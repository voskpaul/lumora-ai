import {
  Upload,
  Scissors,
  Captions,
  Rocket,
} from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Long Video",
    desc: "Upload podcasts, interviews, YouTube videos or webinars.",
  },
  {
    icon: Scissors,
    title: "AI Detects Viral Moments",
    desc: "Lumora AI finds high-engagement sections automatically.",
  },
  {
    icon: Captions,
    title: "Generate Captions & Hooks",
    desc: "Lumora AI creates subtitles, titles and social-ready formatting.",
  },
  {
    icon: Rocket,
    title: "Publish Everywhere",
    desc: "Push content directly to TikTok, Reels, Shorts and LinkedIn.",
  },
];

export default function AIWorkflow() {
  return (
    <section className="py-28 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6">
            AI Powered <span className="gradient-text">Workflow</span>
          </h2>

          <p className="text-zinc-400 max-w-2xl mx-auto">
            From long-form content to viral short clips in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <div
                key={i}
                className="glass rounded-3xl p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 text-8xl font-bold text-white/5">
                  0{i + 1}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-cyan-400" />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {step.title}
                </h3>

                <p className="text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}