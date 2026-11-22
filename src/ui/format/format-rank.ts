const points = new Intl.NumberFormat('fr-FR');

/** 1er, 2e, 42e. */
export const formatRank = (rank: number): string => (rank === 1 ? '1er' : `${rank}e`);

/** 1 230 pts. */
export const formatPoints = (value: number): string => `${points.format(value)} pt${value > 1 ? 's' : ''}`;

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** « novembre 2026 ». */
export const formatMonth = (date: Date): string => monthFormat.format(date);
