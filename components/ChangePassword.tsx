"use client";
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { fetchApi } from "@/app/lib/api";
import { useJwt } from "@/app/lib/jwt-provider";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [jwt, setAndStoreJwt] = useJwt();
  const router = useRouter();
  const handleClickShowPassword = (field: string) => {
    switch (field) {
      case "old":
        setShowOldPassword(!showOldPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmNewPassword(!showConfirmNewPassword);
        break;
      default:
        break;
    }
  };
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) {
      newErrors.oldPassword = "Old password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    }
    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = "Confirm password is required";
    }
    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
      newErrors.newPassword = "Passwords do not match";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  interface ApiResponse {
    message?: string;
    error?: string;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (validateForm()) {
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        const response: Response = await fetchApi(
          jwt,
          setAndStoreJwt,
          "users/password/update/",
          "PATCH",
          {
            old_password: oldPassword,
            new_password: newPassword,
            confirm_new_password: confirmNewPassword,
          },
        );

        const data = await response.json();

        if (response.ok) {
          setOldPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setSuccess(data.message || "Password changed successfully.");
        } else {
          setError(data.detail || "Failed to change password.");
        }
      } catch (err) {
        setError("An error occurred while changing the password: " + err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      <Box
        sx={{
          maxWidth: 400,
          margin: "auto",
          marginTop: 4,
          padding: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      >
        <Typography variant="h5" component="h2">
          Change Password
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Old Password"
          type={showOldPassword ? "text" : "password"}
          fullWidth
          value={oldPassword}
          error={!!formErrors.oldPassword}
          helperText={formErrors.oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => handleClickShowPassword("old")}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="New Password"
          type={showNewPassword ? "text" : "password"}
          fullWidth
          value={newPassword}
          error={!!formErrors.newPassword}
          helperText={formErrors.newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => handleClickShowPassword("new")}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Confirm New Password"
          type={showConfirmNewPassword ? "text" : "password"}
          fullWidth
          value={confirmNewPassword}
          error={!!formErrors.confirmNewPassword}
          helperText={formErrors.confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => handleClickShowPassword("confirm")}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showConfirmNewPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          loading={loading}
          loadingPosition="end"
        >
          Submit
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/profile")}
          disabled={loading}
          loading={loading}
          loadingPosition="end"
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};
