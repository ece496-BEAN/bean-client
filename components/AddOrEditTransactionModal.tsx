"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Trash, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";

import { Label } from "@/components/ui/label";
import {
  isArrayType,
  PartialByKeys,
  ReadOnlyTransaction,
  Transaction,
  TransactionGroup,
  WriteOnlyTransaction,
} from "@/lib/types";
import { useCategories } from "@/contexts/CategoriesContext";
import { Button, CircularProgress } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { useTransactions } from "@/contexts/TransactionsContext";
import "react-toastify/dist/ReactToastify.css";
import CategorySelector from "./CategorySelector";

interface AddOrEditTransactionModalProps {
  isOpen: boolean;
  initialTransactionGroup?: TransactionGroup<ReadOnlyTransaction>;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (
    transaction: PartialByKeys<TransactionGroup<Transaction>, "id">,
  ) => Promise<TransactionGroup<ReadOnlyTransaction>>;
}

const defaultTransactionGroup: Omit<TransactionGroup<Transaction>, "id"> = {
  name: "",
  description: "",
  source: null,
  date: new Date().toISOString(),
  transactions: [],
};

export function AddOrEditTransactionGroupModal({
  isOpen,
  onClose,
  mode,
  initialTransactionGroup,
  onSave,
}: AddOrEditTransactionModalProps) {
  const { categories, categoriesQueryError } = useCategories();
  const {
    getSelectedTransactionGroup: getTransactionGroup,
    selectedTransactionGroup,
    isSelectedTransactionGroupLoading: isTransactionGroupLoading,
    selectedTransactionGroupError: isTransactionGroupError,
  } = useTransactions();
  const [newTransactionGroup, setNewTransactionGroup] = useState<
    PartialByKeys<TransactionGroup<Transaction>, "id">
  >(initialTransactionGroup ?? defaultTransactionGroup);
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm:ss"); // Correct format for datetime-local
  };

  const [formErrors, setFormErrors] = useState<string[]>([]); // Array of error messages
  const formRef = useRef<HTMLFormElement>(null);
  // Fetches transaction group data from backend for specified transaction group when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialTransactionGroup?.id) {
      getTransactionGroup(initialTransactionGroup.id);
    }
  }, [mode, initialTransactionGroup, getTransactionGroup]);
  useEffect(() => {
    // Set local form data when selectedTransactionGroup changes
    // This useEffect will re-run if selectedTransactionGroup changes (when opening in edit mode)
    if (mode === "edit" && selectedTransactionGroup) {
      setNewTransactionGroup({
        ...selectedTransactionGroup,
        date: formatDateForInput(selectedTransactionGroup.date),
      });
    }
  }, [mode, selectedTransactionGroup]);
  useEffect(() => {
    if (categoriesQueryError) {
      toast.error(`Error loading categories: ${categoriesQueryError.message}`, {
        position: "bottom-left",
      });
    }
  }, [categoriesQueryError]);
  const handleTransactionGroupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setNewTransactionGroup({
      ...newTransactionGroup,
      [e.target.name]: e.target.value,
    });
  };
  const addTransaction = () => {
    setNewTransactionGroup({
      ...newTransactionGroup,
      transactions: [
        ...newTransactionGroup.transactions,
        { name: "", description: "", amount: 0, category_uuid: "" },
      ],
    });
  };
  const handleTransactionChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    index: number,
  ) => {
    const updatedTransactions = [...newTransactionGroup.transactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [e.target.name]: e.target.value,
    } as WriteOnlyTransaction;
    setNewTransactionGroup({
      ...newTransactionGroup,
      transactions: updatedTransactions,
    });
  };

  const removeTransaction = (index: number) => {
    const updatedTransactions = newTransactionGroup.transactions.filter(
      (_, i) => i !== index,
    );
    setNewTransactionGroup({
      ...newTransactionGroup,
      transactions: updatedTransactions,
    });
  };

  const onModalClose = () => {
    setFormErrors([]); // Clear errors when closing modal
    setNewTransactionGroup(defaultTransactionGroup); // Reset form state
    onClose();
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!newTransactionGroup.name) {
      errors.push("Name is required");
    }
    newTransactionGroup.transactions.forEach((transaction, index) => {
      if (!transaction.name) {
        errors.push(`Transaction ${index + 1}: Name is required`);
      }
      if (isNaN(transaction.amount) || transaction.amount === 0) {
        // Check for valid amount
        errors.push(
          `Transaction ${index + 1}-amount: Valid amount is required`,
        );
      }

      if ("category" in transaction && !transaction.category.id) {
        errors.push(`Transaction ${index + 1}-category: Category is required`);
      }
      if ("category_uuid" in transaction && !transaction.category_uuid) {
        errors.push(`Transaction ${index + 1}-category: Category is required`);
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
    await onSave(newTransactionGroup); // Call onSave if no errors

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
  useEffect(() => {
    if (isTransactionGroupError) {
      toast.error(
        `Error loading transaction: ${isTransactionGroupError.message}`,
        {
          position: "bottom-left",
        },
      );
    }
  }, [isTransactionGroupError]);
  if (isTransactionGroupLoading) {
    return <CircularProgress />;
  }

  if (!isArrayType(categories)) {
    toast.error("Error loading categories: categories is not an array", {
      position: "bottom-left",
    });
    return <ToastContainer />;
  }
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
          {mode === "add" ? (
            <h2 className="text-2xl font-bold">Add New Transaction Group</h2>
          ) : (
            <h2 className="text-2xl font-bold">Edit Transaction Group</h2>
          )}
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
        <div>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={newTransactionGroup.name}
                onChange={handleTransactionGroupChange}
                placeholder="Transaction Group Name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={newTransactionGroup.description}
                onChange={handleTransactionGroupChange}
                placeholder="Transaction Group description"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                value={newTransactionGroup.date}
                onChange={handleTransactionGroupChange}
                required
              />
            </div>
            <h3>Transactions</h3>
            {newTransactionGroup.transactions.map((transaction, index) => (
              <div
                key={index}
                className="flex flex-col border border-solid border-indigo-600"
              >
                <div>
                  <Label htmlFor={`transaction-name-${index}`}>Name</Label>
                  <Input
                    id={`transaction-name-${index}`}
                    type="text"
                    name="name"
                    value={transaction.name}
                    onChange={(e) => handleTransactionChange(e, index)}
                  />
                </div>

                <div>
                  <Label htmlFor={`transaction-description-${index}`}>
                    Description
                  </Label>
                  <Input
                    id={`transaction-description-${index}`}
                    type="text"
                    name="description"
                    value={transaction.description || ""}
                    onChange={(e) => handleTransactionChange(e, index)}
                  />
                </div>

                <div>
                  <Label htmlFor={`transaction-amount-${index}`}>Amount</Label>
                  <Input
                    id={`transaction-amount-${index}`}
                    type="number"
                    step="0.01"
                    name="amount"
                    value={transaction.amount}
                    onChange={(e) => handleTransactionChange(e, index)}
                  />
                </div>
                <div>
                  <CategorySelector
                    value={(transaction as ReadOnlyTransaction).category}
                    onChange={(value) => {
                      if (value) {
                        const updatedTransactions = [
                          ...newTransactionGroup.transactions,
                        ];
                        if (
                          mode === "edit" &&
                          "category" in updatedTransactions[index]
                        ) {
                          updatedTransactions[index] = {
                            ...updatedTransactions[index],
                            category: {
                              ...updatedTransactions[index].category,
                              id: value.id,
                            },
                          };
                        } else {
                          updatedTransactions[index] = {
                            ...updatedTransactions[index],
                            category_uuid: value.id,
                          };
                        }
                        setNewTransactionGroup({
                          ...newTransactionGroup,
                          transactions: updatedTransactions,
                        });
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeTransaction(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </form>
        </div>
      </DialogContent>
      <div className="flex flex-col space-y-1">
        <Button type="button" variant="contained" onClick={addTransaction}>
          Add Transaction
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
          Submit Transaction Group
        </Button>
      </div>
      <ToastContainer />
    </Dialog>
  );
}
