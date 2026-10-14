import { useState, useRef, useEffect, useCallback } from "react";
import { Entity } from "../models/entity";
import { Relationship } from "../models/relationship";
import { Document } from "../models/document";
import { TextUnit } from "../models/text-unit";
import { Community } from "../models/community";
import { CommunityReport } from "../models/community-report";
import { Covariate } from "../models/covariate";
import { readParquetFile } from "../utils/parquet-utils";
import {
  GraphifyCommunity,
  GraphifyGraph,
  GraphifyLink,
  GraphifyManifestItem,
  GraphifyNode,
} from "../models/graphify";
import { getCachedItem, setCachedItem } from "../utils/graph-storage";
import {
  getGraphifySampleFiles,
  getGraphRAGSampleFiles,
} from "../utils/sample-data";

const baseMapping: { [key: string]: string } = {
  "entities.parquet": "entity",
  "relationships.parquet": "relationship",
  "documents.parquet": "document",
  "text_units.parquet": "text_unit",
  "communities.parquet": "community",
  "community_reports.parquet": "community_report",
  "covariates.parquet": "covariate",
};

const fileSchemas: { [key: string]: string } = {};
Object.entries(baseMapping).forEach(([key, value]) => {
  fileSchemas[key] = value;
  fileSchemas[`create_final_${key}`] = value;
});

function extractCommunities(
  nodes: GraphifyNode[],
  labels: Record<string, string>,
): GraphifyCommunity[] {
  const communityMap = new Map<
    number | string,
    { name: string; sampleNodes: string[]; count: number }
  >();

  nodes.forEach((n) => {
    const commId = n.community !== undefined ? n.community : "other";
    const commName =
      n.community_name ||
      labels[String(commId)] ||
      (commId !== "other" ? `Community ${commId}` : "Unassigned");

    if (!communityMap.has(commId)) {
      communityMap.set(commId, { name: commName, sampleNodes: [], count: 0 });
    }
    const entry = communityMap.get(commId)!;
    entry.count += 1;
    if (entry.sampleNodes.length < 8 && n.label) {
      entry.sampleNodes.push(n.label);
    }
  });

  return Array.from(communityMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      nodeCount: data.count,
      sampleNodes: data.sampleNodes,
    }))
    .sort((a, b) => b.nodeCount - a.nodeCount);
}

