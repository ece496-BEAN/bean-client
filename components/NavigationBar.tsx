"use client";

import React, { useEffect, useRef, useState } from "react";
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

export const NavigationBar: React.FC = () => {
  const router = useRouter();
  const [image, setImage] = useState<string | null>("");
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTransactionGroup } = useTransactions();

  const { categories, getCategories } = useCategories();

  // Handles the image upload process
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // Set image URL for optional display
      setLoading(true); // Indicate loading state

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mimeType", file.type);
      formData.append("displayName", file.name);

      formData.append(
        "categories",
        JSON.stringify(
          categories
            .filter((category) => !category.legacy && !category.is_income_type)
            .map((category) => category.name),
        ),
      );

      const response = await fetch("/api/receipt-ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("HI FRANK, PLEASE INTEGRATE THIS!!!");
      console.log(data);
      // TODO: Definitely need to display the dialog modal, as well as allow for the creation of DocumentScans instances (with image upload)
      // addTransactionGroup(data);

      setLoading(false); // Reset loading state

      // Reset the input value to allow the same file to be uploaded again
      if (inputRef.current) {
        inputRef.current.value = "";
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
    </nav>
  );
};

export default NavigationBar;
