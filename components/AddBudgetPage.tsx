"use client";
import { useCategories } from "@/contexts/CategoriesContext";
import { Budget } from "@/lib/types";
import { endOfMonth, format, startOfMonth } from "date-fns";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CategoryAutocomplete from "./CategorySelector";

interface AddBudgetPageProps {
  onSave: () => void;
}

export const AddBudgetPage = () => {
  const { categoriesQueryError } = useCategories();
  const [budget, setBudget] = useState<Omit<Budget, "id">>({
    name: "",
    description: "",
    start_date: format(startOfMonth(Date.now()), "yyyy-MM-dd"),
    end_date: format(endOfMonth(Date.now()), "yyyy-MM-dd"),
    budget_items: [],
  });
  const handleBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBudget({
      ...budget,
      [e.target.name]: e.target.value,
    });
  };

  const addBudgetItem = () => {
    setBudget({
      ...budget,
      budget_items: [
        ...budget.budget_items,
        {
          category_uuid: "",
          allocation: 0,
        },
      ],
    });
  };
  useEffect(() => {
    if (categoriesQueryError) {
      toast.error(`Error loading categories: ${categoriesQueryError.message}`, {
        position: "bottom-left",
      });
    }
  }, [categoriesQueryError]);
  return (
    <div className="flex flex-col h-auto bg-gray-50 p-4">
      <h1>Add Budget</h1>
      <CategoryAutocomplete
        onChange={(category) => {
          console.log(category);
        }}
      ></CategoryAutocomplete>
    </div>
  );
};
