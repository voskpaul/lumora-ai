import StudioShell from "@/components/dashboard/studio-shell";
import UploadZone from "@/components/dashboard/upload-zone";
import AIProcessing from "@/components/dashboard/ai-processing";
import TimelineEditor from "@/components/dashboard/timeline-editor";
import CaptionsPanel from "@/components/dashboard/captions-panel";

export default function StudioPage() {
  return (
    <StudioShell>
      <div>
        <h1 className="text-4xl font-bold">
          AI Studio
        </h1>

        <p className="text-gray-400 mt-2">
          Upload videos and generate viral clips instantly.
        </p>
      </div>

      <UploadZone />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AIProcessing />
        <CaptionsPanel />
      </div>

      <TimelineEditor />
    </StudioShell>
  );
}