import { AuthScreen } from "@/components/auth/AuthScreen";

export default function LoginPage() {
  return (
    <AuthScreen
      role="admin"
      redirectTo="/admin"
      title="Admin sign in"
      subtitle="Manage companies, links, tickets and SLA."
    />
  );
}
