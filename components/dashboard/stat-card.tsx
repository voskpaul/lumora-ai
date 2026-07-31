interface Props {
  title: string;
  value: string;
  description: string;
}

export default function StatCard({
  title,
  value,
  description,
}: Props) {
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

      <p className="text-sm text-cyan-400 mt-2">
        {description}
      </p>
    </div>
  );
}