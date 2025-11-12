// tests/integration/ai.test.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Project = require('../../src/models/Project.model');
const { generateAccessToken } = require('../../src/config/jwt');

describe('AI Endpoints', () => {
  let token;
  let userId;
  let projectId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    userId = user._id;
    token = generateAccessToken(userId);

    // Create test project
    const project = await Project.create({
      name: 'Test Project',
      owner: userId
    });
    projectId = project._id;
  });

  describe('POST /api/v1/ai/chat', () => {
    it('should respond to chat message', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Create a task for implementing user authentication',
          context: {
            type: 'project-management',
            projectId: projectId.toString()
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBeDefined();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({ message: 'Hello' });

      expect(response.status).toBe(401);
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/ai/tasks/create', () => {
    it('should create task from description', async () => {
      const response = await request(app)
        .post('/api/v1/ai/tasks/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Implement user login with JWT authentication',
          projectId: projectId.toString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.priority).toBeDefined();
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
  });
});