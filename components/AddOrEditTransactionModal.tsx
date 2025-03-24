"use client";

import React, { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { Trash, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

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
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";

interface AddOrEditTransactionModalProps {
  isOpen: boolean;
  initialTransactionGroup?: TransactionGroup<ReadOnlyTransaction>;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (
    transaction: PartialByKeys<TransactionGroup<Transaction>, "id">,
  ) => Promise<
    | TransactionGroup<ReadOnlyTransaction>
    | TransactionGroup<ReadOnlyTransaction>[]
  >;
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
  const initialTransactionGroupMemoized = useMemo(
    () => initialTransactionGroup,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialTransactionGroup?.name],
  );
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Store errors by field name
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (mode === "add" && initialTransactionGroupMemoized) {
      setNewTransactionGroup({
        ...initialTransactionGroupMemoized,
        date: formatDateForInput(initialTransactionGroupMemoized.date),
      });
    }
  }, [mode, initialTransactionGroupMemoized]);
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
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setNewTransactionGroup({
        ...newTransactionGroup,
        date: date.toISOString(),
      });
    }
  };
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
        { name: "", description: "", amount: 0, category_uuid: "0-0-0-0-0" },
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
    setFormErrors({}); // Clear errors when closing modal
    setNewTransactionGroup(defaultTransactionGroup); // Reset form state
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!newTransactionGroup.name) {
      newErrors.name = "Transaction Group Name is required";
    }
    newTransactionGroup.transactions.forEach((transaction, index) => {
      if (!transaction.name) {
        newErrors[`transaction[${index}].name`] = `Name is required`;
      }
      if (isNaN(transaction.amount) || transaction.amount === 0) {
        // Check for valid amount
        newErrors[`transaction[${index}].amount`] = `Valid amount is required`;
      }
      if (!("category" in transaction) && !("category_uuid" in transaction)) {
        newErrors[`transaction[${index + 1}].category`] =
          `Category is required`;
      }
      if ("category" in transaction && !transaction.category.id) {
        newErrors[`transaction[${index + 1}].category`] =
          `Category is required`;
      }
      if (
        "category_uuid" in transaction &&
        transaction.category_uuid === "0-0-0-0-0"
      ) {
        newErrors[`transaction[${index + 1}].category`] =
          `Category is required`;
      }
    });
    setFormErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(newTransactionGroup); // Call onSave if no errors
      onModalClose();
    }
  };

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
      maxWidth={false}
      className="overflow-y-hidden"
    >
      <DialogTitle className="flex justify-between items-center bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        {mode === "add" ? (
          <h2 className="text-2xl font-bold">Add New Transaction</h2>
        ) : (
          <h2 className="text-2xl font-bold">Edit Transaction</h2>
        )}
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
        <Card className="p-4">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
            <TextField
              id="name"
              name="name"
              label="Transaction Name"
              fullWidth
              error={!!formErrors.name}
              helperText={formErrors.name}
              value={newTransactionGroup.name}
              onChange={handleTransactionGroupChange}
            />
            <TextField
              id="description"
              name="description"
              label="Transaction Description"
              fullWidth
              multiline
              value={newTransactionGroup.description}
              onChange={handleTransactionGroupChange}
            />
            <DateTimePicker
              name="date"
              label="Date"
              value={new Date(newTransactionGroup.date)}
              onChange={(date) => handleDateChange(date)}
            />
            <Typography variant="h6" sx={{ color: "grey" }} gutterBottom>
              Budget Items
            </Typography>{" "}
            {newTransactionGroup.transactions.map((transaction, index) => (
              <Card key={index} className="flex flex-col p-4 space-y-2">
                <TextField
                  fullWidth
                  id={`transaction-name-${index}`}
                  name="name"
                  label="Name"
                  error={!!formErrors[`transaction[${index}].name`]}
                  helperText={formErrors[`transaction[${index}].name`] || ""}
                  value={transaction.name}
                  onChange={(e) => handleTransactionChange(e, index)}
                />
                <TextField
                  fullWidth
                  id={`transaction-description-${index}`}
                  name="description"
                  label="Description"
                  value={transaction.description || ""}
                  onChange={(e) => handleTransactionChange(e, index)}
                />
                <TextField
                  fullWidth
                  id={`transaction-amount-${index}`}
                  type="number"
                  slotProps={{ htmlInput: { step: 0.01 } }}
                  name="amount"
                  label="Amount"
                  value={transaction.amount}
                  error={!!formErrors[`transaction[${index}].amount`]}
                  helperText={formErrors[`transaction[${index}].amount`] || ""}
                  onChange={(e) => handleTransactionChange(e, index)}
                />
                <div>
                  <CategorySelector
                    error={!!formErrors[`transaction[${index + 1}].category`]}
                    helperText={
                      formErrors[`transaction[${index + 1}].category`] || ""
                    }
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
                  variant="outlined"
                  color="error"
                  onClick={() => removeTransaction(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </form>
        </Card>
      </DialogContent>
      <div className="flex flex-col space-y-1">
        <Button type="button" variant="contained" onClick={addTransaction}>
          Add Item
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
          Submit Transaction
        </Button>
      </div>
      <ToastContainer />
    </Dialog>
  );
}
