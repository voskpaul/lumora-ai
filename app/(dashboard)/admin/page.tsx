import AdminShell from "@/components/admin/admin-shell";
import AnalyticsCard from "@/components/admin/analytics-card";
import UsersTable from "@/components/admin/users-table";
import ProcessingQueue from "@/components/admin/processing-queue";

export default function AdminPage() {
  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Users"
            value="12,480"
            growth="+18% growth"
          />

          <AnalyticsCard
            title="Monthly Revenue"
            value="$48,200"
            growth="+12% growth"
          />

          <AnalyticsCard
            title="Videos Generated"
            value="98K"
            growth="+32% growth"
          />

          <AnalyticsCard
            title="AI Jobs Running"
            value="342"
            growth="Live monitoring"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <UsersTable />
          <ProcessingQueue />
        </div>
      </div>
    </AdminShell>
  );
}