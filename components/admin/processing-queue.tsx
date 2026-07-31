const queue = [
  {
    task: "AI Clip Generation",
    status: "Running",
  },
  {
    task: "Caption Rendering",
    status: "Queued",
  },
  {
    task: "FFmpeg Export",
    status: "Completed",
  },
];

export default function ProcessingQueue() {
  return (
    <div className="glass rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-6">
        AI Processing Queue
      </h2>

      <div className="space-y-4">
        {queue.map((item) => (
          <div
            key={item.task}
            className="glass rounded-2xl p-5 flex items-center justify-between"
          >
            <p>{item.task}</p>

            <span className="text-cyan-400 text-sm">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}