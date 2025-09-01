import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export const login = async (email, password) => {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data; // should contain { token, user }
};
