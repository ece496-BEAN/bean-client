import React from "react";
import { ProfilePage } from "@/components/ProfilePage";
import AccountProvider from "@/contexts/AccountContext";

export default function Page() {
  return (
    <AccountProvider>
      <ProfilePage />
    </AccountProvider>
  );
}
