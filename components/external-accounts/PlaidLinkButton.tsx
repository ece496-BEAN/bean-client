// components/PlaidLinkButton.tsx
"use client";

import { usePlaidLink } from "react-plaid-link";
import { usePlaidContext } from "@/contexts/PlaidContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { Category, TransactionGroup, WriteOnlyTransaction } from "@/lib/types";
import { UUID } from "crypto";
import { Snackbar, Alert } from "@mui/material";

const PlaidLinkButton = () => {
  const {
    linkToken,
    exchangePublicToken,
    generateLinkToken,
    userId,
    fetchTransactions,
  } = usePlaidContext();

  const { categories, addCategory } = useCategories();

  const { addTransactionGroup } = useTransactions();

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const onSuccess = async (public_token: string, metadata: any) => {
    console.log("PlaidLink onSuccess called"); // Debugging log
    await exchangePublicToken(public_token);
    const category_string_to_obj: Record<string, Category> = categories
      .filter((category) => !category.legacy)
      .reduce(
        (acc, category) => {
          acc[category.name] = category;
          return acc;
        },
        {} as Record<string, Category>,
      );
    // Fetch transactions after successful exchange
    const newTransactions: any = await fetchTransactions(
      Object.keys(category_string_to_obj),
    );

    for (const transactionGroup of newTransactions) {
      for (const transaction of transactionGroup.transactions) {
        const category = transaction.category;
        if (!category_string_to_obj[category]) {
          const newCategory = (await addCategory({
            name: category,
            is_income_type: false, // or determine based on your logic
            color: "#000000",
          })) as Category;
          category_string_to_obj[category] = newCategory;
        }
      }
    }

    const newTransactionsWithCategoryUUID: TransactionGroup<WriteOnlyTransaction>[] =
      newTransactions.map((transactionGroup: any) => {
        return {
          ...transactionGroup,
          source: null,
          transactions: transactionGroup.transactions.map(
            (transaction: any) => {
              const category = transaction.category;
              if (!category_string_to_obj[category]) {
                console.error(
                  "Category not found for transaction:",
                  transaction,
                );
              }
              delete transaction.category;
              return {
                ...transaction,
                amount:
                  transaction.amount *
                  (category_string_to_obj[category].is_income_type ? 1 : -1),
                category_uuid: category_string_to_obj[category].id,
              };
            },
          ),
        };
      });

    console.log(
      "New transactions with category UUIDs:",
      newTransactionsWithCategoryUUID,
    ); // Debugging log

    for (const transactionGroup of newTransactionsWithCategoryUUID) {
      try {
        await addTransactionGroup(transactionGroup);
      } catch (error) {
        console.error("Error adding transaction group:", error);
        console.error("Transaction group:", transactionGroup);
        return;
      }
    }
    setOpenSnackbar(true); // Show snackbar on success
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
    <>
      <Button onClick={() => open()} disabled={!ready}>
        Connect a bank account
      </Button>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Importing completed successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default PlaidLinkButton;
