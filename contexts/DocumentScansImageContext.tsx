"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { DocumentScansImage } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { fetchApiFormData } from "@/app/lib/api";
import { useJwt } from "@/app/lib/jwt-provider";

interface DocumentScansImageContextType {
  addDocumentScansImage: (newImage: FormData) => Promise<DocumentScansImage>;
  mutationError: Error | null;
}

const DocumentScansImageContext = createContext<
  DocumentScansImageContextType | undefined
>(undefined);

export default function DocumentScansImageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jwt, setAndStoreJwt] = useJwt();
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const addDocumentScansImageMutation = useMutation({
    onError: (error) => {
      setMutationError(
        error instanceof Error
          ? error
          : new Error("An error occurred during the image upload."),
      );
    },
    mutationFn: async (image: FormData) => {
      const response = await fetchApiFormData(
        jwt,
        setAndStoreJwt,
        "images/",
        "POST",
        image,
      );
      return (await response.json()) as DocumentScansImage;
    },
    onSuccess: () => {},
  });

  const { mutateAsync: addDocumentScansImageMutationAsync } =
    addDocumentScansImageMutation;

  const addDocumentScansImage = useCallback(
    async (image: FormData) => {
      return await addDocumentScansImageMutationAsync(image);
    },
    [addDocumentScansImageMutationAsync],
  );
  return (
    <DocumentScansImageContext.Provider
      value={{ addDocumentScansImage, mutationError }}
    >
      {children}
    </DocumentScansImageContext.Provider>
  );
}

export const useDocumentScansImage = () => {
  const context = useContext(DocumentScansImageContext);

  if (!context) {
    throw new Error(
      "useDocumentScansImage must be used within a DocumentScansImageProvider",
    );
  }

  return context;
};
