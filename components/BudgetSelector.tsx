import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { ReadOnlyBudget } from "@/lib/types"; // Import your types
import { CircularProgress, Grid2, Stack, Typography } from "@mui/material";
import { useBudgets } from "@/contexts/BudgetContext";
import { DateField } from "@mui/x-date-pickers";

type BudgetOptions = ReadOnlyBudget & { inputValue?: string };

interface BudgetAutocompleteProps {
  value?: BudgetOptions | null; // Allow external control of the value to set initial value (useful for editing existing data)
  onChange: (category: ReadOnlyBudget | null) => void; // Callback to update external state
  error?: boolean;
  helperText?: React.ReactNode;
}

export default function BudgetAutocomplete({
  value,
  onChange,
  error,
  helperText,
}: BudgetAutocompleteProps) {
  const { budgets, isBudgetsLoading } = useBudgets();
  const budgetOptions: BudgetOptions[] = budgets;

  const loading = isBudgetsLoading;
  React.useEffect(() => {
    if (!loading) {
      return undefined;
    }
    // Postpone the isBudgetsLoading to give time for budgets to resolve.
    // If budgets resolves before isBudgetsLoading is false, it will throw an error if you try and access budgets[0] when budgets is undefined.
    setTimeout(() => {}, 500);
  }, [loading]);

  const filter = createFilterOptions<BudgetOptions>();

  return (
    <Stack spacing={1}>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => {
          onChange(newValue);
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id} // Compare IDs
        filterOptions={(_, params) => {
          let filtered = filter(budgets, params);
          return filtered;
        }}
        disablePortal
        id="combo-box-demo"
        options={budgetOptions}
        getOptionLabel={(option: BudgetOptions) => {
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
                <Stack direction="column" alignItems="flex-start" spacing={0.2}>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Stack>
              </Grid2>
              <Grid2>
                <Stack direction="row" spacing={0.5}>
                  <DateField
                    label="Start Date"
                    defaultValue={new Date(option.start_date)}
                    size="small"
                    variant="outlined"
                  />
                  <DateField
                    label="End Date"
                    defaultValue={new Date(option.end_date)}
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
            label="Budgets"
            error={error}
            helperText={helperText}
          />
        )}
        loading={loading}
        loadingText={<CircularProgress />}
        clearOnBlur
        blurOnSelect
      />
    </Stack>
  );
}
