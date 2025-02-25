// transactionsContext.tsx (No changes)
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";

/**
 * Interface for a transaction object.
 */
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

/**
 * Interface for the TransactionsContext value.
 */
interface TransactionsContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  searchTerm: string;
  categoryFilter: string;
  totalIncome: number;
  totalExpenses: number;
  setSearchTerm: (searchTerm: string) => void;
  setCategoryFilter: (category: string) => void;
  addTransactions: (newTransactions: Transaction[]) => void; // Function to add new transactions
}

// Initial transactions data
const initialTransactions: Transaction[] = [
  // {
  //   id: 1,
  //   description: "Grocery Store",
  //   amount: -75.5,
  //   date: "2023-06-15",
  //   category: "Food",
  // },
  {
    id: 2,
    description: "Monthly Salary",
    amount: 3000,
    date: "2023-06-01",
    category: "Income",
  },
  // {
  //   id: 3,
  //   description: "Restaurant Dinner",
  //   amount: -45.0,
  //   date: "2023-06-10",
  //   category: "Food",
  // },
  // {
  //   id: 4,
  //   description: "Utility Bill",
  //   amount: -120.0,
  //   date: "2023-06-05",
  //   category: "Utilities",
  // },
  // {
  //   id: 5,
  //   description: "Online Shopping",
  //   amount: -89.99,
  //   date: "2023-06-08",
  //   category: "Shopping",
  // },
  // {
  //   id: 6,
  //   description: "Freelance Work",
  //   amount: 500,
  //   date: "2023-06-12",
  //   category: "Income",
  // },
  // {
  //   id: 7,
  //   description: "Gas Station",
  //   amount: -40.0,
  //   date: "2023-06-14",
  //   category: "Transportation",
  // },
  // {
  //   id: 8,
  //   description: "Movie Tickets",
  //   amount: -30.0,
  //   date: "2023-06-17",
  //   category: "Entertainment",
  // },
];

// Create the TransactionsContext
const TransactionsContext = createContext<TransactionsContextType | undefined>(
  undefined,
);

/**
 * Provider component for the TransactionsContext.
 */
export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  /**
   * Filters transactions based on search term and category.
   */
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "All" || transaction.category === categoryFilter),
  );

  /**
   * Calculates the total income from filtered transactions.
   */
  const totalIncome = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.amount > 0 ? sum + transaction.amount : sum,
    0,
  );

  /**
   * Calculates the total expenses from filtered transactions.
   */
  const totalExpenses = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum,
    0,
  );

  /**
   * Adds new transactions to the existing transactions array.
   * Ensures that each transaction has a unique ID.
   */
  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions((prevTransactions) => {
      // Concatenate the new transactions with the existing ones
      const updatedTransactions = [...prevTransactions, ...newTransactions];
      // Renumber all transactions starting from 0
      return updatedTransactions.map((transaction, index) => ({
        ...transaction,
        id: index,
      }));
    });
  };

  useEffect(() => {
    console.log("Transactions state updated:", transactions);
  }, [transactions]);

  const contextValue: TransactionsContextType = {
    transactions,
    filteredTransactions,
    searchTerm,
    categoryFilter,
    totalIncome,
    totalExpenses,
    setSearchTerm,
    setCategoryFilter,
    addTransactions,
  };

  return (
    <TransactionsContext.Provider value={contextValue}>
      {children}
    </TransactionsContext.Provider>
  );
};

/**
 * Custom hook to access the TransactionsContext.
 */
export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider",
    );
  }
  return context;
};
