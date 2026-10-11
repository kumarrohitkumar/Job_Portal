import axios from 'axios';

/** Same-origin API: Vite proxies /api in development and Vercel rewrites it in production. */
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1', withCredentials: true });

/** The message to show a person for any failed request. */
export function errorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again';
  return 'Something went wrong. Please try again';
}

/** Field-level validation errors from the API, as { field: message }. */
export function fieldErrors(err) {
  return Object.fromEntries((err?.response?.data?.errors ?? []).map((e) => [e.field, e.message]));
}
