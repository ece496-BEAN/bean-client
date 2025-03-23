// components/PlaidLinkButton.tsx
"use client";

import { usePlaidLink } from "react-plaid-link";
import { usePlaidContext } from "@/contexts/PlaidContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategories } from "@/contexts/CategoriesContext";

const PlaidLinkButton = () => {
  const {
    linkToken,
    exchangePublicToken,
    generateLinkToken,
    userId,
    fetchTransactions,
  } = usePlaidContext();

  const { categories } = useCategories();

  const { addTransactionGroup } = useTransactions();

  const onSuccess = async (public_token: string, metadata: any) => {
    console.log("PlaidLink onSuccess called"); // Debugging log
    await exchangePublicToken(public_token);

    const string_categories = categories
      // .filter((category) => !category.legacy && !category.is_income_type)
      .map((category) => category.name);
    console.log(string_categories);
    // Fetch transactions after successful exchange
    const newTransactions = await fetchTransactions(string_categories);
    for (const transactionGroup of newTransactions) {
      console.log("Fetched transaction group:", transactionGroup); // Debugging log
      console.log("FRANK: PLEASE INTEGRATE THIS!!!");
    }
  };

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready, error } = usePlaidLink(config);

  // Debugging logs for 'ready' and 'error' states
  useEffect(() => {
    console.log("PlaidLink ready state:", ready);
    if (error) {
      console.error("PlaidLink error:", error);
    }
  }, [ready, error]);

  // Automatically generate link token when the component mounts
  useEffect(() => {
    if (!linkToken && userId) {
      generateLinkToken(userId);
    }
  }, [linkToken, generateLinkToken, userId]);

  return (
    <Button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </Button>
  );
};

export default PlaidLinkButton;
