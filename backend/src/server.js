require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const redisClient = require('./config/redis');

const PORT = process.env.PORT || 5000;

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Sync models (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✓ Database models synchronized');
    }

    // Test Redis connection
    await redisClient.ping();
    console.log('✓ Redis connection established successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`✓ API available at http://localhost:${PORT}/api/${process.env.API_VERSION}`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  await redisClient.quit();
  process.exit(0);
});

startServer();
