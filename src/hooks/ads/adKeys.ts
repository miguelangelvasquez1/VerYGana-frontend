export const adKeys = {
  all: ['ads'] as const,
  lists: () => [...adKeys.all, 'list'] as const,
  list: (page: number, size: number, filters?: any) => 
    [...adKeys.lists(), { page, size, ...filters }] as const,
  details: () => [...adKeys.all, 'detail'] as const,
  detail: (id: number) => [...adKeys.details(), id] as const,
  stats: (id: number) => [...adKeys.all, 'stats', id] as const,
};