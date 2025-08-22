import api from '../lib/axios';

export const registerUser = async (userData: {
  name: string;
  lastNames: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('auth/register', userData);
  return response.data;
};

export const loginUser = async(identifier: string, password: string) => {
  const response = await api.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
}