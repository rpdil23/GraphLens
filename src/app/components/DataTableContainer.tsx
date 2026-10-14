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
  const hasGraphRAG = entities.length > 0;
  const hasGraphify = graphifyNodes.length > 0;

  return (
    <>
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: 260,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 260, boxSizing: "border-box" },
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
          {dataSource === "graphify" ? (
            <>
              <ListItemButton
                selected={selectedTable === "nodes"}
                onClick={() => setSelectedTable("nodes")}
              >
                <ListItemText primary="Symbols / Nodes" />
                <Chip
                  label={graphifyNodes.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>

              <ListItemButton
                selected={selectedTable === "links"}
                onClick={() => setSelectedTable("links")}
              >
                <ListItemText primary="Relations / Edges" />
                <Chip
                  label={graphifyLinks.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>

              <ListItemButton
                selected={selectedTable === "communities"}
                onClick={() => setSelectedTable("communities")}
              >
                <ListItemText primary="Communities" />
                <Chip
                  label={graphifyCommunities.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>

              <ListItemButton
                selected={selectedTable === "report"}
                onClick={() => setSelectedTable("report")}
              >
                <ListItemText primary="Architecture Report" />
              </ListItemButton>

              {graphifyManifest.length > 0 && (
                <ListItemButton
                  selected={selectedTable === "manifest"}
                  onClick={() => setSelectedTable("manifest")}
                >
                  <ListItemText primary="Files Manifest" />
                  <Chip
                    label={graphifyManifest.length}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                  />
                </ListItemButton>
              )}
            </>
          ) : (
            <>
              <ListItemButton
                selected={selectedTable === "entities"}
                onClick={() => setSelectedTable("entities")}
              >
                <ListItemText primary="Entities" />
                <Chip
                  label={entities.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>
              <ListItemButton
                selected={selectedTable === "relationships"}
                onClick={() => setSelectedTable("relationships")}
              >
                <ListItemText primary="Relationships" />
                <Chip
                  label={relationships.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>
              <ListItemButton
                selected={selectedTable === "documents"}
                onClick={() => setSelectedTable("documents")}
              >
                <ListItemText primary="Documents" />
                <Chip
                  label={documents.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>
              <ListItemButton
                selected={selectedTable === "textunits"}
                onClick={() => setSelectedTable("textunits")}
              >
                <ListItemText primary="TextUnits" />
                <Chip
                  label={textunits.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>
              <ListItemButton
                selected={selectedTable === "communities"}
                onClick={() => setSelectedTable("communities")}
              >
                <ListItemText primary="Communities" />
                <Chip
                  label={communities.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>

              <ListItemButton
                selected={selectedTable === "communityReports"}
                onClick={() => setSelectedTable("communityReports")}
              >
                <ListItemText primary="Community Reports" />
                <Chip
                  label={communityReports.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>

              <ListItemButton
                selected={selectedTable === "covariates"}
                onClick={() => setSelectedTable("covariates")}
              >
                <ListItemText primary="Covariates" />
                <Chip
                  label={covariates.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>
      <Box p={3} sx={{ flexGrow: 1, overflow: "auto" }}>
        {dataSource === "graphify" ? (
          <>
            {selectedTable === "nodes" && (
              <>
                <Typography variant="h4" gutterBottom>
                  Symbols / Nodes (graph.json)
                </Typography>
                <DataTable columns={graphifyNodeColumns} data={graphifyNodes} />
              </>
            )}
            {selectedTable === "links" && (
              <>
                <Typography variant="h4" gutterBottom>
                  Relationships / Edges (graph.json)
                </Typography>
                <DataTable columns={graphifyLinkColumns} data={graphifyLinks} />
              </>
            )}
            {selectedTable === "communities" && (
              <>
                <Typography variant="h4" gutterBottom>
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
                <Typography variant="h4" gutterBottom>
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
                <Typography variant="h4" gutterBottom>
                  Entities (entities.parquet)
                </Typography>
                <DataTable columns={entityColumns} data={entities} />
              </>
            )}
            {selectedTable === "relationships" && (
              <>
                <Typography variant="h4" gutterBottom>
                  Relationships (relationships.parquet)
                </Typography>
                <DataTable columns={relationshipColumns} data={relationships} />
              </>
            )}
            {selectedTable === "documents" && (
              <>
                <Typography variant="h4" gutterBottom>
                  Documents (documents.parquet)
                </Typography>
                <DataTable columns={documentColumns} data={documents} />
              </>
            )}
            {selectedTable === "textunits" && (
              <>
                <Typography variant="h4" gutterBottom>
                  TextUnits (text_units.parquet)
                </Typography>
                <DataTable columns={textUnitColumns} data={textunits} />
              </>
            )}
            {selectedTable === "communities" && (
              <>
                <Typography variant="h4" gutterBottom>
                  Communities (communities.parquet)
                </Typography>
                <DataTable columns={communityColumns} data={communities} />
              </>
            )}
            {selectedTable === "communityReports" && (
              <>
                <Typography variant="h4" gutterBottom>
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
                <Typography variant="h4" gutterBottom>
                  Covariates (covariates.parquet)
                </Typography>
                <DataTable columns={covariateColumns} data={covariates} />
              </>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default DataTableContainer;
