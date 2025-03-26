"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import { ReactNode } from "react";
import TransactionProvider from "@/contexts/TransactionsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import CategoryProvider from "@/contexts/CategoriesContext";
import DocumentScansProvider from "@/contexts/DocumentScansContext";
import DocumentScansImageProvider from "@/contexts/DocumentScansImageContext";
import { useJwt } from "@/app/lib/jwt-provider";

function LayoutClient({ children }: { children: ReactNode }) {
  // login & survey page -> no navigation bar
  const pathname = usePathname();
  const router = useRouter();
  const excludedPaths = ["/login", "/survey", "/signup"];
  const showNavigationBar = !excludedPaths.includes(pathname);
  const [jwt, _] = useJwt();

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const [queryClient] = useState(() => new QueryClient());
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryClientProvider client={queryClient}>
          {showNavigationBar && (
            <TransactionProvider>
              <CategoryProvider>
                <DocumentScansImageProvider>
                  <DocumentScansProvider>
                    <NavigationBar />
                  </DocumentScansProvider>
                </DocumentScansImageProvider>
              </CategoryProvider>
            </TransactionProvider>
          )}

          <main className="pb-16">{children}</main>
        </QueryClientProvider>
      </LocalizationProvider>
    </>
  );
}

export default LayoutClient; // Don't forget to export it!
