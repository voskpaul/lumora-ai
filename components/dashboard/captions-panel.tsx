const captions = [
  "This AI tool changed everything...",
  "Watch what happens next...",
  "Most creators miss this trick...",
  "Here's how viral videos are made...",
];

export default function CaptionsPanel() {
  return (
    <div className="glass rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-6">
        AI Captions
      </h2>

      <div className="space-y-4">
        {captions.map((caption, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-4 hover:border-cyan-400 transition"
          >
            {caption}
          </div>
        ))}
      </div>
    </div>
  );
}