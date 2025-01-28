import "./globals.css"; // Keep your global styles
import { Metadata } from "next"; // Keep metadata if needed
import NavigationBar from "@/components/NavigationBar"; // Import your NavigationBar component
import { BudgetProvider } from "@/contexts/BudgetContext";
import { PlaidProvider } from "@/contexts/PlaidContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import { getSession } from "next-auth/react";
import Providers from "./providers";

export const metadata = {
  title: "My Awesome App",
  description: "This is my awesome app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <Providers session={session}>
          <TransactionsProvider>
            <NavigationBar /> {/* Add your navigation bar */}
            <main>
              <PlaidProvider>
                <BudgetProvider>{children}</BudgetProvider>
              </PlaidProvider>
            </main>{" "}
            {/* Render page-specific content */}
          </TransactionsProvider>
        </Providers>
      </body>
    </html>
  );
}
