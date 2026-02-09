"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Users, Zap } from "lucide-react";

const features = [
  { icon: Shield, label: "Secure client portals" },
  { icon: Users, label: "Real-time collaboration" },
  { icon: Zap, label: "Lightning-fast delivery" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#F7F5F3] dark:bg-black items-center justify-center p-12">
        {/* Orange gradient glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(234,160,60,0.2)_0%,_rgba(220,130,40,0.1)_35%,_transparent_70%)]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(245,180,70,0.15)_0%,_rgba(234,160,60,0.08)_45%,_transparent_70%)]" />
        </div>

        {/* Decorative lines */}
        <div className="absolute left-12 top-0 bottom-0 w-px bg-[rgba(55,50,47,0.08)] dark:bg-[rgba(255,255,255,0.06)]" />
        <div className="absolute right-12 top-0 bottom-0 w-px bg-[rgba(55,50,47,0.08)] dark:bg-[rgba(255,255,255,0.06)]" />

        {/* Content - Centered */}
        <div className="relative z-10 w-full max-w-md text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-normal text-[#37322F] dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              Welcome Back
            </h2>
            <p className="text-[rgba(55,50,47,0.6)] dark:text-white/50 text-sm">
              Sign in to manage your projects and clients.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left">
            {features.map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-4 rounded-xl px-4 py-3.5 bg-white/50 dark:bg-white/[0.05] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8A040]/15 text-[#D4922E] dark:text-[#E8A040]">
                  <feat.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-[rgba(55,50,47,0.6)] dark:text-white/70">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950 p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile heading */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <h1 className="text-4xl font-normal tracking-tight text-[#37322F] dark:text-white" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              Welcome back
            </h1>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block space-y-2">
            <h1 className="text-4xl font-normal tracking-tight text-[#37322F] dark:text-white" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              Sign In
            </h1>
            <p className="text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Google / GitHub */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-[#F7F5F3] dark:bg-zinc-900/50 px-4 py-2.5 text-sm font-medium text-[#37322F] dark:text-white transition-colors hover:bg-[#EFECEA] dark:hover:bg-zinc-800/70"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-[#F7F5F3] dark:bg-zinc-900/50 px-4 py-2.5 text-sm font-medium text-[#37322F] dark:text-white transition-colors hover:bg-[#EFECEA] dark:hover:bg-zinc-800/70"
            >
              <svg className="h-4 w-4 fill-[#37322F] dark:fill-white" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Github
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(55,50,47,0.08)] dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-zinc-950 px-3 text-[rgba(55,50,47,0.4)] dark:text-zinc-600">Or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#37322F] dark:text-zinc-300 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-[#F7F5F3] dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#37322F] dark:text-zinc-300 text-sm">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-[#E8A040] hover:text-[#D4922E] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-[#F7F5F3] dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#37322F] hover:bg-[#4A443F] dark:bg-[#E8A040] dark:hover:bg-[#D4922E] text-white font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#E8A040] hover:text-[#D4922E] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
