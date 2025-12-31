import axios from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession(); // NextAuth puede refrescar aquí si es necesario
  const token = (session as any)?.accessToken;
  console.log("Requesting API");
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
