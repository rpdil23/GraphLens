import React from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { CustomLink, CustomNode } from "../models/custom-graph-data";

interface SearchDrawerProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  searchResults: (CustomNode | CustomLink)[];
  rightDrawerOpen: boolean;
  toggleDrawer: (open: boolean) => () => void;
  handleFocusButtonClick: (node: CustomNode) => void;
  handleNodeClick: (node: CustomNode) => void;
  handleFocusLinkClick: (link: CustomLink) => void;
  handleLinkClick: (link: CustomLink) => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  searchResults,
  rightDrawerOpen,
  toggleDrawer,
  handleFocusButtonClick,
  handleNodeClick,
  handleFocusLinkClick,
  handleLinkClick,
}) => {
  return (
    <Drawer
      anchor="right"
      open={rightDrawerOpen}
      onClose={toggleDrawer(false)}
      sx={{ zIndex: 1700 }}
    >
      <Box
        sx={{
          width: { xs: "100vw", sm: 500, md: 680 },
          maxWidth: "100vw",
          padding: { xs: 1.5, sm: 2.5 },
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.25rem" } }}
          >
            Search Graph
          </Typography>
          <IconButton onClick={toggleDrawer(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search Node or Relationship"
          fullWidth
          size="small"
          margin="dense"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch} color="primary" size="small">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {searchResults.filter((item) => "neighbors" in item).length > 0 && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Nodes ({searchResults.filter((item) => "neighbors" in item).length})
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ marginTop: 1, maxHeight: "350px", overflow: "auto" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((item) => {
                    if (!("neighbors" in item)) return null;
                    const node = item as CustomNode;
                    return (
                      <TableRow key={node.id} hover>
                        <TableCell sx={{ wordBreak: "break-word", maxWidth: 160 }}>
                          {node.name}
                        </TableCell>
                        <TableCell>{node.type}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                handleFocusButtonClick(node);
                                toggleDrawer(false)();
                              }}
                              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.72rem" }}
                            >
                              Focus
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleNodeClick(node)}
                              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.72rem" }}
                            >
                              Details
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {searchResults.filter((item) => "source" in item && "target" in item)
          .length > 0 && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Relationships ({searchResults.filter((item) => "source" in item && "target" in item).length})
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ marginTop: 1, maxHeight: "350px", overflow: "auto" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((item) => {
                    if (!("source" in item && "target" in item)) return null;
                    const link = item as CustomLink;
                    return (
                      <TableRow key={link.id} hover>
                        <TableCell sx={{ wordBreak: "break-word", maxWidth: 120 }}>
                          {typeof link.source === "object"
                            ? (link.source as CustomNode).name
                            : link.source}
                        </TableCell>
                        <TableCell sx={{ wordBreak: "break-word", maxWidth: 120 }}>
                          {typeof link.target === "object"
                            ? (link.target as CustomNode).name
                            : link.target}
                        </TableCell>
                        <TableCell sx={{ wordBreak: "break-word", maxWidth: 160 }}>
                          {link.relation
                            ? `${link.relation}${link.confidence ? ` [${link.confidence}]` : ""}`
                            : link.description || link.type}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                handleFocusLinkClick(link);
                                toggleDrawer(false)();
                              }}
                              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.72rem" }}
                            >
                              Focus
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleLinkClick(link)}
                              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: "0.72rem" }}
                            >
                              Details
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default SearchDrawer;
