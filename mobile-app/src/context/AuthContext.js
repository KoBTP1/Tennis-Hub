import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
  deleteMyAccount,
  updateMyProfile,
  updateSessionUser,
  uploadMyAvatar,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getCurrentSession({ enforceRemember: true });
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
      deleteAccount: async () => {
        await deleteMyAccount();
        setUser(null);
        setToken(null);
      },
      updateProfile: async (changes) => {
        const response = await updateMyProfile(changes);
        const nextUserFromApi = response?.user || null;
        const session = await updateSessionUser(nextUserFromApi || changes);
        if (session?.user) {
          setUser(session.user);
          return session.user;
        }

        const fallbackUser = { ...user, ...(nextUserFromApi || changes) };
        setUser(fallbackUser);
        return fallbackUser;
      },
      updateAvatar: async (asset) => {
        const response = await uploadMyAvatar(asset);
        const nextUserFromApi = response?.user || null;
        const session = await updateSessionUser(nextUserFromApi);
        if (session?.user) {
          setUser(session.user);
          return session.user;
        }
        const fallbackUser = { ...user, ...nextUserFromApi };
        setUser(fallbackUser);
        return fallbackUser;
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
