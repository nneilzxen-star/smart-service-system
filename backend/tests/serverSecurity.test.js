const request = require('supertest');

process.env.FRONTEND_URL = 'http://presentation.example';
const app = require('../server');

describe('API browser-origin policy', () => {
  test('serves health checks without requiring a browser origin', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('allows only configured frontend origins', async () => {
    const allowed = await request(app)
      .get('/api/health')
      .set('Origin', 'http://presentation.example');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const blocked = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    consoleError.mockRestore();

    expect(allowed.headers['access-control-allow-origin']).toBe('http://presentation.example');
    expect(allowed.headers['access-control-allow-credentials']).toBeUndefined();
    expect(blocked.status).toBe(403);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
