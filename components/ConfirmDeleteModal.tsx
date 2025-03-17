"use client";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  TextField,
  Typography,
} from "@mui/material";
import { red } from "@mui/material/colors";
import React, { useState } from "react";

type Item = {
  id: string;
  name: string;
  description?: string;
};

type ConfirmDeleteModalProps<T extends Item> = {
  isOpen: boolean;
  onDelete: (id: string) => void;
  confirmDeleteItem: T | undefined;
  onClose: () => void;
};

export function ConfirmDeleteModal<T extends Item>({
  isOpen,
  onDelete,
  confirmDeleteItem,
  onClose,
}: ConfirmDeleteModalProps<T>) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState(false); // State for error

  const handleConfirmDelete = () => {
    if (confirmDeleteItem && deleteConfirmation === confirmDeleteItem.name) {
      onDelete(confirmDeleteItem.id);
      setDeleteConfirmation("");
      setDeleteError(false);
      onClose();
    } else if (confirmDeleteItem) {
      setDeleteError(true);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(""); // Clear any typed confirmation
    onClose();
  };
  return (
    <Dialog open={isOpen} onClose={handleCancelDelete}>
      <DialogTitle
        sx={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center" }}
      >
        Confirm Delete
      </DialogTitle>
      <DialogContent sx={{ padding: "1.5rem" }}>
        <Typography variant="body1" sx={{ marginBottom: "1rem" }}>
          Are you sure you want to delete <b>{confirmDeleteItem?.name}</b>? This
          action cannot be undone.
        </Typography>
        <TextField
          label="Type the name of the item to confirm:"
          fullWidth
          margin="normal"
          value={deleteConfirmation}
          onChange={(e) => setDeleteConfirmation(e.target.value)}
          error={deleteError}
          helperText={
            deleteError && (
              <FormHelperText error>Item name does not match</FormHelperText>
            )
          }
          slotProps={{ formHelperText: { style: { color: red[500] } } }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "1rem 1.5rem" }}>
        <Button onClick={handleCancelDelete} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleConfirmDelete} color="error">
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
