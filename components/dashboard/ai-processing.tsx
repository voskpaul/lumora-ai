import { Sparkles, Wand2, Scissors } from "lucide-react";

const items = [
  {
    title: "AI Detecting Viral Moments",
    icon: Sparkles,
  },
  {
    title: "Generating Captions",
    icon: Wand2,
  },
  {
    title: "Auto Cutting Clips",
    icon: Scissors,
  },
];

export default function AIProcessing() {
  return (
    <div className="glass rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-8">
        AI Processing
      </h2>

      <div className="space-y-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center justify-between glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Icon className="text-violet-400" />
                </div>

                <p className="font-medium">
                  {item.title}
                </p>
              </div>

              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          );
        })}
      </div>
    </div>
  );
}