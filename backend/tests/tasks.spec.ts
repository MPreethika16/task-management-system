import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { Task } from '../src/models/Task';

describe('Tasks API', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'userA@example.com',
      password: 'password123',
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data._id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'userB@example.com',
      password: 'password123',
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data._id;
  });

  describe('POST /api/tasks', () => {
    const validTask = {
      title: 'Test Task',
      description: 'Test Description',
      dueDate: new Date().toISOString(),
    };

    it('allows an authenticated user to create a valid task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validTask);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validTask.title);
      expect(response.body.data.description).toBe(validTask.description);
      expect(response.body.data.status).toBe('Todo'); // Default
      expect(response.body.data.priority).toBe('Medium'); // Default
      expect(response.body.data.user).toBe(userAId);
    });

    it('rejects client-provided user ID and uses authenticated user', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validTask,
          user: userBId, // Try to assign to User B
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user).toBe(userAId); // Should be User A
    });

    it('rejects missing required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Title Only' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ ...validTask, status: 'InvalidStatus' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects invalid priority', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ ...validTask, priority: 'Urgent' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects unauthenticated request', async () => {
      const response = await request(app).post('/api/tasks').send(validTask);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    let taskAId: string;

    beforeEach(async () => {
      // User A creates a task
      const resA = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'User A Task',
          description: 'Desc',
          dueDate: new Date().toISOString(),
        });
      taskAId = resA.body.data._id;

      // User B creates a task
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          title: 'User B Task',
          description: 'Desc',
          dueDate: new Date().toISOString(),
        });
    });

    it('retrieves only tasks belonging to the authenticated user', async () => {
      const responseA = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(responseA.status).toBe(200);
      expect(responseA.body.data.tasks.length).toBe(1);
      expect(responseA.body.data.tasks[0]._id).toBe(taskAId);

      const responseB = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(responseB.status).toBe(200);
      expect(responseB.body.data.tasks.length).toBe(1);
      expect(responseB.body.data.tasks[0].title).toBe('User B Task');
    });
  });

  describe('GET /api/tasks with query parameters', () => {
    beforeEach(async () => {
      // Create some tasks for User A
      const tasksToCreate = [
        { title: 'Learn Backend', description: 'desc', status: 'Done', priority: 'High', dueDate: '2026-08-01T00:00:00Z' },
        { title: 'Frontend Assignment', description: 'desc', status: 'In Progress', priority: 'Medium', dueDate: '2026-08-05T00:00:00Z' },
        { title: 'Write tests', description: 'desc', status: 'Todo', priority: 'Low', dueDate: '2026-08-10T00:00:00Z' },
        { title: 'Special (chars)*?', description: 'desc', status: 'Todo', priority: 'High', dueDate: '2026-08-15T00:00:00Z' },
      ];
      for (const t of tasksToCreate) {
        await request(app).post('/api/tasks').set('Authorization', `Bearer ${userAToken}`).send(t);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Create a task for User B
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${userBToken}`).send({
        title: 'User B Secret', description: 'desc', status: 'Todo', priority: 'High', dueDate: new Date().toISOString()
      });
    });

    it('returns default pagination metadata', async () => {
      const response = await request(app).get('/api/tasks').set('Authorization', `Bearer ${userAToken}`);
      expect(response.status).toBe(200);
      const { pagination, tasks } = response.body.data;
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
      expect(pagination.total).toBe(4);
      expect(pagination.totalPages).toBe(1);
      expect(tasks.length).toBe(4);
    });

    it('handles pagination logic correctly', async () => {
      const page1 = await request(app).get('/api/tasks?page=1&limit=2').set('Authorization', `Bearer ${userAToken}`);
      expect(page1.body.data.tasks.length).toBe(2);
      expect(page1.body.data.pagination.totalPages).toBe(2);

      const page2 = await request(app).get('/api/tasks?page=2&limit=2').set('Authorization', `Bearer ${userAToken}`);
      expect(page2.body.data.tasks.length).toBe(2);
      
      const idsPage1 = page1.body.data.tasks.map((t: any) => t._id);
      const idsPage2 = page2.body.data.tasks.map((t: any) => t._id);
      const intersection = idsPage1.filter((id: string) => idsPage2.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('supports case-insensitive partial title search', async () => {
      const res = await request(app).get('/api/tasks?search=FRONTEND').set('Authorization', `Bearer ${userAToken}`);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Frontend Assignment');
      
      const resEscaped = await request(app).get('/api/tasks?search=(chars)*?').set('Authorization', `Bearer ${userAToken}`);
      expect(resEscaped.body.data.tasks.length).toBe(1);
    });

    it('filters by status', async () => {
      const res = await request(app).get('/api/tasks?status=Done').set('Authorization', `Bearer ${userAToken}`);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].status).toBe('Done');

      const bad = await request(app).get('/api/tasks?status=Invalid').set('Authorization', `Bearer ${userAToken}`);
      expect(bad.status).toBe(400);
    });

    it('filters by priority', async () => {
      const res = await request(app).get('/api/tasks?priority=High').set('Authorization', `Bearer ${userAToken}`);
      expect(res.body.data.tasks.length).toBe(2);

      const bad = await request(app).get('/api/tasks?priority=Urgent').set('Authorization', `Bearer ${userAToken}`);
      expect(bad.status).toBe(400);
    });

    it('supports combined search and filters', async () => {
      const res = await request(app).get('/api/tasks?search=Backend&status=Done&priority=High').set('Authorization', `Bearer ${userAToken}`);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Learn Backend');
    });

    it('sorts by dueDate ascending and descending', async () => {
      const resAsc = await request(app).get('/api/tasks?sort=dueDate&order=asc').set('Authorization', `Bearer ${userAToken}`);
      expect(resAsc.body.data.tasks[0].title).toBe('Learn Backend'); 
      expect(resAsc.body.data.tasks[3].title).toBe('Special (chars)*?'); 
      
      const resDesc = await request(app).get('/api/tasks?sort=dueDate&order=desc').set('Authorization', `Bearer ${userAToken}`);
      expect(resDesc.body.data.tasks[0].title).toBe('Special (chars)*?'); 
    });

    it('sorts by priority semantically (desc=High first, asc=Low first)', async () => {
      const resDesc = await request(app).get('/api/tasks?sort=priority&order=desc').set('Authorization', `Bearer ${userAToken}`);
      expect(resDesc.body.data.tasks[0].priority).toBe('High');
      expect(resDesc.body.data.tasks[1].priority).toBe('High');
      expect(resDesc.body.data.tasks[2].priority).toBe('Medium');
      expect(resDesc.body.data.tasks[3].priority).toBe('Low');

      const resAsc = await request(app).get('/api/tasks?sort=priority&order=asc').set('Authorization', `Bearer ${userAToken}`);
      expect(resAsc.body.data.tasks[0].priority).toBe('Low');
      expect(resAsc.body.data.tasks[1].priority).toBe('Medium');
      expect(resAsc.body.data.tasks[2].priority).toBe('High');
    });

    it('validates query parameters', async () => {
      const res1 = await request(app).get('/api/tasks?page=0').set('Authorization', `Bearer ${userAToken}`);
      expect(res1.status).toBe(400);
      const res2 = await request(app).get('/api/tasks?limit=101').set('Authorization', `Bearer ${userAToken}`);
      expect(res2.status).toBe(400);
      const res3 = await request(app).get('/api/tasks?sort=unknown').set('Authorization', `Bearer ${userAToken}`);
      expect(res3.status).toBe(400);
      const res4 = await request(app).get('/api/tasks?order=random').set('Authorization', `Bearer ${userAToken}`);
      expect(res4.status).toBe(400);
    });

    it('never includes another users tasks in queries', async () => {
      const res = await request(app).get('/api/tasks?search=Secret').set('Authorization', `Bearer ${userAToken}`);
      expect(res.body.data.tasks.length).toBe(0);
      
      const resB = await request(app).get('/api/tasks?search=Secret').set('Authorization', `Bearer ${userBToken}`);
      expect(resB.body.data.tasks.length).toBe(1);
    });
  });

  describe('Cross-User Authorization & Single Task Operations', () => {
    let taskAId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'User A Task',
          description: 'Desc',
          dueDate: new Date().toISOString(),
        });
      taskAId = res.body.data._id;
    });

    describe('GET /api/tasks/:id', () => {
      it('allows owner to retrieve their task', async () => {
        const response = await request(app)
          .get(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data._id).toBe(taskAId);
      });

      it('returns 404 for another user attempting to retrieve the task', async () => {
        const response = await request(app)
          .get(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      it('returns 400 for invalid ObjectId', async () => {
        const response = await request(app)
          .get(`/api/tasks/invalid-id`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(response.status).toBe(400);
      });

      it('returns 404 for unknown valid ObjectId', async () => {
        const unknownId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
          .get(`/api/tasks/${unknownId}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/tasks/:id', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Desc',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date().toISOString(),
      };

      it('allows owner to update allowed fields', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.status).toBe(updateData.status);

        // Verify in DB
        const dbTask = await Task.findById(taskAId);
        expect(dbTask?.title).toBe(updateData.title);
      });

      it('returns 404 for another user attempting to update the task', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send(updateData);

        expect(response.status).toBe(404);
      });

      it('does not allow updating user/owner field', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ ...updateData, user: userBId });

        expect(response.status).toBe(200);
        expect(response.body.data.user).toBe(userAId); // Remains User A
      });
      
      it('rejects invalid status', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ ...updateData, status: 'InvalidStatus' });
          
        expect(response.status).toBe(400);
      });

      it('rejects invalid priority', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ ...updateData, priority: 'Urgent' });
          
        expect(response.status).toBe(400);
      });
    });

    describe('PATCH /api/tasks/:id/status', () => {
      it('allows owner to change status to In Progress', async () => {
        const response = await request(app)
          .patch(`/api/tasks/${taskAId}/status`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ status: 'In Progress' });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('In Progress');
      });

      it('returns 404 for another user attempting to update status', async () => {
        const response = await request(app)
          .patch(`/api/tasks/${taskAId}/status`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({ status: 'In Progress' });

        expect(response.status).toBe(404);
      });

      it('rejects invalid status', async () => {
        const response = await request(app)
          .patch(`/api/tasks/${taskAId}/status`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ status: 'InvalidStatus' });

        expect(response.status).toBe(400);
      });

      it('ignores other fields sent to this endpoint', async () => {
        const response = await request(app)
          .patch(`/api/tasks/${taskAId}/status`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ status: 'Done', title: 'Hacked Title' });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('Done');
        expect(response.body.data.title).toBe('User A Task'); // Title unmodified
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      it('returns 404 for another user attempting to delete the task', async () => {
        const response = await request(app)
          .delete(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect(response.status).toBe(404);
        
        // Confirm task still exists
        const dbTask = await Task.findById(taskAId);
        expect(dbTask).not.toBeNull();
      });

      it('allows owner to delete their task', async () => {
        const response = await request(app)
          .delete(`/api/tasks/${taskAId}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(response.status).toBe(200);

        // Confirm task is deleted
        const dbTask = await Task.findById(taskAId);
        expect(dbTask).toBeNull();
      });
    });
  });
});
