"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  Sparkles,
  Wand2,
  Video,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7c3aed22,transparent_35%),radial-gradient(circle_at_bottom_right,#06b6d422,transparent_35%)]" />

      {/* LEFT SIDE */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/10 p-12 lg:flex">

        {/* Glow Effects */}
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
            Build the future of AI filmmaking.
          </motion.h2>

          <p className="mb-10 text-lg text-white/60">
            Create cinematic videos, AI avatars,
            social clips, voiceovers and motion graphics
            powered by next-generation AI models.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Video className="mb-3 h-6 w-6 text-cyan-400" />

              <h3 className="font-medium">
                AI Video Generation
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Generate cinematic scenes instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <Sparkles className="mb-3 h-6 w-6 text-violet-400" />

              <h3 className="font-medium">
                Smart AI Editing
              </h3>

              <p className="mt-1 text-sm text-white/50">
                Captions, transitions and effects.
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
                Export ultra-high-quality videos.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-white/40">
          Trusted by creators, filmmakers and AI studios worldwide.
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

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Create your account
            </h2>

            <p className="mt-2 text-white/50">
              Start generating cinematic AI videos today
            </p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">

            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/dashboard",
                })
              }
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 transition hover:bg-white/10"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5"
              />

              Continue with Google
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
              type="text"
              placeholder="Full name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-500"
            />

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

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-500"
            />

            <p className="text-xs text-white/40">
              Use at least 8 characters with numbers and symbols.
            </p>

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-white/50">
              <input
                type="checkbox"
                className="mt-1 rounded border-white/20 bg-white/5"
              />

              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            {/* CTA */}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-cyan-500 py-3 font-medium transition hover:opacity-90">
              Create Account

              <ArrowRight className="h-4 w-4" />
            </button>

          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}

            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Login
            </Link>
          </p>

        </motion.div>
      </div>
    </main>
  );
}