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
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Pencil, Trash, Check, X } from "lucide-react";
import { useCategories } from "@/contexts/CategoriesContext";
import { Category } from "@/lib/types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

function CategoriesContent() {
  const {
    paginatedCategories,
    isPaginatedCategoriesLoading,
    paginatedCategoriesQueryError,
    getCategories,
    editCategory,
    deleteCategory,
    refetchPaginatedCategories,
  } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [categoryToBeDeleted, setCategoryToDeleted] = useState<Category>();

  const handleDeleteConfirmation = (category: Category) => {
    setIsDeleteModalOpen(true);
    setCategoryToDeleted(category);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDeleted(undefined);
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = useCallback(
    (newPage: number) => {
      setPage(newPage);
      getCategories({ page: newPage + 1, page_size: rowsPerPage });
    },
    [rowsPerPage, getCategories],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
      getCategories({ page: 1, page_size: parseInt(event.target.value, 10) }); // Reset to page 1
    },
    [getCategories],
  );

  // useEffect(() => {
  //     getCategories({page: page + 1, page_size: rowsPerPage})
  // }, [])

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

  if (isPaginatedCategoriesLoading) {
    return <CircularProgress />;
  }

  if (!paginatedCategories || !("results" in paginatedCategories)) {
    return <div>Error loading categories</div>;
  }
  const { results: categories, count: totalCount } = paginatedCategories;

  return (
    <Box className="flex flex-col h-auto bg-gray-50">
      <div className="flex justify-end">
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
              <TableCell>Name</TableCell>
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
