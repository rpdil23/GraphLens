import React, { useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface SourceUploadCardProps {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  icon: React.ReactNode;
  isLoaded: boolean;
  isActive: boolean;
  countLabel: string;
  fileLabel: string;
  fileAccept: string;
  onFilesSelected: (files: File[]) => void;
  onActivate: () => void;
  onLoadSample?: () => void;
  isLoadingSample?: boolean;
}

const SourceUploadCard: React.FC<SourceUploadCardProps> = ({
  title,
  subtitle,
  description,
  accentColor,
  icon,
  isLoaded,
  isActive,
  countLabel,
  fileLabel,
  fileAccept,
  onFilesSelected,
  onActivate,
  onLoadSample,
  isLoadingSample = false,
}) => {
  const theme = useTheme();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        borderColor: isActive && isLoaded ? accentColor : theme.palette.divider,
        borderWidth: isActive && isLoaded ? 2 : 1,
        transition: "all 0.2s ease",
        "&:hover": { borderColor: accentColor },
      }}
    >
      <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                backgroundColor: `${accentColor}1f`,
                color: accentColor,
                display: "flex",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>

          {isLoaded ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: "16px !important" }} />}
              label="Loaded"
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip label="Ready" size="small" variant="outlined" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        {isLoaded && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: `${accentColor}12`,
              mb: 2,
              border: `1px solid ${accentColor}33`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: accentColor }}>
              ✓ {countLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active dataset: {isActive ? "Yes" : "No"}
            </Typography>
          </Box>
        )}

        {/* Inputs */}
        <Box sx={{ mt: "auto", pt: 1 }}>
          <input
            ref={folderInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleInputFiles}
            {...({ webkitdirectory: "true", directory: "true" } as any)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            multiple
            style={{ display: "none" }}
            onChange={handleInputFiles}
          />

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderOpenIcon />}
              onClick={() => folderInputRef.current?.click()}
              sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
            >
              Upload Folder
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
            >
              {fileLabel}
            </Button>
          </Stack>

          {onLoadSample && (
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={
                isLoadingSample ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PlayArrowIcon />
                )
              }
              disabled={isLoadingSample}
              onClick={onLoadSample}
              sx={{
                mt: 1.5,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: accentColor,
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: accentColor,
                  filter: "brightness(0.9)",
                },
              }}
            >
              {isLoadingSample
                ? "Loading Example..."
                : isLoaded
                ? `Reload ${title} Example`
                : `Load Example ${title} Dataset`}
            </Button>
          )}

          {isLoaded && !isActive && (
            <Button
              fullWidth
              variant="text"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={onActivate}
              sx={{ mt: 1.5, textTransform: "none", color: accentColor }}
            >
              Switch to {title} dataset
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SourceUploadCard;
