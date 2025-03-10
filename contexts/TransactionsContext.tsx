"use client";

import { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JwtContext } from "@/app/lib/jwt-provider";
import { fetchApi } from "@/app/lib/api";
import {
  TransactionGroup,
  PaginatedServerResponse,
  Category,
} from "@/lib/types";

interface TransactionsContextType {
  transactionGroups: TransactionGroup[];
  isLoading: boolean;
  queryError: Error | null;
  mutationError: Error | null;
  addTransactionGroup: (newGroup: TransactionGroup) => Promise<void>;
  editTransactionGroup: (editedGroup: TransactionGroup) => Promise<void>;
  deleteTransactionGroup: (groupId: string) => Promise<void>;
  refetchTransactions: () => void;
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export default function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<Error | null>(null); // State to hold the mutation error

  const {
    data: transactionGroups,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transaction-groups"],
    queryFn: async () => {
      try {
        const response = await fetchApi(
          jwt,
          setAndStoreJwt,
          "transaction-groups/",
          "GET",
        );
        const data: PaginatedServerResponse<TransactionGroup> =
          await response.json();
        return data.results;
      } catch (error) {
        throw new Error("Error fetching transaction groups: " + error);
      }
    },
    enabled: !!jwt, // Only fetch when jwt is available
  });

  const addTransactionGroupMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error(
              "An error occurred during the transaction group addition.",
            ),
      );
    },
    mutationFn: async (newGroup: TransactionGroup) => {
      // Modify ReadOnlyTransaction to a WriteOnlyTransaction
      newGroup.transactions = newGroup.transactions.map((transaction) => {
        if ("category" in transaction) {
          const { category, ...rest } = transaction;

          transaction = { ...rest, category_uuid: category.id };
        }
        if ("amount" in transaction) {
          // Round to 2 Decimal Places since server cannot handle more than 2 decimal places
          transaction.amount = parseFloat(
            parseFloat(transaction.amount.toString()).toFixed(2),
          );
        }
        return transaction;
      });

      return fetchApi(
        jwt,
        setAndStoreJwt,
        "transaction-groups/",
        "POST",
        newGroup,
      );
    },

    onSuccess: () => {
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({ queryKey: ["transaction-groups"] });
    },
  });

  const editTransactionGroupMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the transaction group update."),
      );
    },
    mutationFn: async (editedTransactionGroup: TransactionGroup) => {
      // Convert ReadOnlyTransaction to WriteOnlyTransaction
      editedTransactionGroup.transactions =
        editedTransactionGroup.transactions.map((transaction) => {
          if ("id" in transaction) {
            const { id, category, group_id, ...rest } = transaction;

            transaction = { ...rest, uuid: id, category_uuid: category.id };
          }
          if ("amount" in transaction) {
            transaction.amount = parseFloat(
              parseFloat(transaction.amount.toString()).toFixed(2),
            );
          }
          return transaction;
        });

      return fetchApi(
        jwt,
        setAndStoreJwt,
        `transaction-groups/${editedTransactionGroup.id}/`,
        "PUT",
        editedTransactionGroup,
      );
    },

    onSuccess: () => {
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({ queryKey: ["transaction-groups"] });
    },
  });

  const deleteTransactionGroupMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error(
              "An error occurred during the transaction group deletion.",
            ),
      );
    },
    mutationFn: async (groupId: string) => {
      return fetchApi(
        jwt,
        setAndStoreJwt,
        `transaction-groups/${groupId}/`,
        "DELETE",
      );
    },

    onSuccess: () => {
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({ queryKey: ["transaction-groups"] });
    },
  });

  const addTransactionGroup = async (transactionGroup: TransactionGroup) => {
    await addTransactionGroupMutation.mutateAsync(transactionGroup);
  };

  const editTransactionGroup = async (transactionGroup: TransactionGroup) => {
    await editTransactionGroupMutation.mutateAsync(transactionGroup);
  };

  const deleteTransactionGroup = async (groupId: string) => {
    await deleteTransactionGroupMutation.mutateAsync(groupId);
  };

  const refetchTransactions = () => {
    refetch();
  };

  const contextValue = {
    transactionGroups: transactionGroups || [],
    isLoading,
    queryError: error,
    mutationError: mutationError,
    addTransactionGroup,
    editTransactionGroup,
    deleteTransactionGroup,
    refetchTransactions,
  };

  return (
    <TransactionsContext.Provider value={contextValue}>
      {children}
    </TransactionsContext.Provider>
  );
}

export const useTransactions = () => {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider",
    );
  }

  return context;
};
