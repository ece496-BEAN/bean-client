"use client";

import React, { useState, FormEvent, useContext, useEffect } from "react";
import { format } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Search,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash,
  ChevronRight,
  ChevronDown,
  Pencil,
} from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import PlaidLinkButton from "@/components/external-accounts/PlaidLinkButton";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePlaidContext } from "@/contexts/PlaidContext";
import {
  Category,
  TransactionGroup,
  WriteOnlyTransaction,
  ReadOnlyTransaction,
} from "@/lib/types";
import { JwtContext } from "@/app/lib/jwt-provider";
import { useCategories } from "@/contexts/CategoriesContext";
import { CircularProgress, Button } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";

interface AddOrEditTransactionModalProps {
  isOpen: boolean;
  initialTransactionGroup?: TransactionGroup;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (transaction: TransactionGroup) => Promise<void>;
}

interface TransactionSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

interface TransactionGroupListProps {
  transactionGroups: TransactionGroup[];
  onEdit: (group: TransactionGroup) => void;
  onDelete: (uuid: string) => Promise<void>;
}

const TransactionGroupList: React.FC<TransactionGroupListProps> = ({
  transactionGroups,
  onEdit,
  onDelete,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [confirmDeleteGroup, setConfirmDeleteGroup] =
    useState<TransactionGroup>();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState(false); // State for error

  const handleDeleteConfirmation = (group: TransactionGroup) => {
    setConfirmDeleteGroup(group);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteGroup && deleteConfirmation === confirmDeleteGroup.name) {
      onDelete(confirmDeleteGroup.id!);
      setConfirmDeleteGroup(undefined);
      setDeleteConfirmation("");
      setDeleteError(false);
    } else if (confirmDeleteGroup) {
      setDeleteError(true);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteGroup(undefined); // Clear the group to be deleted
    setDeleteConfirmation(""); // Clear any typed confirmation
  };
  const toggleGroup = (groupId: string) => {
    setOpenGroups((prevState) => ({
      ...prevState,
      [groupId]: !prevState[groupId],
    }));
  };

  return (
    <div className="space-y-4">
      {" "}
      {/* Add spacing between groups */}
      {transactionGroups.map((group) => {
        const groupId = group.id || "temp-key";
        const isOpen = openGroups[groupId];

        return (
          <div key={groupId} className="border rounded-lg p-4 relative">
            <div className="flex justify-between items-start">
              {" "}
              {/* Header */}
              <div className="flex">
                <button onClick={() => toggleGroup(groupId)} className="mr-2">
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {format(new Date(group.date), "MM/dd/yyyy")}{" "}
                  {/* Formatted date */}
                </p>
                <button
                  onClick={() => onEdit(group)}
                  className="text-blue-500 ml-2 hover:text-blue-700"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDeleteConfirmation(group)}
                  className="text-red-500 ml-2 hover:text-red-700"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>

            {isOpen && (
              <ul className="mt-4 border-t pt-4">
                {group.transactions.map((transaction) => (
                  <li
                    key={(transaction as ReadOnlyTransaction).id}
                    className="p-2 border rounded mb-2"
                  >
                    <div className="flex justify-between items-center">
                      {" "}
                      {/* Transaction details */}
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.description}
                        </p>
                        {"category" in transaction && (
                          <p className="text-sm text-gray-500">
                            Category: {transaction.category.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-semibold ${transaction.amount < 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.amount < 0
                          ? `+${Math.abs(transaction.amount).toFixed(2)}`
                          : `-${Math.abs(transaction.amount).toFixed(2)}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Dialog
              open={confirmDeleteGroup === group}
              onOpenChange={handleCancelDelete}
            >
              <DialogContent className={deleteError ? "border-red-500" : ""}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete transaction group "
                  {confirmDeleteGroup?.name}"? This action cannot be undone.
                </DialogDescription>

                <div>
                  <Label htmlFor="deleteConfirmation">
                    Type the name of the transaction group to confirm:
                  </Label>

                  <Input
                    type="text"
                    id="deleteConfirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className={deleteError ? "border-red-500" : ""}
                  />
                  {deleteError && (
                    <p className="text-red-500 mt-1">
                      Transaction group name does not match.
                    </p>
                  )}
                </div>

                <div className="mt-2 flex justify-end space-x-2">
                  <Button color="error" onClick={handleConfirmDelete}>
                    Delete
                  </Button>
                  <Button variant="outlined" onClick={handleCancelDelete}>
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      })}
    </div>
  );
};

const defaultTransactionGroup: TransactionGroup = {
  name: "",
  description: "",
  source: null,
  date: new Date().toISOString(),
  transactions: [],
};

function AddOrEditTransactionGroupModal({
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

function TransactionSummaryBanner({
  totalIncome,
  totalExpenses,
  netBalance,
}: TransactionSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-700">
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowUpIcon className="w-5 h-5 mr-2 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-700">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowDownIcon className="w-5 h-5 mr-2 text-red-500" />
            <span className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-700">
            Net Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {netBalance >= 0 ? (
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
            )}
            <span
              className={`text-2xl font-bold ${
                netBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Math.abs(netBalance).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecentTransactionsPage() {
  const {
    transactionGroups,
    isLoading,
    queryError: transactionQueryError,
    mutationError: transactionMutationError,
    refetchTransactions,
    addTransactionGroup,
    deleteTransactionGroup,
    editTransactionGroup,
  } = useTransactions();
  const { categories } = useCategories();
  const [jwt] = useContext(JwtContext);
  const router = useRouter();

  useEffect(() => {
    console.log("The JWT Token is: ", jwt);
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);
  useEffect(() => {
    if (transactionQueryError) {
      toast.error(
        `Error loading transactions: ${transactionQueryError.message}`,
      );
    }
  }, [transactionQueryError]);

  useEffect(() => {
    if (transactionMutationError) {
      toast.error(
        `Error modifying transaction: ${transactionMutationError.message}`,
      );
    }
  }, [transactionMutationError]);

  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionGroup>();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    Category["name"] | "All"
  >("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const categoryFilteredTransactionGroups =
    categoryFilter !== "All"
      ? transactionGroups.filter((transactionGroup) =>
          transactionGroup.transactions.some((transaction) => {
            // Type Guard to ensure transaction is a ReadOnlyTransaction
            if (!("category" in transaction)) {
              return false;
            }
            return transaction.category?.name === categoryFilter;
          }),
        )
      : transactionGroups;

  const filteredTransactionGroups = categoryFilteredTransactionGroups.filter(
    (transactionGroup) =>
      transactionGroup.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const { totalIncome, totalExpenses } = filteredTransactionGroups.reduce(
    (acc, group) => {
      group.transactions.forEach((transaction) => {
        if (transaction.amount < 0) {
          // Subtract since income is stored as a negative number in database
          acc.totalIncome -= transaction.amount;
        } else {
          acc.totalExpenses += transaction.amount;
        }
      });

      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 }, // Initial accumulator value
  );

  const netBalance = totalIncome - totalExpenses;

  const handleOpenEditModal = (groupToEdit: TransactionGroup) => {
    setIsAddModalOpen(true); // Open the same modal
    setIsEditing(true); // Make sure it's in edit mode
    setTransactionToEdit(groupToEdit);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setIsEditing(false); // Reset mode
    setTransactionToEdit(undefined); // Clear transactionToEdit after closing
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Recent Transactions</h1>
      </header>

      <ToastContainer />

      <main className="flex-grow p-4 overflow-y-auto">
        <TransactionSummaryBanner
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netBalance={netBalance}
        />

        <div className="mb-6">
          <PlaidLinkButton />
        </div>

        <Card className="bg-white shadow-lg">
          <TransactionListHeader
            setIsAddModalOpen={setIsAddModalOpen}
            refetchTransactions={refetchTransactions}
            isLoading={isLoading}
          />
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search transactions"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(value: Category["id"]) =>
                  setCategoryFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <TransactionGroupList
                transactionGroups={filteredTransactionGroups}
                onEdit={handleOpenEditModal}
                onDelete={deleteTransactionGroup}
              />
            )}
          </CardContent>
        </Card>
      </main>
      <AddOrEditTransactionGroupModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        initialTransactionGroup={transactionToEdit}
        mode={isEditing ? "edit" : "add"}
        onSave={isEditing ? editTransactionGroup : addTransactionGroup}
      />
    </div>
  );
}
interface TransactionListHeaderProps {
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refetchTransactions: () => void;
  isLoading: boolean;
}
function TransactionListHeader({
  setIsAddModalOpen,
  refetchTransactions,
  isLoading,
}: TransactionListHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-700">
          Transaction List
        </CardTitle>
        <Button onClick={() => setIsAddModalOpen(true)} variant="contained">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
        <Button
          onClick={refetchTransactions}
          loading={isLoading}
          loadingPosition="end"
          variant="contained"
        >
          Refresh
        </Button>
      </div>
    </CardHeader>
  );
}
