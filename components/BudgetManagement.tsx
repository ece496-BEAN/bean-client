"use client";

import { JwtContext } from "@/app/lib/jwt-provider";
import { Box, Tab, Tabs } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";

interface BudgetAndCategoryPageProps {
  children?: React.ReactNode;
  initialTab?: number;
}
export function BudgetAndCategoryPage({
  children,
}: BudgetAndCategoryPageProps) {
  const [jwt, _] = useContext(JwtContext);
  const { currentBudgetUUID } = useCurrentBudget();

  const router = useRouter();
  const path = usePathname();

  const routes = {
    currentBudget: currentBudgetUUID
      ? `/budget/${currentBudgetUUID}`
      : "/budget/current", // Conditional route
    addBudget: "/budget/new",
    allBudgets: "/budget",
    categories: "/categories",
  };
  const [selectedTab, setSelectedTab] = useState(() => {
    if (
      path.startsWith(routes.currentBudget) ||
      path.startsWith("/budget/current")
    )
      return 0;
    if (path.startsWith(routes.addBudget)) return 1;
    if (path.startsWith(routes.allBudgets)) return 2;
    if (path.startsWith(routes.categories)) return 3;
    return 0; // Default to Current Budget,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  useEffect(() => {
    // Sync selectedTab with router.pathname when it changes
    let newIndex = 0;
    if (path === "/budget") newIndex = 2;
    else if (path.startsWith("/budget/new")) newIndex = 1;
    else if (path.startsWith("/budget/current") || path.startsWith(`/budget`))
      newIndex = 0;
    else if (path.startsWith("/categories")) newIndex = 3;
    setSelectedTab(newIndex);
  }, [path]);

  const currentPage = () => {
    switch (selectedTab) {
      case 0:
        if (!currentBudgetUUID) return "No Active Budget Detected";
        return "Budget Overview";
      case 1:
        return "Add Budget";
      case 2:
        return "All Budgets";
      case 3:
        return "Categories";
      default:
        return null;
    }
  };
  return (
    <div>
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{currentPage()}</h1>
      </header>
      <Grid container justifyContent="left">
        <Box sx={{ width: "100%", bgcolor: "background.paper" }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            scrollButtons="auto"
            variant="scrollable"
          >
            <Tab
              label="Budget Details"
              component={Link}
              href={routes.currentBudget}
            />
            <Tab label="Add Budget" component={Link} href={routes.addBudget} />
            <Tab
              label="All Budgets"
              component={Link}
              href={routes.allBudgets}
            />
            <Tab label="Categories" component={Link} href={routes.categories} />
          </Tabs>
        </Box>
      </Grid>
      <main>{children}</main>
    </div>
  );
}
