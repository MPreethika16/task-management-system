/// <reference types="jest" />
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User } from '../src/models/User';

describe('Auth API', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('successfully registers a user with valid email and password', async () => {
      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.password).toBeUndefined();

      const dbUser = await User.findOne({ email: validUser.email }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser?.password).not.toBe(validUser.password); // Should not be plaintext
      
      const matches = await bcrypt.compare(validUser.password, dbUser!.password!);
      expect(matches).toBe(true);
    });

    it('rejects duplicate email registration with 409', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const response = await request(app).post('/api/auth/register').send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('stores the email in normalized lowercase form', async () => {
      await request(app).post('/api/auth/register').send({
        email: ' UpperCase@Example.com ',
        password: 'password123',
      });

      const dbUser = await User.findOne({ email: 'uppercase@example.com' });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe('uppercase@example.com');
    });

    it('rejects password shorter than 8 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'short@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects missing required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'missing@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(500); // Mongoose validation error
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('successfully logs in with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send(validUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('rejects an incorrect password with 401', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('rejects an unknown email with 401', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'unknown@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      token = res.body.data.token;
    });

    it('returns the authenticated user with a valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('returns 401 when token is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer invalidtoken`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
