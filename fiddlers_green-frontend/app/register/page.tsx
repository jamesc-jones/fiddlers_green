import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Fiddler's Green account.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,_#141d17_0%,_#0a0d0a_55%,_#000000_100%)] px-6 md:px-10 py-24">
      <div className="max-w-md w-full mx-auto text-center">
        <p className="font-body text-xs md:text-sm tracking-[0.3em] text-brand-gold uppercase">
          Join Us
        </p>
        <h1 className="mt-6 font-display italic text-4xl md:text-6xl text-brand-cream">
          Register
        </h1>
        <div className="mt-10">
          <RegisterForm />
        </div>
        <p className="mt-8 font-body text-sm text-brand-smoke">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-gold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
