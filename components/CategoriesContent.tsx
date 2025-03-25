"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  TextField,
  IconButton,
  Box,
  Button,
  FormControlLabel,
  Switch,
  InputAdornment,
  Tooltip,
  Popover,
  Typography,
  Checkbox,
  FormGroup,
  Grid2,
  Tab,
  LinearProgress,
} from "@mui/material";
import { Pencil, Trash, Check, X } from "lucide-react";
import {
  CategoryQueryParameters,
  useCategories,
} from "@/contexts/CategoriesContext";
import { Category } from "@/lib/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import {
  Search,
  FilterList,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { AddCategoryModal } from "@/components/AddCategoryModal";
import { MuiColorInput } from "mui-color-input";

function CategoriesContent() {
  const {
    paginatedCategories,
    isCategoriesLoading: isLoading,
    paginatedCategoriesQueryError,
    getCategories,
    addCategory,
    editCategory,
    deleteCategory,
    refetchPaginatedCategories,
  } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [categoryToBeDeleted, setCategoryToBeDeleted] = useState<Category>();
  const [searchQuery, setSearchQuery] = useState("");
  const [legacyFilter, setLegacyFilter] = useState<boolean | null>(null);
  const [isIncomeTypeFilter, setIsIncomeTypeFilter] = useState<boolean | null>(
    null,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(anchorEl);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  const handleSearchClick = () => {
    const params: CategoryQueryParameters = {};
    if (searchQuery) {
      params.search = searchQuery;
    }
    if (legacyFilter !== null) {
      params.legacy = legacyFilter;
    }
    if (isIncomeTypeFilter !== null) {
      params.is_income_type = isIncomeTypeFilter;
    }
    if (sortDirection) {
      params.ordering = sortDirection === "asc" ? "name" : "-name";
    }

    params.page = 1; // Reset to first page when filters change
    setPage(0);

    getCategories(params);
  };
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };
  const handleIsIncomeTypeFilterChange = () => {
    let isIncomeTypeValue = null;
    setIsIncomeTypeFilter((prev) => {
      if (prev === null) {
        isIncomeTypeValue = true;
      } else if (prev === true) {
        isIncomeTypeValue = false;
      } else {
        isIncomeTypeValue = null;
      }
      return isIncomeTypeValue;
    });
    handleFilterMenuClose();
    const params: CategoryQueryParameters =
      isIncomeTypeValue === null ? {} : { is_income_type: isIncomeTypeValue };
    if (legacyFilter !== null) {
      params.legacy = legacyFilter;
    }
    if (searchQuery) {
      params.name = searchQuery;
    }
    if (sortDirection) {
      params.ordering = sortDirection === "asc" ? "name" : "-name";
    }
  };
  const handleLegacyFilterChange = () => {
    let legacyValue = null;
    setLegacyFilter((prev) => {
      if (prev === null) {
        legacyValue = true;
      } else if (prev === true) {
        legacyValue = false;
      } else {
        legacyValue = null;
      }
      return legacyValue;
    });
    handleFilterMenuClose();
    const params: CategoryQueryParameters =
      legacyValue === null ? {} : { legacy: legacyValue };
    if (isIncomeTypeFilter !== null) {
      params.is_income_type = isIncomeTypeFilter;
    }
    if (searchQuery) {
      params.name = searchQuery;
    }
    if (sortDirection) {
      params.ordering = sortDirection === "asc" ? "name" : "-name";
    }
    setPage(0);

    getCategories(params);
  };

  const handleSortClick = (direction: "asc" | "desc") => {
    setSortDirection((_) => direction);
    handleFilterMenuClose();
    const params: CategoryQueryParameters = {};
    if (searchQuery) {
      params.name = searchQuery;
    }
    if (legacyFilter !== null) {
      params.legacy = legacyFilter;
    }
    if (isIncomeTypeFilter !== null) {
      params.is_income_type = isIncomeTypeFilter;
    }
    if (sortDirection) {
      params.ordering = direction === "asc" ? "name" : "-name";
    }
    setPage(0);

    getCategories(params);
  };
  const handleDeleteConfirmation = (category: Category) => {
    setIsDeleteModalOpen(true);
    setCategoryToBeDeleted(category);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToBeDeleted(undefined);
  };

  // TODO: Make it refetch with the proper query parameters other than pages
  const handleChangePage = useCallback(
    (newPage: number) => {
      setPage((_) => newPage);
      const params: CategoryQueryParameters = {};
      if (searchQuery) {
        params.name = searchQuery;
      }
      if (legacyFilter !== null) {
        params.legacy = legacyFilter;
      }
      if (sortDirection) {
        params.ordering = sortDirection === "asc" ? "name" : "-name";
      }
      getCategories({ ...params, page: newPage + 1, page_size: rowsPerPage });
    },
    [rowsPerPage, searchQuery, legacyFilter, sortDirection, getCategories],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage((_) => parseInt(event.target.value, 10));
      setPage((_) => 0);
      getCategories({ page: 1, page_size: parseInt(event.target.value, 10) }); // Reset to page 1
    },
    [getCategories],
  );

  useEffect(() => {
    if (paginatedCategoriesQueryError) {
      toast.error(
        `Error loading paginated categories: ${paginatedCategoriesQueryError.message}`,
        {
          position: "bottom-left",
        },
      );
    }
  }, [paginatedCategoriesQueryError]);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancelClick = () => {
    setEditingCategory(undefined);
  };

  const handleSaveClick = async (category: Category) => {
    await editCategory(category);
    setEditingCategory(undefined);
  };

  const handleValueChange = (
    field: "name" | "description" | "legacy" | "is_income_type" | "color",
    value: string | boolean,
  ) => {
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, [field]: value });
    }
  };

  const { results: categories, count: totalCount } = paginatedCategories;
  return (
    <>
      {" "}
      <Grid2
        container
        spacing={1}
        className="flex flex-col h-auto bg-gray-50 p-4"
      >
        <Popover
          open={filterMenuOpen}
          anchorEl={anchorEl}
          onClose={handleFilterMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <div className="p-4">
            <Typography variant="body2" className="font-bold mb-2">
              Legacy
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={legacyFilter === true}
                    indeterminate={legacyFilter === false}
                    onChange={handleLegacyFilterChange}
                    color="primary"
                  />
                }
                label="Filter Legacy"
              />
            </FormGroup>
            <Typography variant="body2" className="font-bold mb-2">
              Is Income Type
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isIncomeTypeFilter === true}
                    indeterminate={isIncomeTypeFilter === false}
                    onChange={handleIsIncomeTypeFilterChange}
                    color="primary"
                  />
                }
                label="Filter Income Type"
              />
            </FormGroup>
          </div>
        </Popover>
        <Grid2 size={{ xs: 12, sm: 12, md: 8, lg: 8 }}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton onClick={handleFilterMenuOpen} edge="start">
                      <FilterList />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearchClick} edge="end">
                      <Search />
                    </IconButton>
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
              backgroundColor: "purple",
              ":hover": { backgroundColor: "#6366f1" },
            }}
          >
            Add New Categories
          </Button>
        </Grid2>
        <Grid2>
          <Button
            variant="contained"
            onClick={refetchPaginatedCategories}
            loading={isLoading}
            loadingPosition="end"
            sx={{
              backgroundColor: "purple",
              ":hover": { backgroundColor: "#6366f1" },
            }}
          >
            Refresh
          </Button>
        </Grid2>
      </Grid2>
      <CategoriesTable
        handleEditClick={handleEditClick}
        handleSortClick={handleSortClick}
        sortDirection={sortDirection}
        categories={categories}
        editingCategory={editingCategory}
        handleValueChange={handleValueChange}
        handleSaveClick={handleSaveClick}
        handleCancelClick={handleCancelClick}
        handleDeleteConfirmation={handleDeleteConfirmation}
        totalCount={totalCount}
        handleChangePage={handleChangePage}
        rowsPerPage={rowsPerPage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        page={page}
        isLoading={isLoading}
      />
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={addCategory}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        confirmDeleteItem={categoryToBeDeleted}
        onDelete={deleteCategory}
        onClose={handleCloseDeleteModal}
      />
      <ToastContainer />
    </>
  );
}
interface CategoriesHeaderProps {}
const CategoriesHeader = ({}: CategoriesHeaderProps) => {};
interface CategoriesTableProps {
  handleEditClick: (category: Category) => void;
  handleSortClick: (direction: "asc" | "desc") => void;
  sortDirection: "asc" | "desc";
  categories: Category[];
  editingCategory: Category | undefined;
  handleValueChange: (
    field: "name" | "description" | "legacy" | "is_income_type" | "color",
    value: string | boolean,
  ) => void;
  handleSaveClick: (category: Category) => void;
  handleCancelClick: () => void;
  handleDeleteConfirmation: (category: Category) => void;
  totalCount: number;
  handleChangePage: (newPage: number) => void;
  rowsPerPage: number;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  page: number;
  isLoading: boolean;
}
const CategoriesTable = ({
  handleEditClick,
  categories,
  handleSortClick,
  sortDirection,
  editingCategory,
  handleValueChange,
  handleSaveClick,
  handleCancelClick,
  handleDeleteConfirmation,
  handleChangePage,
  rowsPerPage,
  handleChangeRowsPerPage,
  page,
  totalCount,
  isLoading,
}: CategoriesTableProps) => {
  if (isLoading) {
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
              <TableCell>
                Name
                <Tooltip title="Sort">
                  <IconButton
                    onClick={() =>
                      handleSortClick(sortDirection === "asc" ? "desc" : "asc")
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUpward />
                    ) : (
                      <ArrowDownward />
                    )}
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <TextField
                      value={editingCategory.name}
                      onChange={(e) =>
                        handleValueChange("name", e.target.value)
                      }
                    />
                  ) : (
                    category.name
                  )}
                </TableCell>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <TextField
                      value={editingCategory.description || ""}
                      onChange={(e) =>
                        handleValueChange("description", e.target.value)
                      }
                    />
                  ) : (
                    category.description || ""
                  )}
                </TableCell>

                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <FormControlLabel
                      label={
                        <Chip
                          label={
                            editingCategory.is_income_type
                              ? "Income"
                              : "Expense"
                          }
                          color={
                            editingCategory.is_income_type ? "success" : "error"
                          }
                        />
                      }
                      control={
                        <Switch
                          checked={!editingCategory.is_income_type}
                          onChange={(e) =>
                            handleValueChange(
                              "is_income_type",
                              !e.target.checked,
                            )
                          }
                        />
                      }
                    />
                  ) : (
                    <Chip
                      label={category.is_income_type ? "Income" : "Expense"}
                      color={category.is_income_type ? "success" : "error"}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <FormControlLabel
                      label={
                        <Chip
                          label={editingCategory.legacy ? "Legacy" : "Active"}
                          color={editingCategory.legacy ? "default" : "primary"}
                        />
                      }
                      control={
                        <Switch
                          checked={!editingCategory.legacy}
                          onChange={(e) =>
                            handleValueChange("legacy", !e.target.checked)
                          }
                        />
                      }
                    />
                  ) : (
                    <Chip
                      label={category.legacy ? "Legacy" : "Active"}
                      color={category.legacy ? "default" : "primary"}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <MuiColorInput
                    name="color"
                    label="Color"
                    disabled={editingCategory?.id !== category.id}
                    sx={{ minWidth: "235px" }}
                    value={
                      editingCategory?.id === category.id
                        ? editingCategory.color
                        : category.color
                    }
                    onChange={(color) => {
                      handleValueChange("color", color);
                    }}
                  />
                </TableCell>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <>
                      <IconButton
                        onClick={() => handleSaveClick(editingCategory)}
                      >
                        <Check />
                      </IconButton>
                      <IconButton onClick={() => handleCancelClick()}>
                        <X />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => handleEditClick(category)}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteConfirmation(category)}
                      >
                        <Trash />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        showFirstButton
        showLastButton
        count={totalCount}
        page={page}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_, page) => handleChangePage(page)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
export default CategoriesContent;
