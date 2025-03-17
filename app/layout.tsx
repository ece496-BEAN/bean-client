// app/layout.tsx

import "./globals.css";
import { Metadata } from "next";
import LayoutClient from "@/components/LayoutClient"; // Import LayoutClient
import JwtProvider from "./lib/jwt-provider";

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
        <JwtProvider>
          <LayoutClient>{children}</LayoutClient>
        </JwtProvider>
      </body>
    </html>
  );
}
