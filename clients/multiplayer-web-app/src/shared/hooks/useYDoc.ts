import { Doc } from "yjs";
import { useMemo } from "react";
import { EntityType } from "@multiplayer/types";
import { EntityConverter, Templates } from "@multiplayer/entity";

export const useYDoc = <T = null>(
  entityType: EntityType,
  doc?: Doc,
  initialData?: T
) => {
  return useMemo(() => {
    if (doc) return doc;
    const yDoc = convertDataToDoc(entityType, initialData);
    return yDoc;
  }, [doc, initialData]);
};

export const convertDataToDoc = <T = null>(
  entityType: EntityType,
  initialData: T
) => {
  const staticContent = initialData || Templates[entityType].empty();
  const yDoc = EntityConverter.convertDataToYDoc(entityType, staticContent);
  return yDoc;
};

export const convertDocToData = (entityType: EntityType, doc: Doc) => {
  const data = EntityConverter.convertYDocToData(entityType, doc);
  return data;
};
