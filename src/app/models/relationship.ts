import { MRT_ColumnDef } from "material-react-table";

export interface Relationship {
    id: string;
    human_readable_id: number;
    source: string;
    target: string;
    description: string;
    weight: number;
    combined_degree: number;
    text_unit_ids: string[];    
    type: string; // Custom field to match neo4j
}

export const relationshipColumns: MRT_ColumnDef<Relationship>[] = [
    {
        accessorKey: "id",
        header: "id",
    },
    {
        accessorKey: "human_readable_id",
        header: "human_readable_id",
    },
    {
      id: "source",
      header: "source",
      accessorFn: (row: Relationship) => {
        const s = row.source as any;
        return typeof s === "object" && s !== null
          ? s.name || s.title || s.label || s.id || ""
          : s || "";
      },
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return typeof val === "object" && val !== null
          ? (val as any).name ||
              (val as any).title ||
              (val as any).label ||
              (val as any).id ||
              JSON.stringify(val)
          : String(val ?? "");
      },
    },
    {
      id: "target",
      header: "target",
      accessorFn: (row: Relationship) => {
        const t = row.target as any;
        return typeof t === "object" && t !== null
          ? t.name || t.title || t.label || t.id || ""
          : t || "";
      },
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return typeof val === "object" && val !== null
          ? (val as any).name ||
              (val as any).title ||
              (val as any).label ||
              (val as any).id ||
              JSON.stringify(val)
          : String(val ?? "");
      },
    },
    {
        accessorKey: "description",
        header: "description",
    },    
    {
        accessorKey: "weight",
        header: "weight",
    },    
    {
        accessorKey: "text_unit_ids",
        header: "text_unit_ids",
        Cell: ({ renderedCellValue }) =>
            Array.isArray(renderedCellValue)
              ? JSON.stringify(renderedCellValue, null, 2)
              : renderedCellValue,
    },
    {
        accessorKey: "combined_degree",
        header: "combined_degree",
    },
    {
        accessorKey: "type",
        header: "type",
    },            
];