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
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Slider,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
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
  onToggleGraphType: () => void;
  includeDocuments: boolean;
  includeTextUnits: boolean;
  onIncludeDocumentsChange: (value: boolean) => void;
  onIncludeTextUnitsChange: (value: boolean) => void;
  includeCommunities: boolean;
  onIncludeCommunitiesChange: (value: boolean) => void;
  includeCovariates: boolean;
  onIncludeCovariatesChange: (value: boolean) => void;
  hasDocuments: boolean;
  hasTextUnits: boolean;
  hasCommunities: boolean;
  hasCovariates: boolean;
  maxEntities: number;
  onMaxEntitiesChange: (value: number) => void;
  totalEntities: number;
  dataSource?: "graphrag" | "graphify";
}

const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  graphType,
  isFullscreen,
  onToggleFullscreen,
  onToggleGraphType,
  includeDocuments,
  includeTextUnits,
  onIncludeDocumentsChange,
  onIncludeTextUnitsChange,
  includeCommunities,
  onIncludeCommunitiesChange,
  includeCovariates,
  onIncludeCovariatesChange,
  hasDocuments,
  hasTextUnits,
  hasCommunities,
  hasCovariates,
  maxEntities,
  onMaxEntitiesChange,
  totalEntities,
  dataSource = "graphrag",
}) => {
  const [showLabels, setShowLabels] = useState(false);
  const [showLinkLabels, setShowLinkLabels] = useState(false);
  const [showHighlight, setShowHighlight] = useState(true);
  const [colorByCommunity, setColorByCommunity] = useState<boolean>(() => {
    // Default to true for Graphify so modularity clusters are immediately visible
    return dataSource === "graphify";
  });
  const [highlightNodes, setHighlightNodes] = useState(new Set<CustomNode>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<CustomLink>());
  const [hoverNode, setHoverNode] = useState<CustomNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<SearchResult | null>(
    null,
  );
  const [searchGraphData, setSearchGraphData] =
    useState<CustomGraphData | null>(null);
  const [serverUp, setServerUp] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<CustomLink | null>(null);
  const [linkedNodes, setLinkedNodes] = useState<CustomNode[]>([]);
  const [linkedRelationships, setLinkedRelationships] = useState<CustomLink[]>(
    [],
  );
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [dragSliderValue, setDragSliderValue] = useState<number | null>(null);
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  // Responsive mobile controls state
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [desktopControlsOpen, setDesktopControlsOpen] = useState(true);

  const graphRef = useRef<any>();
  const initialGraphData = useRef<CustomGraphData>(data);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const NODE_R = 4;

  const sliderMin = 50;
  const sliderMax = totalEntities > 50 ? Math.min(totalEntities, 2000) : 50;

  // Convert maxEntities prop to slider position (0 means "All" -> sliderMax)
  const toSliderValue = (val: number): number => {
    if (val === 0 || val >= sliderMax) return sliderMax;
    return Math.max(sliderMin, Math.min(val, sliderMax));
  };

  // Convert slider position back to maxEntities (sliderMax means "All" -> 0)
  const fromSliderValue = (val: number): number => {
    if (val >= sliderMax) return 0;
    return val;
  };

  // While dragging use local state for responsiveness, otherwise sync with prop
  const sliderValue = isSliderDragging
    ? dragSliderValue ?? toSliderValue(maxEntities)
    : toSliderValue(maxEntities);

  const hasCommunityData = useMemo(() => {
    return data.nodes.some(
      (n) => n.community !== undefined && n.community !== null,
    );
  }, [data.nodes]);

  // Color palette for communities
  const communityColors = useMemo(() => {
    return [
      "#6366f1", // indigo
      "#ec4899", // pink
      "#10b981", // emerald
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#06b6d4", // cyan
      "#f97316", // orange
      "#14b8a6", // teal
      "#e11d48", // rose
      "#84cc16", // lime
      "#3b82f6", // blue
      "#a855f7", // violet
    ];
  }, []);

  const getNodeColorCategory = useCallback(
    (node: any): string => {
      if (colorByCommunity && node.community !== undefined && node.community !== null) {
        const commIndex =
          typeof node.community === "number"
            ? Math.abs(node.community)
            : Math.abs(
                String(node.community)
                  .split("")
                  .reduce((acc, c) => acc + c.charCodeAt(0), 0),
              );
        return communityColors[commIndex % communityColors.length];
      }
      return node.type || "ENTITY";
    },
    [colorByCommunity, communityColors],
  );

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
      const searchData: SearchResult =
        searchType === "local"
          ? await agent.Search.local(query)
          : await agent.Search.global(query);

      setApiSearchResults(searchData);
      updateGraphData(searchData.context_data);
    } catch (err) {
      console.error("An error occurred during the API search.", err);
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

    Object.entries(contextData).forEach(([key, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (key === "relationships") {
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

    const updatedGraphData: CustomGraphData = sanitizeGraphData({
      nodes: [...newNodes],
      links: [...newLinks],
    });

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
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "gray";
        ctx.globalAlpha = 0.3;
      }
      ctx.fill();
      ctx.globalAlpha = 1;
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
          { x: node.x, y: node.y, z: 300 },
          { x: node.x, y: node.y, z: 0 },
          3000,
        );
      }
    }
  };

  const handleFocusLinkClick = (link: CustomLink) => {
    const newHighlightNodes = new Set<CustomNode>();
    const newHighlightLinks = new Set<CustomLink>();

    newHighlightLinks.add(link);
    const sourceNode = link.source as unknown as CustomNode;
    const targetNode = link.target as unknown as CustomNode;

    if (sourceNode && typeof sourceNode !== "string") {
      newHighlightNodes.add(sourceNode);
    }
    if (targetNode && typeof targetNode !== "string") {
      newHighlightNodes.add(targetNode);
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);

    if (graphRef.current && sourceNode && targetNode) {
      const midX = (sourceNode.x! + targetNode.x!) / 2;
      const midY = (sourceNode.y! + targetNode.y!) / 2;

      if (graphType === "2d") {
        graphRef.current.centerAt(midX, midY, 1000);
        graphRef.current.zoom(8, 1000);
      } else {
        const midZ = (sourceNode.z! + targetNode.z!) / 2;
        graphRef.current.cameraPosition(
          { x: midX, y: midY, z: midZ + 300 },
          { x: midX, y: midY, z: midZ },
          3000,
        );
      }
    }
  };

  const handleNodeClick = (node: CustomNode) => {
    setSelectedNode(node);
    setSelectedRelationship(null);
    setLinkedNodes(node.neighbors || []);
    setLinkedRelationships(node.links || []);
    setBottomDrawerOpen(true);
  };

  const handleLinkClick = (link: CustomLink) => {
    setSelectedRelationship(link);
    setSelectedNode(null);
    const sourceNode = link.source as unknown as CustomNode;
    const targetNode = link.target as unknown as CustomNode;
    setLinkedNodes([sourceNode, targetNode].filter(Boolean));
    setLinkedRelationships([]);
    setBottomDrawerOpen(true);
  };

  const nodeCount = data.nodes.length;
  const linkCount = data.links.length;

  const getBackgroundColor = () => {
    return theme.palette.mode === "dark" ? "#0a0a0f" : "#f8f9fa";
  };

  const extraRenderers = useMemo(() => {
    if (graphType === "3d" && showLabels) {
      return [new CSS2DRenderer() as unknown as Renderer];
    }
    return [];
  }, [graphType, showLabels]);

  const nodeThreeObject = (node: any) => {
    if (!showLabels) return new THREE.Object3D();
    try {
      const nodeEl = document.createElement("div");
      nodeEl.textContent = node.name || node.id;
      nodeEl.style.color =
        node.color || (theme.palette.mode === "dark" ? "#ffffff" : "#222222");
      nodeEl.style.padding = "2px 4px";
      nodeEl.style.borderRadius = "4px";
      nodeEl.style.fontSize = "10px";
      nodeEl.className = "node-label";

      return new CSS2DObject(nodeEl);
    } catch (error) {
      console.error("Error creating 3D object:", error);
      return new THREE.Object3D();
    }
  };

  const localSearchEnabled = hasCovariates
    ? includeTextUnits && includeCommunities && includeCovariates
    : includeTextUnits && includeCommunities;

  // Active filter count for badge indicator
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (graphType === "3d") count += 1;
    if (showLabels) count += 1;
    if (showLinkLabels) count += 1;
    if (!showHighlight) count += 1;
    if (colorByCommunity) count += 1;
    if (includeDocuments) count += 1;
    if (includeTextUnits) count += 1;
    if (includeCommunities) count += 1;
    if (includeCovariates) count += 1;
    if (hiddenTypes.size > 0) count += 1;
    if (maxEntities !== 500 && maxEntities !== 0) count += 1;
    return count;
  }, [
    graphType,
    showLabels,
    showLinkLabels,
    showHighlight,
    colorByCommunity,
    includeDocuments,
    includeTextUnits,
    includeCommunities,
    includeCovariates,
    hiddenTypes.size,
    maxEntities,
  ]);

  // Reusable controls content for both Desktop Panel and Mobile Drawer
  const renderControlsContent = (inDrawer: boolean = false) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: inDrawer ? 2.5 : 1.75 }}>
      {/* Section 1: Display & View */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "text.secondary",
            display: "block",
            mb: 0.75,
            fontSize: "0.68rem",
          }}
        >
          View & Physics
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={graphType === "3d"}
                onChange={onToggleGraphType}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                3D View
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                Show Node Labels
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showLinkLabels}
                onChange={() => setShowLinkLabels(!showLinkLabels)}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                Show Link Labels
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showHighlight}
                onChange={() => setShowHighlight(!showHighlight)}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                Highlight on Hover
              </Typography>
            }
          />
          {hasCommunityData && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={colorByCommunity}
                  onChange={() => setColorByCommunity(!colorByCommunity)}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                  Color by Community
                </Typography>
              }
            />
          )}
        </Box>
      </Box>

      {/* Section 2: Data Layers (GraphRAG / Graphify) */}
      {(hasDocuments || hasTextUnits || hasCommunities || hasCovariates) && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "text.secondary",
              display: "block",
              mb: 0.75,
              fontSize: "0.68rem",
            }}
          >
            Data Layers
          </Typography>
          <FormGroup sx={{ gap: 0.25 }}>
            {hasDocuments && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={includeDocuments}
                    onChange={() => onIncludeDocumentsChange(!includeDocuments)}
                    disabled={!hasDocuments || apiSearchResults !== null}
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Include Documents</Typography>}
              />
            )}
            {hasTextUnits && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
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
                label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Include Text Units</Typography>}
              />
            )}
            {hasCommunities && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={includeCommunities}
                    onChange={() => onIncludeCommunitiesChange(!includeCommunities)}
                    disabled={!hasCommunities || apiSearchResults !== null}
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Include Communities</Typography>}
              />
            )}
            {hasCovariates && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
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
                label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Include Covariates</Typography>}
              />
            )}
          </FormGroup>
        </Box>
      )}

      {/* Section 3: Entity Types */}
      {availableEntityTypes.length > 0 && (
        <Box>
          <Accordion
            disableGutters
            elevation={0}
            defaultExpanded={inDrawer}
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
              borderRadius: "8px !important",
              border: `1px solid ${theme.palette.divider}`,
              "&:before": { display: "none" },
              width: "100%",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                px: 1.25,
                minHeight: 34,
                "& .MuiAccordionSummary-content": { my: 0.5 },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                Entity Types ({availableEntityTypes.length - hiddenTypes.size}/
                {availableEntityTypes.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: 1.25, pt: 0, pb: 1, maxHeight: 160, overflowY: "auto" }}
            >
              <Box sx={{ display: "flex", gap: 1, mb: 0.75 }}>
                <Button
                  size="small"
                  variant="text"
                  sx={{ p: 0, minWidth: 0, fontSize: "0.72rem", textTransform: "none" }}
                  onClick={showAllTypes}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="text"
                  sx={{ p: 0, minWidth: 0, fontSize: "0.72rem", textTransform: "none" }}
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
                      sx={{
                        fontSize: "0.68rem",
                        height: 22,
                        opacity: isHidden ? 0.5 : 1,
                      }}
                    />
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Section 4: Max Entities */}
      {totalEntities > 0 && (
        <Box sx={{ width: "100%", pt: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}>
            Max Entities: {maxEntities === 0 ? "All" : maxEntities}
            {totalEntities > 0 && ` / ${totalEntities}`}
          </Typography>
          <Slider
            size="small"
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
  );

  return (
    <Box
      sx={{
        height: isFullscreen ? "100vh" : "100%",
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
      {/* Top Left Glass Badge */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 12 },
          left: { xs: 8, sm: 12 },
          zIndex: 1400,
          pointerEvents: "none",
        }}
      >
        <Paper
          elevation={2}
          sx={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1 },
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.4, sm: 0.5 },
            borderRadius: "20px",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(18, 18, 24, 0.85)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Chip
            label={dataSource === "graphify" ? "⚡ Graphify" : "🌐 GraphRAG"}
            size="small"
            color={dataSource === "graphify" ? "secondary" : "primary"}
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.68rem", sm: "0.75rem" },
              height: { xs: 20, sm: 22 },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              fontSize: { xs: "0.68rem", sm: "0.75rem" },
              whiteSpace: "nowrap",
            }}
          >
            {nodeCount} nodes · {linkCount} rels
          </Typography>
        </Paper>
      </Box>

      {/* Top Right Controls & Actions */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 12 },
          right: { xs: 8, sm: 12 },
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {/* Action Bar */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.6, sm: 1 },
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          {/* Search Button */}
          {isMobile ? (
            <Tooltip title="Search Nodes & Relationships">
              <IconButton
                size="small"
                onClick={toggleDrawer(true)}
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(18, 18, 24, 0.85)"
                      : "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  p: 0.75,
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={toggleDrawer(true)}
              startIcon={<SearchIcon />}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 600,
                px: 1.75,
                py: 0.45,
                fontSize: "0.8rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              Search
            </Button>
          )}

          {/* Controls Trigger */}
          {isMobile ? (
            <Badge
              color="secondary"
              badgeContent={activeFilterCount}
              invisible={activeFilterCount === 0}
            >
              <Button
                variant="contained"
                size="small"
                onClick={() => setMobileControlsOpen(true)}
                startIcon={<TuneIcon sx={{ fontSize: "16px !important" }} />}
                sx={{
                  borderRadius: "20px",
                  px: 1.25,
                  py: 0.45,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "none",
                  backgroundColor:
                    dataSource === "graphify" ? "#a855f7" : "#0284c7",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor:
                      dataSource === "graphify" ? "#9333ea" : "#0369a1",
                  },
                }}
              >
                Controls
              </Button>
            </Badge>
          ) : (
            <Tooltip
              title={
                desktopControlsOpen ? "Hide Controls Panel" : "Show Controls Panel"
              }
            >
              <IconButton
                size="small"
                onClick={() => setDesktopControlsOpen(!desktopControlsOpen)}
                color={desktopControlsOpen ? "primary" : "default"}
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(18, 18, 24, 0.85)"
                      : "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  p: 0.75,
                }}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Fullscreen Button */}
          <Tooltip title={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
            <IconButton
              size="small"
              onClick={onToggleFullscreen}
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(18, 18, 24, 0.85)"
                    : "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                p: 0.75,
              }}
            >
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Desktop Collapsible Floating Card */}
        {!isMobile && desktopControlsOpen && (
          <Paper
            elevation={4}
            sx={{
              pointerEvents: "auto",
              p: 2,
              width: 250,
              maxHeight: "calc(100vh - 130px)",
              overflowY: "auto",
              borderRadius: 3,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(18, 18, 24, 0.88)"
                  : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(14px)",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
            }}
          >
            {renderControlsContent(false)}
          </Paper>
        )}
      </Box>

      {/* Mobile Controls Drawer (Bottom Sheet) */}
      <Drawer
        anchor="bottom"
        open={isMobile && mobileControlsOpen}
        onClose={() => setMobileControlsOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "82vh",
            backgroundColor:
              theme.palette.mode === "dark" ? "#14141e" : "#ffffff",
            backgroundImage: "none",
            p: 2.5,
            pt: 1.5,
            display: "flex",
            flexDirection: "column",
          },
        }}
        sx={{ zIndex: 1600 }}
      >
        {/* Pull Handle */}
        <Box
          sx={{
            width: 38,
            height: 4,
            borderRadius: 2,
            bgcolor: "text.disabled",
            mx: "auto",
            mb: 1.5,
            opacity: 0.4,
          }}
        />

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Graph Controls & Filters
            </Typography>
            <Chip
              label={dataSource === "graphify" ? "Graphify" : "GraphRAG"}
              size="small"
              color={dataSource === "graphify" ? "secondary" : "primary"}
              sx={{ fontWeight: 600, fontSize: "0.68rem", height: 20 }}
            />
          </Box>
          <IconButton
            size="small"
            onClick={() => setMobileControlsOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Scrollable Content */}
        <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5, pb: 2 }}>
          {renderControlsContent(true)}
        </Box>

        {/* Bottom Done Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => setMobileControlsOpen(false)}
          sx={{
            mt: 1,
            py: 1.1,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "none",
            backgroundColor: dataSource === "graphify" ? "#a855f7" : "#0284c7",
            "&:hover": {
              backgroundColor:
                dataSource === "graphify" ? "#9333ea" : "#0369a1",
            },
          }}
        >
          Apply & View Graph
        </Button>
      </Drawer>

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
          linkCurvature={0.25}
          autoPauseRedraw={false}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(link, ctx) => {
            if (!showLinkLabels) return;
            const source = link.source as any;
            const target = link.target as any;
            if (typeof source !== "object" || typeof target !== "object") return;

            const label =
              link.description ||
              link.title ||
              link.relation ||
              link.human_readable_id ||
              "";
            if (!label) return;

            const fontSize = 10;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2,
            );

            const x = (source.x + target.x) / 2;
            const y = (source.y + target.y) / 2;

            ctx.fillStyle =
              theme.palette.mode === "dark"
                ? "rgba(10, 10, 15, 0.85)"
                : "rgba(255, 255, 255, 0.85)";
            ctx.fillRect(
              x - bckgDimensions[0] / 2,
              y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1],
            );

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle =
              theme.palette.mode === "dark" ? "#cbd5e1" : "#475569";
            ctx.fillText(label, x, y);
          }}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name || node.title || node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2,
            );

            if (showHighlight && (hoverNode === node || highlightNodes.has(node))) {
              paintRing(node, ctx);
            }

            if (showLabels) {
              ctx.fillStyle =
                theme.palette.mode === "dark"
                  ? "rgba(10, 10, 15, 0.8)"
                  : "rgba(255, 255, 255, 0.8)";
              ctx.fillRect(
                node.x! - bckgDimensions[0] / 2,
                node.y! - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1],
              );

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle =
                theme.palette.mode === "dark" ? "#f1f5f9" : "#0f172a";
              ctx.fillText(label, node.x!, node.y!);
            }
          }}
          nodeLabel={(node) => `
            <div style="background: ${
              theme.palette.mode === "dark" ? "#1e1e24" : "#ffffff"
            }; color: ${
            theme.palette.mode === "dark" ? "#ffffff" : "#000000"
          }; padding: 6px 10px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-size: 12px; max-width: 280px; word-break: break-word;">
              <strong>${node.name || node.title || node.id}</strong><br/>
              <span style="opacity: 0.75;">Type: ${node.type || "ENTITY"}</span>
              ${
                node.community_name || node.community !== undefined
                  ? `<br/><span style="opacity: 0.75;">Community: ${
                      node.community_name || node.community
                    }</span>`
                  : ""
              }
              ${
                node.source_file
                  ? `<br/><span style="opacity: 0.75; font-size: 10px;">File: ${node.source_file}</span>`
                  : ""
              }
              ${
                node.description
                  ? `<br/><span style="opacity: 0.85; margin-top: 4px; display: inline-block;">${
                      node.description.length > 120
                        ? node.description.slice(0, 120) + "..."
                        : node.description
                    }</span>`
                  : ""
              }
            </div>
          `}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          linkWidth={(link: CustomLink) => (highlightLinks.has(link) ? 3 : 1)}
          linkColor={(link: CustomLink) => {
            if (highlightLinks.has(link)) {
              return "red";
            }
            return theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.2)";
          }}
          linkDirectionalParticles={(link: CustomLink) =>
            highlightLinks.has(link) ? 4 : 0
          }
          linkDirectionalParticleWidth={4}
          linkDirectionalParticleSpeed={0.006}
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
            ref={graphRef}
            graphData={displayGraphData}
            nodeAutoColorBy={getNodeColorCategory}
            nodeRelSize={NODE_R}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            onNodeClick={(node: any) => handleNodeClick(node as CustomNode)}
            onLinkClick={(link: any) => handleLinkClick(link as CustomLink)}
            onNodeHover={(node: any) => handleNodeHover(node as CustomNode | null)}
            onLinkHover={(link: any) => handleLinkHover(link as CustomLink | null)}
            extraRenderers={extraRenderers}
            nodeThreeObject={nodeThreeObject}
            nodeThreeObjectExtend={true}
            nodeLabel={(node: any) => `
              <div style="background: ${
                theme.palette.mode === "dark" ? "#1e1e24" : "#ffffff"
              }; color: ${
              theme.palette.mode === "dark" ? "#ffffff" : "#000000"
            }; padding: 6px 10px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-size: 12px; max-width: 280px; word-break: break-word;">
                <strong>${node.name || node.title || node.id}</strong><br/>
                <span style="opacity: 0.75;">Type: ${node.type || "ENTITY"}</span>
                ${
                  node.community_name || node.community !== undefined
                    ? `<br/><span style="opacity: 0.75;">Community: ${
                        node.community_name || node.community
                      }</span>`
                    : ""
                }
              </div>
            `}
            linkWidth={(link: any) => (highlightLinks.has(link as CustomLink) ? 3 : 1)}
            linkColor={(link: any) => {
              if (highlightLinks.has(link as CustomLink)) {
                return "red";
              }
              return theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)";
            }}
            linkDirectionalParticles={(link: any) =>
              highlightLinks.has(link as CustomLink) ? 4 : 0
            }
            linkDirectionalParticleWidth={4}
            linkDirectionalParticleSpeed={0.006}
            linkThreeObjectExtend={true}
            linkThreeObject={(link: any) => {
              if (!showLinkLabels) return new THREE.Object3D();
              const sprite = new SpriteText(
                link.description ||
                  link.title ||
                  link.relation ||
                  link.human_readable_id ||
                  "",
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

              Object.assign(sprite.position, middlePos);
            }}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default GraphViewer;
