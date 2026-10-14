/**
 * Sample dataset file paths for GraphLens demo loading.
 * Files are served from the public/sample-data directory.
 */

export const getGraphifySampleFiles = (): string[] => {
  const publicUrl = process.env.PUBLIC_URL || "";
  return [
    `${publicUrl}/sample-data/graphify/graph.json`,
    `${publicUrl}/sample-data/graphify/manifest.json`,
  ];
};

export const getGraphRAGSampleFiles = (): string[] => {
  const publicUrl = process.env.PUBLIC_URL || "";
  return [
    `${publicUrl}/sample-data/graphrag/entities.parquet`,
    `${publicUrl}/sample-data/graphrag/relationships.parquet`,
    `${publicUrl}/sample-data/graphrag/documents.parquet`,
    `${publicUrl}/sample-data/graphrag/text_units.parquet`,
    `${publicUrl}/sample-data/graphrag/communities.parquet`,
    `${publicUrl}/sample-data/graphrag/community_reports.parquet`,
  ];
};
