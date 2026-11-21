/** Routes de park-finder-api. */
export const Endpoints = {
  parkings: {
    nearby: '/parkings',
    details: (id: string) => `/parkings/${encodeURIComponent(id)}`,
    report: (id: string) => `/parkings/${encodeURIComponent(id)}/report`,
    vote: (id: string) => `/parkings/${encodeURIComponent(id)}/vote`,
    comments: (id: string) => `/parkings/${encodeURIComponent(id)}/comments`,
  },
} as const;
