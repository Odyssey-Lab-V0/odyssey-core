import { createContext, useContext, useEffect, useState } from "react";
import { api, getSession, setSession as persistSession } from "./api";

const AuthCtx = createContext(null);

const extractError = (err, fallback) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?._embedded?.errors?.[0]?.message) {
    return err.response.data._embedded.errors[0].message;
  }
  if (err?.message) return err.message;
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Sync persistence on change
  useEffect(() => {
    persistSession(session);
  }, [session]);

  // On mount, if we have a token, validate via /me
  useEffect(() => {
    let cancelled = false;
    const cur = getSession();
    if (!cur?.token) return;
    setBootstrapping(true);
    api
      .get("/me")
      .then((res) => {
        if (cancelled) return;
        setSessionState({ token: cur.token, user: res.data });
      })
      .catch(() => {
        if (cancelled) return;
        setSessionState(null);
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = async ({ fullName, email, password, phone, country, dateOfBirth }) => {
    try {
      const res = await api.post("/auth/signup", {
        fullName,
        email,
        password,
        phone: phone || null,
        country: country || null,
        dateOfBirth: dateOfBirth || null,
      });
      setSessionState(res.data);
      return res.data.user;
    } catch (err) {
      throw new Error(extractError(err, "Sign up failed."));
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setSessionState(res.data);
      return res.data.user;
    } catch (err) {
      throw new Error(extractError(err, "Login failed."));
    }
  };

  const logout = () => setSessionState(null);

  return (
    <AuthCtx.Provider value={{ session, signup, login, logout, bootstrapping }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
