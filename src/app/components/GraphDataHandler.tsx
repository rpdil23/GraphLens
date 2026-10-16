import React, { useState, useEffect, Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
} from "@mui/material";
import AppHeader from "./AppHeader";
import UploadView from "./UploadView";
import useFileHandler from "../hooks/useFileHandler";
import useGraphData from "../hooks/useGraphData";

const GraphViewer = lazy(() => import("./GraphViewer"));
const DataTableContainer = lazy(() => import("./DataTableContainer"));

const getTabIndexFromPathname = (pathname: string): number => {
  switch (pathname) {
    case "/graph":
      return 1;
    case "/data":
      return 2;
    default:
      return 0;
  }
};

interface GraphDataHandlerProps {
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

const GraphDataHandler: React.FC<GraphDataHandlerProps> = ({
  darkMode = true,
  onToggleTheme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabIndex = getTabIndexFromPathname(location.pathname);
  const [graphType, setGraphType] = useState<"2d" | "3d">("2d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>("entities");
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeTextUnits, setIncludeTextUnits] = useState(false);
  const [includeCommunities, setIncludeCommunities] = useState(false);
  const [includeCovariates, setIncludeCovariates] = useState(false);
  const [maxEntities, setMaxEntities] = useState(500);

  const {
    dataSource,
    setDataSource,
    entities,
    relationships,
    documents,
    textunits,
    communities,
    covariates,
    communityReports,
    graphifyData,
    graphifyReport,
    graphifyManifest,
    graphifyCommunities,
    handleFilesRead,
    loadingSample,
    loadSampleGraphify,
    loadSampleGraphRAG,
  } = useFileHandler();

  const graphData = useGraphData(
    entities,
    relationships,
    documents,
    textunits,
    communities,
    communityReports,
    covariates,
    includeDocuments,
    includeTextUnits,
    includeCommunities,
    includeCovariates,
    maxEntities,
    dataSource,
    graphifyData,
  );

  const hasDocuments = documents.length > 0;
  const hasTextUnits = textunits.length > 0;
  const hasCommunities = communities.length > 0;
  const hasCovariates = covariates.length > 0;

  const hasGraphRAG = entities.length > 0;
  const hasGraphify = Boolean(graphifyData && graphifyData.nodes.length > 0);

  const totalEntities =
    dataSource === "graphify"
      ? (graphifyData?.nodes?.length || 0)
      : entities.length;

  useEffect(() => {
    if (dataSource === "graphify") {
      setSelectedTable((prev: string) =>
        ["nodes", "links", "communities", "report", "manifest"].includes(prev)
          ? prev
          : "nodes",
      );
    } else {
      setSelectedTable((prev: string) =>
        [
          "entities",
          "relationships",
          "documents",
          "textunits",
          "communities",
          "communityReports",
          "covariates",
        ].includes(prev)
          ? prev
          : "entities",
      );
    }
  }, [dataSource]);

  const onFilesSelected = (acceptedFiles: File[]) => {
    handleFilesRead(acceptedFiles);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    let path = "/upload";
    if (newValue === 1) path = "/graph";
    if (newValue === 2) path = "/data";
    navigate(path);
  };

  const toggleGraphType = () => {
    setGraphType((prevType) => (prevType === "2d" ? "3d" : "2d"));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <AppHeader
        tabIndex={tabIndex}
        onTabChange={handleTabChange}
        dataSource={dataSource}
        onDataSourceChange={setDataSource}
        hasGraphRAG={hasGraphRAG}
        hasGraphify={hasGraphify}
        graphRAGCount={entities.length}
        graphifyCount={graphifyData?.nodes?.length || 0}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      />

      {tabIndex === 0 && (
        <UploadView
          hasGraphRAG={hasGraphRAG}
          hasGraphify={hasGraphify}
          graphRAGCount={entities.length}
          graphRAGRelCount={relationships.length}
          graphifyCount={graphifyData?.nodes?.length || 0}
          graphifyEdgeCount={graphifyData?.links?.length || 0}
          dataSource={dataSource}
          setDataSource={setDataSource}
          onFilesSelected={onFilesSelected}
          onNavigateToGraph={() => navigate("/graph")}
          onLoadSampleGraphify={loadSampleGraphify}
          onLoadSampleGraphRAG={loadSampleGraphRAG}
          loadingSample={loadingSample}
        />
      )}

      {tabIndex === 1 && (
        <Box
          p={0}
          sx={{
            height: isFullscreen
              ? "100vh"
              : { xs: "calc(100vh - 46px)", sm: "calc(100vh - 52px)" },
            width: isFullscreen ? "100vw" : "100%",
            position: isFullscreen ? "fixed" : "relative",
            top: 0,
            left: 0,
            zIndex: isFullscreen ? 1300 : "auto",
            overflow: "hidden",
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <CircularProgress size={44} />
              </Box>
            }
          >
            <GraphViewer
              data={graphData}
              graphType={graphType}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onToggleGraphType={toggleGraphType}
              includeDocuments={includeDocuments}
              includeTextUnits={includeTextUnits}
              onIncludeDocumentsChange={() =>
                setIncludeDocuments(!includeDocuments)
              }
              onIncludeTextUnitsChange={() =>
                setIncludeTextUnits(!includeTextUnits)
              }
              includeCommunities={includeCommunities}
              onIncludeCommunitiesChange={() =>
                setIncludeCommunities(!includeCommunities)
              }
              includeCovariates={includeCovariates}
              onIncludeCovariatesChange={() =>
                setIncludeCovariates(!includeCovariates)
              }
              hasDocuments={hasDocuments}
              hasTextUnits={hasTextUnits}
              hasCommunities={hasCommunities}
              hasCovariates={hasCovariates}
              maxEntities={maxEntities}
              onMaxEntitiesChange={setMaxEntities}
              totalEntities={totalEntities}
              dataSource={dataSource}
            />
          </Suspense>
        </Box>
      )}

      {tabIndex === 2 && (
        <Box
          sx={{
            display: "flex",
            height: { xs: "calc(100vh - 46px)", sm: "calc(100vh - 52px)" },
            overflow: "hidden",
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <CircularProgress size={44} />
              </Box>
            }
          >
            <DataTableContainer
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              entities={entities}
              relationships={relationships}
              documents={documents}
              textunits={textunits}
              communities={communities}
              communityReports={communityReports}
              covariates={covariates}
              dataSource={dataSource}
              setDataSource={setDataSource}
              graphifyNodes={graphifyData?.nodes || []}
              graphifyLinks={graphifyData?.links || []}
              graphifyCommunities={graphifyCommunities}
              graphifyReport={graphifyReport}
              graphifyManifest={graphifyManifest}
            />
          </Suspense>
        </Box>
      )}
    </>
  );
};

export default GraphDataHandler;
