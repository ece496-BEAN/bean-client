"use client";

import { JwtContext } from "@/app/lib/jwt-provider";
import { Box, Button, Tab, Tabs } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import CategoriesContent from "./CategoriesContent";
import AllBudgetsContent from "./AllBudgetsContent";
import CurrentBudgetContent from "./CurrentBudgetContent";
import CategoryProvider from "@/contexts/CategoriesContext";
import { BudgetProvider } from "@/contexts/BudgetContext";

export function BudgetAndCategoryPage() {
  const [jwt, _] = useContext(JwtContext);
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return (
          <CategoryProvider>
            <CurrentBudgetContent />
          </CategoryProvider>
        );
      case 1:
        return (
          <CategoryProvider>
            <BudgetProvider>
              <AllBudgetsContent />
            </BudgetProvider>
          </CategoryProvider>
        );
      case 2:
        return (
          <CategoryProvider>
            <CategoriesContent />
          </CategoryProvider>
        );
      default:
        return null;
    }
  };
  const currentPage = () => {
    switch (selectedTab) {
      case 0:
        return "Current Budget";
      case 1:
        return "All Budgets";
      case 2:
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
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Current Budget" />
            <Tab label="All Budgets" />
            <Tab label="Categories" />
          </Tabs>
        </Box>
      </Grid>
      <main>{renderTabContent()}</main>
    </div>
  );
}
