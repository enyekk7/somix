import axios from 'axios'

// Default to Railway backend in production
const API_BASE_URL = import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? 'https://somix-production.up.railway.app/api' : 'http://localhost:3001/api')

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api


