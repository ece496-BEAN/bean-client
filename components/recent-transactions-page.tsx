"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
  Plus,
  ShoppingCart,
  Utensils,
  Briefcase,
  Zap,
  Car,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LucideProps } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaidLinkButton from "@/components/external-accounts/PlaidLinkButton";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePlaidContext } from "@/contexts/PlaidContext";

// Define the possible categories
type TransactionCategory =
  | "Food"
  | "Income"
  | "Utilities"
  | "Shopping"
  | "Transportation"
  | "Entertainment";

// Define the shape of a transaction object
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: TransactionCategory;
}

// Interface for category icons
interface CategoryIcons {
  [key: string]: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}
const categoryIcons: CategoryIcons = {
  Food: Utensils,
  Income: Briefcase,
  Utilities: Zap,
  Shopping: ShoppingCart,
  Transportation: Car,
  Entertainment: Film,
};

// Props for the AddTransactionModal component
interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Transaction) => void;
}

function AddTransactionModal({
  isOpen,
  onClose,
  onAddTransaction,
}: AddTransactionModalProps) {
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: undefined,
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTransaction.amount && newTransaction.category) {
      onAddTransaction({
        ...newTransaction,
        id: Date.now(),
        amount: parseFloat(newTransaction.amount.toString()),
        description: newTransaction.description || newTransaction.category,
      } as Transaction);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              value={newTransaction.description}
              onChange={handleInputChange}
              placeholder="Transaction description"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={newTransaction.amount?.toString()}
              onChange={handleInputChange}
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={newTransaction.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              name="category"
              value={newTransaction.category}
              onValueChange={(value: TransactionCategory) =>
                handleInputChange({
                  target: { name: "category", value },
                } as ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {/* Ensure that the values match the TransactionCategory type */}
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Add Transaction</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecentTransactionsPage() {
  const { transactions, addTransactions } = useTransactions();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    TransactionCategory | "All"
  >("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "All" || transaction.category === categoryFilter),
  );

  useEffect(() => {
    // Update the transactions context when the transactions change
    console.log("Transactions updated:", transactions);
  }, [transactions]);

  const totalIncome = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.amount > 0 ? sum + transaction.amount : sum,
    0,
  );

  const totalExpenses = filteredTransactions.reduce(
    (sum, transaction) =>
      transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum,
    0,
  );

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Recent Transactions</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
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

        {/* Add Plaid Link Button */}
        <div className="mb-6">
          <PlaidLinkButton />
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-gray-700">
                Transaction List
              </CardTitle>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white text-purple-700 border border-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </CardHeader>
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
                onValueChange={(value: TransactionCategory | "All") =>
                  setCategoryFilter(value)
                }
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ul className="space-y-3">
              {filteredTransactions.map((transaction) => {
                // Use type assertion here for categoryIcons
                const Icon = categoryIcons[transaction.category] || TrendingUp;
                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full mr-3 ${
                          transaction.amount >= 0
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            transaction.amount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.date} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.amount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : "-"}$
                      {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={(transaction) => addTransactions([transaction])}
      />
    </div>
  );
}
