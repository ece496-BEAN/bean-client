"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingDown,
  TrendingUp,
  Trash,
  Pencil,
} from "lucide-react";
import { Resizable } from "re-resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import PlaidLinkButton from "@/components/external-accounts/PlaidLinkButton";
import {
  TransactionGroupQueryParameters,
  useTransactions,
} from "@/contexts/TransactionsContext";
import {
  Category,
  TransactionGroup,
  ReadOnlyTransaction,
  Transaction,
} from "@/lib/types";
import { useCategories } from "@/contexts/CategoriesContext";
import {
  CircularProgress,
  Button,
  TablePagination,
  IconButton,
  Popover,
  TextField,
  InputAdornment,
  Grid2,
  Tooltip,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  styled,
  Box,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  FilterList,
  Search,
  ExpandMore,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import { AddOrEditTransactionGroupModal } from "@/components/AddOrEditTransactionModal";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import CategorySelector from "@/components/CategorySelector";
import { HeaderBanner } from "@/components/HeaderBanner";
import CategoriesContent from "@/components/CategoriesContent";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  border: "1px solid rgba(0, 0, 0, .125)",
  boxShadow: "none",
  "&:before": {
    display: "none",
  },
  "&:hover": {
    backgroundColor: "transparent",
  },

  "&.Mui-expanded": {
    margin: 0,
    backgroundColor: "transparent",
  },
  "&.Mui-disabled": {
    opacity: 1,
    backgroundColor: "transparent",
    color: "grey-500",
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(0deg)",
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    transform: "rotate(-90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
    justifyContent: "space-between",
    alignItems: "center",
  },
}));
interface TransactionSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

type TransactionGroupListProps = {
  transactionGroups: TransactionGroup<ReadOnlyTransaction>[];
  readOnly: boolean;
  onEdit?: (group: TransactionGroup<ReadOnlyTransaction>) => void;
  handleDeleteConfirmation?: (
    group: TransactionGroup<ReadOnlyTransaction>,
  ) => void;
};

