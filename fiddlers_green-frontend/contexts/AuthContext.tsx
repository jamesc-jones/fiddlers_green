"use client";

// Global auth state, shared between Navbar and any page that needs to know
// who's logged in. This is the first cross-component shared state in the
// app — everything before this (chat messages, intro-seen flags, cart FAB
// open/closed) lived in a single component subtree. A React Context is the
// smallest tool that fits: no new dependency, and it's the pattern the
// Next.js App Router docs themselves recommend for sharing state between a
// Server Component layout's Client Component children (see
// node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md).
//
// The JWT is persisted in localStorage (key below) rather than
// sessionStorage — unlike the intro-seen flag or the floating chat's
// session-dismissal flag (both deliberately per-tab/per-session), a login
// should survive closing the tab, which is what localStorage is for.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getJson, postJson } from "@/lib/api";

const TOKEN_STORAGE_KEY = "fg_auth_token";

export interface AuthUser {
  id: string;
  email: string;
  role: "customer" | "admin";
  is_active: boolean;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first mount, restore a previously-persisted token and validate it
  // against the backend (rather than trusting a client-decoded JWT payload)
  // so an expired or tampered token is caught immediately.
  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      // react-hooks/set-state-in-effect flags this as a synchronous setState
      // in an effect, but there's no event to derive this from — restoring
      // a persisted token is inherently a mount-time sync with an external
      // store (localStorage), which is exactly the case the rule's own
      // guidance defers to useSyncExternalStore for. Full migration to that
      // API is out of scope for this change; suppressing narrowly instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    getJson<AuthUser>("/auth/me", storedToken)
      .then((fetchedUser) => {
        setToken(storedToken);
        setUser(fetchedUser);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { access_token } = await postJson<TokenResponse>("/auth/login", {
      email,
      password,
    });
    const fetchedUser = await getJson<AuthUser>("/auth/me", access_token);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
    setToken(access_token);
    setUser(fetchedUser);
  }

  async function register(email: string, password: string) {
    await postJson<AuthUser>("/auth/register", { email, password });
    // Registration doesn't return a token (customers must log in
    // separately, per the backend contract) — logging in right after
    // keeps the UX to a single step from the user's perspective.
    await login(email, password);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
