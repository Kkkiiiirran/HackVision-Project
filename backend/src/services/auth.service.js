const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, EducatorProfile, StudentProfile } = require('../models');
const redisClient = require('../config/redis');

class AuthService {
  async signupEducator(data) {
    const { name, email, password, organization, website } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw { statusCode: 409, message: 'Email already registered' };
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    const user = await User.create({
      name,
      email,
      password_hash,
      role: 'educator'
    });

    await EducatorProfile.create({
      user_id: user.id,
      organization,
      website
    });

    const tokens = await this.generateTokens(user);

    return {
      user_id: user.id,
      email: user.email,
      role: user.role,
      ...tokens
    };
  }

  async signupStudent(data) {
    const { name, email, password } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw { statusCode: 409, message: 'Email already registered' };
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    const user = await User.create({
      name,
      email,
      password_hash,
      role: 'student'
    });

    await StudentProfile.create({
      user_id: user.id
    });

    const tokens = await this.generateTokens(user);

    return {
      user_id: user.id,
      email: user.email,
      role: user.role,
      ...tokens
    };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.is_active) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    await user.update({ last_login: new Date() });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async generateTokens(user) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '1h' }
    );

    const refresh_token = jwt.sign(
      { userId: user.id, tokenId: uuidv4() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    await redisClient.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refresh_token);

    return { token, refresh_token };
  }

  async refresh(refresh_token) {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

    if (!storedToken || storedToken !== refresh_token) {
      throw { statusCode: 401, message: 'Invalid refresh token' };
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      throw { statusCode: 401, message: 'User not found or inactive' };
    }

    return await this.generateTokens(user);
  }

  async logout(refresh_token) {
    try {
      const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      await redisClient.del(`refresh_token:${decoded.userId}`);
    } catch (error) {
      // Token invalid or expired, ignore
    }
  }
}

module.exports = new AuthService();
