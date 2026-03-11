import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, loginUser, logoutUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          setUser(session.user);
          setToken(session.token);
        }
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isBootstrapping,
      register: registerUser,
      login: async ({ email, password, rememberMe = false }) => {
        const session = await loginUser({ email, password, rememberMe });
        setUser(session.user);
        setToken(session.token);
        return session;
      },
      logout: async () => {
        await logoutUser();
        setUser(null);
        setToken(null);
      },
    }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
