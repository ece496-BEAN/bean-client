"use client";
import { useCategories } from "@/contexts/CategoriesContext";
import {
  Budget,
  Category,
  PartialByKeys,
  ReadOnlyBudgetItem,
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
interface AddOrEditBudgetPageProps {
  editMode?: boolean;
  initial_budget?: Budget;
  onSubmit?: () => void;
}
export const AddOrEditBudgetPage = ({
  editMode,
  initial_budget,
  onSubmit,
}: AddOrEditBudgetPageProps) => {
  const { categoriesQueryError } = useCategories();
  const { addBudget, editBudget } = useBudgets();
  const router = useRouter();
  const [budget, setBudget] = useState<PartialByKeys<Budget, "id">>(
    initial_budget || {
      name: "",
      description: "",
      start_date: format(startOfMonth(Date.now()), "yyyy-MM-dd"),
      end_date: format(endOfMonth(Date.now()), "yyyy-MM-dd"),
      budget_items: [],
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({}); // Store errors by field name
  const [duplicateCategoryError, setDuplicateCategoryError] = useState(false);
  const [openClearConfirmation, setOpenClearConfirmation] = useState(false);
  const handleBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBudget({
      ...budget,
      [e.target.name]: e.target.value,
    });
  };

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

    setBudget({ ...budget, budget_items: updatedItems });
  };
  const handleAllocationChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
  ) => {
    const updatedItems = [...budget.budget_items];

    const parsedValue = parseFloat(event.target.value);
    updatedItems[index] = { ...updatedItems[index], allocation: parsedValue };
    setBudget({ ...budget, budget_items: updatedItems });
  };
  const handleClearConfirmationOpen = () => {
    setOpenClearConfirmation(true);
  };
  const handleClearConfirmationClose = () => {
    setOpenClearConfirmation(false);
  };
  const handleClearConfirmed = () => {
    setBudget({
      id: budget.id, // Preserve the ID
      name: "",
      description: "",
      start_date: format(startOfMonth(Date.now()), "yyyy-MM-dd"),
      end_date: format(endOfMonth(Date.now()), "yyyy-MM-dd"),
      budget_items: [],
    });
    setErrors({});
    setDuplicateCategoryError(false);
    setOpenClearConfirmation(false);
  };
  const handleDateChange = (start: boolean, date: Date | null) => {
    if (date) {
      if (start) {
        setBudget((prev_budget) => ({
          ...prev_budget,
          start_date: format(date, "yyyy-MM-dd"),
        }));
      } else {
        setBudget((prev_budget) => ({
          ...prev_budget,
          end_date: format(date, "yyyy-MM-dd"),
        }));
      }
    }
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
      ],
    });
  };
  const handleRemoveBudgetItem = (index: number) => {
    const updatedItems = budget.budget_items.filter((_, i) => i !== index);
    setBudget({ ...budget, budget_items: updatedItems });
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!budget.name) {
      newErrors.name = "Name is required.";
    }
    if (!budget.start_date) {
      newErrors.startDate = "Start Date is required";
    }

    if (!budget.end_date) {
      newErrors.endDate = "End Date is required.";
    }

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
      const new_budget = editMode
        ? await editBudget({ ...budget, id: budget.id! })
        : await addBudget(budget);
      // Handles the extra submit behavior provided by parent component
      if (onSubmit) {
        onSubmit();
      }
      router.push(`/budget/${new_budget.id}/`);
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
    <div>
      <Box className="flex flex-col h-auto bg-gray-50 p-2">
        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: "grey" }}
            gutterBottom
          >
            {editMode ? `Edit Budget ${budget.id}` : `Add New Budget`}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                value={budget.name}
                onChange={handleBudgetChange}
                error={!!errors.name}
                helperText={errors.name}
              />

              <TextField
                label="Description (Optional)"
                name="description"
                fullWidth
                multiline
                value={budget.description}
                onChange={handleBudgetChange}
              />

              <DatePicker
                label="Start Date"
                value={getLocalMidnightDate(budget.start_date)}
                onChange={(date) => handleDateChange(true, date)}
              />

              <DatePicker
                label="End Date"
                value={getLocalMidnightDate(budget.end_date)}
                onChange={(date) => handleDateChange(false, date)}
              />

              <Typography variant="h6" sx={{ color: "grey" }} gutterBottom>
                Budget Items
              </Typography>

              {(budget.budget_items as ReadOnlyBudgetItem[]).map(
                (item, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Grid2 container spacing={2}>
                        <Grid2
                          size={{ xs: 7.5, sm: 8, md: 8.5, lg: 9.5, xl: 9.5 }}
                        >
                          <CategorySelector
                            value={item.category || null}
                            onChange={(category) =>
                              handleBudgetItemCategoryChange(category, index)
                            }
                            error={!!errors[`items[${index}].category`]} // Error for category
                            helperText={
                              errors[`items[${index}].category`] || ""
                            }
                          />
                        </Grid2>
                        <Grid2 size={{ xs: 3.5, sm: 3, md: 3, lg: 2, xl: 2 }}>
                          <TextField
                            fullWidth
                            label="Allocation"
                            type="number"
                            slotProps={{ htmlInput: { step: 0.01 } }}
                            value={item.allocation}
                            onChange={(event) =>
                              handleAllocationChange(event, index)
                            }
                            error={!!errors[`items[${index}].allocation`]} // Error for allocation
                            helperText={
                              errors[`items[${index}].allocation`] || ""
                            }
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
                ),
              )}

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
                  Submit
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
                You have unsaved changes. Are you sure you want to clear all
                fields?
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
        </Card>
      </Box>
    </div>
  );
};
