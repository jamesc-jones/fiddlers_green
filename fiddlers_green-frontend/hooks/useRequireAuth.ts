import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";

/**
 * Redirects away from a protected page if the user isn't authenticated
 * (or, when `role` is given, isn't that role). Returns the current auth
 * state so the page can gate its own render on `isLoading`/`isAllowed`
 * to avoid a flash of protected content before the redirect fires.
 */
export function useRequireAuth(role?: AuthUser["role"]) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = !!user && (!role || user.role === role);

  useEffect(() => {
    if (isLoading) return;
    if (!isAllowed) {
      router.replace("/login");
    }
  }, [isLoading, isAllowed, router]);

  return { user, token, isLoading, isAllowed };
}
