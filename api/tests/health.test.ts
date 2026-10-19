import { describe, expect, it } from 'vitest';
import { checkHealth } from '../src/health.js';

const fixedNow = () => new Date('2026-10-19T12:00:00.000Z');

describe('checkHealth', () => {
  it('reports ok when every check passes', async () => {
    const result = await checkHealth({ app: async () => {} }, fixedNow);

    expect(result).toEqual({
      status: 'ok',
      timestamp: '2026-10-19T12:00:00.000Z',
      checks: { app: 'ok' }
    });
  });

  it('reports ok when there are no dependency checks', async () => {
    const result = await checkHealth({}, fixedNow);

    expect(result.status).toBe('ok');
  });

  it('reports degraded and names the failing check without leaking the error', async () => {
    const result = await checkHealth(
      {
        app: async () => {},
        storage: async () => {
          throw new Error('secret connection string details');
        }
      },
      fixedNow
    );

    expect(result.status).toBe('degraded');
    expect(result.checks).toEqual({ app: 'ok', storage: 'failed' });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
