import {
  Sparkles,
  Wand2,
  Video,
  Captions,
  BrainCircuit,
  Rocket,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Viral Hooks",
    desc: "Generate high-retention hooks designed for social algorithms.",
  },
  {
    icon: Video,
    title: "Auto Clip Detection",
    desc: "Detect viral moments from long videos automatically.",
  },
  {
    icon: Captions,
    title: "Animated Captions",
    desc: "Dynamic subtitles with TikTok/Reels styling.",
  },
  {
    icon: BrainCircuit,
    title: "AI Optimization",
    desc: "Titles, hashtags, descriptions, SEO and engagement analysis.",
  },
  {
    icon: Wand2,
    title: "One Click Editing",
    desc: "Trim, resize, crop and enhance clips instantly.",
  },
  {
    icon: Rocket,
    title: "Direct Publishing",
    desc: "Publish directly to social platforms from one dashboard.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-28 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-5">
            Built for <span className="gradient-text">Viral Growth</span>
          </h2>

          <p className="text-zinc-400 max-w-2xl mx-auto">
            Lumora AI combines AI editing, automation and social publishing
            into one modern creator platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <div
                key={i}
                className="glass rounded-3xl p-8 hover:-translate-y-2 transition duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-violet-400" />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                <p className="text-zinc-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}