import { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

const USERS_KEY = "wm_users";
const SESSION_KEY = "wm_session";

// Mock JWT (base64 of payload — for demo only)
const fakeJwt = (payload) => {
  const head = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
  return `${head}.${body}.mockSig`;
};

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const signup = ({ name, email, password }) => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user = { id: crypto.randomUUID(), name, email, password };
    users.push(user);
    saveUsers(users);
    const token = fakeJwt({ sub: user.id, email });
    setSession({ token, user: { id: user.id, name, email } });
    return user;
  };

  const login = ({ email, password }) => {
    const users = getUsers();
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid email or password.");
    const token = fakeJwt({ sub: u.id, email });
    setSession({ token, user: { id: u.id, name: u.name, email: u.email } });
    return u;
  };

  const logout = () => setSession(null);

  return (
    <AuthCtx.Provider value={{ session, signup, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
