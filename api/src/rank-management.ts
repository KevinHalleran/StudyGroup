export interface RankManagementRequest {
  actor: { roles: string[] };
  userId: string;
  rankId: string;
  isValidRank: (rankId: string) => boolean;
  repository: {
    updateRank: (userId: string, rankId: string) => Promise<void>;
  };
}

export async function updateUserRank(
  _request: RankManagementRequest
): Promise<void> {
  throw new Error('Not implemented: user rank management');
}
