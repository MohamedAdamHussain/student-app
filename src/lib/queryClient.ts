import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min
      gcTime: 5 * 60 * 1000, // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Centralized query keys
export const queryKeys = {
  stats: ['stats'] as const,
  tasks: ['tasks'] as const,
  task: (id: number) => ['tasks', id] as const,
  hackathons: ['hackathons'] as const,
  hackathon: (id: number) => ['hackathons', id] as const,
  submissions: ['submissions'] as const,
  submission: (id: number) => ['submissions', id] as const,
  teams: ['teams'] as const,
  team: (id: number) => ['teams', id] as const,
  profile: ['profile'] as const,
  skills: ['skills'] as const,
  tracks: ['tracks'] as const,
  batches: ['batches'] as const,
}
