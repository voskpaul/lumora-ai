"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  Sparkles,
  Wand2,
  Video,
} from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7c3aed22,transparent_35%),radial-gradient(circle_at_bottom_right,#06b6d422,transparent_35%)]" />

      {/* LEFT SIDE */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/10 p-12 lg:flex">

        {/* Glow */}
        <div className="absolute -left-30 -top-30 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-30 -right-30 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Lumora AI"
            className="h-11 w-11"
          />

          <div>
            <h1 className="text-2xl font-bold">
              Lumora AI
            </h1>

            <p className="text-sm text-white/50">
              Cinematic AI Video Platform
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 max-w-lg">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 text-6xl font-bold leading-tight"
          >
            Create Hollywood-grade AI videos.
          </motion.h2>

          <p className="mb-10 text-lg text-white/60">
            Generate cinematic scenes, AI avatars,
            motion graphics, voiceovers and social
            clips with next-generation AI models.
          </p>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Video className="mb-3 h-6 w-6 text-cyan-400" />

              <h3 className="font-medium">
                Text-to-Video
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Generate cinematic scenes instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Sparkles className="mb-3 h-6 w-6 text-violet-400" />

              <h3 className="font-medium">
                AI Editing
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Smart cuts, captions and transitions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Wand2 className="mb-3 h-6 w-6 text-pink-400" />

              <h3 className="font-medium">
                Motion Transfer
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Animate characters naturally.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Sparkles className="mb-3 h-6 w-6 text-yellow-400" />

              <h3 className="font-medium">
                4K Rendering
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Export ultra high quality videos.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-white/40">
          Trusted by creators, filmmakers and AI studios.
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
        >

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Welcome back
            </h2>

            <p className="mt-2 text-white/50">
              Login to continue creating with Lumora AI
            </p>
          </div>

          {/* Social */}
          <div className="space-y-3">

            <button 
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 transition hover:bg-white/10"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5"
              />

              Continue with Google
            </button>

            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 transition hover:bg-white/10"
            >
              Continue with GitHub
            </button>

          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-xs uppercase tracking-widest text-white/40">
              or continue with email
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Form */}
          <form className="space-y-5">

            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-500"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-500"
            />

            <div className="flex items-center justify-between text-sm">

              <label className="flex items-center gap-2 text-white/50">
                <input type="checkbox" />
                Remember me
              </label>

              <a
                href="#"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Forgot password?
              </a>

            </div>

            <button className="w-full rounded-2xl bg-linear-to-r from-violet-500 to-cyan-500 py-3 font-medium transition hover:opacity-90">
              Login
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Create account
            </Link>
          </p>

        </motion.div>
      </div>
    </main>
  );
}