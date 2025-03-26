"use client";

import React, { useContext, useRef, useState } from "react";
import {
  Home,
  PieChart,
  Camera,
  DollarSign,
  Settings,
  BarChart,
} from "lucide-react"; // Import BarChart icon
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { AddOrEditTransactionGroupModal } from "@/components/AddOrEditTransactionModal";
import {
  DocumentScans,
  PartialByKeys,
  ReadOnlyTransaction,
  Transaction,
  TransactionGroup,
} from "@/lib/types";
import { JwtContext } from "@/app/lib/jwt-provider";
import { fetchApi, fetchApiFormData } from "@/app/lib/api";
import { toast, ToastContainer } from "react-toastify";
import { useDocumentScans } from "@/contexts/DocumentScansContext";
import { useDocumentScansImage } from "@/contexts/DocumentScansImageContext";
import imageCompression from "browser-image-compression";

export const NavigationBar: React.FC = () => {
  const router = useRouter();
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const [image, setImage] = useState<string | null>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTransactionGroup } = useTransactions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] =
    useState<TransactionGroup<ReadOnlyTransaction>>();

  const { categories } = useCategories();
  const { addDocumentScans } = useDocumentScans();
  const { addDocumentScansImage } = useDocumentScansImage();
  const handleAddTransaction = async (
    transactionGroup: PartialByKeys<TransactionGroup<Transaction>, "id">,
  ): Promise<TransactionGroup<ReadOnlyTransaction>> => {
    // Create Document Scans and upload images
    try {
      const documentScans = await addDocumentScans({ ocr_result: ocrResult });
      const documentScanId = documentScans.id;

      // Update the transaction group with the newly created document scan's ID
      transactionGroup.source = documentScanId;
      const addedTransactionGroup = await addTransactionGroup(transactionGroup);

      const formData = new FormData();
      const pngFile = new File([imageFile as Blob], "image.png", {
        type: "image/png",
      });
      formData.append("image", pngFile);
      formData.append("source", documentScanId);

      await addDocumentScansImage(formData);

      return addedTransactionGroup as TransactionGroup<ReadOnlyTransaction>;
    } catch (error) {
      toast.error(`Error creating document scan: ${error as Error}`, {
        position: "bottom-left",
      });
      throw error; // Re-throw the error to ensure proper handling
    }
  };
  const handleOpenAddModal = (
    groupToAdd: TransactionGroup<ReadOnlyTransaction>,
  ) => {
    setIsAddModalOpen(true); // Open the same modal
    setNewTransaction(groupToAdd);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewTransaction(undefined); // Clear newTransaction after closing
  };

  // Handles the image upload process
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true); // Indicate loading state

      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile); // Set compressed image file
        setImage(URL.createObjectURL(compressedFile)); // Set image URL for optional display

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("mimeType", compressedFile.type);
        console.log("file type: ", compressedFile.type);
        formData.append("displayName", compressedFile.name);

        formData.append(
          "categories",
          JSON.stringify(
            categories
              .filter(
                (category) => !category.legacy && !category.is_income_type,
              )
              .map((category) => category.name),
          ),
        );

        const response = await fetch("/api/receipt-ocr", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        setOcrResult(JSON.stringify(data, null, 2));
        console.log(data);

        // TODO: Definitely need to display the dialog modal, as well as allow for the creation of DocumentScans instances (with image upload)
        // addTransactionGroup(data);
        // Need to remap the categories of the data object since the category fields are only strings from the OCR API
        data.transactions = data.transactions.map((transaction: any) => {
          const { category, ...rest } = transaction; // Strip away the `category` string field
          // Search for a corresponding category instance in the categories array
          const category_instance = categories.find(
            // We really fucked up the types with the data object since category is set as a string for some reason, so I need to set it as any for now
            (c) => c.name === category,
          );

          if (category_instance) {
            transaction = {
              ...rest,
              category: category_instance,
            };
          } else {
            transaction = {
              ...rest,
            };
          }
          if (transaction.amount < 0) {
            transaction.amount = transaction.amount * -1;
          }
          return transaction;
        });
        handleOpenAddModal(data);
        setLoading(false); // Reset loading state

        // Reset the input value to allow the same file to be uploaded again
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error compressing the image:", error);
        setLoading(false); // Reset loading state
      }
    }
  };

  // Opens the file picker dialog
  const openFilePicker = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white shadow-lg z-50">
      <ul className="flex justify-around items-center h-16">
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-indigo-600"
            onClick={() => router.push("/home")}
          >
            <Home className="w-6 h-6" />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-indigo-600"
            onClick={() => router.push("/budget")}
          >
            <PieChart className="w-6 h-6" />
          </Button>
        </li>
        <li>
          <Button
            variant="default"
            size="icon"
            className="w-16 h-16 rounded-full -mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700"
            onClick={openFilePicker}
          >
            <Camera className="w-8 h-8" />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-indigo-600"
            onClick={() => router.push("/transactions")}
          >
            <DollarSign className="w-6 h-6" />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-indigo-600"
            onClick={() => router.push("/savings-graph")} // Add new button for savings graph
          >
            <BarChart className="w-6 h-6" />
          </Button>
        </li>
        {/* <li>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-indigo-600"
            onClick={() => router.push("/settings")}
          >
            <Settings className="w-6 h-6" />
          </Button>
        </li> */}
      </ul>

      {/* Hidden file input for image capture */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" // Opens camera on mobile devices
        style={{ display: "none" }} // Hidden input
        onChange={handleImageUpload}
      />

      {/* Optionally display the uploaded image */}
      {/*
      {image && (
        <div>
          <h3>Uploaded Image:</h3>
          <Image src={image} alt="Uploaded" width={300} height={300} />
        </div>
      )}
      */}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Processing...</div>
        </div>
      )}
      <AddOrEditTransactionGroupModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        initialTransactionGroup={newTransaction}
        mode="add"
        onSave={handleAddTransaction}
      />
      <ToastContainer />
    </nav>
  );
};

export default NavigationBar;
