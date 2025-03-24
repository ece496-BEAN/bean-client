// import { LoginPage } from "@/components/login-page"

// export default function Page() {
//   return <LoginPage />
// }
import React from "react";
import { RecentTransactionsPage } from "@/components/RecentTransactionsPage";
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
