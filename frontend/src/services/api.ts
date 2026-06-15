import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Bearer token if it exists
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('webarco_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Parse the custom backend envelope structure
api.interceptors.response.use(
  (response) => {
    // Check if the response follows the standard success envelope: { success, data, message }
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'success' in resData) {
      return resData;
    }

    // Fallback if the response does not follow the standard envelope
    return {
      success: true,
      data: resData,
      message: 'Operación realizada con éxito',
    };
  },
  (error: AxiosError) => {
    let message = 'Ocurrió un error inesperado. Por favor, intente de nuevo.';
    let status = error.response?.status;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorData = error.response.data as any;

      if (errorData && typeof errorData === 'object') {
        // Parse validation errors or generic exception filter format
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            // Join validation array messages (e.g. ['nombre no puede estar vacío', 'email debe ser válido'])
            message = errorData.message.join(', ');
          } else {
            message = errorData.message;
          }
        }
      }

      // Handle 401 Unauthorized (token expired or invalid)
      if (status === 401 && !error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('webarco_auth_token');
        localStorage.removeItem('webarco_user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      message = 'No se pudo establecer conexión con el servidor. Verifique su red.';
    } else {
      // Something happened in setting up the request that triggered an Error
      message = error.message;
    }

    return Promise.reject({
      success: false,
      data: null,
      message,
      statusCode: status,
    });
  }
);
export default api;
