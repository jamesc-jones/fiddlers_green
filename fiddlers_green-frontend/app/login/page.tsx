import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Fiddler's Green account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,_#141d17_0%,_#0a0d0a_55%,_#000000_100%)] px-6 md:px-10 py-24">
      <div className="max-w-md w-full mx-auto text-center">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Welcome Back
        </p>
        <h1 className="mt-6 font-display italic text-4xl md:text-6xl text-brand-cream">
          Sign In
        </h1>
        <div className="mt-10">
          <LoginForm />
        </div>
        <p className="mt-8 font-body text-sm text-brand-smoke">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-gold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
