import axios from 'axios'

// All requests go to /api; Vite proxies them to Express in development.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Pull a readable message out of an axios error
export const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong'

export default api
