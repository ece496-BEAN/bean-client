// import { LoginPage } from "@/components/login-page"

// export default function Page() {
//   return <LoginPage />
// }

import { RecentTransactionsPage } from "@/components/recent-transactions-page";
import JwtProvider from "../lib/jwt-provider";

export default function Page() {
  return <RecentTransactionsPage />;
}
