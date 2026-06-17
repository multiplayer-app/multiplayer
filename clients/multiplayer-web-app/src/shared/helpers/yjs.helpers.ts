import { clone } from "shared/utils";
import * as Y from "yjs";

export function convertObjectToYMap<T>(object: any, doc?: Y.Doc): Y.Map<T> {
  const objY = doc ? doc.getMap<T>() : new Y.Map<T>();
  Object.keys(clone(object)).forEach((key) => {
    objY.set(key, object[key]);
  });
  return objY;
}

export function convertObjectsArrayToYMap(
  objects: Array<{ id: string; [key: string]: any }>
) {
  return objects.reduce((acc, obj) => {
    const objY = convertObjectToYMap(obj);
    acc.set(obj.id, objY);
    return acc;
  }, new Y.Map<unknown>());
}
