// hooks/campaigns/campaignKeys.ts
export const campaignKeys = {
  all: ['campaigns'] as const,

  games: () => [...campaignKeys.all, 'games'] as const,
  gamesList: (page: number, size: number) =>
    [...campaignKeys.games(), page, size] as const,

  assetDefinitions: (gameId: number) =>
    [...campaignKeys.all, 'asset-definitions', gameId] as const,
};
