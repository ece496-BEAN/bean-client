"use client";

import React, { useEffect } from "react";
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
  ArrowDownIcon,
  ArrowUpIcon,
  Search,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PlaidLinkButton from "@/components/external-accounts/PlaidLinkButton";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePlaidContext } from "@/contexts/PlaidContext";

export function RecentTransactionsPage() {
  const router = useRouter();
  const {
    filteredTransactions,
    searchTerm,
    categoryFilter,
    totalIncome,
    totalExpenses,
    setSearchTerm,
    setCategoryFilter,
    addTransactions,
  } = useTransactions();

  const {
    fetchTransactions,
    transactions: plaidTransactions,
    linkSuccess,
  } = usePlaidContext();

  // Fetch transactions when link is successful
  useEffect(() => {
    if (linkSuccess) {
      fetchTransactions();
    }
  }, [fetchTransactions, linkSuccess]);

  // Update transactions state with fetched transactions from context
  useEffect(() => {
    if (plaidTransactions.length > 0) {
      addTransactions(plaidTransactions);
    }
  }, [plaidTransactions]);

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
                {totalIncome - totalExpenses >= 0 ? (
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                )}
                <span
                  className={`text-2xl font-bold ${
                    totalIncome - totalExpenses >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${Math.abs(totalIncome - totalExpenses).toFixed(2)}
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
            <CardTitle className="text-lg font-semibold text-gray-700">
              Transaction List
            </CardTitle>
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
                onValueChange={(value) => setCategoryFilter(value)}
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
              {filteredTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        transaction.amount >= 0 ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {transaction.amount >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
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
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
