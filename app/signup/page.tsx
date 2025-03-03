import { SignupPage } from "@/components/signup-page";
import JwtProvider from "@/app/lib/jwt-provider";

export default function Page() {
  return (
    <JwtProvider>
      <SignupPage />
    </JwtProvider>
  );
}
