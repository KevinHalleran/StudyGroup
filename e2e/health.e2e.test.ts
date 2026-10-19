import { describe, expect, it } from 'vitest';

const apiBase = process.env.E2E_API_URL ?? 'http://127.0.0.1:7071';
const webBase = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:5173';

describe('US-0.1 Site exists: API (Functions host + Azurite)', () => {
  it('reports healthy including storage reachability', async () => {
    const response = await fetch(`${apiBase}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.checks.storage).toBe('ok');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

describe('US-0.1 Site exists: Web (Vite dev server)', () => {
  it('serves the app shell', async () => {
    const response = await fetch(`${webBase}/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<div id="app">');
  });

  it('proxies /api to the Functions host, as Static Web Apps does in Azure', async () => {
    const response = await fetch(`${webBase}/api/health`);

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('ok');
  });
});
