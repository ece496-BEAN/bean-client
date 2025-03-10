"use client";

import { fetchApi } from "@/app/lib/api";
import { JwtContext } from "@/app/lib/jwt-provider";
import { Category, PaginatedServerResponse } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: unknown | null;
  addCategory: (newCategory: Category) => Promise<void>;
  editCategory: (editedCategory: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refetchTransactions: () => void;
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export default function CategoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const queryClient = useQueryClient();

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "categories/",
        "GET",
      );
      const data: PaginatedServerResponse<Category> = await response.json();
      return data.results;
    },
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // TODO: Implement functions to add, edit, and delete categories
  const addCategory = async (newCategory: Category) => {};
  const editCategory = async (editedCategory: Category) => {};
  const deleteCategory = async (categoryId: string) => {};
  const refetchTransactions = () => {
    refetch();
  };

  const contextValue = {
    categories: categories || [],
    isLoading,
    error,
    addCategory,
    editCategory,
    deleteCategory,
    refetchTransactions,
  };

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  const context = useContext(CategoriesContext);

  if (!context) {
    throw new Error("useCategories must be used within a CategoriesContext");
  }

  return context;
};
