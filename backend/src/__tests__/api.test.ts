import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server';

vi.mock('../config/database', () => ({
  default: {
    user: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'demo-user-id',
        username: 'demo-user',
        email: 'demo@deployeasy.dev',
      }),
    },
    project: {
      findMany: vi.fn().mockResolvedValue([
        { id: '1', name: 'portfolio', repository: 'demo-user/portfolio', status: 'ACTIVE' },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: '1',
        name: 'portfolio',
        repository: 'demo-user/portfolio',
        status: 'ACTIVE',
      }),
      create: vi.fn().mockResolvedValue({
        id: '2',
        name: 'new-app',
        repository: 'demo-user/new-app',
        status: 'ACTIVE',
        userId: 'demo-user-id',
      }),
      update: vi.fn().mockResolvedValue({
        id: '1',
        status: 'BUILDING',
      }),
    },
    deployment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'dep-1',
        version: 'v1.0.0',
        status: 'QUEUED',
        projectId: '1',
      }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    activity: {
      create: vi.fn().mockResolvedValue({ id: 'act-1' }),
    },
  },
}));

describe('Backend API Endpoints', () => {
  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api/projects returns project list', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('portfolio');
  });

  it('GET /api/projects/:id returns a project', async () => {
    const res = await request(app).get('/api/projects/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('portfolio');
  });

  it('POST /api/projects creates a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'new-app', repository: 'demo-user/new-app' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('new-app');
  });

  it('POST /api/deployments creates a deployment', async () => {
    const res = await request(app)
      .post('/api/deployments')
      .send({ projectId: '1' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('v1.0.0');
  });
});
