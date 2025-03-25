import * as React from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { useCategories } from "@/contexts/CategoriesContext"; // Import your context
import { Category, PartialByKeys } from "@/lib/types"; // Import your types
import {
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid2,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { MuiColorInput, matchIsValidColor } from "mui-color-input";
import { useState } from "react";
type CategoryOption = Category & { inputValue?: string };

interface CategoryAutocompleteProps {
  value?: CategoryOption | null; // Allow external control of the value to set initial value (useful for editing existing data)
  onChange: (category: Category | null) => void; // Callback to update external state
  error?: boolean;
  helperText?: React.ReactNode;
}

export default function CategoryAutocomplete({
  value,
  onChange,
  error,
  helperText,
}: CategoryAutocompleteProps) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { categories, addCategory, isCategoriesLoading } = useCategories();
  const categoryOptions: CategoryOption[] = categories;
  const [open, toggleOpen] = React.useState(false);
  const [dialogValue, setDialogValue] = React.useState<
    PartialByKeys<Category, "id" | "legacy">
  >({
    name: "",
    description: "",
    is_income_type: false,
    color: "#0062ff",
  });

  const loading = open && isCategoriesLoading;
  React.useEffect(() => {
    if (!loading) {
      return undefined;
    }
    // Postpone the isCategoriesLoading to give time for categories to resolve.
    // If categories resolves before isCategoriesLoading is false, it will throw an error if you try and access categories[0] when categories is undefined.
    setTimeout(() => {}, 500);
  }, [loading]);

  const handleClose = () => {
    setDialogValue({
      name: "",
      description: "",
      is_income_type: false,
      color: "#0062ff",
    });
    setFormErrors({});
    toggleOpen(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!dialogValue.name) {
      newErrors.name = "Name is required";
    }
    if (!matchIsValidColor(dialogValue.color)) {
      newErrors.color = "Color is invalid. Please use a valid hex color code.";
    }

    setFormErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    if (validateForm()) {
      // Can't seem to get the type inferring working
      const newCategory = (await addCategory(dialogValue)) as Category;
      setDialogValue(newCategory);
      onChange(newCategory); // Send value to parent component
      handleClose();
    }
  };

  const filter = createFilterOptions<CategoryOption>();

  return (
    <Stack spacing={1}>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => {
          if (newValue?.inputValue) {
            toggleOpen(true);
            setDialogValue({
              name: newValue.inputValue,
              description: "",
              is_income_type: false,
              color: "#0062ff",
            });
          } else {
            onChange(newValue);
          }
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id} // Compare IDs
        filterOptions={(_, params) => {
          let filtered = filter(categories, params);

          if (params.inputValue !== "") {
            filtered.push({
              inputValue: params.inputValue,
              name: `Add "${params.inputValue}"`, // Display in options
              // Placeholder values (will be overwritten later)
              id: "0-0-0-0-0",
              legacy: false,
              is_income_type: false,
              color: "#0062ff",
            });
          }

          return filtered;
        }}
        disablePortal
        id="category-autocomplete"
        options={categoryOptions}
        getOptionLabel={(option: CategoryOption) => {
          if (typeof option === "string") {
            return option;
          }
          if (option?.inputValue) {
            return option.inputValue;
          }

          return option?.name || "";
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Grid2
              container
              direction="row"
              alignItems="center"
              justifyContent="space-between" // Align items to edges
              sx={{ width: "100%" }}
            >
              <Grid2>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 16, // Adjust size as needed
                      height: 16,
                      bgcolor: option.color || "transparent", // Use category color or transparent if not available
                      borderRadius: "50%", // Make it a circle
                    }}
                  />
                  <Stack
                    direction="column"
                    alignItems="flex-start"
                    spacing={0.2}
                  >
                    <Typography variant="body1">{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Grid2>
              <Grid2>
                <Stack direction="row" spacing={0.5}>
                  <Chip
                    label={option.is_income_type ? "Income" : "Expense"}
                    color={option.is_income_type ? "success" : "error"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={option.legacy ? "Legacy" : "Active"}
                    color={option.legacy ? "default" : "primary"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Grid2>
            </Grid2>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Categories"
            error={error}
            helperText={helperText}
          />
        )}
        loading={loading}
        loadingText={<CircularProgress />}
        clearOnBlur
        blurOnSelect
      />

      <Dialog
        open={open}
        onClose={handleClose}
        className="overflow-y-hidden"
        fullWidth
      >
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent className="!p-0">
          <div className="p-4">
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={dialogValue.name}
              error={!!formErrors.name}
              helperText={formErrors.name || ""}
              onChange={(e) =>
                setDialogValue({ ...dialogValue, name: e.target.value })
              }
            />

            <TextField
              margin="dense"
              id="description"
              label="Description (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={dialogValue.description || ""}
              onChange={(e) =>
                setDialogValue({
                  ...dialogValue,
                  description: e.target.value,
                })
              }
            />
            <Grid2 container className="mt-2 mb-2">
              {/* TODO: Fix to not cause as many re-renders since this triggers alot of times when using the picker */}
              {/* Maybe consider using a [react-hook-form](https://viclafouch.github.io/mui-color-input/docs/react-hook-form/) */}
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <MuiColorInput
                  name="color"
                  label="Color"
                  sx={{ minWidth: "235px" }}
                  value={dialogValue.color}
                  onChange={(color) => {
                    setDialogValue({ ...dialogValue, color });
                  }}
                />
              </Grid2>
              <Grid2
                size={{ xs: 12, sm: 6 }}
                sx={{
                  left_margin: "auto",
                  display: "flex",
                  justifyContent: "left",
                  alignItems: "center",
                }}
              >
                <FormControlLabel
                  label={
                    <Chip
                      label={dialogValue.is_income_type ? "Income" : "Expense"}
                      color={dialogValue.is_income_type ? "success" : "error"}
                    />
                  }
                  control={
                    <Switch
                      name="is_income_type"
                      checked={dialogValue.is_income_type}
                      onChange={(e) =>
                        setDialogValue({
                          ...dialogValue,
                          is_income_type: e.target.checked,
                        })
                      }
                    />
                  }
                />
              </Grid2>
            </Grid2>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
