"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { DocumentScans } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/app/lib/api";
import { useJwt } from "@/app/lib/jwt-provider";

interface DocumentScansContextType {
  addDocumentScans: (
    newDocumentScans: Pick<DocumentScans, "ocr_result">,
  ) => Promise<DocumentScans>;
  mutationError: Error | null;
}

const DocumentScansContext = createContext<
  DocumentScansContextType | undefined
>(undefined);

export default function DocumentScansProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jwt, setAndStoreJwt] = useJwt();
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const addDocumentScansMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the budget creation."),
      );
    },
    mutationFn: async (newDocumentScans: Pick<DocumentScans, "ocr_result">) => {
      const response = await fetchApi(
        jwt,
        setAndStoreJwt,
        "document-scans/",
        "POST",
        newDocumentScans,
      );
      return (await response.json()) as DocumentScans;
    },
    onSuccess: () => {},
  });

  const { mutateAsync: addDocumentScansMutationAsync } =
    addDocumentScansMutation;

  const addDocumentScans = useCallback(
    async (documentScans: Pick<DocumentScans, "ocr_result">) => {
      return await addDocumentScansMutationAsync(documentScans);
    },
    [addDocumentScansMutationAsync],
  );
  return (
    <DocumentScansContext.Provider value={{ addDocumentScans, mutationError }}>
      {children}
    </DocumentScansContext.Provider>
  );
}

export const useDocumentScans = () => {
  const context = useContext(DocumentScansContext);

  if (!context) {
    throw new Error(
      "useDocumentScans must be used within a DocumentScansProvider",
    );
  }

  return context;
};
