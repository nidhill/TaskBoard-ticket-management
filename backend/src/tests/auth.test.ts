import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/User';

const TEST_USER = {
    name: 'Test User',
    email: 'testauth@taskboard.test',
    password: 'testpass123',
    department: 'Developer',
};

beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskboard_test';
    await mongoose.connect(uri);
});

afterAll(async () => {
    await User.deleteMany({ email: TEST_USER.email });
    await mongoose.disconnect();
});

describe('POST /api/auth/register', () => {
    it('should require all fields', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: TEST_USER.email });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should register a new user and return needsVerification', async () => {
        const res = await request(app).post('/api/auth/register').send(TEST_USER);
        expect(res.status).toBe(201);
        expect(res.body.needsVerification).toBe(true);
        expect(res.body.email).toBe(TEST_USER.email);
    });

    it('should reject duplicate email', async () => {
        const res = await request(app).post('/api/auth/register').send(TEST_USER);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
    });
});

describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: 'wrongpassword' });
        expect([401, 403]).toContain(res.status);
    });

    it('should reject unverified user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });
        expect(res.status).toBe(403);
        expect(res.body.needsVerification).toBe(true);
    });
});

describe('POST /api/auth/forgot-password', () => {
    it('should return 404 for unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'unknown@taskboard.test' });
        expect(res.status).toBe(404);
    });
});

describe('POST /api/auth/refresh', () => {
    it('should reject missing refresh token', async () => {
        const res = await request(app).post('/api/auth/refresh').send({});
        expect(res.status).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid.token.here' });
        expect(res.status).toBe(403);
    });
});
