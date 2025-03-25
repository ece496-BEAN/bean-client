"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { JwtContext } from "@/app/lib/jwt-provider";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { fetchApi } from "@/app/lib/api";
import { Budget, PaginatedServerResponse, ReadOnlyBudget } from "@/lib/types";

interface CurrentBudgetContextType {
  currentBudgetUUID: string | null;
  setCurrentBudgetUUID: (uuid: string | null) => void;
  currentBudget: PaginatedServerResponse<ReadOnlyBudget>;
  isCurrentBudgetLoading: boolean;
  currentBudgetError: Error | null;
}

const CurrentBudgetContext = createContext<CurrentBudgetContextType | null>(
  null,
);

export default function CurrentBudgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentBudgetUUID, setCurrentBudgetUUID] = useState<string | null>(
    null,
  );
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const {
    data: currentBudget,
    isLoading: isCurrentBudgetLoading,
    error: currentBudgetError,
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["currentBudget"],
    queryFn: async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const formattedStart = format(start, "yyyy-MM-dd");
      const formattedEnd = format(end, "yyyy-MM-dd");

      // Set query parameters for current budget
      const queryString = new URLSearchParams({
        start_date_after: formattedStart,
        start_date_before: formattedEnd,
      }).toString();
      const url = `budgets/?${queryString}`;
      console.log("Fetching Current Budget", url);
      const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
      const data: PaginatedServerResponse<ReadOnlyBudget> =
        await response.json();
      return data;
    },
    enabled: !!jwt,
  });

  useEffect(() => {
    if (currentBudget?.count) {
      setCurrentBudgetUUID(currentBudget?.results[0].id || null);
    }
  }, [currentBudget]);

  const contextValue: CurrentBudgetContextType = {
    currentBudgetUUID,
    setCurrentBudgetUUID,
    currentBudget: useMemo(
      () =>
        currentBudget || { count: 0, next: null, previous: null, results: [] },
      [currentBudget],
    ),
    isCurrentBudgetLoading,
    currentBudgetError,
  };

  return (
    <CurrentBudgetContext.Provider value={contextValue}>
      {children}
    </CurrentBudgetContext.Provider>
  );
}

export const useCurrentBudget = () => {
  const context = useContext(CurrentBudgetContext);
  if (!context) {
    throw new Error(
      "useCurrentBudget must be used within a CurrentBudgetProvider",
    );
  }

  return context;
};
