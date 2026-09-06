import { AuthScreen } from "@/components/auth/AuthScreen";

export default function EngineerLoginPage() {
  return (
    <AuthScreen
      role="engineer"
      redirectTo="/ext"
      title="Field app sign in"
      subtitle="Use the mobile number from your onboarding invite."
    />
  );
}
