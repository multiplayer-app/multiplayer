import MOCK from 'mock/schemas.json';
import { toCapitalize } from 'shared/utils';

let timeout;

export const updateData = (tabId, data) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const localCache = localStorage.getItem('schema__nodes');
    const cacheData = localCache ? JSON.parse(localCache) : {};
    localStorage.setItem(
      'schema__nodes',
      JSON.stringify({ ...cacheData, [tabId]: data })
    );
  }, 100);
};

export const getData = (tabId) => {
  const localCache = localStorage.getItem('schema__nodes');
  const cacheData = localCache ? JSON.parse(localCache) : {};

  if (cacheData[tabId]) {
    return cacheData[tabId];
  }

  const { definitions, tags } = MOCK;
  const targets = {};
  const edges = [];
  const nodes = [];
  const groups = {};

  tags.forEach((t) => {
    const key = toCapitalize(t.name);
    if (!definitions[key]) return;
    groups[key] = getRefs(key, definitions);
  });

  const addEdge = (source, target, parent) => {
    targets[target] = targets[parent] ? targets[parent] + 1 : 1;
    edges.push({
      id: `${source}_${target}`,
      source: { id: source, x: 0, y: 0 },
      target: { id: target, x: 0, y: 0 },
    });
  };

  const addNodes = (obj, iteration) => {
    Object.keys(obj).forEach((key, i) => {
      const node = obj[key];

      nodes.push({
        id: key,
        type: 'schemaNode',
        position: { x: iteration, y: i },
        data: { name: key, fields: getProps(node, key, addEdge) },
      });

      if (node.refs) {
        addNodes(node.refs, iteration + 1);
      }
    });
  };

  addNodes(groups, 0);

  return { nodes, edges };
};

function parseRef(str) {
  return str?.split('/').pop();
}

function getRefs(key, defs) {
  const obj = defs[key];
  obj.refs = {};

  if (obj.allOf?.length && obj.allOf[0].$ref) {
    const ref = parseRef(obj.allOf[0].$ref);
    if (defs[ref]) {
      obj.allOf = ref;
      obj.refs[ref] = getRefs(ref, defs);
    }
  }

  if (obj.properties) {
    Object.keys(obj.properties).forEach((prop) => {
      const ref = parseRef(obj.properties[prop].$ref);
      if (defs[ref]) {
        obj.refs[ref] = getRefs(ref, defs);
        obj.properties[prop].type = ref;
      }
    });
  }

  if (obj.items && obj.items.$ref) {
    const ref = parseRef(obj.items.$ref);
    if (defs[ref]) {
      obj.refs[ref] = getRefs(ref, defs);
      obj.items = ref;
    }
  }

  return obj;
}

function getProps(obj, key, addEdge) {
  const { properties, allOf, refs, type, items } = obj;

  if (allOf) {
    addEdge(key, allOf, key);
  }
  if (type === 'array') {
    const id = `${key}_items`;
    if (refs[items]) {
      addEdge(id, items, key);
    }

    return [{ id, name: 'items', type: refs[items] ? items : 'array' }];
  }

  if (!properties) {
    return [];
  }

  return Object.keys(properties).map((name) => {
    const val = properties[name];
    const id = `${key}_${name}`;
    const ref = refs[val.type];
    let type = val.type;
    if (ref) {
      addEdge(id, val.type, key);
    }
    return { id, type, name };
  });
}
