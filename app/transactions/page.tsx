// import { LoginPage } from "@/components/login-page"

// export default function Page() {
//   return <LoginPage />
// }

import { RecentTransactionsPage } from "@/components/recent-transactions-page";
import CategoryProvider from "@/contexts/CategoriesContext";
import TransactionsProvider from "@/contexts/TransactionsContext";

export default function Page() {
  return (
    <TransactionsProvider>
      <CategoryProvider>
        <RecentTransactionsPage />
      </CategoryProvider>
    </TransactionsProvider>
  );
}
