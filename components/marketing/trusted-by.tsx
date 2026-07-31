export default function TrustedBy() {
  const brands = [
    "TikTok",
    "YouTube",
    "Instagram",
    "LinkedIn",
    "X",
    "Facebook",
  ];

  return (
    <section className="py-14 border-y border-white/5 bg-black/20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-sm text-zinc-400 mb-8 uppercase tracking-[0.3em]">
          Optimized for creators publishing on
        </p>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <div
              key={brand}
              className="glass rounded-2xl py-5 text-center text-white font-semibold hover:scale-105 transition"
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}