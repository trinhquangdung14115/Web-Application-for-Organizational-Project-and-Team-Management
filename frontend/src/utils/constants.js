
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
// Debug để biết đang chạy môi trường nào
console.log('Current API URL:', API_BASE_URL);