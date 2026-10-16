import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Link,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";

interface AppHeaderProps {
  tabIndex: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  dataSource: "graphrag" | "graphify";
  onDataSourceChange: (source: "graphrag" | "graphify") => void;
  hasGraphRAG: boolean;
  hasGraphify: boolean;
  graphRAGCount?: number;
  graphifyCount?: number;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tabIndex,
  onTabChange,
  dataSource,
  onDataSourceChange,
  hasGraphRAG,
  hasGraphify,
  graphRAGCount = 0,
  graphifyCount = 0,
  darkMode = true,
  onToggleTheme,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(18, 18, 24, 0.88)"
            : "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(12px)",
        zIndex: 1100,
      }}
    >
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          px: { xs: 1, sm: 2.5 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: { xs: 46, sm: 52 },
          gap: { xs: 0.5, sm: 1.5 },
        }}
      >
        {/* Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <AutoGraphIcon
            sx={{
              color: dataSource === "graphify" ? "#a855f7" : "#0284c7",
              fontSize: { xs: 22, sm: 26 },
              transition: "color 0.3s ease",
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              display: { xs: "none", md: "block" },
              userSelect: "none",
            }}
          >
            GraphLens
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
          <Tabs
            value={tabIndex}
            onChange={onTabChange}
            centered={!isMobile}
            variant={isMobile ? "standard" : "standard"}
            sx={{
              minHeight: { xs: 40, sm: 44 },
              "& .MuiTab-root": {
                minHeight: { xs: 40, sm: 44 },
                py: 0.5,
                px: { xs: 0.75, sm: 2 },
                minWidth: { xs: 52, sm: 80 },
                fontSize: { xs: "0.72rem", sm: "0.85rem" },
                fontWeight: 600,
                textTransform: "none",
              },
            }}
          >
            <Tab label="Upload" />
            <Tab label="Graph View" />
            <Tab label="Data Tables" />
          </Tabs>
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
          {/* Dataset Switcher */}
          {hasGraphRAG && hasGraphify ? (
            <ToggleButtonGroup
              value={dataSource}
              exclusive
              onChange={(_, val) => val && onDataSourceChange(val)}
              size="small"
              sx={{
                height: { xs: 28, sm: 32 },
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.04)",
                borderRadius: 2,
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: { xs: 0.75, sm: 1.25 },
                  py: 0.25,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.68rem", sm: "0.75rem" },
                  borderRadius: 2,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                },
                "& .Mui-selected": {
                  backgroundColor:
                    dataSource === "graphify"
                      ? theme.palette.mode === "dark"
                        ? "rgba(168, 85, 247, 0.25) !important"
                        : "rgba(168, 85, 247, 0.15) !important"
                      : theme.palette.mode === "dark"
                        ? "rgba(14, 165, 233, 0.25) !important"
                        : "rgba(14, 165, 233, 0.15) !important",
                  color:
                    dataSource === "graphify"
                      ? "#a855f7 !important"
                      : "#0284c7 !important",
                },
              }}
            >
              <ToggleButton value="graphify" aria-label="Graphify dataset">
                {isMobile
                  ? `⚡ ${graphifyCount > 0 ? graphifyCount : "Graphify"}`
                  : `⚡ Graphify ${graphifyCount > 0 ? `(${graphifyCount})` : ""}`}
              </ToggleButton>
              <ToggleButton value="graphrag" aria-label="GraphRAG dataset">
                {isMobile
                  ? `🌐 ${graphRAGCount > 0 ? graphRAGCount : "GraphRAG"}`
                  : `🌐 GraphRAG ${graphRAGCount > 0 ? `(${graphRAGCount})` : ""}`}
              </ToggleButton>
            </ToggleButtonGroup>
          ) : hasGraphify ? (
            <Chip
              label={
                isMobile
                  ? `⚡ ${graphifyCount > 0 ? graphifyCount : "Graphify"}`
                  : `⚡ Graphify ${graphifyCount > 0 ? `(${graphifyCount})` : ""}`
              }
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: { xs: "0.68rem", sm: "0.75rem" }, height: { xs: 24, sm: 26 } }}
            />
          ) : hasGraphRAG ? (
            <Chip
              label={
                isMobile
                  ? `🌐 ${graphRAGCount > 0 ? graphRAGCount : "GraphRAG"}`
                  : `🌐 GraphRAG ${graphRAGCount > 0 ? `(${graphRAGCount})` : ""}`
              }
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: { xs: "0.68rem", sm: "0.75rem" }, height: { xs: 24, sm: 26 } }}
            />
          ) : null}

          {/* Theme Mode Toggle */}
          {onToggleTheme && (
            <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton
                onClick={onToggleTheme}
                size="small"
                color="inherit"
                sx={{ p: { xs: 0.5, sm: 0.75 } }}
              >
                {darkMode ? (
                  <DarkModeOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                ) : (
                  <LightModeOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          {/* GitHub link (hidden on small mobile to preserve header room) */}
          <Tooltip title="View Source on GitHub">
            <IconButton
              component={Link}
              href="https://github.com/rpdil23/GraphLens"
              target="_blank"
              rel="noopener"
              size="small"
              color="inherit"
              sx={{
                p: { xs: 0.5, sm: 0.75 },
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              <GitHubIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
