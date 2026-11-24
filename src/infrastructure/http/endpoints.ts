/** Routes de park-finder-api. */
export const Endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    leaderboard: '/users/leaderboard',
  },
  parkings: {
    nearby: '/parkings',
    add: '/parkings/new',
    details: (id: string) => `/parkings/${encodeURIComponent(id)}`,
    photos: (id: string) => `/parkings/${encodeURIComponent(id)}/photos`,
    photo: (id: string, photoId: string) =>
      `/parkings/${encodeURIComponent(id)}/photos/${encodeURIComponent(photoId)}`,
    report: (id: string) => `/parkings/${encodeURIComponent(id)}/report`,
    vote: (id: string) => `/parkings/${encodeURIComponent(id)}/vote`,
    comments: (id: string) => `/parkings/${encodeURIComponent(id)}/comments`,
  },
} as const;
