"use client";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md border p-6 rounded-xl">
        <h1 className="text-xl font-bold mb-4">Reset password</h1>

        <input
          placeholder="Enter email"
          className="w-full p-3 border rounded-lg mb-3"
        />

        <button className="w-full p-3 bg-black text-white rounded-lg">
          Send reset link
        </button>
      </div>
    </div>
  );
}