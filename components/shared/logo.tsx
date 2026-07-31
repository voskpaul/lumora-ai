import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-r from-violet-500 to-cyan-500 p-2 rounded-xl">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
        Limora AI
      </span>
    </div>
  );
}