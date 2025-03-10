// src/components/LayoutClient.tsx
"use client"; // Mark this component as client-side

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import { PlaidProvider } from "@/contexts/PlaidContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { ReactNode } from "react";
import TransactionProvider from "@/contexts/TransactionsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function LayoutClient({ children }: { children: ReactNode }) {
  // login & survey page -> no naviagtion bar
  const pathname = usePathname();
  const excludedPaths = ["/login", "/survey", "/signup"];
  const showNavigationBar = !excludedPaths.includes(pathname);

  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        {showNavigationBar && (
          <TransactionProvider>
            <NavigationBar />
          </TransactionProvider>
        )}

        <main className="pb-16">
          {/* TODO: Move Plaid and Budget Provider to components that need them rather than wrap everything with them */}
          <PlaidProvider>
            <BudgetProvider>{children}</BudgetProvider>
          </PlaidProvider>
        </main>
      </QueryClientProvider>
    </>
  );
}

export default LayoutClient; // Don't forget to export it!
