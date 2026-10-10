import { describe, expect, it, vi } from 'vitest';
import { updateUserRank } from '../src/rank-management.js';

describe('updateUserRank', () => {
  it('persists a valid rank when requested by an administrator', async () => {
    const repository = { updateRank: vi.fn().mockResolvedValue(undefined) };
    const isValidRank = vi.fn().mockReturnValue(true);

    await updateUserRank({
      actor: { roles: ['administrator'] },
      userId: 'student-1',
      rankId: 'rank-id',
      isValidRank,
      repository
    });

    expect(isValidRank).toHaveBeenCalledWith('rank-id');
    expect(repository.updateRank).toHaveBeenCalledWith('student-1', 'rank-id');
  });

  it('rejects non-administrators without changing the rank', async () => {
    const repository = { updateRank: vi.fn().mockResolvedValue(undefined) };

    await expect(
      updateUserRank({
        actor: { roles: ['authenticated'] },
        userId: 'student-1',
        rankId: 'rank-id',
        isValidRank: vi.fn().mockReturnValue(true),
        repository
      })
    ).rejects.toThrow('Forbidden');

    expect(repository.updateRank).not.toHaveBeenCalled();
  });

  it('rejects an unknown rank without changing the rank', async () => {
    const repository = { updateRank: vi.fn().mockResolvedValue(undefined) };

    await expect(
      updateUserRank({
        actor: { roles: ['administrator'] },
        userId: 'student-1',
        rankId: 'unknown-rank',
        isValidRank: vi.fn().mockReturnValue(false),
        repository
      })
    ).rejects.toThrow('Invalid rank');

    expect(repository.updateRank).not.toHaveBeenCalled();
  });
});
