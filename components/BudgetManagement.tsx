"use client";

import { JwtContext } from "@/app/lib/jwt-provider";
import { Box, Tab, Tabs } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { HeaderBanner } from "./HeaderBanner";

interface BudgetAndCategoryPageProps {
  children?: React.ReactNode;
  initialTab?: number;
}
export function BudgetAndCategoryPage({
  children,
}: BudgetAndCategoryPageProps) {
  const { currentBudgetUUID } = useCurrentBudget();

  const path = usePathname();

  const routes = {
    budgetDetails: currentBudgetUUID
      ? `/budget/${currentBudgetUUID}`
      : "/budget/current", // Conditional route
    addBudget: "/budget/new",
    allBudgets: "/budget",
    categories: "/categories",
  };
  const [selectedTab, setSelectedTab] = useState(() => {
    if (path === routes.allBudgets) return 2;
    if (path.startsWith(routes.addBudget)) return 1;

    if (path.startsWith(routes.budgetDetails)) return 0;
    if (path.startsWith(routes.categories)) return 3;
    return 0; // Default to Budget Details,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    // Sync selectedTab with router.pathname when it changes
    let newIndex = 0;
    if (path === routes.allBudgets) newIndex = 2;
    if (path.startsWith(routes.addBudget)) newIndex = 1;

    if (path.startsWith(routes.budgetDetails)) newIndex = 0;
    if (path.startsWith(routes.categories)) newIndex = 3;
    setSelectedTab(newIndex);
  }, [
    path,
    routes.addBudget,
    routes.allBudgets,
    routes.budgetDetails,
    routes.categories,
  ]);

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
        return "Invalid Tab";
    }
  };
  return (
    <div>
      <HeaderBanner headerText={currentPage()} showAccountMenu />
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
              href={routes.budgetDetails}
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
