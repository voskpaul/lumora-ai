export default function TemplatesPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-6">
        Templates
      </h1>

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          YouTube Shorts
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          TikTok Ad
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          Product Commercial
        </div>

      </div>
    </div>
  );
}