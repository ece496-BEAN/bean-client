"use client";
import { useCategories } from "@/contexts/CategoriesContext";
import {
  Budget,
  Category,
  PartialByKeys,
  ReadOnlyBudget,
  ReadOnlyBudgetItem,
  WriteOnlyBudget,
  WriteOnlyBudgetItem,
} from "@/lib/types";
import { endOfMonth, format, startOfMonth } from "date-fns";
import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import CategorySelector from "@/components/CategorySelector";
import { useBudgets } from "@/contexts/BudgetContext";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  TextField,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Trash } from "lucide-react";
import { getLocalMidnightDate } from "@/lib/utils";

interface EditBudgetAllocationProps {
  budget: Budget;
  refetch: () => void;
}

export const EditBudgetAllocation = (props: EditBudgetAllocationProps) => {
  const { categoriesQueryError } = useCategories();
  const { editBudget } = useBudgets();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget>(props.budget);

  const [errors, setErrors] = useState<Record<string, string>>({}); // Store errors by field name
  const [duplicateCategoryError, setDuplicateCategoryError] = useState(false);
  const [openClearConfirmation, setOpenClearConfirmation] = useState(false);

  const handleBudgetItemCategoryChange = (
    newValue: Category | null,
    index: number,
  ) => {
    const updatedItems = [...budget.budget_items];
    if (newValue) {
      updatedItems[index] = { ...updatedItems[index], category: newValue };
      if ("category_uuid" in updatedItems[index]) {
        // At this point, we will have both `category_uuid` and `category` in the object, so we remove `category_uuid`
        const { category_uuid, ...rest } = updatedItems[index];
        updatedItems[index] = rest as ReadOnlyBudgetItem;
      }
    }

    setBudget({ ...budget, budget_items: updatedItems } as Budget);
  };
  const handleAllocationChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
  ) => {
    const updatedItems = [...budget.budget_items];

    const parsedValue = parseFloat(event.target.value);
    updatedItems[index] = { ...updatedItems[index], allocation: parsedValue };
    setBudget({ ...budget, budget_items: updatedItems } as Budget);
  };
  const handleClearConfirmationOpen = () => {
    setOpenClearConfirmation(true);
  };
  const handleClearConfirmationClose = () => {
    setOpenClearConfirmation(false);
  };
  const handleClearConfirmed = () => {
    setBudget({
      ...budget,
      budget_items: [],
    });
    setErrors({});
    setDuplicateCategoryError(false);
    setOpenClearConfirmation(false);
  };
  const handleAddBudgetItem = () => {
    setBudget({
      ...budget,
      budget_items: [
        ...budget.budget_items,
        {
          category_uuid: "0-0-0-0-0",
          allocation: 0,
        },
      ] as WriteOnlyBudgetItem[],
    });
  };
  const handleRemoveBudgetItem = (index: number) => {
    const updatedItems = budget.budget_items.filter((_, i) => i !== index);
    setBudget({ ...budget, budget_items: updatedItems } as Budget);
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const categoryCounts: Record<string, number> = {};
    (budget.budget_items || []).forEach((item, index) => {
      if ("category" in item) {
        const categoryID = item.category.id;

        categoryCounts[categoryID] = (categoryCounts[categoryID] || 0) + 1;

        if (categoryCounts[categoryID] > 1) {
          setDuplicateCategoryError(true);
        }
      }
      if ("category_uuid" in item && !item.category_uuid) {
        newErrors[`items[${index}].category`] = "Category is required.";
      }

      if (!item.allocation || isNaN(parseFloat(item.allocation.toString()))) {
        newErrors[`items[${index}].allocation`] = "Allocation is required.";
      }
      if (item.allocation < 0) {
        newErrors[`items[${index}].allocation`] =
          "Allocation must be greater than or equal to 0.";
      }
    });

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 && duplicateCategoryError === false
    );
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      editBudget({
        ...budget,
        id: (budget as ReadOnlyBudget).id,
      }).then(
        () => {
          toast.success("Saved budget allocations", {
            position: "bottom-left",
          });
          props.refetch();
        },
        (err) =>
          toast.error(`Failed to save: ${err}`, {
            position: "bottom-left",
          }),
      );
    }
  };
  useEffect(() => {
    if (categoriesQueryError) {
      toast.error(`Error loading categories: ${categoriesQueryError.message}`, {
        position: "bottom-left",
      });
    }
  }, [categoriesQueryError]);
  return (
    <>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {(budget.budget_items as ReadOnlyBudgetItem[]).map((item, index) => (
            <Card key={index} variant="outlined">
              <CardContent>
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 7.5, sm: 8, md: 8.5, lg: 9.5, xl: 9.5 }}>
                    <CategorySelector
                      value={item.category || null}
                      onChange={(category) =>
                        handleBudgetItemCategoryChange(category, index)
                      }
                      error={!!errors[`items[${index}].category`]} // Error for category
                      helperText={errors[`items[${index}].category`] || ""}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 3.5, sm: 3, md: 3, lg: 2, xl: 2 }}>
                    <TextField
                      fullWidth
                      label="Allocation"
                      type="number"
                      slotProps={{ htmlInput: { step: 0.01 } }}
                      value={item.allocation}
                      onChange={(event) => handleAllocationChange(event, index)}
                      error={!!errors[`items[${index}].allocation`]} // Error for allocation
                      helperText={errors[`items[${index}].allocation`] || ""}
                    />
                  </Grid2>
                  <Grid2
                    size={{ xs: 1, sm: 1, md: 0.5, lg: 0.5, xl: 0.5 }}
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      size="large"
                      color="error"
                      onClick={() => handleRemoveBudgetItem(index)}
                    >
                      <Trash />
                    </IconButton>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          ))}

          <Stack spacing={2} direction="row">
            <Button
              type="button"
              variant="contained"
              onClick={handleAddBudgetItem}
              sx={{ flex: 1 }}
            >
              Add Budget Item
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ flex: 1 }}
            >
              Save Changes
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={handleClearConfirmationOpen}
              sx={{ flex: 1 }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </form>
      <Dialog
        open={openClearConfirmation}
        onClose={handleClearConfirmationClose}
      >
        <DialogTitle>Confirm Clear</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to clear all fields?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClearConfirmationClose}>
            Cancel
          </Button>
          <Button color="error" onClick={handleClearConfirmed} autoFocus>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
