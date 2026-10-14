import React from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import StorageIcon from "@mui/icons-material/Storage";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SourceUploadCard from "./SourceUploadCard";

interface UploadViewProps {
  hasGraphRAG: boolean;
  hasGraphify: boolean;
  graphRAGCount: number;
  graphRAGRelCount: number;
  graphifyCount: number;
  graphifyEdgeCount: number;
  dataSource: "graphrag" | "graphify";
  setDataSource: (source: "graphrag" | "graphify") => void;
  onFilesSelected: (files: File[]) => void;
  onNavigateToGraph: () => void;
  onLoadSampleGraphify?: () => void;
  onLoadSampleGraphRAG?: () => void;
  loadingSample?: boolean;
}

const UploadView: React.FC<UploadViewProps> = ({
  hasGraphRAG,
  hasGraphify,
  graphRAGCount,
  graphRAGRelCount,
  graphifyCount,
  graphifyEdgeCount,
  dataSource,
  setDataSource,
  onFilesSelected,
  onNavigateToGraph,
  onLoadSampleGraphify,
  onLoadSampleGraphRAG,
  loadingSample = false,
}) => {
  const theme = useTheme();
  const isAnyLoaded = hasGraphRAG || hasGraphify;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Header */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: "-1px", mb: 1 }}
        >
          GraphLens
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 640, mx: "auto" }}
        >
          Upload and explore knowledge graphs from <strong>Graphify</strong> codebase analyses or{" "}
          <strong>Microsoft GraphRAG</strong> pipelines with 2D &amp; 3D force simulation.
        </Typography>
      </Box>

      {/* Main Source Upload Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <SourceUploadCard
            title="Graphify"
            subtitle="Codebase Knowledge Graph"
            description="Visualize code structure, call graphs, AST nodes, and detected communities from graphify-out/."
            accentColor="#a855f7"
            icon={<AutoGraphIcon fontSize="medium" />}
            isLoaded={hasGraphify}
            isActive={dataSource === "graphify"}
            countLabel={`${graphifyCount} symbols / nodes • ${graphifyEdgeCount} relationships`}
            fileLabel="Select graph.json"
            fileAccept=".json,.md"
            onFilesSelected={onFilesSelected}
            onActivate={() => setDataSource("graphify")}
            onLoadSample={onLoadSampleGraphify}
            isLoadingSample={loadingSample && dataSource === "graphify"}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SourceUploadCard
            title="GraphRAG"
            subtitle="Microsoft Parquet Pipeline"
            description="Visualize extracted entities, relationships, text units, and community reports from Parquet tables."
            accentColor="#0ea5e9"
            icon={<StorageIcon fontSize="medium" />}
            isLoaded={hasGraphRAG}
            isActive={dataSource === "graphrag"}
            countLabel={`${graphRAGCount} entities • ${graphRAGRelCount} relationships`}
            fileLabel="Select .parquet"
            fileAccept=".parquet"
            onFilesSelected={onFilesSelected}
            onActivate={() => setDataSource("graphrag")}
            onLoadSample={onLoadSampleGraphRAG}
            isLoadingSample={loadingSample && dataSource === "graphrag"}
          />
        </Grid>
      </Grid>

      {/* Action / Launch Banner */}
      {isAnyLoaded && (
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {hasGraphRAG && hasGraphify
                ? "Both Graphify and GraphRAG datasets are loaded!"
                : `Ready to explore ${dataSource === "graphify" ? "Graphify" : "GraphRAG"}!`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasGraphRAG && hasGraphify
                ? "You can toggle between both datasets anytime using the switcher in the header."
                : "Explore nodes, relationships, and clusters in 2D or 3D."}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={onNavigateToGraph}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: dataSource === "graphify" ? "#a855f7" : "#0284c7",
              "&:hover": {
                backgroundColor: dataSource === "graphify" ? "#9333ea" : "#0369a1",
              },
            }}
          >
            Launch Graph Visualization
          </Button>
        </Box>
      )}

      {/* Clean Feature Overview */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              🌐 2D &amp; 3D Force Graphs
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Toggle between interactive 2D canvas and 3D space with smooth orbit controls and zoom.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              ⚡ Community Clusters
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Color nodes by detected communities, view cluster summaries, and inspect relationships.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              🔒 100% Client-Side
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Parquet decoding and JSON graph analysis run locally in your browser. Zero data leaves your machine.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UploadView;
