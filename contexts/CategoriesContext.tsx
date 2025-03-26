"use client";

import React from "react";
import { fetchApi } from "@/app/lib/api";
import { useJwt } from "@/app/lib/jwt-provider";
import {
  Category,
  NonPaginatedServerResponse,
  PaginatedServerResponse,
  PartialByKeys,
  ServerResponse,
} from "@/lib/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import rgbHex from "rgb-hex";

interface CategoriesContextType {
  paginatedCategories: PaginatedServerResponse<Category>;
  isPaginatedCategoriesLoading: boolean;
  paginatedCategoriesQueryError: Error | null;
  isPaginatedCategoriesPlaceholderData: boolean;

  categories: NonPaginatedServerResponse<Category>;
  isCategoriesLoading: boolean;
  categoriesQueryError: Error | null;
  isCategoriesPlaceholderData: boolean;

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
  ) => Promise<Category | Category[]>;
  editCategory: (editedCategory: Category) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refetchPaginatedCategories: () => void;
  refetchCategories: () => void;
}

export type CategoryQueryParameters = {
  legacy?: boolean;
  name?: string;
  description?: string;
  is_income_type?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
  no_page?: undefined;
};

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export default function CategoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const [jwt, setAndStoreJwt] = useJwt();
  const [mutationError, setMutationError] = useState<Error | null>(null);
  const [categoriesQueryOptions, setCategoriesQueryOptions] = useState<
    Record<string, any>
  >({ no_page: true });
  const [paginatedCategoriesQueryOptions, setPaginatedCategoriesQueryOptions] =
    useState<Record<string, any>>({});

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
    isPlaceholderData: isPaginatedCategoriesPlaceholderData,
  } = useQuery({
    queryKey: ["categories", paginatedCategoriesQueryOptions],
    queryFn: async () => fetchCategories(paginatedCategoriesQueryOptions),
    placeholderData: keepPreviousData,
    enabled: !!jwt, // Only fetch when jwt is available
  });

  // Fetching Non-Paginated Categories
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesQueryError,
    refetch: refetchCategories,
    isPlaceholderData: isCategoriesPlaceholderData,
  } = useQuery({
    queryKey: ["categories", categoriesQueryOptions],
    queryFn: async () => fetchCategories(categoriesQueryOptions),
    placeholderData: keepPreviousData,
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
        | PartialByKeys<Category, "legacy" | "id">
        | PartialByKeys<Category, "legacy" | "id">[],
    ) => {
      const processCategory = (
        category: PartialByKeys<Category, "legacy" | "id">,
      ) => {
        if (category.color) {
          // If the color is not in hex format, convert it to hex
          // Assumes that color is in rgb or rgba format
          if (!category.color.startsWith("#")) {
            category.color = `#${rgbHex(category.color)}`;
          }
        }
        return category;
      };
      if (Array.isArray(newCategory)) {
        newCategory = newCategory.map(processCategory);
      } else {
        newCategory = processCategory(newCategory);
      }
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "categories/",
        "POST",
        newCategory,
      );
      if (Array.isArray(newCategory)) {
        return (await response.json()) as Category[];
      }
      return (await response.json()) as Category;
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
      await fetchApi(
        jwt,
        setAndStoreJwt,
        `categories/${categoryId}/`,
        "DELETE",
      );
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
      if (editedCategory.color) {
        // If the color is not in hex format, convert it to hex
        // Assumes that color is in rgb or rgba format
        if (!editedCategory.color.startsWith("#")) {
          editedCategory.color = `#${rgbHex(editedCategory.color)}`;
        }
      }
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        `categories/${editedCategory.id}/`,
        "PATCH",
        editedCategory,
      );
      return (await response.json()) as Category;
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

  const { mutateAsync: addCategoryMutateAsync } = addCategoryMutation;
  const { mutateAsync: editCategoryMutateAsync } = editCategoryMutation;
  const { mutateAsync: deleteCategoryMutateAsync } = deleteCategoryMutation;

  const addCategory = useCallback(
    async (
      newCategories:
        | Omit<Category, "legacy" | "id">
        | Omit<Category, "legacy" | "id">[],
    ) => {
      const newlyCreatedCategory = await addCategoryMutateAsync(newCategories);
      if (Array.isArray(newCategories)) {
        return newlyCreatedCategory as Category[];
      }
      return newlyCreatedCategory as Category;
    },
    [addCategoryMutateAsync],
  );

  const editCategory = useCallback(
    async (editedCategory: Category) => {
      return await editCategoryMutateAsync(editedCategory);
    },
    [editCategoryMutateAsync],
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      await deleteCategoryMutateAsync(categoryId);
    },
    [deleteCategoryMutateAsync],
  );

  const defaultPaginatedCategories: ServerResponse<Category> = useMemo(
    () => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }),
    [],
  );
  const contextValue = {
    paginatedCategories: useMemo(() => {
      return (
        (paginated_categories as PaginatedServerResponse<Category>) ||
        defaultPaginatedCategories
      );
    }, [paginated_categories, defaultPaginatedCategories]),
    isPaginatedCategoriesLoading,
    paginatedCategoriesQueryError,
    isPaginatedCategoriesPlaceholderData,
    categories: useMemo(() => {
      return (categories as NonPaginatedServerResponse<Category>) || [];
    }, [categories]),
    isCategoriesLoading,
    categoriesQueryError,
    isCategoriesPlaceholderData,
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
