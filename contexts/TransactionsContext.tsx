"use client";

import React, { useMemo } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useJwt } from "@/app/lib/jwt-provider";
import { fetchApi } from "@/app/lib/api";
import {
  TransactionGroup,
  ServerResponse,
  NonPaginatedServerResponse,
  PaginatedServerResponse,
  ReadOnlyTransaction,
  Transaction,
  isArrayType,
  Category,
} from "@/lib/types";

interface TransactionsContextType {
  transactionGroups: NonPaginatedServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  >;
  isTransactionGroupsLoading: boolean;
  transactionGroupsQueryError: Error | null;
  isTransactionGroupsPlaceholderData: boolean;

  paginatedTransactionGroups: PaginatedServerResponse<
    TransactionGroup<ReadOnlyTransaction>
  >;
  isPaginatedTransactionGroupsLoading: boolean;
  paginatedTransactionGroupsQueryError: Error | null;
  isPaginatedTransactionGroupsPlaceholderData: boolean;

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
  ) => Promise<
    | TransactionGroup<ReadOnlyTransaction>
    | TransactionGroup<ReadOnlyTransaction>[]
  >;
  editTransactionGroup: (
    editedGroup: TransactionGroup<Transaction>,
  ) => Promise<TransactionGroup<ReadOnlyTransaction>>;
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
  category_type_is_income?: boolean;
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

  const [jwt, setAndStoreJwt] = useJwt();
  const [mutationError, setMutationError] = useState<Error | null>(null); // State to hold the mutation error
  const [queryOptions, setQueryOptions] = useState<Record<string, any>>({
    no_page: true,
  });
  const [paginatedQueryOptions, setPaginatedQueryOptions] = useState<
    Record<string, any>
  >({});
  const [selectedTransactionGroupUUID, setSelectedTransactionGroupUUID] =
    useState<string>();

  const fetchTransactionGroups = useCallback(
    async (queryOptions: Record<string, any>, options?: { uuid: string }) => {
      try {
        if (options?.uuid) {
          const url = `transaction-groups/${options.uuid}/`;
          const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
          const data: TransactionGroup<ReadOnlyTransaction> =
            await response.json();
          return data;
        }
        const queryString = new URLSearchParams(queryOptions).toString();
        const url = `transaction-groups/?${queryString}`;
        const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
        const data: ServerResponse<TransactionGroup<ReadOnlyTransaction>> =
          await response.json();

        return data;
      } catch (err) {
        if (options?.uuid) {
          throw new Error(
            `Error fetching transaction group/${selectedTransactionGroupUUID}: ` +
              err,
          );
        }
        throw new Error("Error fetching transaction groups: " + err);
      }
    },
    [jwt, setAndStoreJwt, selectedTransactionGroupUUID],
  );

  // Fetch Non-Paginated Transaction Groups
  const {
    data: transactionGroups,
    isLoading: isTransactionGroupsLoading,
    error: transactionGroupsQueryError,
    refetch: refetchTransactions,
    isPlaceholderData: isTransactionGroupsPlaceholderData,
  } = useQuery({
    queryKey: ["transaction-groups", queryOptions],
    queryFn: () => fetchTransactionGroups(queryOptions),
    placeholderData: keepPreviousData,
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Fetch Paginated Transaction Groups
  const {
    data: paginatedTransactionGroups,
    isLoading: isPaginatedTransactionGroupsLoading,
    error: paginatedTransactionGroupsQueryError,
    refetch: refetchPaginatedTransactionGroups,
    isPlaceholderData: isPaginatedTransactionGroupsPlaceholderData,
  } = useQuery({
    queryKey: ["transaction-groups", paginatedQueryOptions],
    queryFn: () => fetchTransactionGroups(paginatedQueryOptions),
    placeholderData: keepPreviousData,
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
    queryFn: () => {
      return fetchTransactionGroups(
        {},
        { uuid: selectedTransactionGroupUUID! },
      ) as Promise<TransactionGroup<ReadOnlyTransaction>>;
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
    mutationFn: async (
      newGroup:
        | Omit<TransactionGroup<Transaction>, "id">
        | Omit<TransactionGroup<Transaction>, "id">[],
    ) => {
      // Modify ReadOnlyTransaction to a WriteOnlyTransaction

      const processTransaction = (transaction: any) => {
        let updatedTransaction = { ...transaction };
        if ("category" in updatedTransaction) {
          const { category, ...rest } = updatedTransaction;
          updatedTransaction = { ...rest, category_uuid: category.id };
        }
        // Round to 2 Decimal Places since server cannot handle more than 2 decimal places
        if ("amount" in updatedTransaction) {
          updatedTransaction.amount = parseFloat(
            parseFloat(updatedTransaction.amount.toString()).toFixed(2),
          );
        }
        return updatedTransaction;
      };
      const processGroup = (
        group: Omit<TransactionGroup<Transaction>, "id">,
      ) => {
        return {
          ...group,
          transactions: group.transactions.map(processTransaction),
        };
      };

      const processedGroup = isArrayType(newGroup)
        ? newGroup.map((group) => processGroup(group))
        : processGroup(newGroup);

      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "transaction-groups/",
        "POST",
        processedGroup,
      );
      const data = await response.json();
      if (isArrayType(data)) {
        return data as TransactionGroup<ReadOnlyTransaction>[];
      }
      return data as TransactionGroup<ReadOnlyTransaction>;
    },

    onSuccess: () => {
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
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
          if ("category" in transaction) {
            const { category, ...rest } = transaction;
            transaction = { ...rest, category_uuid: (category as Category).id };
          }
          if ("amount" in transaction) {
            transaction.amount = parseFloat(
              parseFloat(transaction.amount.toString()).toFixed(2),
            );
          }
          return transaction;
        });

      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        `transaction-groups/${editedTransactionGroup.id}/`,
        "PUT",
        editedTransactionGroup,
      );
      return (await response.json()) as TransactionGroup<ReadOnlyTransaction>;
    },

    onSuccess: () => {
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
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
      await fetchApi(
        jwt,
        setAndStoreJwt,
        `transaction-groups/${groupId}/`,
        "DELETE",
      );
      return groupId;
    },

    onSuccess: (groupId) => {
      if (selectedTransactionGroupUUID === groupId) {
        setSelectedTransactionGroupUUID(undefined);
      }
      // Invalidate the transaction groups query and it will trigger an update
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const { mutateAsync: addTransactionGroupMutateAsync } =
    addTransactionGroupMutation;
  const { mutateAsync: editTransactionGroupMutateAsync } =
    editTransactionGroupMutation;
  const { mutateAsync: deleteTransactionGroupMutateAsync } =
    deleteTransactionGroupMutation;

  const addTransactionGroup = useCallback(
    async (
      transactionGroup:
        | Omit<TransactionGroup<Transaction>, "id">
        | Omit<TransactionGroup<Transaction>, "id">[],
    ) => {
      return await addTransactionGroupMutateAsync(transactionGroup);
    },
    [addTransactionGroupMutateAsync],
  );

  const editTransactionGroup = useCallback(
    async (transactionGroup: TransactionGroup<Transaction>) => {
      return await editTransactionGroupMutateAsync(transactionGroup);
    },
    [editTransactionGroupMutateAsync],
  );

  const deleteTransactionGroup = useCallback(
    async (groupId: string) => {
      await deleteTransactionGroupMutateAsync(groupId);
    },
    [deleteTransactionGroupMutateAsync],
  );

  const getSelectedTransactionGroup = useCallback(
    (uuid: string) => {
      setSelectedTransactionGroupUUID(uuid);
      refetchSelectedTransactionGroup();
    },
    [refetchSelectedTransactionGroup],
  );

  const defaultNonPaginatedData = useMemo(
    () => ({
      results: [],
      totals: { income: 0, expense: 0 },
    }),
    [],
  );

  const defaultPaginatedData = useMemo(
    () => ({
      ...defaultNonPaginatedData,
      count: 0,
      next: null,
      previous: null,
    }),
    [defaultNonPaginatedData],
  );
  const contextValue = {
    transactionGroups: useMemo(
      () =>
        (transactionGroups as NonPaginatedServerResponse<
          TransactionGroup<ReadOnlyTransaction>
        >) || defaultNonPaginatedData,
      [defaultNonPaginatedData, transactionGroups],
    ),
    isTransactionGroupsLoading,
    transactionGroupsQueryError,
    isTransactionGroupsPlaceholderData,
    paginatedTransactionGroups: useMemo(
      () =>
        (paginatedTransactionGroups as PaginatedServerResponse<
          TransactionGroup<ReadOnlyTransaction>
        >) || defaultPaginatedData,
      [defaultPaginatedData, paginatedTransactionGroups],
    ),
    isPaginatedTransactionGroupsLoading,
    paginatedTransactionGroupsQueryError,
    isPaginatedTransactionGroupsPlaceholderData,
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
