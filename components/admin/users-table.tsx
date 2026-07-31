const users = [
  {
    name: "Paul Njeru",
    email: "paul@example.com",
    plan: "Pro",
  },
  {
    name: "Sarah AI",
    email: "sarah@example.com",
    plan: "Free",
  },
  {
    name: "Creator Studio",
    email: "creator@example.com",
    plan: "Enterprise",
  },
];

export default function UsersTable() {
  return (
    <div className="glass rounded-3xl p-8 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">
        Recent Users
      </h2>

      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-white/10">
            <th className="pb-4">Name</th>
            <th className="pb-4">Email</th>
            <th className="pb-4">Plan</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.email}
              className="border-b border-white/5"
            >
              <td className="py-4">
                {user.name}
              </td>

              <td className="py-4">
                {user.email}
              </td>

              <td className="py-4 text-cyan-400">
                {user.plan}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}