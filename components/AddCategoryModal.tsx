"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { Trash, X } from "lucide-react";
import { Input } from "@/components/ui/input";

import {
  Box,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
} from "@mui/material";

import { Label } from "@/components/ui/label";
import { Category, PartialByKeys } from "@/lib/types";
import { Button } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    category:
      | PartialByKeys<Category, "id" | "legacy">[]
      | PartialByKeys<Category, "id" | "legacy">,
  ) => Promise<Category[] | Category>;
}

const defaultCategory: PartialByKeys<Category, "id" | "legacy"> = {
  name: "",
  description: "",
  is_income_type: false,
};

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
}: AddCategoryModalProps) {
  const [newCategories, setNewCategories] = useState<
    PartialByKeys<Category, "id" | "legacy">[]
  >([defaultCategory]);

  const [formErrors, setFormErrors] = useState<string[]>([]); // Array of error messages
  const formRef = useRef<HTMLFormElement>(null);

  const handleCategoryChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    index: number,
  ) => {
    const updatedCategories = [...newCategories];
    if (e.target.name !== "is_income_type") {
      updatedCategories[index] = {
        ...updatedCategories[index],
        [e.target.name]: e.target.value,
      } as PartialByKeys<Category, "id" | "legacy">;
    } else {
      updatedCategories[index] = {
        ...updatedCategories[index],
        [e.target.name]: (e.target as HTMLInputElement).checked,
      } as PartialByKeys<Category, "id" | "legacy">;
    }
    setNewCategories(updatedCategories);
  };

  const addCategory = () => {
    setNewCategories([...newCategories, defaultCategory]);
  };

  const removeCategory = (index: number) => {
    const updatedCategories = newCategories.filter((_, i) => i !== index);
    setNewCategories(updatedCategories);
  };

  const onModalClose = () => {
    setFormErrors([]); // Clear errors when closing modal
    setNewCategories([defaultCategory]); // Reset form state
    onClose();
  };

  const validateForm = () => {
    const errors: string[] = [];
    newCategories.forEach((category, index) => {
      if (!category.name) {
        errors.push(`Category ${index + 1}: Name is required`);
      }
    });
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setFormErrors(errors);
      return; // Prevent form submission if there are errors
    }
    await onSave(newCategories); // Call onSave if no errors

    setFormErrors([]); // Clear errors after submission
    onModalClose();
  };

  useEffect(() => {
    // Display toast notifications for each form error:
    formErrors.forEach((error) => {
      toast.error(error, {
        position: "bottom-left",
      });
    });

    // After displaying toasts, you can clear formErrors here or when errors are fixed.
  }, [formErrors]);

  return (
    <Dialog
      open={isOpen}
      onClose={onModalClose}
      scroll="paper"
      fullWidth={true}
      className="overflow-y-hidden"
    >
      <DialogTitle className="flex justify-between items-center bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <div>
          <h2 className="text-2xl font-bold">Add New Categories</h2>
        </div>
        <IconButton
          aria-label="close"
          className="ml-auto"
          onClick={onModalClose}
          sx={{ color: "white" }}
        >
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers={true}>
        <Box>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
            {newCategories.map((category, index) => (
              <Card key={index} className="flex flex-col p-4 space-y-2">
                <TextField
                  id={`category-name-${index}`}
                  name="name"
                  label="Name"
                  variant="outlined"
                  fullWidth
                  value={category.name}
                  onChange={(e) => handleCategoryChange(e, index)}
                />
                <TextField
                  id={`category-description-${index}`}
                  name="description"
                  label="Description (Optional)"
                  variant="outlined"
                  fullWidth
                  value={category.description}
                  onChange={(e) => handleCategoryChange(e, index)}
                />
                <div>
                  <FormControlLabel
                    label={
                      <Chip
                        label={category.is_income_type ? "Income" : "Expense"}
                        color={category.is_income_type ? "success" : "error"}
                      />
                    }
                    control={
                      <Switch
                        name="is_income_type"
                        checked={category.is_income_type}
                        onChange={(e) => handleCategoryChange(e, index)}
                      />
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeCategory(index)}
                  variant="outlined"
                  color="error"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </form>
        </Box>
      </DialogContent>
      <div className="flex flex-col space-y-1">
        <Button type="button" variant="contained" onClick={addCategory}>
          Add Category
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={() => {
            if (formRef.current) {
              formRef.current.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true }),
              );
            } else {
              console.error("formRef.current is null");
            }
          }}
        >
          Submit Categories
        </Button>
      </div>
      <ToastContainer />
    </Dialog>
  );
}
