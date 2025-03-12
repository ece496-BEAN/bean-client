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
import {
  TransactionGroupQueryParameters,
  useTransactions,
} from "@/contexts/TransactionsContext";
import { usePlaidContext } from "@/contexts/PlaidContext";
import {
  Category,
  TransactionGroup,
  WriteOnlyTransaction,
  ReadOnlyTransaction,
  PaginatedServerResponse,
} from "@/lib/types";
import { JwtContext } from "@/app/lib/jwt-provider";
import { useCategories } from "@/contexts/CategoriesContext";
import {
  CircularProgress,
  Button,
  TablePagination,
  IconButton,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import { AddOrEditTransactionGroupModal } from "@/components/add-edit-transaction-group-modal";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";

interface TransactionSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

interface TransactionGroupListProps {
  transactionGroups: TransactionGroup[];
  onEdit: (group: TransactionGroup) => void;
  onDelete: (uuid: string) => Promise<void>;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  onPageChange: (pageNumber: number) => void;
  onRowsPerPageChange: (newPageSize: number) => void;
}

const TransactionGroupList: React.FC<TransactionGroupListProps> = ({
  transactionGroups,
  onEdit,
  onDelete,
  totalCount,
  pageNumber,
  pageSize,
  onPageChange,
  onRowsPerPageChange,
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
      <TablePagination
        component="div"
        count={totalCount}
        page={pageNumber}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          onRowsPerPageChange(parseInt(e.target.value, 10));
        }}
      />
    </div>
  );
};

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
    getTransactionGroups,
  } = useTransactions();

  const { categories } = useCategories();
  const [jwt] = useContext(JwtContext);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [ordering, setOrdering] = useState<string>("-date");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [queryOptions, setQueryOptions] =
    useState<TransactionGroupQueryParameters>({});
  useEffect(() => {
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
  const [categoryFilter, setCategoryFilter] = useState<Category["id"]>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  if (!("results" in transactionGroups)) {
    return <></>;
  }

  // FIXME: This does not work with pagination (need no paginated to properly calculate)
  const { totalIncome, totalExpenses } = transactionGroups.results.reduce(
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
  const applyFilters = () => {
    // Give no options to set `no_page`
    let queryParams: TransactionGroupQueryParameters = {};
    if (searchTerm) {
      queryParams.search = searchTerm;
    }
    if (categoryFilter) {
      queryParams.category_uuid = categoryFilter;
    }
    if (currentPage > 1) {
      queryParams.page = currentPage;
    }
    if (pageSize) {
      queryParams.page_size = pageSize;
    }
    if (ordering) {
      queryParams.ordering = ordering;
    }
    if (startDate) {
      queryParams.date_after = format(startDate, "yyyy-MM-dd");
    }
    if (endDate) {
      queryParams.date_before = format(endDate, "yyyy-MM-dd");
    }

    getTransactionGroups(queryParams);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter(undefined);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(0);
    setPageSize(10);
    setOrdering("-date");
    getTransactionGroups({});
  };
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
            applyFilters={applyFilters}
            isLoading={isLoading}
          />
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <IconButton
                onClick={() => {
                  setOrdering((prev) => {
                    if (prev === "-date") {
                      return "date";
                    } else {
                      return "-date";
                    }
                  });
                  applyFilters();
                }}
              >
                {ordering === "date" ? <ArrowUpward /> : <ArrowDownward />}
              </IconButton>
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
                value={categoryFilter || "All"}
                onValueChange={(value) => {
                  if (value === "All") {
                    setCategoryFilter(undefined);
                  } else {
                    setCategoryFilter(value);
                  }
                }}
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
              <DateRangePicker
                localeText={{ start: "Start Date", end: "End Date" }}
                value={[startDate, endDate]}
                onChange={(newValue) => {
                  if (newValue[0]) {
                    setStartDate(newValue[0]);
                  }
                  if (newValue[1]) {
                    setEndDate(newValue[1]);
                  }
                }}
              />
              <Button onClick={resetFilters}>Clear Filters</Button>
            </div>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <TransactionGroupList
                transactionGroups={transactionGroups.results}
                onEdit={handleOpenEditModal}
                onDelete={deleteTransactionGroup}
                totalCount={transactionGroups.count}
                pageNumber={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={setPageSize}
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
  applyFilters: () => void;
  isLoading: boolean;
}
function TransactionListHeader({
  setIsAddModalOpen,
  refetchTransactions,
  applyFilters,
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
          onClick={applyFilters}
          loading={isLoading}
          loadingPosition="end"
          variant="contained"
        >
          Search
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
