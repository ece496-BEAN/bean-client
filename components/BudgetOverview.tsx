"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useBudgets } from "@/contexts/BudgetContext"; // Import your Budget context
import {
  Budget,
  Category,
  PaginatedServerResponse,
  ReadOnlyBudget,
  ReadOnlyBudgetItem,
} from "@/lib/types";
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Grid2,
  Card,
  CardContent,
  CardHeader,
  Link,
} from "@mui/material";
import { Check, DollarSign, Eye, Pencil, StepBack } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { DatePicker } from "@mui/x-date-pickers";
import { BudgetAllocation } from "./BudgetAllocation";
import { BudgetUsage } from "./BudgetUsage";
import { JwtContext } from "@/app/lib/jwt-provider";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { fetchApi } from "@/app/lib/api";
import CategoriesContent from "./CategoriesContent";
import AllBudgetsPage from "./AllBudgetsPage";
import { ArrowBack, KeyboardReturn } from "@mui/icons-material";

function BudgetOverview() {
  const router = useRouter();
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const [viewAll, setViewAll] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Construct date range from selected month
  const [month, setMonth] = useState<Date | null>(new Date(Date.now()));
  const monthStart = useMemo(
    () => month && format(startOfMonth(month), "yyyy-MM-dd"),
    [month],
  );
  const monthEnd = useMemo(
    () => month && format(endOfMonth(month), "yyyy-MM-dd"),
    [month],
  );

  // Query for the budget corresponding to the selected month
  const {
    data: selectedBudget,
    isLoading: isQuerying,
    error: queryError,
    refetch,
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [monthStart, monthEnd],
    queryFn: async () => {
      if (!monthStart || !monthEnd) return undefined;

      // Set query parameters for selected month
      const queryString = new URLSearchParams({
        start_date_after: monthStart,
        start_date_before: monthEnd,
      }).toString();
      const url = `budgets/?${queryString}`;

      // Get budget from API request
      const response = await fetchApi(jwt, setAndStoreJwt, url, "GET");
      const data: PaginatedServerResponse<ReadOnlyBudget> =
        await response.json();
      return data?.results?.[0];
    },
    enabled: !!jwt,
  });

  // If no budget exists for this month, create it
  const { addBudget } = useBudgets();
  const isCreating =
    !isQuerying && queryError?.message?.includes("data is undefined");
  useEffect(
    () => {
      if (!isCreating) return;
      addBudget({
        name: `${format(month!, "MMMM yyyy")}`,
        start_date: monthStart!,
        end_date: monthEnd!,
        budget_items: [],
      })
        .then(() => {
          // fetch the newly created budget
          refetch();
        })
        .catch(console.error);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCreating],
  );

  const isErrorState = !isQuerying && !isCreating && queryError;
  useEffect(() => {
    // log errors to the console
    if (isErrorState) console.warn(queryError.message);
  }, [isErrorState, queryError]);

  const isLoading = isQuerying || isCreating || !selectedBudget;
  return (
    <>
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budget Overview</h1>
      </header>
      <main className="p-4 overflow-y-auto">
        <Card variant="outlined" sx={{ p: 2, width: "100%", marginBottom: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 size="grow">
              <DatePicker
                label="Month"
                views={["month", "year"]}
                value={month}
                onChange={(date) => {
                  setMonth(date);
                  setEditMode(false);
                  setViewAll(false);
                }}
                sx={{ width: "100%" }}
              />
            </Grid2>
            <Grid2 size="auto">
              <Button
                variant="outlined"
                onClick={() => setViewAll(!viewAll)}
                startIcon={viewAll ? <ArrowBack /> : <Eye />}
                sx={{ height: "100%" }}
              >
                {viewAll ? "Return" : "View All"}
              </Button>
            </Grid2>
            {!viewAll && (
              <Grid2 size="auto">
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(!editMode)}
                  startIcon={editMode ? <ArrowBack /> : <Pencil />}
                  sx={{ height: "100%" }}
                >
                  {editMode ? "Return" : "Edit"}
                </Button>
              </Grid2>
            )}
          </Grid2>
        </Card>
        {isErrorState ? (
          <Box className="flex flex-col h-auto bg-gray-50 p-2">
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "grey" }}
              gutterBottom
            >
              Budget Not Found
            </Typography>
            <Typography variant="body1" sx={{ color: "grey" }} gutterBottom>
              The budget you are looking for does not exist.
            </Typography>
            <Typography variant="body1" sx={{ color: "grey" }} gutterBottom>
              Consider creating a new budget.
            </Typography>
          </Box>
        ) : isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <CircularProgress />
          </div>
        ) : viewAll ? (
          <AllBudgetsPage
            chooseMonth={(month, editMode) => {
              setMonth(month);
              setViewAll(false);
              setEditMode(editMode);
            }}
          />
        ) : !selectedBudget.budget_items.length && !editMode ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Typography variant="body1">
              No allocations set for this month.
            </Typography>
            <Link
              component="button"
              variant="body1"
              onClick={() => setEditMode(true)}
            >
              Add some?
            </Link>
          </Stack>
        ) : (
          <Grid2 container columns={12} spacing={2}>
            <Grid2 size={editMode ? 12 : { xs: 12, md: 6, lg: 4 }}>
              <BudgetAllocation
                budget={selectedBudget}
                editMode={editMode}
                refetch={refetch}
              />
            </Grid2>
            {editMode ? (
              <Grid2 size={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h5" gutterBottom>
                    Modify Categories
                  </Typography>
                  <CategoriesContent refetch={refetch} />
                </Card>
              </Grid2>
            ) : (
              <Grid2 size={{ xs: 12, md: 6, lg: 8 }}>
                <BudgetUsage budget={selectedBudget} />
              </Grid2>
            )}
          </Grid2>
        )}
      </main>
    </>
  );
}

export default BudgetOverview;
