// src/components/LayoutClient.tsx
"use client"; // Mark this component as client-side

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import { PlaidProvider } from "@/contexts/PlaidContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { ReactNode } from "react";

function LayoutClient({ children }: { children: ReactNode }) {
  // login & survey page -> no naviagtion bar
  const pathname = usePathname();
  const excludedPaths = ["/login", "/survey"];
  const showNavigationBar = !excludedPaths.includes(pathname);

  return (
    <>
      {showNavigationBar && <NavigationBar />}
      <main>
        <PlaidProvider>
          <BudgetProvider>{children}</BudgetProvider>
        </PlaidProvider>
      </main>
    </>
  );
}

export default LayoutClient; // Don't forget to export it!
