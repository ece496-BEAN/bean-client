"use client";

import { fetchApi } from "@/app/lib/api";
import { JwtContext } from "@/app/lib/jwt-provider";
import {
  Category,
  NonPaginatedServerResponse,
  PaginatedServerResponse,
  ServerResponse,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";

interface CategoriesContextType {
  paginatedCategories: PaginatedServerResponse<Category>;
  isPaginatedCategoriesLoading: boolean;
  paginatedCategoriesQueryError: Error | null;

  categories: NonPaginatedServerResponse<Category>;
  isCategoriesLoading: boolean;
  categoriesQueryError: Error | null;

  mutationError: Error | null;

  getCategories: (
    queryParams?: Record<
      string,
      string | number | boolean | (string | number | boolean)[] | undefined
    >,
    options?: { no_page?: boolean },
  ) => void;
  addCategory: (
    newCategories:
      | Omit<Category, "legacy" | "id">
      | Omit<Category, "legacy" | "id">[],
  ) => Promise<void>;
  editCategory: (editedCategory: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refetchPaginatedCategories: () => void;
  refetchCategories: () => void;
}

export type CategoryQueryParameters = {
  legacy?: boolean;
  name?: string;
  page?: number;
  page_size?: number;
  no_page?: undefined;
};

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export default function CategoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const [mutationError, setMutationError] = useState<Error | null>(null);
  const [categoriesQueryOptions, setCategoriesQueryOptions] = useState<
    Record<string, any>
  >({ no_page: true });
  const [paginatedCategoriesQueryOptions, setPaginatedCategoriesQueryOptions] =
    useState<Record<string, any>>({});
  const [selectedCategoryUUID, setSelectedCategoryUUID] = useState<
    string | null
  >(null);
  const fetchCategories = async (queryOptions: Record<string, any>) => {
    try {
      const queryString = new URLSearchParams(queryOptions).toString();
      const url = `categories/?${queryString}`;
      const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
      const data: ServerResponse<Category> = await response.json();
      return data;
    } catch (err) {
      throw new Error("Error fetching categories: " + err);
    }
  };
  // Fetching Paginated Categories
  const {
    data: paginated_categories,
    isLoading: isPaginatedCategoriesLoading,
    error: paginatedCategoriesQueryError,
    refetch: refetchPaginatedCategories,
  } = useQuery({
    queryKey: ["categories", paginatedCategoriesQueryOptions],
    queryFn: async () => fetchCategories(paginatedCategoriesQueryOptions),
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Fetching Non-Paginated Categories
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesQueryError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories", categoriesQueryOptions],
    queryFn: async () => fetchCategories(categoriesQueryOptions),
    enabled: !!jwt, // Only fetch when jwt is available
  });

  const getCategories = useCallback(
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
          setCategoriesQueryOptions({ ...queryParams, no_page: true });
        } else {
          // Extract `no_page` from queryParams if it exists
          const { no_page, ...paginatedQueryParams } = queryParams || {};
          setPaginatedCategoriesQueryOptions(paginatedQueryParams);
        }
      } else {
        options?.no_page ? refetchCategories() : refetchPaginatedCategories();
      }
    },
    [refetchCategories, refetchPaginatedCategories],
  );

  // Category endpoint supports bulk creation as well
  const addCategoryMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the category addition."),
      );
    },
    mutationFn: async (
      newCategory:
        | Omit<Category, "legacy" | "id">
        | Omit<Category, "legacy" | "id">[],
    ) => {
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "categories/",
        "POST",
        newCategory,
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the transaction groups and budget queries as well since they nest category information in their responses
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the category deletion."),
      );
    },
    mutationFn: async (categoryId: string) => {
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        `categories/${categoryId}/`,
        "DELETE",
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the transaction groups and budget queries as well since they nest category information in their responses
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const editCategoryMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the category edit."),
      );
    },
    mutationFn: async (editedCategory: Category) => {
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        `categories/${editedCategory.id}/`,
        "PATCH",
        editedCategory,
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the transaction groups and budget queries as well since they nest category information in their responses
      queryClient.invalidateQueries({
        queryKey: ["transaction-groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgets"],
      });
    },
  });

  const addCategory = async (
    newCategories:
      | Omit<Category, "legacy" | "id">
      | Omit<Category, "legacy" | "id">[],
  ) => {
    addCategoryMutation.mutate(newCategories);
  };
  const editCategory = async (editedCategory: Category) => {
    editCategoryMutation.mutate(editedCategory);
  };
  const deleteCategory = async (categoryId: string) => {
    deleteCategoryMutation.mutate(categoryId);
  };

  const defaultPaginatedCategories: ServerResponse<Category> = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  const contextValue = {
    paginatedCategories:
      (paginated_categories as PaginatedServerResponse<Category>) ||
      defaultPaginatedCategories,
    isPaginatedCategoriesLoading,
    paginatedCategoriesQueryError,
    categories: (categories as NonPaginatedServerResponse<Category>) || [],
    isCategoriesLoading,
    categoriesQueryError,
    mutationError,
    getCategories,
    addCategory,
    editCategory,
    deleteCategory,
    refetchPaginatedCategories,
    refetchCategories,
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
