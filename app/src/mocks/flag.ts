/**
 * The single gate for mock data. Feature code must import mock data only through
 * modules in src/mocks that check this flag, never directly.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
