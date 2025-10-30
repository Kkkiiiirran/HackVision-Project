const { User, EducatorProfile, StudentProfile } = require('../models');

class ProfileController {
  async getEducatorProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [{ model: EducatorProfile, as: 'educatorProfile' }]
      });

      if (!user || user.role !== 'educator') {
        return res.status(404).json({ error: 'Educator profile not found' });
      }

      res.status(200).json({
        id: user.educatorProfile.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        bio: user.educatorProfile.bio,
        organization: user.educatorProfile.organization,
        website: user.educatorProfile.website,
        avatar_url: user.educatorProfile.avatar_url,
        social_links: user.educatorProfile.social_links,
        created_at: user.educatorProfile.created_at,
        updated_at: user.educatorProfile.updated_at
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEducatorProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [{ model: EducatorProfile, as: 'educatorProfile' }]
      });

      if (!user || user.role !== 'educator') {
        return res.status(404).json({ error: 'Educator profile not found' });
      }

      const { name, bio, organization, website, avatar_url } = req.body;

      if (name) {
        await user.update({ name });
      }

      await user.educatorProfile.update({
        bio,
        organization,
        website,
        avatar_url
      });

      res.status(200).json(user.educatorProfile);
    } catch (error) {
      next(error);
    }
  }

  async getStudentProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [{ model: StudentProfile, as: 'studentProfile' }]
      });

      if (!user || user.role !== 'student') {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      res.status(200).json({
        id: user.studentProfile.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        bio: user.studentProfile.bio,
        avatar_url: user.studentProfile.avatar_url,
        education: user.studentProfile.education,
        created_at: user.studentProfile.created_at,
        updated_at: user.studentProfile.updated_at
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStudentProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [{ model: StudentProfile, as: 'studentProfile' }]
      });

      if (!user || user.role !== 'student') {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      const { name, bio, education, avatar_url } = req.body;

      if (name) {
        await user.update({ name });
      }

      await user.studentProfile.update({
        bio,
        education,
        avatar_url
      });

      res.status(200).json(user.studentProfile);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
