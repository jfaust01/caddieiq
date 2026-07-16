import { AdminSetupForm } from "@/features/setup/admin-setup-form"

export const metadata = {
  title: "Admin Setup",
  description: "Create the initial admin user for CaddieIQ",
}

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <AdminSetupForm />
      </div>
    </div>
  )
}
