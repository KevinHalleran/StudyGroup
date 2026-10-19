import { app, HttpResponseInit } from '@azure/functions';
import { checkHealth } from '../health.js';
import { createStorageCheck } from '../storage-health.js';

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (): Promise<HttpResponseInit> => {
    const result = await checkHealth({
      app: async () => {},
      storage: createStorageCheck(process.env.STORAGE_CONNECTION_STRING)
    });

    return {
      status: result.status === 'ok' ? 200 : 503,
      jsonBody: result,
      headers: { 'Cache-Control': 'no-store' }
    };
  }
});
