import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', // cambia esto si tu backend usa otra URL base
  withCredentials: true, // si usas cookies en el backend
});

export default api;