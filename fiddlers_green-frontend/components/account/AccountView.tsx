"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AccountView() {
  const { user, isLoading, isAllowed } = useRequireAuth();

  if (isLoading || !isAllowed || !user) {
    return (
      <p className="font-body text-brand-smoke text-center">Loading...</p>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <dl className="mt-6 flex flex-col gap-4 text-left border border-white/10 p-6">
        <div>
          <dt className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold">
            Email
          </dt>
          <dd className="mt-1 font-body text-brand-cream">{user.email}</dd>
        </div>
        <div>
          <dt className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold">
            Role
          </dt>
          <dd
            data-testid="account-role"
            className="mt-1 font-body text-brand-cream capitalize"
          >
            {user.role}
          </dd>
        </div>
        <div>
          <dt className="font-body text-xs tracking-[0.2em] uppercase text-brand-gold">
            Member Since
          </dt>
          <dd className="mt-1 font-body text-brand-cream">
            {new Date(user.created_at).toLocaleDateString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
