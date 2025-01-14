"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useContext,
} from "react";

type Category = {
  name: string;
  amount: number;
  color: string;
};

type BudgetContextType = {
  categories: Category[];
  isEditMode: boolean;
  newCategory: string;
  newAmount: string;
  addCategory: (e: React.FormEvent) => void;
  removeCategory: (index: number) => void;
  updateAmount: (index: number, amount: string) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setNewCategory: (newCategory: string) => void;
  setNewAmount: (newAmount: string) => void;
};

// Default values for the context
const defaultBudgetContextValue: BudgetContextType = {
  categories: [],
  isEditMode: false,
  newCategory: "",
  newAmount: "",
  addCategory: () => {},
  removeCategory: () => {},
  updateAmount: () => {},
  setIsEditMode: () => {},
  setNewCategory: () => {},
  setNewAmount: () => {},
};

const BudgetContext = createContext<BudgetContextType>(
  defaultBudgetContextValue,
);

type BudgetProviderProps = {
  children: ReactNode;
};

export const BudgetProvider = ({ children }: BudgetProviderProps) => {
  const [categories, setCategories] = useState<Category[]>([
    { name: "Housing", amount: 1200, color: "#4CAF50" },
    { name: "Food", amount: 500, color: "#FFC107" },
    { name: "Transportation", amount: 300, color: "#2196F3" },
    { name: "Entertainment", amount: 200, color: "#9C27B0" },
    { name: "Miscellaneous", amount: 150, color: "#FF5722" },
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const addCategory = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategory.trim() !== "" && newAmount.trim() !== "") {
        setCategories([
          ...categories,
          {
            name: newCategory.trim(),
            amount: parseFloat(newAmount),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          },
        ]);
        setNewCategory("");
        setNewAmount("");
      }
    },
    [categories, newCategory, newAmount],
  );

  const removeCategory = useCallback(
    (index: number) => {
      setCategories(categories.filter((_, i) => i !== index));
    },
    [categories],
  );

  const updateAmount = useCallback(
    (index: number, amount: string) => {
      const updatedCategories = [...categories];
      updatedCategories[index].amount = parseFloat(amount) || 0;
      setCategories(updatedCategories);
    },
    [categories],
  );

  const value = {
    categories,
    isEditMode,
    newCategory,
    newAmount,
    addCategory,
    removeCategory,
    updateAmount,
    setIsEditMode,
    setNewCategory,
    setNewAmount,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

// Custom hook to ensure the context is used within a provider
export const useBudgetContext = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudgetContext must be used within a BudgetProvider");
  }
  return context;
};
