import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DataTable from "./DataTable";
import {
  CustomLink,
  CustomNode,
  customLinkColumns,
  customNodeColumns,
} from "../models/custom-graph-data";
import { textUnitColumns } from "../models/text-unit";
import { communityColumns } from "../models/community";
import { findingColumns } from "../models/community-report";
import { documentColumns } from "../models/document";
import { covariateColumns } from "../models/covariate";
import { MRT_ColumnDef } from "material-react-table";
import { entityColumns } from "../models/entity";

interface DetailDrawerProps {
  bottomDrawerOpen: boolean;
  setBottomDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedNode: CustomNode | null;
  selectedRelationship: CustomLink | null;
  linkedNodes: CustomNode[];
  linkedRelationships: CustomLink[];
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  bottomDrawerOpen,
  setBottomDrawerOpen,
  selectedNode,
  selectedRelationship,
  linkedNodes,
  linkedRelationships,
}) => {
  const getNodeName = (node: string | CustomNode) => {
    if (typeof node === "object") return node.name;
    const match = linkedNodes.find((n) => n.id === node);
    return match ? match.name : node;
  };

  const getNodeType = (node: string | CustomNode) => {
    if (typeof node === "object") return node.type;
    const match = linkedNodes.find((n) => n.id === node);
    return match ? match.type : node;
  };

  const getFilteredNodeColumns = (
    types: string[],
  ): MRT_ColumnDef<CustomNode>[] => {
    const validAccessorKeys = new Set<string>();

    types.forEach((type) => {
      let columns: MRT_ColumnDef<any>[] = [];
      switch (type) {
        case "RAW_DOCUMENT":
          columns = documentColumns;
          break;
        case "CHUNK":
          columns = textUnitColumns;
          break;
        case "COMMUNITY":
          columns = communityColumns;
          break;
        case "FINDING":
          columns = findingColumns;
          break;
        case "covariate":
          columns = covariateColumns;
          break;
        default:
          columns = entityColumns;
          break;
      }
      columns.forEach((column) => {
        if (column.accessorKey) {
          validAccessorKeys.add(column.accessorKey);
        }
      });
    });

    validAccessorKeys.add("community_name");
    validAccessorKeys.add("source_file");
    validAccessorKeys.add("source_location");
    validAccessorKeys.add("confidence");
    validAccessorKeys.add("degree");

    return customNodeColumns.filter(
      (column) =>
        column.accessorKey && validAccessorKeys.has(column.accessorKey),
    );
  };

  const linkedNodeTypes = [...new Set(linkedNodes.map((node) => node.type))];
  const filteredColumns = getFilteredNodeColumns(linkedNodeTypes);

  return (
    <Drawer
      anchor="bottom"
      open={bottomDrawerOpen}
      onClose={() => setBottomDrawerOpen(false)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: { xs: "88vh", sm: "75vh" },
        },
      }}
      sx={{ zIndex: 1700 }}
    >
      <Box
        sx={{
          width: "100%",
          padding: { xs: 2, sm: 3 },
          boxSizing: "border-box",
        }}
      >
        {/* Mobile Pull Handle */}
        <Box
          sx={{
            width: 38,
            height: 4,
            borderRadius: 2,
            bgcolor: "text.disabled",
            mx: "auto",
            mb: 1.5,
            opacity: 0.4,
            display: { xs: "block", sm: "none" },
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
            gap: 1,
          }}
        >
          {selectedNode ? (
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.95rem", sm: "1.25rem" },
                wordBreak: "break-word",
              }}
            >
              Node Details: {selectedNode.name.toString()}
            </Typography>
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.8rem", sm: "1.05rem" },
                wordBreak: "break-word",
              }}
            >
              {selectedRelationship && (
                <>
                  {"(:"}
                  {getNodeType(selectedRelationship.source)} {"{name: "}
                  {"'"}
                  {getNodeName(selectedRelationship.source)}
                  {"'"}
                  {"}"}
                  {")"}
                  {"-[:"}
                  {selectedRelationship.relation || selectedRelationship.type}
                  {"]->"}
                  {"(:"}
                  {getNodeType(selectedRelationship.target)} {"{name: "}
                  {"'"}
                  {getNodeName(selectedRelationship.target)}
                  {"'"}
                  {"}"}
                  {")"}
                </>
              )}
            </Typography>
          )}
          <IconButton
            onClick={() => setBottomDrawerOpen(false)}
            size="small"
            sx={{ marginLeft: "auto" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {selectedNode && (
          <Card sx={{ marginBottom: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Node Information
              </Typography>
              <Typography variant="body2">ID: {selectedNode.uuid}</Typography>
              <Typography variant="body2">Title: {selectedNode.name}</Typography>
              {selectedNode.covariate_type && (
                <Typography variant="body2">
                  Covariate Type: {selectedNode.covariate_type}
                </Typography>
              )}
              <Typography variant="body2" sx={{ my: 0.5 }}>
                Type: <Chip label={selectedNode.type} size="small" />
              </Typography>
              {selectedNode.title && (
                <Typography variant="body2">
                  Community Report Title: {selectedNode.title}
                </Typography>
              )}
              {selectedNode.summary && (
                <Typography variant="body2">Summary: {selectedNode.summary}</Typography>
              )}
              {selectedNode.n_tokens && (
                <Typography variant="body2">
                  Number of Tokens: {selectedNode.n_tokens}
                </Typography>
              )}

              {selectedNode.community_name && (
                <Typography variant="body2">Community: {selectedNode.community_name}</Typography>
              )}
              {selectedNode.source_file && (
                <Typography variant="body2">
                  Source File: {selectedNode.source_file}
                  {selectedNode.source_location ? ` (${selectedNode.source_location})` : ""}
                </Typography>
              )}
              {selectedNode.confidence && (
                <Typography variant="body2">Confidence: {selectedNode.confidence}</Typography>
              )}
              {selectedNode.degree !== undefined && (
                <Typography variant="body2">Degree: {selectedNode.degree}</Typography>
              )}
              {selectedNode.description && (
                <Typography variant="body2">Description: {selectedNode.description}</Typography>
              )}
              {selectedNode.human_readable_id && (
                <Typography variant="body2">
                  Human Readable ID: {selectedNode.human_readable_id}
                </Typography>
              )}
              {selectedNode.raw_content && (
                <Typography variant="body2">Raw Content: {selectedNode.raw_content}</Typography>
              )}
            </CardContent>
          </Card>
        )}

        {selectedRelationship && (
          <Card sx={{ marginBottom: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Relationship Information:
              </Typography>
              <Typography variant="body2">ID: {selectedRelationship.id}</Typography>
              <Typography variant="body2">
                Source: {getNodeName(selectedRelationship.source)}
              </Typography>
              <Typography variant="body2">
                Target: {getNodeName(selectedRelationship.target)}
              </Typography>
              <Typography variant="body2" sx={{ display: "block" }}>
                Relation: {selectedRelationship.relation || selectedRelationship.type}
              </Typography>
              {selectedRelationship.source_file && (
                <Typography variant="body2">
                  Source File: {selectedRelationship.source_file}
                </Typography>
              )}
              {selectedRelationship.confidence && (
                <Typography variant="body2">
                  Confidence: {selectedRelationship.confidence}
                </Typography>
              )}
              {selectedRelationship.description && (
                <Typography variant="body2">
                  Description: {selectedRelationship.description}
                </Typography>
              )}
              {selectedRelationship.weight && (
                <Typography variant="body2">
                  Weight: {selectedRelationship.weight}
                </Typography>
              )}
              {selectedRelationship.rank && (
                <Typography variant="body2">
                  Rank: {selectedRelationship.rank}
                </Typography>
              )}
              {selectedRelationship.human_readable_id && (
                <Typography variant="body2">
                  Human Readable ID: {selectedRelationship.human_readable_id}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {linkedNodes.length > 0 && (
          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Linked Nodes:
            </Typography>
            <DataTable data={linkedNodes} columns={filteredColumns} />
          </Box>
        )}

        {linkedRelationships.length > 0 && (
          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Linked Relationships:
            </Typography>
            <DataTable
              data={linkedRelationships}
              columns={customLinkColumns}
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default DetailDrawer;
