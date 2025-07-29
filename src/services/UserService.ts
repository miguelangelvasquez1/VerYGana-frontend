
import api from '../lib/axios';

export const registerUser = async (userData: {
  name: string;
  lastNames: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('/users', userData);
  return response.data;
};