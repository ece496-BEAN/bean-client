"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import { PlaidProvider } from "@/contexts/PlaidContext";
import BudgetProvider from "@/contexts/BudgetContext";
import { ReactNode } from "react";
import TransactionProvider from "@/contexts/TransactionsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import CategoryProvider from "@/contexts/CategoriesContext";

function LayoutClient({ children }: { children: ReactNode }) {
  // login & survey page -> no navigation bar
  const pathname = usePathname();
  const excludedPaths = ["/login", "/survey", "/signup"];
  const showNavigationBar = !excludedPaths.includes(pathname);

  const [queryClient] = useState(() => new QueryClient());
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryClientProvider client={queryClient}>
          {showNavigationBar && (
            <TransactionProvider>
              <CategoryProvider>
                <NavigationBar />
              </CategoryProvider>
            </TransactionProvider>
          )}

          <main className="pb-16">
            {/* TODO: Move Plaid and Budget Provider to components that need them rather than wrap everything with them */}
            <PlaidProvider>
              <BudgetProvider>{children}</BudgetProvider>
            </PlaidProvider>
          </main>
        </QueryClientProvider>
      </LocalizationProvider>
    </>
  );
}

export default LayoutClient; // Don't forget to export it!
