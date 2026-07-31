import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold">404</h1>

      <p className="mt-4 text-zinc-400">
        Page not found
      </p>

      <Link
        href="/"
        className="mt-6 rounded-xl bg-white px-6 py-3 text-black"
      >
        Go Home
      </Link>
    </div>
  );
}