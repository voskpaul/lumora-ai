import DashboardShell from "./dashboard-shell";

export default function StudioShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <div className="space-y-8">
        {children}
      </div>
    </DashboardShell>
  );
}