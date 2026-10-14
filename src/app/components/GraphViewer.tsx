import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  Suspense,
  lazy,
} from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  CustomGraphData,
  CustomLink,
  CustomNode,
} from "../models/custom-graph-data";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  IconButton,
  Slider,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Fuse from "fuse.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import * as THREE from "three";
import { Renderer } from "three";
import SearchDrawer from "./SearchDrawer";
import DetailDrawer from "./DetailDrawer";
import { SearchResult } from "../models/search-result";
import agent from "../api/agent";
import APISearchDrawer from "./APISearchDrawer";
import SpriteText from "three-spritetext";
import { sanitizeGraphData } from "../utils/sanitizeGraphData";

const ForceGraph3D = lazy(() => import("react-force-graph-3d"));

type Coords = {
  x: number;
  y: number;
  z: number;
};

interface GraphViewerProps {
  data: CustomGraphData;
  graphType: "2d" | "3d";
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleGraphType: (event: React.ChangeEvent<HTMLInputElement>) => void;
  includeDocuments: boolean;
  onIncludeDocumentsChange: React.Dispatch<React.SetStateAction<boolean>>;
  includeTextUnits: boolean;
  onIncludeTextUnitsChange: React.Dispatch<React.SetStateAction<boolean>>;
  includeCommunities: boolean;
  onIncludeCommunitiesChange: React.Dispatch<React.SetStateAction<boolean>>;
  includeCovariates: boolean;
  onIncludeCovariatesChange: React.Dispatch<React.SetStateAction<boolean>>;
  hasDocuments: boolean;
  hasTextUnits: boolean;
  hasCommunities: boolean;
  hasCovariates: boolean;
  maxEntities: number;
  onMaxEntitiesChange: React.Dispatch<React.SetStateAction<number>>;
  totalEntities: number;
  dataSource?: "graphrag" | "graphify";
}

