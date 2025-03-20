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

function CategoriesContent() {
  const {
    paginatedCategories,
    paginatedCategoriesQueryError,
    getCategories,
    addCategory,
    editCategory,
    deleteCategory,
    refetchPaginatedCategories,
  } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [categoryToBeDeleted, setCategoryToDeleted] = useState<Category>();
  const [searchQuery, setSearchQuery] = useState("");
  const [legacyFilter, setLegacyFilter] = useState<boolean | null>(null);
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
    if (sortDirection) {
      params.ordering = direction === "asc" ? "name" : "-name";
    }
    setPage(0);

    getCategories(params);
  };
  const handleDeleteConfirmation = (category: Category) => {
    setIsDeleteModalOpen(true);
    setCategoryToDeleted(category);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDeleted(undefined);
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
    field: "name" | "description" | "legacy",
    value: string | boolean,
  ) => {
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, [field]: value });
    }
  };

  const { results: categories, count: totalCount } = paginatedCategories;
  return (
    <Box className="flex flex-col h-auto bg-gray-50">
      <div className="flex items-center space-x-4 mb-4">
        <TextField
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
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
        <Button
          variant="outlined"
          onClick={handleFilterMenuOpen}
          startIcon={<FilterList />}
          size="small"
        >
          Filter
        </Button>

        <Popover // Filter popover (no changes needed here)
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
          </div>
        </Popover>
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
        <Button
          variant="contained"
          onClick={() => refetchPaginatedCategories()}
          sx={{
            backgroundColor: "purple",
            ":hover": { backgroundColor: "#6366f1" },
          }}
        >
          Refresh
        </Button>
      </div>
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
        count={totalCount}
        page={page}
        onPageChange={(_, page) => handleChangePage(page)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <ToastContainer />
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
    </Box>
  );
}
export default CategoriesContent;
