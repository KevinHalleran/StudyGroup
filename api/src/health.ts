export interface HealthResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: Record<string, 'ok' | 'failed'>;
}

export async function checkHealth(
  checks: Record<string, () => Promise<void>>,
  now: () => Date = () => new Date()
): Promise<HealthResult> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, run]) => {
      try {
        await run();
        return [name, 'ok'] as const;
      } catch {
        // Error details are deliberately dropped so the public endpoint cannot leak them.
        return [name, 'failed'] as const;
      }
    })
  );

  return {
    status: entries.every(([, outcome]) => outcome === 'ok') ? 'ok' : 'degraded',
    timestamp: now().toISOString(),
    checks: Object.fromEntries(entries)
  };
}