const NODE_R = 8;

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  graphType,
  isFullscreen,
  includeDocuments,
  onIncludeDocumentsChange,
  includeTextUnits,
  onIncludeTextUnitsChange,
  includeCommunities,
  onIncludeCommunitiesChange,
  includeCovariates,
  onIncludeCovariatesChange,
  onToggleFullscreen,
  onToggleGraphType,
  hasDocuments,
  hasTextUnits,
  hasCommunities,
  hasCovariates,
  maxEntities,
  onMaxEntitiesChange,
  totalEntities,
  dataSource = "graphrag",
}) => {
  const theme = useTheme();
  const [colorByCommunity, setColorByCommunity] = useState<boolean>(
    dataSource === "graphify",
  );

  useEffect(() => {
    if (dataSource === "graphify") {
      setColorByCommunity(true);
    } else {
      setColorByCommunity(false);
    }
  }, [dataSource]);

  const getNodeColorCategory = useCallback(
    (node: any): string => {
      if (colorByCommunity && node?.community_name) {
        return String(node.community_name);
      }
      return String(node?.type || node?.file_type || node?.label || "Entity");
    },
    [colorByCommunity],
  );

  const hasCommunityData = useMemo(
    () => data.nodes.some((n) => Boolean(n.community_name)),
    [data.nodes],
  );

  const sliderMax = Math.max(totalEntities, 1000);
  const sliderMin = 50;
  const toSliderValue = (value: number) =>
    value === 0 ? sliderMax : Math.min(value, sliderMax);
  const fromSliderValue = (value: number) => (value >= sliderMax ? 0 : value);
  const committedSliderValue = toSliderValue(maxEntities);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [dragSliderValue, setDragSliderValue] = useState<number | null>(null);
  const sliderValue =
    isSliderDragging && dragSliderValue !== null
      ? dragSliderValue
      : committedSliderValue;
  const [highlightNodes, setHighlightNodes] = useState<Set<CustomNode>>(
    new Set(),
  );
  const [highlightLinks, setHighlightLinks] = useState<Set<CustomLink>>(
    new Set(),
  );
  const [hoverNode, setHoverNode] = useState<CustomNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    (CustomNode | CustomLink)[]
  >([]);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<CustomLink | null>(null);
  const [linkedNodes, setLinkedNodes] = useState<CustomNode[]>([]);
  const [linkedRelationships, setLinkedRelationships] = useState<CustomLink[]>(
    [],
  );
  const [showLabels, setShowLabels] = useState(false);
  const [showLinkLabels, setShowLinkLabels] = useState(false);
  const [showHighlight, setShowHighlight] = useState(true);
  const graphRef = useRef<any>();
  const extraRenderers = useMemo(
    () => [new CSS2DRenderer() as any as Renderer],
    [],
  );
  const nodeCount = data.nodes.length;
  const linkCount = data.links.length;

  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<SearchResult | null>(
    null,
  );
  const [serverUp, setServerUp] = useState<boolean>(false);

  const [searchGraphData, setSearchGraphData] =
    useState<CustomGraphData | null>(null);

  const sanitizedBaseData = useMemo(() => sanitizeGraphData(data), [data]);
  const initialGraphData = useRef<CustomGraphData>(sanitizedBaseData);
  const prevBaseDataRef = useRef(data);

  if (prevBaseDataRef.current !== data) {
    prevBaseDataRef.current = data;
    initialGraphData.current = sanitizedBaseData;
  }

  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const availableEntityTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach((node) => {
      if (
        node.type &&
        !node.covariate_type &&
        !["RAW_DOCUMENT", "CHUNK", "COMMUNITY", "FINDING"].includes(node.type)
      ) {
        counts[node.type] = (counts[node.type] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }, [data.nodes]);

  const toggleType = useCallback((type: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const showAllTypes = useCallback(() => {
    setHiddenTypes(new Set());
  }, []);

  const hideAllTypes = useCallback(() => {
    setHiddenTypes(new Set(availableEntityTypes.map((item) => item.type)));
  }, [availableEntityTypes]);

  const displayGraphData = useMemo(() => {
    const base = apiSearchResults && searchGraphData ? searchGraphData : data;
    if (hiddenTypes.size === 0) {
      return sanitizeGraphData(base);
    }
    const filteredNodes = base.nodes.filter(
      (node) => !node.type || !hiddenTypes.has(node.type),
    );
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = base.links.filter((link) => {
      const source = link.source as any;
      const target = link.target as any;
      const sourceId = typeof source === "object" ? source.id : source;
      const targetId = typeof target === "object" ? target.id : target;
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    });
    return sanitizeGraphData({ nodes: filteredNodes, links: filteredLinks });
  }, [apiSearchResults, searchGraphData, data, hiddenTypes]);

  const graphRenderKey = useMemo(
    () =>
      `${maxEntities}-${displayGraphData.nodes.length}-${displayGraphData.links.length}`,
    [maxEntities, displayGraphData.nodes.length, displayGraphData.links.length],
  );

  useEffect(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setHoverNode(null);
  }, [graphRenderKey]);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const toggleApiDrawer = (open: boolean) => () => {
    setApiDrawerOpen(open);
  };

  const handleApiSearch = async (
    query: string,
    searchType: "local" | "global",
  ) => {
    try {
      const data: SearchResult =
        searchType === "local"
          ? await agent.Search.local(query)
          : await agent.Search.global(query);

      setApiSearchResults(data);
      // Process the search result to update the graph data
      updateGraphData(data.context_data);
    } catch (err) {
      console.error("An error occurred during the API search.", err);
    } finally {
    }
  };

  const checkServerStatus = async () => {
    try {
      const response = await agent.Status.check();
      if (response.status === "Server is up and running") {
        setServerUp(true);
      } else {
        setServerUp(false);
      }
    } catch (error) {
      setServerUp(false);
    }
  };

  const updateGraphData = (contextData: any) => {
    if (!contextData) return;

    const newNodes: CustomNode[] = [];
    const newLinks: CustomLink[] = [];

    const baseGraphData = initialGraphData.current;

    // Assuming contextData has keys like entities, reports, relationships, sources
    Object.entries(contextData).forEach(([key, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (key === "relationships") {
            // Handle links
            const existingLink = baseGraphData.links.find(
              (link) =>
                link.human_readable_id?.toString() === item.id.toString(),
            );

            if (existingLink) {
              newLinks.push(existingLink);
            }
          } else if (key === "entities") {
            const existingNode = baseGraphData.nodes.find(
              (node) =>
                node.human_readable_id?.toString() === item.id.toString() &&
                !node.covariate_type,
            );
            if (existingNode) {
              newNodes.push(existingNode);
            }
          } else if (key === "reports") {
            const existingNode = baseGraphData.nodes.find(
              (node) => node.uuid === item.id.toString(),
            );
            if (existingNode) {
              newNodes.push(existingNode);
            }
          } else if (key === "sources") {
            const existingNode = baseGraphData.nodes.find(
              (node) => node.text?.toString() === item.text,
            );
            if (existingNode) {
              newNodes.push(existingNode);
            }
          } else if (key === "covariates" || key === "claims") {
            const existingNode = baseGraphData.nodes.find(
              (node) =>
                node.human_readable_id?.toString() === item.id.toString() &&
                node.covariate_type,
            );
            if (existingNode) {
              newNodes.push(existingNode);
            }
          }
        });
      }
    });

    // Update the graph data with the new nodes and links
    const updatedGraphData: CustomGraphData = sanitizeGraphData({
      nodes: [...newNodes],
      links: [...newLinks],
    });

    // Set the updated data to trigger re-render
    setSearchGraphData(updatedGraphData);
  };

  const fuse = useMemo(
    () =>
      new Fuse([...data.nodes, ...data.links], {
        keys: [
          "uuid",
          "id",
          "name",
          "type",
          "description",
          "source",
          "target",
          "title",
          "summary",
          "community_name",
          "source_file",
          "relation",
        ],
        threshold: 0.3,
      }),
    [data.nodes, data.links],
  );

  const hoverLinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
      }
    };
  }, []);

  const handleNodeHover = useCallback((node: CustomNode | null) => {
    if (hoverLinkTimeoutRef.current) {
      clearTimeout(hoverLinkTimeoutRef.current);
    }

    const newHighlightNodes = new Set<CustomNode>();
    const newHighlightLinks = new Set<CustomLink>();

    if (node) {
      newHighlightNodes.add(node);
      node.neighbors?.forEach((neighbor) => newHighlightNodes.add(neighbor));
      node.links?.forEach((link) => newHighlightLinks.add(link));
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    setHoverNode(node);
  }, []);

  const handleLinkHover = useCallback((link: CustomLink | null) => {
    if (hoverLinkTimeoutRef.current) {
      clearTimeout(hoverLinkTimeoutRef.current);
    }

    // Debounce link hover to prevent state churn when mouse crosses dense link clusters
    hoverLinkTimeoutRef.current = setTimeout(() => {
      const newHighlightNodes = new Set<CustomNode>();
      const newHighlightLinks = new Set<CustomLink>();

      if (link) {
        newHighlightLinks.add(link);
        const source = link.source as any;
        const target = link.target as any;
        if (typeof source !== "string" && source) newHighlightNodes.add(source);
        if (typeof target !== "string" && target) newHighlightNodes.add(target);
      }

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }, 40);
  }, []);

  const paintRing = useCallback(
    (node: CustomNode, ctx: CanvasRenderingContext2D) => {
      const radius = NODE_R * 1.4;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
      if (highlightNodes.has(node)) {
        ctx.fillStyle = node === hoverNode ? "red" : "orange";
        ctx.globalAlpha = 1; // full opacity
      } else {
        ctx.fillStyle = "gray";
        ctx.globalAlpha = 0.3; // reduced opacity for non-highlighted nodes
      }
      ctx.fill();
      ctx.globalAlpha = 1; // reset alpha for other drawings
    },
    [hoverNode, highlightNodes],
  );

  const handleSearch = () => {
    const results = fuse.search(searchTerm).map((result) => result.item);
    const nodeResults = results.filter((item) => "neighbors" in item);
    const linkResults = results.filter(
      (item) => "source" in item && "target" in item,
    );
    setSearchResults([...nodeResults, ...linkResults]);
    setRightDrawerOpen(true);
  };

  const toggleDrawer = (open: boolean) => () => {
    setRightDrawerOpen(open);
  };

  const handleFocusButtonClick = (node: CustomNode) => {
    const newHighlightNodes = new Set<CustomNode>();
    newHighlightNodes.add(node);
    node.neighbors?.forEach((neighbor) => newHighlightNodes.add(neighbor));
    node.links?.forEach((link) => highlightLinks.add(link));

    setHighlightNodes(newHighlightNodes);
    setHoverNode(node);

    if (graphRef.current) {
      if (graphType === "2d") {
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(8, 1000);
      } else {
        graphRef.current.cameraPosition(
          { x: node.x, y: node.y, z: 300 }, // new position
          { x: node.x, y: node.y, z: 0 }, // lookAt
          3000, // ms transition duration
        );
      }
    }

    // Simulate mouse hover on the focused node
    setTimeout(() => {
      handleNodeHover(node);
    }, 1000); // Adjust delay as needed

    setRightDrawerOpen(false);
  };

  const handleFocusLinkClick = (link: CustomLink) => {
    const newHighlightNodes = new Set<CustomNode>();
    const newHighlightLinks = new Set<CustomLink>();

    newHighlightLinks.add(link);
    let sourceNode: CustomNode | undefined;
    let targetNode: CustomNode | undefined;

    if (typeof link.source !== "string") {
      newHighlightNodes.add(link.source);
      sourceNode = link.source;
    }

    if (typeof link.target !== "string") {
      newHighlightNodes.add(link.target);
      targetNode = link.target;
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);

    if (
      graphRef.current &&
      sourceNode &&
      targetNode &&
      sourceNode.x &&
      targetNode.x &&
      sourceNode.y &&
      targetNode.y
    ) {
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      if (graphType === "2d") {
        graphRef.current.centerAt(midX, midY, 1000);
        graphRef.current.zoom(8, 1000);
      } else {
        graphRef.current.cameraPosition(
          { x: midX, y: midY, z: 300 }, // new position
          { x: midX, y: midY, z: 0 }, // lookAt
          3000, // ms transition duration
        );
      }
    }

    // Simulate mouse hover on the focused link
    setTimeout(() => {
      handleLinkHover(link);
    }, 1000); // Adjust delay as needed

    setRightDrawerOpen(false);
  };

  const handleNodeClick = (node: CustomNode) => {
    setSelectedRelationship(null);
    setSelectedNode(node);
    setLinkedNodes(node.neighbors || []);
    setLinkedRelationships(node.links || []);
    setBottomDrawerOpen(true);
  };

  const handleLinkClick = (link: CustomLink) => {
    setSelectedNode(null);
    setSelectedRelationship(link);
    const linkSource =
      typeof link.source === "object"
        ? (link.source as CustomNode).id
        : link.source;
    const linkTarget =
      typeof link.target === "object"
        ? (link.target as CustomNode).id
        : link.target;
    const sourceNode = data.nodes.find((node) => node.id === linkSource);
    const targetNode = data.nodes.find((node) => node.id === linkTarget);
    if (sourceNode && targetNode) {
      const linkedNodes = [sourceNode, targetNode];
      setLinkedNodes(linkedNodes);
      const linkedRelationships = [link];
      setLinkedRelationships(linkedRelationships);
      setBottomDrawerOpen(true);
    }
  };

  const getBackgroundColor = () =>
    theme.palette.mode === "dark" ? "#000000" : "#FFFFFF";

  const getLinkColor = (link: CustomLink) =>
    theme.palette.mode === "dark" ? "gray" : "lightgray";

  const get3DLinkColor = (link: CustomLink) =>
    theme.palette.mode === "dark" ? "lightgray" : "gray";

  const getlinkDirectionalParticleColor = (link: CustomLink) =>
    theme.palette.mode === "dark" ? "lightgray" : "gray";

  const renderNodeLabel = (node: CustomNode, ctx: CanvasRenderingContext2D) => {
    if (!showLabels) return; // Only render the label if showLabels is true

    const label = node.name || "";
    const fontSize = 4;
    const padding = 2;
    ctx.font = `${fontSize}px Sans-Serif`;

    // Set the styles based on the theme mode
    const backgroundColor =
      theme.palette.mode === "dark"
        ? "rgba(0, 0, 0, 0.6)"
        : "rgba(255, 255, 255, 0.6)";

    // Calculate label dimensions
    const anyNode = node as any;
    const textWidth =
      anyNode.__textWidth ?? (anyNode.__textWidth = ctx.measureText(label).width);
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding * 2;

    if (node.x && node.y) {
      // Draw the background rectangle with rounded corners
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.moveTo(node.x - boxWidth / 2 + 5, node.y - boxHeight / 2);
      ctx.lineTo(node.x + boxWidth / 2 - 5, node.y - boxHeight / 2);
      ctx.quadraticCurveTo(
        node.x + boxWidth / 2,
        node.y - boxHeight / 2,
        node.x + boxWidth / 2,
        node.y - boxHeight / 2 + 5,
      );
      ctx.lineTo(node.x + boxWidth / 2, node.y + boxHeight / 2 - 5);
      ctx.quadraticCurveTo(
        node.x + boxWidth / 2,
        node.y + boxHeight / 2,
        node.x + boxWidth / 2 - 5,
        node.y + boxHeight / 2,
      );
      ctx.lineTo(node.x - boxWidth / 2 + 5, node.y + boxHeight / 2);
      ctx.quadraticCurveTo(
        node.x - boxWidth / 2,
        node.y + boxHeight / 2,
        node.x - boxWidth / 2,
        node.y + boxHeight / 2 - 5,
      );
      ctx.lineTo(node.x - boxWidth / 2, node.y - boxHeight / 2 + 5);
      ctx.quadraticCurveTo(
        node.x - boxWidth / 2,
        node.y - boxHeight / 2,
        node.x - boxWidth / 2 + 5,
        node.y - boxHeight / 2,
      );
      ctx.closePath();
      ctx.fill();

      // Draw the text in the center of the node
      // ctx.fillStyle = textColor;
      ctx.fillStyle =
        node.color || (theme.palette.mode === "dark" ? "#ffffff" : "#222222");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, node.x, node.y);
    }
  };

  const nodeThreeObject = (node: CustomNode) => {
    if (!showLabels) {
      return new THREE.Object3D();
    }

    try {
      const nodeEl = document.createElement("div");
      nodeEl.textContent = node.name || node.id; // Use either name or id for the label
      nodeEl.style.color =
        node.color || (theme.palette.mode === "dark" ? "#ffffff" : "#222222");
      nodeEl.style.padding = "2px 4px";
      nodeEl.style.borderRadius = "4px";
      nodeEl.style.fontSize = "10px";
      nodeEl.className = "node-label";

      return new CSS2DObject(nodeEl);
    } catch (error) {
      console.error("Error creating 3D object:", error);
      return new THREE.Object3D(); // Fallback in case of error
    }
  };

  const localSearchEnabled = hasCovariates
    ? includeTextUnits && includeCommunities && includeCovariates
    : includeTextUnits && includeCommunities;

  return (
    <Box
      sx={{
        height: isFullscreen ? "100vh" : "calc(100vh - 64px)",
        width: isFullscreen ? "100vw" : "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: 0,
        left: 0,
        zIndex: isFullscreen ? 1300 : "auto",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        backgroundColor: getBackgroundColor(),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-end",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            onClick={toggleDrawer(true)}
            startIcon={<SearchIcon />}
          >
            Search Nodes/Links
          </Button>
          {/* <FormControlLabel
            control={
              <Switch
                checked={graphType === "3d"}
                onChange={onToggleGraphType}
              />
            }
            label="3D View"
          /> */}
          {/* <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
              />
            }
            label="Show Node Labels"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showLinkLabels}
                onChange={() => setShowLinkLabels(!showLinkLabels)}
              />
            }
            label="Show Relationship Labels"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showHighlight}
                onChange={() => setShowHighlight(!showHighlight)}
              />
            }
            label="Show Highlight"
          /> */}
          <Tooltip title={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
            <IconButton onClick={onToggleFullscreen} color="inherit">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={graphType === "3d"}
                onChange={onToggleGraphType}
              />
            }
            label="3D View"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
              />
            }
            label="Show Node Labels"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showLinkLabels}
                onChange={() => setShowLinkLabels(!showLinkLabels)}
              />
            }
            label="Show Link Labels"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showHighlight}
                onChange={() => setShowHighlight(!showHighlight)}
              />
            }
            label="Show Highlight"
          />
          {hasCommunityData && (
            <FormControlLabel
              control={
                <Switch
                  checked={colorByCommunity}
                  onChange={() => setColorByCommunity(!colorByCommunity)}
                />
              }
              label="Color by Community"
            />
          )}
        </Box>

        {(hasDocuments ||
          hasTextUnits ||
          hasCommunities ||
          hasCovariates) && (
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDocuments}
                    onChange={() => onIncludeDocumentsChange(!includeDocuments)}
                    disabled={!hasDocuments || apiSearchResults !== null}
                  />
                }
                label="Include Documents"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeTextUnits}
                    onChange={() => {
                      if (!includeTextUnits) {
                        onIncludeTextUnitsChange(true);
                      } else if (includeTextUnits && !includeCovariates) {
                        onIncludeTextUnitsChange(false);
                      } else {
                        onIncludeTextUnitsChange(false);
                        onIncludeCovariatesChange(false);
                      }
                    }}
                    disabled={!hasTextUnits || apiSearchResults !== null}
                  />
                }
                label="Include Text Units"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeCommunities}
                    onChange={() => onIncludeCommunitiesChange(!includeCommunities)}
                    disabled={!hasCommunities || apiSearchResults !== null}
                  />
                }
                label="Include Communities"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeCovariates}
                    onChange={() => {
                      if (!includeCovariates) {
                        if (!includeTextUnits) {
                          onIncludeTextUnitsChange(true);
                        }
                        onIncludeCovariatesChange(true);
                      } else {
                        onIncludeCovariatesChange(false);
                      }
                    }}
                    disabled={!hasCovariates || apiSearchResults !== null}
                  />
                }
                label="Include Covariates"
              />
            </FormGroup>
          )}

        {availableEntityTypes.length > 0 && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(30, 30, 30, 0.7)"
                  : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(6px)",
              borderRadius: "8px !important",
              border: "1px solid",
              borderColor: "divider",
              "&:before": { display: "none" },
              width: "100%",
              maxWidth: 220,
              mt: 1,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 1.5,
                minHeight: 36,
                "& .MuiAccordionSummary-content": { my: 0.5 },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Entity Types ({availableEntityTypes.length - hiddenTypes.size}/
                {availableEntityTypes.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: 1.5, pt: 0, pb: 1, maxHeight: 180, overflowY: "auto" }}
            >
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  sx={{ p: 0, minWidth: 0, fontSize: "0.75rem" }}
                  onClick={showAllTypes}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="text"
                  sx={{ p: 0, minWidth: 0, fontSize: "0.75rem" }}
                  onClick={hideAllTypes}
                >
                  Clear All
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {availableEntityTypes.map(({ type, count }) => {
                  const isHidden = hiddenTypes.has(type);
                  return (
                    <Chip
                      key={type}
                      label={`${type} (${count})`}
                      size="small"
                      clickable
                      color={isHidden ? "default" : "primary"}
                      variant={isHidden ? "outlined" : "filled"}
                      onClick={() => toggleType(type)}
                      sx={{ fontSize: "0.7rem", opacity: isHidden ? 0.6 : 1 }}
                    />
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {totalEntities > 0 && (
          <Box sx={{ width: 200, mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Max Entities: {maxEntities === 0 ? "All" : maxEntities}
              {totalEntities > 0 && ` / ${totalEntities}`}
            </Typography>
            <Slider
              value={sliderValue}
              onChange={(_, value) => {
                setIsSliderDragging(true);
                setDragSliderValue(value as number);
              }}
              onChangeCommitted={(_, value) => {
                setIsSliderDragging(false);
                setDragSliderValue(null);
                onMaxEntitiesChange(fromSliderValue(value as number));
              }}
              min={sliderMin}
              max={sliderMax}
              step={50}
              marks={[
                { value: sliderMin, label: String(sliderMin) },
                { value: sliderMax, label: "All" },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => (value >= sliderMax ? "All" : value)}
              disabled={apiSearchResults !== null}
            />
          </Box>
        )}
      </Box>

      <APISearchDrawer
        apiDrawerOpen={apiDrawerOpen}
        toggleDrawer={toggleApiDrawer}
        handleApiSearch={handleApiSearch}
        apiSearchResults={apiSearchResults}
        localSearchEnabled={localSearchEnabled}
        globalSearchEnabled={includeCommunities}
        hasCovariates={hasCovariates}
        serverUp={serverUp}
      />

      <SearchDrawer
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        searchResults={searchResults}
        rightDrawerOpen={rightDrawerOpen}
        toggleDrawer={toggleDrawer}
        handleFocusButtonClick={handleFocusButtonClick}
        handleNodeClick={handleNodeClick}
        handleFocusLinkClick={handleFocusLinkClick}
        handleLinkClick={handleLinkClick}
      />

      <DetailDrawer
        bottomDrawerOpen={bottomDrawerOpen}
        setBottomDrawerOpen={setBottomDrawerOpen}
        selectedNode={selectedNode}
        selectedRelationship={selectedRelationship}
        linkedNodes={linkedNodes}
        linkedRelationships={linkedRelationships}
      />

      {graphType === "2d" ? (
        <ForceGraph2D
          key={graphRenderKey}
          ref={graphRef}
          graphData={displayGraphData}
          nodeAutoColorBy={getNodeColorCategory}
          nodeRelSize={NODE_R}
          cooldownTicks={100}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkWidth={(link) =>
            showHighlight && highlightLinks.has(link) ? 5 : 1
          }
          linkDirectionalParticles={(link) =>
            showHighlight && highlightLinks.has(link) ? 4 : 0
          }
          linkDirectionalParticleWidth={4}
          linkDirectionalParticleColor={
            showHighlight ? getlinkDirectionalParticleColor : undefined
          }
          nodeCanvasObjectMode={(node) =>
            showHighlight && highlightNodes.has(node)
              ? "before"
              : showLabels
                ? "after"
                : undefined
          }
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (showHighlight && highlightNodes.has(node)) {
              paintRing(node as CustomNode, ctx);
            }
            if (
              showLabels &&
              (globalScale >= 1.2 ||
                (showHighlight && highlightNodes.has(node as CustomNode)))
            ) {
              renderNodeLabel(node as CustomNode, ctx);
            }
          }}
          linkCanvasObjectMode={() => (showLinkLabels ? "after" : undefined)}
          linkCanvasObject={(link, ctx, globalScale) => {
            if (
              showLinkLabels &&
              (globalScale >= 1.5 ||
                (showHighlight && highlightLinks.has(link as CustomLink)))
            ) {
              const label = (link as any).relation || link.type || "";
              const fontSize = 4;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle =
                theme.palette.mode === "dark" ? "lightgray" : "darkgray";
              const source =
                typeof link.source !== "string"
                  ? (link.source as CustomNode)
                  : null;
              const target =
                typeof link.target !== "string"
                  ? (link.target as CustomNode)
                  : null;

              if (
                source &&
                target &&
                source.x !== undefined &&
                target.x !== undefined &&
                source.y !== undefined &&
                target.y !== undefined
              ) {
                const anyLink = link as any;
                const textWidth =
                  anyLink.__textWidth ??
                  (anyLink.__textWidth = ctx.measureText(label).width);
                const posX = (source.x + target.x) / 2 - textWidth / 2;
                const posY = (source.y + target.y) / 2;
                ctx.fillText(label, posX, posY);
              }
            }
          }}
          onNodeHover={showHighlight ? handleNodeHover : undefined}
          onLinkHover={showHighlight ? handleLinkHover : undefined}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          backgroundColor={getBackgroundColor()}
          linkColor={getLinkColor}
        />
      ) : (
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
          <ForceGraph3D
            key={graphRenderKey}
            ref={graphRef}
            extraRenderers={extraRenderers}
            graphData={displayGraphData}
            nodeAutoColorBy={getNodeColorCategory}
            nodeRelSize={NODE_R}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkWidth={(link) =>
              showHighlight && highlightLinks.has(link as CustomLink) ? 5 : 1
            }
            linkDirectionalParticles={showHighlight ? 4 : 0}
            linkDirectionalParticleWidth={(link) =>
              showHighlight && highlightLinks.has(link as CustomLink) ? 4 : 0
            }
            nodeThreeObject={(node) => nodeThreeObject(node as CustomNode)}
            nodeThreeObjectExtend={true}
            onNodeHover={
              showHighlight
                ? (node) => handleNodeHover(node as CustomNode | null)
                : undefined
            }
            onLinkHover={
              showHighlight
                ? (link) => handleLinkHover(link as CustomLink | null)
                : undefined
            }
            onNodeClick={(node) => handleNodeClick(node as CustomNode)}
            onLinkClick={(link) => handleLinkClick(link as CustomLink)}
            backgroundColor={getBackgroundColor()}
            linkColor={(link) => get3DLinkColor(link as CustomLink)}
            linkThreeObjectExtend={true}
            linkThreeObject={(link) => {
              if (!showLinkLabels) return new THREE.Object3D();
              const sprite = new SpriteText(
                `${(link as CustomLink).relation || (link as CustomLink).type}`,
              );
              sprite.color = "lightgrey";
              sprite.textHeight = 1.5;
              return sprite;
            }}
            linkPositionUpdate={(sprite, { start, end }) => {
              if (!showLinkLabels) return;

              const middlePos = ["x", "y", "z"].reduce((acc, c) => {
                acc[c as keyof Coords] =
                  start[c as keyof Coords] +
                  (end[c as keyof Coords] - start[c as keyof Coords]) / 2;
                return acc;
              }, {} as Coords);

              // Position sprite
              Object.assign(sprite.position, middlePos);
            }}
          />
        </Suspense>
      )}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
        }}
      >
        <Chip
          label={dataSource === "graphify" ? "Graphify Code Graph" : "GraphRAG Graph"}
          size="small"
          color={dataSource === "graphify" ? "secondary" : "primary"}
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="body2">Nodes: {nodeCount}</Typography>
        <Typography variant="body2">Relationships: {linkCount}</Typography>
      </Box>
    </Box>
  );
};

export default GraphViewer;
