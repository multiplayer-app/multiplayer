ALTER TABLE radar.detections ADD COLUMN tags_new Array(Tuple(String, String));

ALTER TABLE radar.detections UPDATE tags_new = arrayZip(tags.key, tags.value) WHERE 1;

ALTER TABLE radar.detections DROP COLUMN tags.key;
ALTER TABLE radar.detections DROP COLUMN tags.value;

ALTER TABLE radar.detections RENAME COLUMN tags_new TO tags;