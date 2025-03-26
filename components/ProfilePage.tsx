"use client";

import React, { use, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAccount } from "@/contexts/AccountContext";
import { User } from "@/lib/types";
import isEmail from "validator/lib/isEmail";
import { useRouter } from "next/navigation";

interface ProfilePageProps {}
export const ProfilePage = ({}: ProfilePageProps) => {
  const { user, editUser, isUserLoading } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const defaultUser = {
    name: "",
    email: "",
  };
  const [editedUser, setEditedUser] = useState<Omit<User, "id">>(
    user || defaultUser,
  );

  const handleEditClick = () => {
    setEditedUser(user || defaultUser);
    setIsEditing(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editedUser.name) {
      newErrors.name = "Name is required";
    }
    if (!editedUser.email) {
      newErrors.email = "Email is required";
    }
    if (editedUser.email && !isEmail(editedUser.email)) {
      newErrors.email = "Invalid email";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSaveClick = async () => {
    if (validateForm()) {
      await editUser(editedUser);
      setIsEditing(false);
      setEditedUser(defaultUser);
      setFormErrors({});
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedUser(defaultUser);
    setFormErrors({});
  };
  const handleFormChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setEditedUser({ ...editedUser, [event.target.name]: event.target.value });
  };

  const handlePasswordChangeClick = () => {
    router.push("/change-password");
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: "auto",
        marginTop: 4,
        padding: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        border: "1px solid #ccc",
        borderRadius: 4,
      }}
    >
      <Avatar sx={{ width: 80, height: 80 }} />
      {isEditing ? (
        <>
          <TextField
            label="Name"
            name="name"
            value={editedUser?.name}
            error={!!formErrors.name}
            helperText={formErrors.name}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            error={!!formErrors.email}
            helperText={formErrors.email}
            value={editedUser?.email}
            onChange={handleFormChange}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveClick}
            >
              <SaveIcon /> Save
            </Button>
            <Button variant="outlined" onClick={handleCancelClick}>
              <CancelIcon /> Cancel
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6">{user?.name}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
            <IconButton aria-label="edit" onClick={handleEditClick}>
              <EditIcon />
            </IconButton>
          </Stack>

          <Button
            variant="outlined"
            color="warning"
            onClick={handlePasswordChangeClick}
          >
            Change Password
          </Button>
        </>
      )}
    </Box>
  );
};
