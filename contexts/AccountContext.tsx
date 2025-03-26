"use client";
import { useJwt } from "@/app/lib/jwt-provider";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { User } from "@/lib/types";
import { createContext, useCallback, useContext, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchApi } from "@/app/lib/api";

interface AccountContextType {
  user: User | undefined;
  isUserLoading: boolean;
  userQueryError: Error | null;
  isUserPlaceholderData: boolean;
  mutationError: Error | null;
  refetchUser: () => void;
  editUser: (newUser: Omit<User, "id">) => Promise<User>;
}
interface BeanJwtPayload extends JwtPayload {
  user_id: string;
  token_type: string;
}

export const AccountContext = createContext<AccountContextType | null>(null);

export default function AccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<Error | null>(null);
  const [jwt, setAndStoreJwt] = useJwt();
  const user_id = jwtDecode<BeanJwtPayload>(jwt?.access).user_id;

  const {
    data: user,
    isLoading: isUserLoading,
    error: userQueryError,
    refetch: refetchUser,
    isPlaceholderData: isUserPlaceholderData,
  } = useQuery({
    queryKey: ["users", user_id, jwt, setAndStoreJwt],
    queryFn: async () => {
      try {
        const url = `users/${user_id}/`;
        const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
        const data: User = await response.json();
        return data;
      } catch (error) {
        throw new Error(`Error fetching budgets: ${error}`);
      }
    },
    placeholderData: keepPreviousData,
    enabled: !!jwt && !!user_id,
  });

  const editUserMutation = useMutation({
    mutationFn: async (newUser: Omit<User, "id">) => {
      try {
        const url = `users/${user_id}/`;
        const response = await fetchApi(
          jwt,
          setAndStoreJwt,
          url,
          "PUT",
          newUser,
        );
        const data: User = await response.json();
        return data;
      } catch (error) {
        throw new Error(`Error editing user: ${error}`);
      }
    },
    onError: (error: Error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the user update."),
      );
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["users", user_id, jwt, setAndStoreJwt], data);
    },
  });

  const { mutateAsync: editUserMutateAsync } = editUserMutation;

  const editUser = useCallback(
    async (newUser: Omit<User, "id">) => {
      return await editUserMutateAsync(newUser);
    },
    [editUserMutateAsync],
  );
  const value = {
    user,
    isUserLoading,
    userQueryError,
    isUserPlaceholderData,
    refetchUser,
    editUser,
    mutationError,
  };
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export const useAccount = () => {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used within a AccountContext");
  }

  return context;
};
