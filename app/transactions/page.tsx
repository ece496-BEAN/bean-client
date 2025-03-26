import React from "react";
import { RecentTransactionsPage } from "@/components/RecentTransactionsPage";
import CategoryProvider from "@/contexts/CategoriesContext";
import TransactionsProvider from "@/contexts/TransactionsContext";
import { PlaidProvider } from "@/contexts/PlaidContext";

export default function Page() {
  return (
    <TransactionsProvider>
      <CategoryProvider>
        <PlaidProvider>
          <RecentTransactionsPage />
        </PlaidProvider>
      </CategoryProvider>
    </TransactionsProvider>
  );
}
