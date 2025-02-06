// app/layout.tsx
import "./globals.css";
import { Metadata } from "next";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import LayoutClient from "@/components/LayoutClient"; // Import LayoutClient

export const metadata: Metadata = {
  title: "My Awesome App" as string,
  description: "This is my awesome app" as string,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{String(metadata.title ?? "Default Title")}</title>
        <meta
          name="description"
          content={metadata.description ?? "Default Description"}
        />
      </head>
      <body>
        <TransactionsProvider>
          {/* Client Component is rendered here */}
          <LayoutClient>{children}</LayoutClient>
        </TransactionsProvider>
      </body>
    </html>
  );
}
