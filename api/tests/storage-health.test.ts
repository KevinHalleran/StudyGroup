import { describe, expect, it, vi } from 'vitest';
import { createStorageCheck } from '../src/storage-health.js';

describe('createStorageCheck', () => {
  it('fails when no connection string is configured', async () => {
    const check = createStorageCheck(undefined, vi.fn());

    await expect(check()).rejects.toThrow(/not configured/i);
  });

  it('passes when the table service answers', async () => {
    const getProperties = vi.fn().mockResolvedValue({});
    const factory = vi.fn().mockReturnValue({ getProperties });

    await expect(createStorageCheck('UseDevelopmentStorage=true', factory)()).resolves.toBeUndefined();
    expect(factory).toHaveBeenCalledWith('UseDevelopmentStorage=true');
  });

  it('fails when the table service is unreachable', async () => {
    const factory = vi.fn().mockReturnValue({ getProperties: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) });

    await expect(createStorageCheck('UseDevelopmentStorage=true', factory)()).rejects.toThrow('ECONNREFUSED');
  });
});
