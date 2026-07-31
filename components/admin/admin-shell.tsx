import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <div className="flex-1">
        <AdminTopbar />

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}