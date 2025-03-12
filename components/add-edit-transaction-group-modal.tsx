"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { format } from "date-fns";
import { Trash } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { TransactionGroup, WriteOnlyTransaction } from "@/lib/types";
import { useCategories } from "@/contexts/CategoriesContext";
import { Button } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";

interface AddOrEditTransactionModalProps {
  isOpen: boolean;
  initialTransactionGroup?: TransactionGroup;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (transaction: TransactionGroup) => Promise<void>;
}

const defaultTransactionGroup: TransactionGroup = {
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
  const { categories } = useCategories();

  const [newTransactionGroup, setNewTransactionGroup] =
    useState<TransactionGroup>(
      initialTransactionGroup ?? defaultTransactionGroup,
    );
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm:ss"); // Correct format for datetime-local
  };

  const [formErrors, setFormErrors] = useState<string[]>([]); // Array of error messages
  useEffect(() => {
    // Update state with initial values when in edit mode.  This useEffect will re-run if initialTransactionGroup changes (when opening in edit mode)
    if (mode === "edit" && initialTransactionGroup) {
      const formattedDate = formatDateForInput(initialTransactionGroup.date);

      setNewTransactionGroup({
        ...initialTransactionGroup,
        date: formattedDate, // Use the formatted date
      });
    }
  }, [mode, initialTransactionGroup]);

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
      toast.error(error);
    });

    // After displaying toasts, you can clear formErrors here or when errors are fixed.
  }, [formErrors]);

  return (
    <Dialog open={isOpen} onOpenChange={onModalClose}>
      <DialogContent>
        <div className="overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Add New Transaction Group"
                : "Edit Transaction Group"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div key={index} className="flex flex-col">
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
                  <Label htmlFor={`transaction-category-${index}`}>
                    Category
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const updatedTransactions = [
                        ...newTransactionGroup.transactions,
                      ];
                      updatedTransactions[index] = {
                        ...updatedTransactions[index],
                        category_uuid: value,
                      };
                      setNewTransactionGroup({
                        ...newTransactionGroup,
                        transactions: updatedTransactions,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <div className="flex flex-col space-y-2">
              <Button type="button" onClick={addTransaction}>
                Add Transaction
              </Button>
              <ToastContainer />
              <Button type="submit">Submit Transaction Group</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
