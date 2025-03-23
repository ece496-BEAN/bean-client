"use client";

import { fetchApi } from "@/app/lib/api";
import { JwtContext } from "@/app/lib/jwt-provider";
import {
  Budget,
  NonPaginatedServerResponse,
  PaginatedServerResponse,
  ServerResponse,
} from "@/lib/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";

type BudgetContextType = {
  budgets: NonPaginatedServerResponse<Budget>;
  isBudgetsLoading: boolean;
  budgetsQueryError: Error | null;
  refetchBudgets: () => void;
  isBudgetPlaceholderData: boolean;

  paginatedBudgets: PaginatedServerResponse<Budget>;
  isPaginatedBudgetsLoading: boolean;
  paginatedBudgetsQueryError: Error | null;
  refetchPaginatedBudgets: () => void;
  isPaginatedBudgetPlaceholderData: boolean;

  selectedBudget: Budget | undefined;
  isSelectedBudgetLoading: boolean;
  selectedBudgetQueryError: Error | null;
  refetchSelectedBudget: () => void;
  isSelectedBudgetPlaceholderData: boolean;

  mutationError: Error | null;
  getBudgets: (
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[] | undefined
    >,
    options?: { no_page?: boolean },
  ) => void;
  getSelectedBudget: (uuid: string) => void;
  addBudget: (budget: Budget) => Promise<Budget>;
  editBudget: (budget: Budget) => Promise<Budget>;
  deleteBudget: (budgetId: string) => Promise<void>;
};

export type BudgetQueryParameters = {
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  no_page?: undefined;
};

const BudgetContext = createContext<BudgetContextType | null>(null);

