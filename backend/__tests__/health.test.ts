import request from 'supertest';
import { createApp } from '../src/app';

describe('health', () => {
  const app = createApp();
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

