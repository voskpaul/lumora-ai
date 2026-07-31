const projects = [
  {
    name: "YouTube Podcast Edit",
    status: "Processing",
  },
  {
    name: "TikTok AI Clips",
    status: "Completed",
  },
  {
    name: "Instagram Reels",
    status: "Queued",
  },
];

export default function RecentProjects() {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6">
        Recent Projects
      </h2>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.name}
            className="flex items-center justify-between border-b border-white/5 pb-3"
          >
            <div>
              <p className="font-medium">
                {project.name}
              </p>
            </div>

            <span className="text-sm text-cyan-400">
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}