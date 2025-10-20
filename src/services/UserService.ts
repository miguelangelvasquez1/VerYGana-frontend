import api from '../lib/axios';

export interface RegisterUserDTO {
  name: string;
  lastNames: string;
  email: string;
  password: string;
  role: "CONSUMIDOR" | "VENDEDOR" | "ANUNCIANTE";
}

export const registerUser = async (userData: RegisterUserDTO) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (identifier: string, password: string) => {
  const response = await api.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
};