export default function BudgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const [mutationError, setMutationError] = useState<Error | null>(null); // State to hold the mutation error
  const [queryOptions, setQueryOptions] = useState<Record<string, any>>({
    no_page: true,
  });
  const [paginatedQueryOptions, setPaginatedQueryOptions] = useState<
    Record<string, any>
  >({});
  const [selectedBudgetUUID, setSelectedBudgetUUID] = useState<string>();

  const fetchBudgets = async (
    queryOptions: Record<string, any>,
    options?: { uuid: string },
  ) => {
    try {
      if (options?.uuid) {
        const url = `budgets/${options.uuid}/`;
        const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
        const data: Budget = await response.json();
        return data;
      }
      const queryString = new URLSearchParams(queryOptions).toString();
      const url = `budgets/?${queryString}`;
      const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
      const data: ServerResponse<Budget> = await response.json();

      return data;
    } catch (err) {
      throw new Error("Error fetching budgets: " + err);
    }
  };

  // Fetch budgets without pagination
  const {
    data: budgets,
    isLoading: isBudgetsLoading,
    error: budgetsQueryError,
    refetch: refetchBudgets,
    isPlaceholderData: isBudgetPlaceholderData,
  } = useQuery({
    queryKey: ["budgets", queryOptions],
    queryFn: () => fetchBudgets(queryOptions),
    placeholderData: keepPreviousData,
    enabled: !!jwt,
  });

  // Fetch paginated budgets
  const {
    data: paginatedBudgets,
    isLoading: isPaginatedBudgetsLoading,
    error: paginatedBudgetsQueryError,
    refetch: refetchPaginatedBudgets,
    isPlaceholderData: isPaginatedBudgetPlaceholderData,
  } = useQuery({
    queryKey: ["budgets", paginatedQueryOptions],
    queryFn: () => fetchBudgets(paginatedQueryOptions),
    placeholderData: keepPreviousData,
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Fetch a single budget
  const {
    data: selectedBudget,
    isLoading: isSelectedBudgetLoading,
    error: selectedBudgetQueryError,
    refetch: refetchSelectedBudget,
    isPlaceholderData: isSelectedBudgetPlaceholderData,
  } = useQuery({
    queryKey: ["budgets", selectedBudgetUUID],
    queryFn: () =>
      fetchBudgets({}, { uuid: selectedBudgetUUID! }) as Promise<Budget>,
    placeholderData: keepPreviousData,
    enabled: !!selectedBudgetUUID,
  });

  const getBudgets = useCallback(
    (
      queryParams?: Record<
        string,
        string | number | boolean | (string | number | boolean)[] | undefined
      >,
      options?: { no_page?: boolean },
    ) => {
      if (options?.no_page) {
        setQueryOptions({ ...queryParams, no_page: true });
      } else {
        const { no_page, ...paginatedQueryParams } = queryParams || {};
        setPaginatedQueryOptions(paginatedQueryParams);
      }
    },
    [setQueryOptions, setPaginatedQueryOptions],
  );

  const getSelectedBudget = useCallback(
    (uuid: string) => {
      setSelectedBudgetUUID(uuid);
      refetchSelectedBudget();
    },
    [refetchSelectedBudget],
  );

  const addBudgetMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the budget creation."),
      );
    },
    mutationFn: async (newBudget: Omit<Budget, "id">) => {
      newBudget.budget_items = newBudget.budget_items.map((item) => {
        if ("category" in item) {
          const { category, ...rest } = item;
          item = {
            ...rest,
            category_uuid: item.category.id,
          };
        }
        // Round to 2 Decimal Places since server cannot handle more than 2 decimal places
        item.allocation = parseFloat(item.allocation.toFixed(2));
        return item;
      });
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "budgets/",
        "POST",
        newBudget,
      );
      return (await response.json()) as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentBudget"],
      });
    },
  });

  const editBudgetMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the budget update."),
      );
    },
    mutationFn: async (updatedBudget: Budget) => {
      // Convert ReadOnlyBudgetItem to WriteOnlyBudgetItem
      updatedBudget.budget_items = updatedBudget.budget_items.map((item) => {
        if ("id" in item) {
          const { id, category, budget_id, ...rest } = item;
          item = {
            ...rest,
            uuid: id,
            category_uuid: item.category.id,
          };
        }
        item.allocation = parseFloat(item.allocation.toFixed(2));

        return item;
      });
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        `budgets/${updatedBudget.id}/`,
        "PUT",
        updatedBudget,
      );
      return (await response.json()) as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentBudget"],
      });
    },
  });
  const deleteBudgetMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the budget deletion."),
      );
    },
    mutationFn: async (budgetId: string) => {
      await fetchApi(jwt, setAndStoreJwt, `budgets/${budgetId}/`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentBudget"],
      });
    },
  });

  const { mutateAsync: addBudgetMutateAsync } = addBudgetMutation;
  const { mutateAsync: editBudgetMutateAsync } = editBudgetMutation;
  const { mutateAsync: deleteBudgetMutateAsync } = deleteBudgetMutation;

  const addBudget = useCallback(
    async (budget: Budget) => {
      return await addBudgetMutateAsync(budget);
    },
    [addBudgetMutateAsync],
  );

  const editBudget = useCallback(
    async (budget: Budget) => {
      return await editBudgetMutateAsync(budget);
    },
    [editBudgetMutateAsync],
  );

  const deleteBudget = useCallback(
    async (budgetId: string) => {
      await deleteBudgetMutateAsync(budgetId);
    },
    [deleteBudgetMutateAsync],
  );

  const defaultPaginatedBudget = useMemo(
    () => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }),
    [],
  );
  const value = {
    budgets: useMemo(() => {
      return (budgets as NonPaginatedServerResponse<Budget>) || [];
    }, [budgets]),
    isBudgetsLoading,
    budgetsQueryError,
    refetchBudgets,
    isBudgetPlaceholderData,
    paginatedBudgets: useMemo(() => {
      return (
        (paginatedBudgets as PaginatedServerResponse<Budget>) ||
        defaultPaginatedBudget
      );
    }, [paginatedBudgets, defaultPaginatedBudget]),
    isPaginatedBudgetsLoading,
    paginatedBudgetsQueryError,
    refetchPaginatedBudgets,
    isPaginatedBudgetPlaceholderData,
    selectedBudget,
    isSelectedBudgetLoading,
    selectedBudgetQueryError,
    refetchSelectedBudget,
    isSelectedBudgetPlaceholderData,
    getBudgets,
    getSelectedBudget,
    addBudget,
    editBudget,
    deleteBudget,
    mutationError,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

// Custom hook to ensure the context is used within a provider
export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudgets must be used within a BudgetProvider");
  }
  return context;
};
