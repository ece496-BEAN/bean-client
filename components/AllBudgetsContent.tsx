"use client";
import { useBudgets } from "@/contexts/BudgetContext";
import React, { useState } from "react";

function AllBudgetsContent() {
  const {
    paginatedBudgets,
    isPaginatedBudgetsLoading,
    paginatedBudgetsQueryError,
    getBudgets,
    addBudget,
    editBudget,
    deleteBudget,
    refetchPaginatedBudgets,
  } = useBudgets();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(anchorEl);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  return (
    <div>
      <h1>All Budgets</h1>
      <p>OH NO</p>
    </div>
  );
}
export default AllBudgetsContent;
