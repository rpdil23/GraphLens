import React from "react";
import {
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DataTable from "./DataTable";
import GraphReportView from "./GraphReportView";
import { Entity, entityColumns } from "../models/entity";
import { Relationship, relationshipColumns } from "../models/relationship";
import { Document, documentColumns } from "../models/document";
import { TextUnit, textUnitColumns } from "../models/text-unit";
import { Community, communityColumns } from "../models/community";
import {
  CommunityReport,
  communityReportColumns,
} from "../models/community-report";
import { Covariate, covariateColumns } from "../models/covariate";
import {
  GraphifyCommunity,
  GraphifyLink,
  GraphifyManifestItem,
  GraphifyNode,
  graphifyCommunityColumns,
  graphifyLinkColumns,
  graphifyManifestColumns,
  graphifyNodeColumns,
} from "../models/graphify";

interface DataTableContainerProps {
  selectedTable: string;
  setSelectedTable: (value: any) => void;
  entities: Entity[];
  relationships: Relationship[];
  documents: Document[];
  textunits: TextUnit[];
  communities: Community[];
  communityReports: CommunityReport[];
  covariates: Covariate[];
  dataSource?: "graphrag" | "graphify";
  setDataSource?: (source: "graphrag" | "graphify") => void;
  graphifyNodes?: GraphifyNode[];
  graphifyLinks?: GraphifyLink[];
  graphifyCommunities?: GraphifyCommunity[];
  graphifyReport?: string | null;
  graphifyManifest?: GraphifyManifestItem[];
}

const DataTableContainer: React.FC<DataTableContainerProps> = ({
  selectedTable,
  setSelectedTable,
  entities,
  relationships,
  documents,
  textunits,
  communities,
  communityReports,
  covariates,
  dataSource = "graphrag",
  setDataSource,
  graphifyNodes = [],
  graphifyLinks = [],
  graphifyCommunities = [],
  graphifyReport,
  graphifyManifest = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const hasGraphRAG = entities.length > 0;
  const hasGraphify = graphifyNodes.length > 0;

  const graphifyTables = [
    { key: "nodes", label: "Symbols / Nodes", count: graphifyNodes.length },
    { key: "links", label: "Relations / Edges", count: graphifyLinks.length },
    { key: "communities", label: "Communities", count: graphifyCommunities.length },
    { key: "report", label: "Architecture Report", count: undefined },
    ...(graphifyManifest.length > 0
      ? [{ key: "manifest", label: "Files Manifest", count: graphifyManifest.length }]
      : []),
  ];

  const graphRAGTables = [
    { key: "entities", label: "Entities", count: entities.length },
    { key: "relationships", label: "Relationships", count: relationships.length },
    { key: "documents", label: "Documents", count: documents.length },
    { key: "textunits", label: "TextUnits", count: textunits.length },
    { key: "communities", label: "Communities", count: communities.length },
    { key: "communityReports", label: "Community Reports", count: communityReports.length },
    { key: "covariates", label: "Covariates", count: covariates.length },
  ];

  const currentTables = dataSource === "graphify" ? graphifyTables : graphRAGTables;

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Mobile Horizontal Table Selector */}
      {isMobile ? (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            p: 1.25,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(18, 18, 24, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            flexShrink: 0,
            whiteSpace: "nowrap",
            "&::-webkit-scrollbar": { height: 4 },
          }}
        >
          {currentTables.map((item) => (
            <Chip
              key={item.key}
              label={item.count !== undefined ? `${item.label} (${item.count})` : item.label}
              clickable
              size="small"
              color={selectedTable === item.key ? "primary" : "default"}
              variant={selectedTable === item.key ? "filled" : "outlined"}
              onClick={() => setSelectedTable(item.key)}
              sx={{ fontWeight: 600, fontSize: "0.75rem", flexShrink: 0 }}
            />
          ))}
        </Box>
      ) : (
        /* Desktop Permanent Drawer */
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: 260,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 260,
              boxSizing: "border-box",
              position: "relative",
              height: "100%",
            },
          }}
        >
          {hasGraphRAG && hasGraphify && setDataSource && (
            <Box sx={{ p: 1.5, pb: 0.5 }}>
              <ToggleButtonGroup
                value={dataSource}
                exclusive
                onChange={(_, val) => {
                  if (val) {
                    setDataSource(val);
                    setSelectedTable(val === "graphify" ? "nodes" : "entities");
                  }
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="graphrag">GraphRAG</ToggleButton>
                <ToggleButton value="graphify">Graphify</ToggleButton>
              </ToggleButtonGroup>
              <Divider sx={{ my: 1.5 }} />
            </Box>
          )}

          <List>
            {currentTables.map((item) => (
              <ListItemButton
                key={item.key}
                selected={selectedTable === item.key}
                onClick={() => setSelectedTable(item.key)}
              >
                <ListItemText primary={item.label} />
                {item.count !== undefined && (
                  <Chip
                    label={item.count}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box p={{ xs: 1.5, sm: 3 }} sx={{ flexGrow: 1, overflow: "auto", minWidth: 0 }}>
        {dataSource === "graphify" ? (
          <>
            {selectedTable === "nodes" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Symbols / Nodes (graph.json)
                </Typography>
                <DataTable columns={graphifyNodeColumns} data={graphifyNodes} />
              </>
            )}
            {selectedTable === "links" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Relationships / Edges (graph.json)
                </Typography>
                <DataTable columns={graphifyLinkColumns} data={graphifyLinks} />
              </>
            )}
            {selectedTable === "communities" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Community Clusters
                </Typography>
                <DataTable
                  columns={graphifyCommunityColumns}
                  data={graphifyCommunities}
                />
              </>
            )}
            {selectedTable === "report" && (
              <GraphReportView
                reportText={graphifyReport || undefined}
                totalNodes={graphifyNodes.length}
                totalEdges={graphifyLinks.length}
                totalCommunities={graphifyCommunities.length}
              />
            )}
            {selectedTable === "manifest" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Files Manifest (manifest.json)
                </Typography>
                <DataTable
                  columns={graphifyManifestColumns}
                  data={graphifyManifest}
                />
              </>
            )}
          </>
        ) : (
          <>
            {selectedTable === "entities" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Entities (entities.parquet)
                </Typography>
                <DataTable columns={entityColumns} data={entities} />
              </>
            )}
            {selectedTable === "relationships" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Relationships (relationships.parquet)
                </Typography>
                <DataTable columns={relationshipColumns} data={relationships} />
              </>
            )}
            {selectedTable === "documents" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Documents (documents.parquet)
                </Typography>
                <DataTable columns={documentColumns} data={documents} />
              </>
            )}
            {selectedTable === "textunits" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  TextUnits (text_units.parquet)
                </Typography>
                <DataTable columns={textUnitColumns} data={textunits} />
              </>
            )}
            {selectedTable === "communities" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Communities (communities.parquet)
                </Typography>
                <DataTable columns={communityColumns} data={communities} />
              </>
            )}
            {selectedTable === "communityReports" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Community Reports (community_reports.parquet)
                </Typography>
                <DataTable
                  columns={communityReportColumns}
                  data={communityReports}
                />
              </>
            )}
            {selectedTable === "covariates" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}>
                  Covariates (covariates.parquet)
                </Typography>
                <DataTable columns={covariateColumns} data={covariates} />
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default DataTableContainer;
