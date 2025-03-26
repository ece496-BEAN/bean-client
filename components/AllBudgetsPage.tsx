"use client";
import { BudgetQueryParameters, useBudgets } from "@/contexts/BudgetContext";
import { FilterList } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Grid2,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DateField, DateRangePicker } from "@mui/x-date-pickers-pro";
import { format } from "date-fns";
import { ExternalLink, Eye, Pencil, Trash } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JwtContext } from "@/app/lib/jwt-provider";
import { PaginatedServerResponse, ReadOnlyBudget } from "@/lib/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { getLocalMidnightDate } from "@/lib/utils";
import { Search } from "@mui/icons-material";

interface AllBudgetsHeaderProps {
  isPaginatedBudgetsLoading: boolean;
  getBudgets: (params: BudgetQueryParameters) => void;
  refetchPaginatedBudgets: () => void;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (pageSize: number) => void;
}
interface AllBudgetsTableProps {
  paginatedBudgets: PaginatedServerResponse<ReadOnlyBudget>;
  isPaginatedBudgetsLoading: boolean;
  paginatedBudgetsError: Error | null;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (pageSize: number) => void;
  handleDeleteConfirmation: (budget: ReadOnlyBudget) => void;
  getSelectedBudget: (id: string) => void;
  chooseMonth: (month: Date, editMode: boolean) => void;
}
const AllBudgetsHeader = ({
  isPaginatedBudgetsLoading,
  getBudgets,
  refetchPaginatedBudgets,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}: AllBudgetsHeaderProps) => {
  const [jwt] = useContext(JwtContext);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(anchorEl);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };
  const applyFilters = useCallback(() => {
    const queryParams: BudgetQueryParameters = {};
    if (searchQuery) {
      queryParams.search = searchQuery;
    }
    if (page >= 1) {
      queryParams.page = page + 1;
    }
    if (rowsPerPage) {
      queryParams.page_size = rowsPerPage;
    }
    if (startDate) {
      queryParams.start_date_after = format(startDate, "yyyy-MM-dd");
    }
    if (endDate) {
      queryParams.start_date_before = format(endDate, "yyyy-MM-dd");
    }
    getBudgets(queryParams);
  }, [getBudgets, page, rowsPerPage, searchQuery, startDate, endDate]);

  const resetFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    setRowsPerPage(10);
    applyFilters();
  };

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearchClick = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAddBudget = useCallback(() => {
    router.push("/budget/new");
  }, [router]);

  return (
    <Grid2 container spacing={1} className="flex flex-col h-auto pb-4">
      <Popover
        open={filterMenuOpen}
        anchorEl={anchorEl}
        onClose={handleFilterMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <div className="p-4">
          <Typography variant="body2" className="font-bold mb-2">
            Date Range
          </Typography>
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
      </Popover>
      <Grid2 size={{ xs: 12, sm: 12, md: 8, lg: 8 }}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Filter">
                    <IconButton edge="start" onClick={handleFilterMenuOpen}>
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search">
                    <IconButton onClick={handleSearchClick} edge="end">
                      <Search />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
          size="small"
        />
      </Grid2>
      <Grid2>
        <Button
          variant="contained"
          onClick={refetchPaginatedBudgets}
          loading={isPaginatedBudgetsLoading}
          loadingPosition="end"
          sx={{
            backgroundColor: "#7b25cd",
            ":hover": { backgroundColor: "#6366f1" },
          }}
        >
          Refresh
        </Button>
      </Grid2>
    </Grid2>
  );
};

const AllBudgetsTable = ({
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  paginatedBudgets,
  isPaginatedBudgetsLoading,
  handleDeleteConfirmation,
  getSelectedBudget,
  chooseMonth,
}: AllBudgetsTableProps) => {
  const router = useRouter();
  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0); // Reset to page 1 when changing rows per page
    },
    [setRowsPerPage, setPage],
  );
  if (isPaginatedBudgetsLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
    );
  }
  return (
    <Box className="flex flex-col h-auto bg-gray-50">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBudgets.results.map((budget) => (
              <TableRow key={budget.id}>
                <TableCell>{budget.name}</TableCell>
                <TableCell sx={{ minWidth: "145px" }}>
                  <DateField
                    label="Start Date"
                    defaultValue={getLocalMidnightDate(budget.start_date)}
                    size="small"
                    variant="outlined"
                    disabled
                  />
                </TableCell>
                <TableCell sx={{ minWidth: "145px" }}>
                  <DateField
                    label="End Date"
                    defaultValue={getLocalMidnightDate(budget.end_date)}
                    size="small"
                    variant="outlined"
                    disabled
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() =>
                      chooseMonth(new Date(budget.start_date), false)
                    }
                  >
                    {<Eye className="text-grey-500 ml-2 hover:text-grey-700" />}
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      chooseMonth(new Date(budget.start_date), true)
                    }
                  >
                    {
                      <Pencil className="text-blue-500 ml-2 hover:text-blue-700" />
                    }
                  </IconButton>
                  <IconButton onClick={() => handleDeleteConfirmation(budget)}>
                    {<Trash className="text-red-500 ml-2 hover:text-red-700" />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination // Add pagination
        component="div"
        showFirstButton
        showLastButton
        rowsPerPageOptions={[5, 10, 25, 50]}
        count={paginatedBudgets.count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

interface AllBudgetsPage {
  chooseMonth: (month: Date, editMode: boolean) => void;
}

function AllBudgetsPage(props: AllBudgetsPage) {
  const {
    paginatedBudgets: budgets,
    isPaginatedBudgetsLoading: isLoading,
    paginatedBudgetsQueryError: error,
    refetchPaginatedBudgets: refetch,
    getBudgets,
    deleteBudget,
    getSelectedBudget,
  } = useBudgets();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToBeDeleted, setBudgetToBeDeleted] = useState<
    ReadOnlyBudget | undefined
  >(undefined);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleDeleteConfirmation = (budget: ReadOnlyBudget) => {
    setIsDeleteModalOpen(true);
    setBudgetToBeDeleted(budget);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBudgetToBeDeleted(undefined);
  };

  useEffect(() => {
    if (error) {
      toast.error(`Error Loading Budgets: ${error?.message}`, {
        position: "bottom-left",
      });
    }
  }, [error]);
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <AllBudgetsHeader
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        getBudgets={getBudgets}
        isPaginatedBudgetsLoading={isLoading}
        refetchPaginatedBudgets={refetch}
      />
      <AllBudgetsTable
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        isPaginatedBudgetsLoading={isLoading}
        paginatedBudgets={budgets}
        paginatedBudgetsError={error}
        handleDeleteConfirmation={handleDeleteConfirmation}
        getSelectedBudget={getSelectedBudget}
        chooseMonth={props.chooseMonth}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        confirmDeleteItem={budgetToBeDeleted}
        onDelete={deleteBudget}
        onClose={handleCloseDeleteModal}
      />
      <ToastContainer />
    </Card>
  );
}
export default AllBudgetsPage;
