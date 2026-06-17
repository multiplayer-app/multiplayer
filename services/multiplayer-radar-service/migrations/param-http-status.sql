ALTER TABLE radar.detection_params ADD COLUMN httpStatus_new Int32;
ALTER TABLE radar.detection_params UPDATE httpStatus_new = toInt32(arrayElement(splitByChar(':', id), -3)) WHERE 1;
ALTER TABLE radar.detection_params DROP COLUMN httpStatus;
ALTER TABLE radar.detection_params RENAME COLUMN httpStatus_new TO httpStatus;

-- ALTER TABLE radar.detections ADD INDEX idx_workspace_id_project_id (workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1
-- ALTER TABLE radar.detections ADD INDEX idx_workspace_id_project_id_type (workspaceId, projectId, type) TYPE bloom_filter(0.001) GRANULARITY 1
ALTER TABLE radar.detections ADD INDEX idx_id_workspace_id_project_id (id, workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1;
ALTER TABLE radar.detections ADD INDEX idx_collapse_id_workspace_id_project_id (collapse_id, workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1;