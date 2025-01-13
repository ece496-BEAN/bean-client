// In components/PlaidLinkButton.tsx
"use client";

import { usePlaidLink } from "react-plaid-link";

interface PlaidLinkButtonProps {
  linkToken: string;
  userId: string;
  onAccessTokenReady: () => void; // Add new prop
}

const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({
  linkToken,
  userId,
  onAccessTokenReady,
}) => {
  // Add onAccessTokenReady to props
  const onSuccess = async (public_token: string, metadata: any) => {
    // Exchange the public_token for an access_token
    const response = await fetch("/api/plaid/set_access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token, userId }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error exchanging public token:", data.error);
    } else {
      // Handle successful exchange (e.g., fetch transactions)
      console.log(
        "Public token exchanged for item_id, which has been logged to the console",
      );
      console.log("item_id: ", data.item_id);
      onAccessTokenReady(); // Signal that access_token is ready
    }
  };

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </button>
  );
};

export default PlaidLinkButton;
