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
  transactionGroups:
    | PaginatedServerResponse<TransactionGroup>
    | TransactionGroup[];
  isLoading: boolean;
  queryError: Error | null;
  mutationError: Error | null;
  getTransactionGroups: (
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[] | undefined
    >,
  ) => void;
  addTransactionGroup: (newGroup: TransactionGroup) => Promise<void>;
  editTransactionGroup: (editedGroup: TransactionGroup) => Promise<void>;
  deleteTransactionGroup: (groupId: string) => Promise<void>;
  refetchTransactions: () => void;
}

export type TransactionGroupQueryParameters = {
  date_after?: string;
  date_before?: string;
  category_uuid?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  no_page?: undefined;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export default function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<Error | null>(null); // State to hold the mutation error
  const [queryOptions, setQueryOptions] = useState<Record<string, any>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transaction-groups", queryOptions],
    queryFn: async () => {
      try {
        const queryString = new URLSearchParams(queryOptions).toString();
        const url = `transaction-groups/?${queryString}`;
        const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
        const data:
          | PaginatedServerResponse<TransactionGroup>
          | TransactionGroup[] = await response.json();

        return data;
      } catch (error) {
        throw new Error("Error fetching transaction groups: " + error);
      }
    },
    enabled: !!jwt, // Only fetch when jwt is available
  });
  const getTransactionGroups = (
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[] | undefined
    >,
  ) => {
    if (queryParams) {
      // triggers refetch since queryOptions is part of the queryKey
      setQueryOptions(queryParams);
    } else {
      // if no queryParams are provided, force refresh using existing queryOptions.
      refetch();
    }
  };
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
    transactionGroups:
      data ||
      ({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as PaginatedServerResponse<TransactionGroup>),
    isLoading,
    queryError: error,
    mutationError: mutationError,
    addTransactionGroup,
    editTransactionGroup,
    deleteTransactionGroup,
    refetchTransactions,
    getTransactionGroups,
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
