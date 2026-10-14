import { MRT_ColumnDef } from "material-react-table";

export interface GraphifyNode {
  id: string;
  label: string;
  community?: number;
  community_name?: string;
  file_type?: string;
  source_file?: string;
  source_location?: string;
  confidence?: string;
  _callable?: boolean;
  _callable_class?: boolean;
  _origin?: string;
  norm_label?: string;
  degree?: number;
  external?: boolean;
  type?: string;
  weight?: number;
  member_count?: number;
  [key: string]: any;
}

export interface GraphifyLink {
  source: string;
  target: string;
  relation: string;
  _origin?: string;
  confidence?: string;
  confidence_score?: number;
  context?: string;
  source_file?: string;
  source_location?: string;
  weight?: number;
  deferred?: boolean;
  type_only?: boolean;
  [key: string]: any;
}

export interface GraphifyGraph {
  directed?: boolean;
  multigraph?: boolean;
  graph?: {
    schema_version?: number;
    graphify_version?: string;
    [key: string]: any;
  };
  nodes: GraphifyNode[];
  links: GraphifyLink[];
  hyperedges?: any[];
  built_at_commit?: string;
}

export interface GraphifyCommunity {
  id: number | string;
  name: string;
  nodeCount: number;
  sampleNodes: string[];
}

export interface GraphifyManifestItem {
  file: string;
  mtime?: number;
  seen?: number;
  ast_hash?: string;
  semantic_hash?: string;
}

export const graphifyNodeColumns: MRT_ColumnDef<GraphifyNode>[] = [
  {
    accessorKey: "label",
    header: "Symbol / Label",
  },
  {
    accessorKey: "file_type",
    header: "Type",
  },
  {
    accessorKey: "community_name",
    header: "Community Hub",
  },
  {
    accessorKey: "source_file",
    header: "Source File",
  },
  {
    accessorKey: "source_location",
    header: "Location",
  },
  {
    accessorKey: "degree",
    header: "Degree",
  },
  {
    accessorKey: "confidence",
    header: "Confidence",
  },
  {
    accessorKey: "id",
    header: "AST ID",
  },
];

export const graphifyLinkColumns: MRT_ColumnDef<GraphifyLink>[] = [
  {
    accessorKey: "source",
    header: "Source Node",
  },
  {
    accessorKey: "relation",
    header: "Relation",
  },
  {
    accessorKey: "target",
    header: "Target Node",
  },
  {
    accessorKey: "confidence",
    header: "Confidence",
  },
  {
    accessorKey: "source_file",
    header: "Source File",
  },
  {
    accessorKey: "source_location",
    header: "Location",
  },
  {
    accessorKey: "weight",
    header: "Weight",
  },
];

export const graphifyCommunityColumns: MRT_ColumnDef<GraphifyCommunity>[] = [
  {
    accessorKey: "id",
    header: "Community ID",
  },
  {
    accessorKey: "name",
    header: "Community Hub",
  },
  {
    accessorKey: "nodeCount",
    header: "Member Count",
  },
  {
    accessorKey: "sampleNodes",
    header: "Sample Nodes",
    Cell: ({ renderedCellValue }) =>
      Array.isArray(renderedCellValue)
        ? renderedCellValue.join(", ")
        : renderedCellValue,
  },
];

export const graphifyManifestColumns: MRT_ColumnDef<GraphifyManifestItem>[] = [
  {
    accessorKey: "file",
    header: "Source File",
  },
  {
    accessorKey: "ast_hash",
    header: "AST Hash",
  },
  {
    accessorKey: "semantic_hash",
    header: "Semantic Hash",
  },
  {
    accessorKey: "mtime",
    header: "Last Modified",
    Cell: ({ cell }) => {
      const val = cell.getValue<number | undefined>();
      return val ? new Date(val * 1000).toLocaleString() : "-";
    },
  },
];
