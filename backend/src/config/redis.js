const redis = require('redis');

// Create a mock Redis client for environments without Redis
const mockRedisClient = {
  connect: async () => {},
  disconnect: async () => {},
  quit: async () => {},
  ping: async () => "PONG",
  get: async () => null,
  setEx: async () => "OK",
  del: async () => 1,
  on: () => mockRedisClient
};

// Check if Redis should be disabled
const useRedis = process.env.USE_REDIS !== 'false';

let redisClient;

if (useRedis) {
  // Create real Redis client
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis reconnection failed after 10 attempts');
          console.log('Falling back to mock Redis client');
          return false; // Stop reconnecting
        }
        return retries * 500;
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  
  redisClient.on('connect', () => console.log('✓ Redis Client Connected'));

  // Try to connect, but don't crash if it fails
  (async () => {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis, using mock client instead:', error.message);
      redisClient = mockRedisClient;
    }
  })();
} else {
  console.log('Redis disabled by configuration, using mock client');
  redisClient = mockRedisClient;
}

module.exports = redisClient;
