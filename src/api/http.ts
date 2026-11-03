import axios from 'axios'

/**
 * Instancia HTTP compartida. `baseURL` puede sobreescribirse con
 * `VITE_API_BASE_URL`; por defecto los requests son relativos al origen.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})
