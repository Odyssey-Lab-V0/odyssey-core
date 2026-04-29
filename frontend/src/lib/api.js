import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const SESSION_KEY = "wm_session";

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

export const setSession = (s) => {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
};

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const s = getSession();
  if (s?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${s.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      setSession(null);
    }
    return Promise.reject(err);
  }
);