const useFileHandler = () => {
  const [dataSource, setDataSourceState] = useState<"graphrag" | "graphify">(
    "graphrag",
  );

  const setDataSource = useCallback((source: "graphrag" | "graphify") => {
    setDataSourceState(source);
    setCachedItem("active_source", source);
  }, []);

  // GraphRAG state
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [textunits, setTextUnits] = useState<TextUnit[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [covariates, setCovariates] = useState<Covariate[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>(
    [],
  );

  // Graphify state
  const [graphifyData, setGraphifyData] = useState<GraphifyGraph | null>(null);
  const [graphifyReport, setGraphifyReport] = useState<string | null>(null);
  const [graphifyManifest, setGraphifyManifest] = useState<
    GraphifyManifestItem[]
  >([]);
  const [graphifyCommunities, setGraphifyCommunities] = useState<
    GraphifyCommunity[]
  >([]);
  const [graphifyLabels, setGraphifyLabels] = useState<Record<string, string>>(
    {},
  );
  const labelsRef = useRef<Record<string, string>>({});
  const [loadingSample, setLoadingSample] = useState<boolean>(false);

  // Restore cached state on initial mount
  useEffect(() => {
    async function restoreCachedData() {
      const activeSource = await getCachedItem<"graphrag" | "graphify">(
        "active_source",
      );
      const ragData = await getCachedItem<any>("graphrag_data");
      const gData = await getCachedItem<any>("graphify_data");

      if (ragData && ragData.entities?.length > 0) {
        setEntities(ragData.entities);
        setRelationships(ragData.relationships || []);
        setDocuments(ragData.documents || []);
        setTextUnits(ragData.textunits || []);
        setCommunities(ragData.communities || []);
        setCommunityReports(ragData.communityReports || []);
        setCovariates(ragData.covariates || []);
      }

      if (gData && gData.graphifyData?.nodes?.length > 0) {
        setGraphifyData(gData.graphifyData);
        setGraphifyReport(gData.graphifyReport || null);
        setGraphifyManifest(gData.graphifyManifest || []);
        setGraphifyCommunities(gData.graphifyCommunities || []);
        setGraphifyLabels(gData.graphifyLabels || {});
        labelsRef.current = gData.graphifyLabels || {};
      }

      if (activeSource) {
        setDataSourceState(activeSource);
      }
    }

    restoreCachedData();
  }, []);

  const handleFilesRead = async (files: File[]) => {
    await loadFiles(files);
  };

  const loadFiles = async (files: (File | string)[]) => {
    const parquetFiles: (File | string)[] = [];
    const graphifyFiles: (File | string)[] = [];

    for (const file of files) {
      const fileName =
        typeof file === "string" ? file.split("/").pop()! : file.name;
      if (fileName.endsWith(".parquet")) {
        parquetFiles.push(file);
      } else if (
        fileName.endsWith(".json") ||
        fileName.endsWith(".md") ||
        fileName.toLowerCase().includes("graphify")
      ) {
        graphifyFiles.push(file);
      }
    }

    // 1. Process Graphify files if present
    if (graphifyFiles.length > 0) {
      let loadedGraph: GraphifyGraph | null = null;
      let loadedManifest: GraphifyManifestItem[] = [];
      let loadedLabels: Record<string, string> = { ...labelsRef.current };
      let loadedReport: string | null = null;

      for (const file of graphifyFiles) {
        const fileName =
          typeof file === "string" ? file.split("/").pop()! : file.name;

        try {
          let text: string;
          if (typeof file === "string") {
            const res = await fetch(file);
            text = await res.text();
          } else {
            text = await file.text();
          }

          if (fileName.includes("manifest.json")) {
            loadedManifest = JSON.parse(text);
            setGraphifyManifest(loadedManifest);
          } else if (fileName.includes("labels.json")) {
            loadedLabels = JSON.parse(text);
            labelsRef.current = loadedLabels;
            setGraphifyLabels(loadedLabels);
          } else if (
            fileName.toLowerCase().includes("report.md") ||
            fileName.endsWith(".md")
          ) {
            loadedReport = text;
            setGraphifyReport(text);
          } else if (fileName.endsWith(".json")) {
            const parsed = JSON.parse(text);
            if (parsed.nodes && (parsed.links || parsed.edges)) {
              const nodes: GraphifyNode[] = parsed.nodes || [];
              const links: GraphifyLink[] = parsed.links || parsed.edges || [];
              loadedGraph = {
                ...parsed,
                nodes,
                links,
              };
            }
          }
        } catch (err) {
          console.error(`Error parsing Graphify file ${fileName}:`, err);
        }
      }

      if (loadedGraph) {
        setGraphifyData(loadedGraph);
        const comms = extractCommunities(loadedGraph.nodes, loadedLabels);
        setGraphifyCommunities(comms);
        setDataSourceState("graphify");

        setCachedItem("active_source", "graphify");
        setCachedItem("graphify_data", {
          graphifyData: loadedGraph,
          graphifyReport: loadedReport,
          graphifyManifest: loadedManifest,
          graphifyCommunities: comms,
          graphifyLabels: loadedLabels,
        });
      }
    }

    // 2. Process Parquet files if present
    if (parquetFiles.length > 0) {
      const entitiesArray: Entity[][] = [];
      const relationshipsArray: Relationship[][] = [];
      const documentsArray: Document[][] = [];
      const textUnitsArray: TextUnit[][] = [];
      const communitiesArray: Community[][] = [];
      const communityReportsArray: CommunityReport[][] = [];
      const covariatesArray: Covariate[][] = [];

      for (const file of parquetFiles) {
        const rawFileName =
          typeof file === "string" ? file.split("/").pop()! : file.name;
        const fileName = rawFileName.replace(/\s*\(\d+\)/, "").toLowerCase();
        const schema =
          fileSchemas[fileName] || fileSchemas[`create_final_${fileName}`];

        let data;
        if (typeof file === "string") {
          const response = await fetch(file);
          if (!response.ok) {
            console.error(`Failed to fetch file ${file}: ${response.statusText}`);
            continue;
          }

          const buffer = await response.arrayBuffer();
          const blob = new Blob([buffer], { type: "application/x-parquet" });
          const fileBlob = new File([blob], fileName);
          data = await readParquetFile(fileBlob, schema);
        } else {
          data = await readParquetFile(file, schema);
        }

        if (schema === "entity") {
          entitiesArray.push(data);
        } else if (schema === "relationship") {
          relationshipsArray.push(data);
        } else if (schema === "document") {
          documentsArray.push(data);
        } else if (schema === "text_unit") {
          textUnitsArray.push(data);
        } else if (schema === "community") {
          communitiesArray.push(data);
        } else if (schema === "community_report") {
          communityReportsArray.push(data);
        } else if (schema === "covariate") {
          covariatesArray.push(data);
        }
      }

      const flatEntities = entitiesArray.flat();
      const flatRelationships = relationshipsArray.flat();
      const flatDocuments = documentsArray.flat();
      const flatTextUnits = textUnitsArray.flat();
      const flatCommunities = communitiesArray.flat();
      const flatReports = communityReportsArray.flat();
      const flatCovariates = covariatesArray.flat();

      setEntities(flatEntities);
      setRelationships(flatRelationships);
      setDocuments(flatDocuments);
      setTextUnits(flatTextUnits);
      setCommunities(flatCommunities);
      setCommunityReports(flatReports);
      setCovariates(flatCovariates);
      setDataSourceState("graphrag");

      setCachedItem("active_source", "graphrag");
      setCachedItem("graphrag_data", {
        entities: flatEntities,
        relationships: flatRelationships,
        documents: flatDocuments,
        textunits: flatTextUnits,
        communities: flatCommunities,
        communityReports: flatReports,
        covariates: flatCovariates,
      });
    }
  };

  const loadSampleGraphify = useCallback(async () => {
    setLoadingSample(true);
    try {
      await loadFiles(getGraphifySampleFiles());
    } catch (err) {
      console.error("Failed to load Graphify sample:", err);
    } finally {
      setLoadingSample(false);
    }
  }, []);

  const loadSampleGraphRAG = useCallback(async () => {
    setLoadingSample(true);
    try {
      await loadFiles(getGraphRAGSampleFiles());
    } catch (err) {
      console.error("Failed to load GraphRAG sample:", err);
    } finally {
      setLoadingSample(false);
    }
  }, []);

  return {
    // Active Source
    dataSource,
    setDataSource,
    // GraphRAG state
    entities,
    relationships,
    documents,
    textunits,
    communities,
    covariates,
    communityReports,
    // Graphify state
    graphifyData,
    graphifyReport,
    graphifyManifest,
    graphifyCommunities,
    graphifyLabels,
    // Handlers
    handleFilesRead,
    loadingSample,
    loadSampleGraphify,
    loadSampleGraphRAG,
  };
};

export default useFileHandler;
