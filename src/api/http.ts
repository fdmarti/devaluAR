import axios from 'axios'

/**
 * Shared HTTP instance. `baseURL` can be overridden with
 * `VITE_API_BASE_URL`; by default the requests are relative to the origin.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})
