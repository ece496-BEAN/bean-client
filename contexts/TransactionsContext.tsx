"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JwtContext } from "@/app/lib/jwt-provider";
import { fetchApi } from "@/app/lib/api";
import {
  TransactionGroup,
  ServerResponse,
  NonPaginatedServerResponse,
  PaginatedServerResponse,
  ReadOnlyTransaction,
  Transaction,
} from "@/lib/types";

interface TransactionsContextType {
  transactionGroups: NonPaginatedServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  >;
  isTransactionGroupsLoading: boolean;
  transactionGroupsQueryError: Error | null;

  paginatedTransactionGroups: PaginatedServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  >;
  isPaginatedTransactionGroupsLoading: boolean;
  paginatedTransactionGroupsQueryError: Error | null;

  mutationError: Error | null;
  getTransactionGroups: (
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[] | undefined
    >,
    options?: { no_page?: boolean },
  ) => void;

  addTransactionGroup: (
    newGroup: Omit<TransactionGroup<Transaction>, "id">,
  ) => Promise<void>;
  editTransactionGroup: (
    editedGroup: TransactionGroup<Transaction>,
  ) => Promise<void>;
  deleteTransactionGroup: (groupId: string) => Promise<void>;
  refetchTransactions: () => void;

  getSelectedTransactionGroup: (groupId: string) => void; // Gets specified transaction group
  selectedTransactionGroup: TransactionGroup<ReadOnlyTransaction> | undefined;
  isSelectedTransactionGroupLoading: boolean;
  selectedTransactionGroupError: Error | null;
  refetchSelectedTransactionGroup: () => void;
  refetchPaginatedTransactionGroups: () => void;
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
  const queryClient = useQueryClient();

  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const [mutationError, setMutationError] = useState<Error | null>(null); // State to hold the mutation error
  const [queryOptions, setQueryOptions] = useState<Record<string, any>>({});
  const [paginatedQueryOptions, setPaginatedQueryOptions] = useState<
    Record<string, any>
  >({});
  const [selectedTransactionGroupUUID, setSelectedTransactionGroupUUID] =
    useState<string | null>(null);

  const fetchTransactionGroups = async (queryOptions: Record<string, any>) => {
    try {
      const queryString = new URLSearchParams(queryOptions).toString();
      const url = `transaction-groups/?${queryString}`;
      const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
      const data: ServerResponse<TransactionGroup<ReadOnlyTransaction>> =
        await response.json();

      return data;
    } catch (err) {
      throw new Error("Error fetching transaction groups: " + err);
    }
  };

  // Fetch Non-Paginated Transaction Groups
  const {
    data: transactionGroups,
    isLoading: isTransactionGroupsLoading,
    error: transactionGroupsQueryError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transaction-groups", queryOptions],
    queryFn: () => fetchTransactionGroups(queryOptions),
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Fetch Paginated Transaction Groups
  const {
    data: paginatedTransactionGroups,
    isLoading: isPaginatedTransactionGroupsLoading,
    error: paginatedTransactionGroupsQueryError,
    refetch: refetchPaginatedTransactionGroups,
  } = useQuery({
    queryKey: ["transaction-groups", paginatedQueryOptions],
    queryFn: () => fetchTransactionGroups(paginatedQueryOptions),
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Add `options: { no_page: true }` for non-paginated response
  const getTransactionGroups = useCallback(
    (
      queryParams?: Record<
        string,
        string | number | boolean | (string | number | boolean)[] | undefined
      >,
      options?: { no_page?: boolean },
    ) => {
      if (queryParams) {
        if (options?.no_page) {
          // if no_page is set, don't use pagination
          setQueryOptions({ ...queryParams, no_page: true });
        } else {
          // Extract `no_page` from queryParams if it exists
          const { no_page, ...paginatedQueryParams } = queryParams || {};
          setPaginatedQueryOptions(paginatedQueryParams);
        }
      } else {
        options?.no_page
          ? refetchTransactions()
          : refetchPaginatedTransactionGroups();
      }
    },
    [refetchTransactions, refetchPaginatedTransactionGroups],
  );

  // Used for fetching a single transaction group
  const {
    data: selectedTransactionGroup,
    isLoading: isSelectedTransactionGroupLoading,
    error: selectedTransactionGroupError,
    refetch: refetchSelectedTransactionGroup,
  } = useQuery({
    queryKey: ["transaction-groups", selectedTransactionGroupUUID],
    queryFn: async () => {
      if (!selectedTransactionGroupUUID) {
        throw Error("No transaction group UUID provided");
      }

      try {
        const response = await fetchApi(
          jwt,
          setAndStoreJwt,
          `transaction-groups/${selectedTransactionGroupUUID}/`,
          "GET",
        );
        const transactionGroup: TransactionGroup<ReadOnlyTransaction> =
          await response.json();

        return transactionGroup;
      } catch (error) {
        throw new Error(
          "Error fetching transaction group: " +
            selectedTransactionGroupUUID +
            error,
        );
      }
    },
    enabled: !!selectedTransactionGroupUUID && !!jwt, // Only fetch if uuid is set and jwt is available
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
    mutationFn: async (newGroup: Omit<TransactionGroup<Transaction>, "id">) => {
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
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
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
    mutationFn: async (
      editedTransactionGroup: TransactionGroup<Transaction>,
    ) => {
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
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
    },
  });

  const addTransactionGroup = async (
    transactionGroup: Omit<TransactionGroup<Transaction>, "id">,
  ) => {
    await addTransactionGroupMutation.mutateAsync(transactionGroup);
  };

  const editTransactionGroup = async (
    transactionGroup: TransactionGroup<Transaction>,
  ) => {
    await editTransactionGroupMutation.mutateAsync(transactionGroup);
  };

  const deleteTransactionGroup = async (groupId: string) => {
    await deleteTransactionGroupMutation.mutateAsync(groupId);
  };

  const getSelectedTransactionGroup = (uuid: string) => {
    setSelectedTransactionGroupUUID(uuid);
    refetchSelectedTransactionGroup();
  };
  const defaultNonPaginatedData: ServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  > = {
    results: [],
    totals: { income: 0, expense: 0 },
  };
  const defaultPaginatedData: ServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  > = {
    ...defaultNonPaginatedData,
    count: 0,
    next: null,
    previous: null,
  };
  const contextValue = {
    transactionGroups:
      (transactionGroups as NonPaginatedServerResponse<
        TransactionGroup<ReadOnlyTransaction>
      >) || defaultNonPaginatedData,
    isTransactionGroupsLoading,
    transactionGroupsQueryError,
    paginatedTransactionGroups:
      (paginatedTransactionGroups as PaginatedServerResponse<
        TransactionGroup<ReadOnlyTransaction>
      >) || defaultPaginatedData,
    isPaginatedTransactionGroupsLoading,
    paginatedTransactionGroupsQueryError,
    mutationError,
    addTransactionGroup,
    editTransactionGroup,
    deleteTransactionGroup,
    refetchTransactions,
    getTransactionGroups,
    getSelectedTransactionGroup,
    selectedTransactionGroup,
    isSelectedTransactionGroupLoading,
    selectedTransactionGroupError,
    refetchSelectedTransactionGroup,
    refetchPaginatedTransactionGroups,
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
