export default function DashboardPreview() {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass rounded-[32px] overflow-hidden border border-white/10">
          
          <div className="border-b border-white/10 p-4 flex items-center gap-2 bg-black/30">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] min-h-[650px]">

            <div className="border-r border-white/10 p-6 bg-black/20">
              <h3 className="text-2xl font-bold mb-10">
                Lumora AI
              </h3>

              <div className="space-y-4">
                {[
                  "Dashboard",
                  "Projects",
                  "AI Editor",
                  "Analytics",
                  "Publishing",
                  "Settings",
                ].map((item) => (
                  <div
                    key={item}
                    className="px-4 py-3 rounded-xl hover:bg-white/10 transition cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 grid gap-6">

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  "Videos Processed",
                  "AI Clips Generated",
                  "Total Views",
                ].map((card) => (
                  <div
                    key={card}
                    className="glass rounded-2xl p-6"
                  >
                    <p className="text-zinc-400 mb-3">
                      {card}
                    </p>

                    <h4 className="text-4xl font-bold">
                      {Math.floor(Math.random() * 900 + 100)}K
                    </h4>
                  </div>
                ))}
              </div>

              <div className="glass rounded-3xl p-8 min-h-[320px]">
                <div className="flex justify-between mb-10">
                  <h3 className="text-2xl font-bold">
                    Viral Clip Performance
                  </h3>

                  <div className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300">
                    +245%
                  </div>
                </div>

                <div className="h-[220px] flex items-end gap-4">
                  {[40, 65, 90, 50, 120, 150, 180].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px` }}
                      className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-400"
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}