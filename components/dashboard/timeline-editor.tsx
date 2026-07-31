export default function TimelineEditor() {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">
          Timeline Editor
        </h2>

        <button className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 transition">
          Export Clip
        </button>
      </div>

      <div className="space-y-4">
        <div className="h-28 rounded-2xl bg-white/5 flex items-center px-4">
          <div className="w-full h-4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
        </div>

        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}