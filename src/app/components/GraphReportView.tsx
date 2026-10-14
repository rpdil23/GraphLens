import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CommitIcon from "@mui/icons-material/Commit";

interface GraphReportViewProps {
  reportText?: string;
  totalNodes?: number;
  totalEdges?: number;
  totalCommunities?: number;
}

const GraphReportView: React.FC<GraphReportViewProps> = ({
  reportText,
  totalNodes,
  totalEdges,
  totalCommunities,
}) => {
  const theme = useTheme();

  // Parse sections from reportText if available
  const parsed = React.useMemo(() => {
    if (!reportText) return null;

    const godNodes: { rank: number; name: string; edges: string }[] = [];
    const communityHubs: string[] = [];
    let commit = "";
    let extraction = "";

    const lines = reportText.split("\n");
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        currentSection = trimmed.replace("## ", "").toLowerCase();
        continue;
      }

      if (currentSection.includes("freshness") && trimmed.includes("Built from commit:")) {
        const match = trimmed.match(/`([^`]+)`/);
        if (match) commit = match[1];
      }

      if (currentSection.includes("summary") && trimmed.includes("Extraction:")) {
        extraction = trimmed.replace(/^[-\s*]+Extraction:\s*/i, "");
      }

      if (currentSection.includes("community hubs") && trimmed.startsWith("- ")) {
        const hub = trimmed.replace(/^-\s*/, "");
        if (hub) communityHubs.push(hub);
      }

      if (currentSection.includes("god nodes")) {
        const match = trimmed.match(/^(\d+)\.\s*`([^`]+)`\s*-\s*(\d+\s*edges)/);
        if (match) {
          godNodes.push({
            rank: parseInt(match[1], 10),
            name: match[2],
            edges: match[3],
          });
        }
      }
    }

    return { commit, extraction, communityHubs, godNodes };
  }, [reportText]);

  return (
    <Box sx={{ p: 1, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Graphify Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Summary of codebase architecture, community clusters, and core abstraction god nodes.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
              }}
            >
              <AutoGraphIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Nodes / Symbols
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totalNodes ?? "-"}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "secondary.main",
                color: "secondary.contrastText",
                display: "flex",
              }}
            >
              <DeviceHubIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Relationships
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totalEdges ?? "-"}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "info.main",
                color: "info.contrastText",
                display: "flex",
              }}
            >
              <HubIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Detected Communities
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totalCommunities ?? parsed?.communityHubs.length ?? "-"}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {parsed?.commit && (
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "success.main",
                  color: "success.contrastText",
                  display: "flex",
                }}
              >
                <CommitIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Built from Commit
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                  {parsed.commit.slice(0, 8)}
                </Typography>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* God Nodes & Community Hubs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {parsed?.godNodes && parsed.godNodes.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  God Nodes (Core Abstractions)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  The most connected symbols representing core architectural hubs in the project:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {parsed.godNodes.map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={`#${item.rank}`}
                          size="small"
                          color={item.rank <= 3 ? "primary" : "default"}
                          sx={{ fontSize: "0.75rem", height: 22 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                      <Chip label={item.edges} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {parsed?.communityHubs && parsed.communityHubs.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Community Hubs
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Detected module clusters for navigation and mental mapping:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {parsed.communityHubs.map((hub, idx) => (
                    <Chip
                      key={idx}
                      icon={<HubIcon />}
                      label={hub}
                      variant="outlined"
                      color="primary"
                      sx={{ borderRadius: 1.5, fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Raw Markdown Report */}
      {reportText && (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              GRAPH_REPORT.md Source
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor:
                  theme.palette.mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.02)",
                fontFamily: "Consolas, Monaco, monospace",
                fontSize: "0.85rem",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              {reportText}
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GraphReportView;
