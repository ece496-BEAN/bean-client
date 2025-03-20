"use client";

import { DEV_USER_ID } from "@/lib/plaid";
import {
  createContext,
  useReducer,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
} from "react";
import { Transaction, TransactionGroup } from "@/lib/types";

interface PlaidState {
  linkToken: string | null;
  linkSuccess: boolean;
  transactions: any[]; // Replace 'any[]' with a more specific transaction type
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PlaidState = {
  linkToken: null,
  linkSuccess: false,
  transactions: [],
  userId: DEV_USER_ID, // Ideally, this should come from your user authentication
  isLoading: false,
  error: null,
};

type PlaidAction =
  | { type: "SET_LINK_TOKEN"; payload: string }
  | { type: "SET_LINK_SUCCESS"; payload: boolean }
  | { type: "SET_TRANSACTIONS"; payload: any[] }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

interface PlaidContextProps extends PlaidState {
  dispatch: Dispatch<PlaidAction>;
  generateLinkToken: (userId: string) => Promise<void>;
  exchangePublicToken: (publicToken: string) => Promise<void>;
  fetchTransactions: () => Promise<TransactionGroup<Transaction>[]>;
}

const PlaidContext = createContext<PlaidContextProps | undefined>(undefined);

const plaidReducer = (state: PlaidState, action: PlaidAction): PlaidState => {
  switch (action.type) {
    case "SET_LINK_TOKEN":
      return { ...state, linkToken: action.payload };
    case "SET_LINK_SUCCESS":
      return { ...state, linkSuccess: action.payload };
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const PlaidProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(plaidReducer, initialState);

  const generateLinkToken = useCallback(async (userId: string) => {
    console.log("generateLinkToken called with userId:", userId); // Debugging log
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      const response = await fetch("/api/plaid/create_link_token", {
        method: "POST",
      });
      const data = await response.json();
      console.log("generateLinkToken response:", data); // Debugging log
      dispatch({ type: "SET_LINK_TOKEN", payload: data.link_token });
      dispatch({ type: "SET_USER_ID", payload: userId });
    } catch (error) {
      console.error("Error generating link token:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to generate link token" });
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  }, []);

  const exchangePublicToken = useCallback(
    async (publicToken: string) => {
      console.log("exchangePublicToken called with publicToken:", publicToken); // Debugging log
      try {
        dispatch({ type: "SET_IS_LOADING", payload: true });
        const response = await fetch("/api/plaid/set_access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_token: publicToken,
            userId: state.userId,
          }),
        });

        const data = await response.json();
        console.log("exchangePublicToken response:", data); // Debugging log

        if (data.error) {
          console.error("Error exchanging public token:", data.error);
          dispatch({ type: "SET_ERROR", payload: data.error });
        } else {
          // Handle successful exchange
          console.log("Access token set successfully:");
          dispatch({ type: "SET_LINK_SUCCESS", payload: true });
        }
      } catch (error) {
        console.error("Error exchanging public token:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to exchange public token",
        });
      } finally {
        dispatch({ type: "SET_IS_LOADING", payload: false });
      }
    },
    [state.userId],
  );

  const fetchTransactions = useCallback(async () => {
    const transactions: TransactionGroup<Transaction>[] = [];
    console.log("fetchTransactions called"); // Debugging log
    if (!state.userId) {
      dispatch({ type: "SET_ERROR", payload: "User ID is not set" });
      return transactions;
    }
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      const response = await fetch(
        `/api/plaid/transactions?userId=${state.userId}`,
      );
      const data = await response.json();
      console.log("fetchTransactions response:", data); // Debugging log
      if (data.error) {
        console.error("Error fetching transactions:", data.error);
        dispatch({ type: "SET_ERROR", payload: data.error });
      } else {
        dispatch({ type: "SET_TRANSACTIONS", payload: data.transactions });
        transactions.push(...data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch transactions" });
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
    return transactions;
  }, [state.userId]);

  const contextValue: PlaidContextProps = {
    ...state,
    dispatch,
    generateLinkToken,
    exchangePublicToken,
    fetchTransactions,
  };

  return (
    <PlaidContext.Provider value={contextValue}>
      {children}
    </PlaidContext.Provider>
  );
};

export const usePlaidContext = () => {
  const context = useContext(PlaidContext);
  if (!context) {
    throw new Error("usePlaidContext must be used within a PlaidProvider");
  }
  return context;
};