export const TransactionGroupList: React.FC<TransactionGroupListProps> = ({
  transactionGroups,
  onEdit,
  handleDeleteConfirmation,
  readOnly,
}) => {
  if (!transactionGroups || transactionGroups.length === 0) {
    return (
      <Typography variant="h6" align="center">
        No Transactions Found
      </Typography>
    );
  }
  return (
    <div className="space-y-2 mt-2">
      {transactionGroups.map((group) => (
        <StyledAccordion key={group.id} disableGutters>
          <StyledAccordionSummary expandIcon={<ExpandMore />}>
            <div className="flex justify-between w-full">
              <Stack direction="row" spacing={1}>
                <Stack direction="column" alignItems="flex-start">
                  <Typography variant="h6" className="font-bold">
                    {group.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {group.description}
                  </Typography>
                </Stack>
              </Stack>
            </div>
            <div>
              <span
                className={`pr-4 font-semibold ${group.transactions.reduce((acc, transaction) => acc + (transaction.category.is_income_type ? transaction.amount : -transaction.amount), 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {group.transactions.reduce(
                  (acc, transaction) =>
                    acc +
                    (transaction.category.is_income_type
                      ? transaction.amount
                      : -transaction.amount),
                  0,
                ) >= 0
                  ? "$"
                  : "-$"}
                {Math.abs(
                  group.transactions.reduce(
                    (acc, transaction) =>
                      acc +
                      (transaction.category.is_income_type
                        ? transaction.amount
                        : -transaction.amount),
                    0,
                  ),
                ).toFixed(2)}
              </span>
              <Typography color="text.secondary" className="ml-4">
                {format(new Date(group.date), "MM/dd/yyyy")}
              </Typography>
              {!readOnly && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    onClick={() => onEdit?.(group)}
                    color="primary"
                    size="small"
                  >
                    <Pencil />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteConfirmation?.(group)}
                    color="error"
                    size="small"
                  >
                    <Trash />
                  </IconButton>
                </Stack>
              )}
            </div>
          </StyledAccordionSummary>
          <AccordionDetails>
            {group.transactions.length > 0 ? (
              <List className="mt-4 border-t pt-4">
                {group.transactions.map((transaction) => (
                  <ListItem
                    key={(transaction as ReadOnlyTransaction).id}
                    className="p-2 border rounded mb-2"
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div>
                        <Typography variant="body1" noWrap>
                          {transaction.name}
                        </Typography>
                        {transaction.description && ( // Display only if present
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: "normal" }}
                          >
                            {transaction.description}
                          </Typography>
                        )}
                        {"category" in transaction && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                bgcolor:
                                  transaction.category.color || "transparent",
                                borderRadius: "50%", // Make it a circle
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                verticalAlign: "middle",
                              }}
                            >
                              Category: {transaction.category.name}
                            </Typography>
                          </Stack>
                        )}
                      </div>
                      <span
                        className={`font-semibold ${transaction.category.is_income_type ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.amount >= 0 ? "$" : "-$"}
                        {transaction.category.is_income_type
                          ? `${Math.abs(transaction.amount).toFixed(2)}`
                          : `${Math.abs(transaction.amount).toFixed(2)}`}
                      </span>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <List className="mt-4 border-t pt-4">
                <ListItem className="p-2 border rounded mb-2">
                  <ListItemText
                    primary="No transactions found for this group."
                    slotProps={{
                      primary: {
                        variant: "body2",
                        color: "text.secondary",
                        align: "center",
                      },
                    }}
                  />
                </ListItem>
              </List>
            )}
          </AccordionDetails>
        </StyledAccordion>
      ))}
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
    paginatedTransactionGroups: transactionGroups,
    isPaginatedTransactionGroupsLoading: isTransactionGroupLoading,
    paginatedTransactionGroupsQueryError: transactionQueryError,
    mutationError: transactionMutationError,
    addTransactionGroup,
    deleteTransactionGroup,
    editTransactionGroup,
  } = useTransactions();

  const { categoriesQueryError } = useCategories();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (categoriesQueryError) {
      toast.error(`Error loading categories: ${categoriesQueryError.message}`, {
        position: "bottom-left",
      });
    }
  }, [categoriesQueryError]);

  useEffect(() => {
    if (transactionQueryError) {
      toast.error(
        `Error loading transactions: ${transactionQueryError.message}`,
        {
          position: "bottom-left",
        },
      );
    }
  }, [transactionQueryError]);

  useEffect(() => {
    if (transactionMutationError) {
      toast.error(
        `Error modifying transaction: ${transactionMutationError.message}`,
        {
          position: "bottom-left",
        },
      );
    }
  }, [transactionMutationError]);

  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [showCategories, setShowCategories] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionGroup<ReadOnlyTransaction>>();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDeleted, setGroupToDeleted] =
    useState<TransactionGroup<ReadOnlyTransaction>>();

  const handleDeleteConfirmation = (
    group: TransactionGroup<ReadOnlyTransaction>,
  ) => {
    setIsDeleteModalOpen(true);
    setGroupToDeleted(group);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGroupToDeleted(undefined);
  };
  const handleOpenEditModal = (
    groupToEdit: TransactionGroup<ReadOnlyTransaction>,
  ) => {
    setIsAddModalOpen(true); // Open the same modal
    setIsEditing(true); // Make sure it's in edit mode
    setTransactionToEdit(groupToEdit);
  };
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setIsEditing(false); // Reset mode
    setTransactionToEdit(undefined); // Clear transactionToEdit after closing
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setIsEditing(false); // Reset mode
    setTransactionToEdit(undefined); // Clear transactionToEdit after closing
  };

  // Type Guard to ensure `transactionGroups` object is a PaginatedServerResponse<TransactionGroup>
  if (!("count" in transactionGroups)) {
    toast.error(
      "Error loading transactions: transactionGroups is a NonPaginatedServerResponse<TransactionGroup>",
      {
        position: "bottom-left",
      },
    );
    return <ToastContainer />;
  }

  // We know `totals` will always exist for transaction groups
  const { income: totalIncome, expense: totalExpenses } =
    transactionGroups.totals;

  const netBalance = totalIncome - totalExpenses;
  return (
    <div className="flex flex-col h-auto bg-gray-50">
      <HeaderBanner headerText="Recent Transactions" showAccountMenu />

      <ToastContainer />

      <main className="flex-grow p-4 overflow-y-auto">
        <TransactionSummaryBanner
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netBalance={netBalance}
        />

        <Stack
          direction="row"
          className="mb-2"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <PlaidLinkButton />
          <Button
            variant="contained"
            onClick={() => setShowCategories(!showCategories)}
            sx={{
              backgroundColor: "#7b25cd",
              ":hover": { backgroundColor: "#6366f1" },
            }}
          >
            {showCategories ? "View Transactions" : "View Categories"}
          </Button>
        </Stack>

        <Card className="bg-white shadow-lg">
          {showCategories ? (
            <CategoriesContent />
          ) : (
            <>
              <TransactionListHeader
                setCurrentPage={setCurrentPage}
                setPageSize={setPageSize}
                pageSize={pageSize}
                currentPage={currentPage}
                isLoading={isTransactionGroupLoading}
                handleOpenAddModal={handleOpenAddModal}
              />

              <CardContent>
                {isTransactionGroupLoading ? (
                  <CircularProgress />
                ) : (
                  <TransactionGroupList
                    readOnly={false}
                    transactionGroups={transactionGroups.results}
                    onEdit={handleOpenEditModal}
                    handleDeleteConfirmation={handleDeleteConfirmation}
                  />
                )}
                <TablePagination
                  component="div"
                  showFirstButton
                  showLastButton
                  count={transactionGroups.count}
                  page={currentPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  onPageChange={(_, newPage) => setCurrentPage(newPage)}
                  rowsPerPage={pageSize}
                  onRowsPerPageChange={(e) => {
                    const onRowsPerPageChange = (pageRows: number) => {
                      setPageSize((_) => pageRows);
                      setCurrentPage((_) => 0);
                    };
                    onRowsPerPageChange(parseInt(e.target.value, 10));
                  }}
                />
              </CardContent>
            </>
          )}
        </Card>
      </main>
      <AddOrEditTransactionGroupModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        initialTransactionGroup={transactionToEdit}
        mode={isEditing ? "edit" : "add"}
        onSave={
          isEditing
            ? (group) =>
                editTransactionGroup(group as TransactionGroup<Transaction>)
            : addTransactionGroup
        }
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onDelete={deleteTransactionGroup}
        confirmDeleteItem={groupToDeleted}
        onClose={handleCloseDeleteModal}
      />
    </div>
  );
}
interface TransactionListHeaderProps {
  setPageSize: (pageSize: number) => void;
  setCurrentPage: (currentPage: number) => void;
  pageSize: number;
  currentPage: number;
  isLoading: boolean;
  handleOpenAddModal: () => void;
}
function TransactionListHeader({
  setPageSize,
  setCurrentPage,
  pageSize,
  currentPage,
  isLoading,
  handleOpenAddModal,
}: TransactionListHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(anchorEl);

  const {
    getTransactionGroups,
    refetchPaginatedTransactionGroups: refetchTransactions,
  } = useTransactions();
  const { refetchCategories } = useCategories();

  const [ordering, setOrdering] = useState<string>("-date");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);

  const refetchData = () => {
    refetchTransactions();
    refetchCategories();
  };

  const applyFilters = useCallback(() => {
    // Give no options to set `no_page`
    let queryParams: TransactionGroupQueryParameters = {};
    if (searchTerm) {
      queryParams.search = searchTerm;
    }
    if (categoryFilter) {
      queryParams.category_uuid = categoryFilter.id;
    }
    if (currentPage >= 1) {
      // Pages for API start at 1, but the pages in the component start at 0
      queryParams.page = currentPage + 1;
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
  }, [
    searchTerm,
    categoryFilter,
    currentPage,
    pageSize,
    ordering,
    startDate,
    endDate,
    getTransactionGroups,
  ]);
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(0);
    setPageSize(10);
    setOrdering("-date");
    getTransactionGroups({});
  };
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };

  // TODO: Debounce this
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClick = () => {
    applyFilters();
  };
  return (
    <Grid2 container spacing={1} className="flex flex-col h-auto p-4">
      <Popover
        open={filterMenuOpen}
        anchorEl={anchorEl}
        onClose={handleFilterMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Resizable>
          <Grid2 container spacing={1} className="p-4">
            <Grid2 size={12}>
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
            </Grid2>
            <Grid2 size={12}>
              <CategorySelector
                value={categoryFilter}
                onChange={(category) => {
                  if (category) {
                    setCategoryFilter(category);
                  } else {
                    setCategoryFilter(null);
                  }
                }}
              />
            </Grid2>
            <Grid2 size={12}>
              <Button onClick={resetFilters}>Clear Filters</Button>
            </Grid2>
          </Grid2>
        </Resizable>
      </Popover>
      <Grid2>
        <IconButton
          onClick={() => {
            setOrdering((prev) => {
              if (prev === "-date") {
                return "date";
              } else {
                return "-date";
              }
            });
          }}
        >
          {ordering === "date" ? <ArrowUpward /> : <ArrowDownward />}
        </IconButton>
      </Grid2>
      <Grid2 size={{ xs: 8, sm: 8, md: 6, lg: 6 }}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchTerm}
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
          onClick={handleOpenAddModal}
          sx={{
            backgroundColor: "#7b25cd",
            ":hover": { backgroundColor: "#6366f1" },
          }}
        >
          Add Transaction
        </Button>
      </Grid2>
      <Grid2>
        <Button
          variant="contained"
          onClick={refetchData}
          loading={isLoading}
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
}
