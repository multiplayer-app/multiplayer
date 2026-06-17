import LZString from "lz-string";
import { SortingDirection, SubscriptionType } from "./models/enums";
import slugify from "../integrations/slugify";
import { CollectionTarget } from "shared/models/enums";
import { EndUserType } from "@multiplayer/types";

export function getMap(arr: any[], key: string = "id"): Map<string, any> {
  return new Map(arr.map((item: any) => [item[key] as string, item]));
}

export function getObject(arr: any[], key: string = "id"): Record<string, any> {
  return clone(arr).reduce((acc: Record<string, any>, item: any) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

export function clone(jsonObj: any): any {
  return JSON.parse(JSON.stringify(jsonObj));
}

export function toCapitalize(str: string, separator: string = "-"): string {
  const arr = str.split(separator);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }
  return arr.join("");
}

export function wasSelectionGroupKeyUsed(
  event: MouseEvent | React.PointerEvent
): boolean {
  const isUsingWindows = navigator.platform.indexOf("Win") >= 0;
  return isUsingWindows ? event.ctrlKey : event.metaKey;
}

export function queryToObject(query: string): Record<string, any> {
  const parameters = new URLSearchParams(query);
  return Object.fromEntries(parameters.entries());
}

export function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;

  const isScrollable = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return (
      /(auto|scroll)/.test(style.overflow + style.overflowX) ||
      element.scrollHeight > element.clientHeight
    );
  };

  if (isScrollable(node)) {
    return node;
  }

  return getScrollParent(node.parentElement);
}

export const fileToBlob = async (file) =>
  new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  const suffixes = {
    1: "st",
    2: "nd",
    3: "rd",
    11: "th",
    12: "th",
    default: "th",
  };

  const suffix = suffixes[day] || suffixes[day % 10] || suffixes.default;

  return `${day}${suffix} of ${month} ${year}`;
};

export const debounce = (func, delay) => {
  let inDebounce;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};

export const findUniqueAndConflictedItems = (array1, array2) => {
  const uniqueItems = [...new Set([...array1, ...array2])];
  const conflictedItems = array1.filter((id) => array2.includes(id));

  return {
    uniqueItems,
    conflictedItems,
  };
};

export const getNestedProperty = <T>(
  obj: any,
  keys: string | string[],
  defaultValue: T = undefined
): T => {
  keys = Array.isArray(keys) ? keys : keys.split(".");
  for (let i = 0; i < keys.length; i++) {
    if (!obj || typeof obj !== "object") {
      return defaultValue;
    }
    obj = obj[keys[i]];
  }
  return obj !== undefined ? obj : defaultValue;
};

export const setNestedProperty = (
  obj: any,
  keys: string | string[],
  value: any
): void => {
  keys = Array.isArray(keys) ? keys : keys.split(".");
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!obj[key] || typeof obj[key] !== "object") {
      obj[key] = {};
    }
    obj = obj[key];
  }
  obj[keys[keys.length - 1]] = value;
};

export const isObjectEmpty = (obj) => {
  return !obj || Object.keys(obj).length === 0;
};

export const groupBy = <T>(arr: T[], key: string): Record<string, T[]> => {
  return arr.reduce((acc, item) => {
    if (!acc[item[key]]) {
      acc[item[key]] = [];
    }
    acc[item[key]].push(item);
    return acc;
  }, {});
};

export const toCamelCase = (str: string, separator: string): string => {
  const regex = new RegExp(`${separator}([a-zA-Z])`, "g");
  return str.replace(regex, (match, p1) => p1.toUpperCase());
};
export const isObject = (obj) => {
  return obj && typeof obj === "object" && !Array.isArray(obj);
};

export const deepAssign = (target: any, source: any): any => {
  const result = Array.isArray(target) ? [] : {};

  for (const key in target) {
    if (target.hasOwnProperty(key)) {
      result[key] = target[key];
    }
  }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !(result[key] && typeof result[key] === "object")
      ) {
        result[key] = Array.isArray(source[key]) ? [] : {};
      }

      if (result[key] && typeof result[key] === "object") {
        result[key] = deepAssign(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
};

export const containsKeyValue = (obj, key, value) => {
  if (obj[key] === value) {
    return true;
  }
  for (let k in obj) {
    if (obj.hasOwnProperty(k)) {
      const item = obj[k];
      if (typeof item === "object" && item !== null) {
        if (containsKeyValue(item, key, value)) {
          return true;
        }
      }
      if (Array.isArray(item)) {
        for (let i = 0; i < item.length; i++) {
          if (
            typeof item[i] === "object" &&
            containsKeyValue(item[i], key, value)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

export function isTextSelected() {
  const selection = window.getSelection();
  return selection && selection.toString().length > 0;
}

export function isMac() {
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function isTouch() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

export const throttle = (() => {
  let timeout = undefined;
  return (callback, duration = 20) => {
    if (timeout === undefined) {
      callback();
      timeout = setTimeout(() => {
        timeout = undefined;
      }, duration);
    }
  };
})();

export function getDuration(
  startDate: string,
  endDate: string = new Date().toISOString()
) {
  const duration = new Date(endDate).getTime() - new Date(startDate).getTime();

  const minutes = Math.floor(duration / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);

  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

export function getReporterName(
  session: {
    userAttributes?: { userName?: string; name?: string };
    sessionAttributes?: { userName?: string; accountName?: string };
  },
  fallback = "Unknown User"
) {
  return (
    session?.userAttributes?.userName ||
    session?.userAttributes?.name ||
    session?.sessionAttributes?.userName ||
    session?.sessionAttributes?.accountName ||
    fallback
  );
}

export function getLastNumberFromName(
  objects: any[],
  prefix: string = "View "
): string {
  let lastNumber = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`);

  objects.forEach((v) => {
    const match = v.name.match(regex);
    if (match) {
      const number = parseInt(match[1], 10);
      if (!isNaN(number)) {
        lastNumber = Math.max(lastNumber, number);
      }
    }
  });

  return `${prefix}${lastNumber + 1}`;
}

export const isBase64 = (str: string) => {
  try {
    // Validate base64 string with a regular expression
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(str) || str.length % 4 !== 0) {
      return false;
    }

    // Try decoding the string with atob
    atob(str);
    return true;
  } catch (e) {
    return false;
  }
};

export const truncateUrlPath = (
  fullPath: string,
  maxLength = 50,
  startingPathsCount = 1
): string => {
  // if url is too long, truncate from folder1/folder2/folder3/folder4/file1 to folder1/.../file1
  // you can additionally set startingPathsCount different from 1 to add more segments from start
  const pathSegments = fullPath.split("/");

  if (fullPath.length <= maxLength) {
    return fullPath;
  }
  const startSegments = pathSegments.slice(0, startingPathsCount).join("/");
  const lastSegment = pathSegments[pathSegments.length - 1];

  return `${startSegments}/.../${lastSegment}`;
};

export function sortByName(arr, dir: SortingDirection, key = "name") {
  arr.sort((a, b) =>
    dir.toString() === "ASC"
      ? a[key].localeCompare(b[key])
      : b[key].localeCompare(a[key])
  );
}

export function areSetsEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

export const safelyParseJSON = (input: string | unknown) => {
  if (!input || typeof input !== "string") {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch {
    // Handle strings wrapped in single quotes
    if (input.startsWith("'") && input.endsWith("'")) {
      return safelyParseJSON(input.slice(1, -1));
    }
    return input;
  }
};

export function parseNestedObjectTree(input) {
  const parsedObject = {};
  if (!input) return parsedObject;

  if (typeof input === "string") return safelyParseJSON(input);

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === "object" && item !== null) {
        return parseNestedObjectTree(item);
      } else if (typeof item === "string") {
        return safelyParseJSON(item);
      }
      return item; // Return primitive values (number, boolean, etc.)
    });
  }

  for (const [key, value] of Object.entries(input)) {
    const parsedValue = safelyParseJSON(value);

    parsedObject[key] =
      typeof parsedValue === "object" && parsedValue !== null
        ? parseNestedObjectTree(parsedValue)
        : parsedValue;
  }

  return parsedObject;
}

export function isInputElement(targetElement) {
  return (
    targetElement.tagName === "INPUT" ||
    targetElement.tagName === "TEXTAREA" ||
    (targetElement.isContentEditable &&
      targetElement.hasAttribute("contenteditable"))
  );
}

export function parseDate(dateStr): number {
  if (!dateStr) return Date.now();
  // Handle format: 2024-07-25 11:42:37.622000000
  if (dateStr.includes(" ")) {
    return new Date(dateStr.replace(" ", "T") + "Z").getTime();
  }
  // Handle format: 2024-07-25T11:42:07.777Z
  return new Date(dateStr).getTime();
}

export const getSubscriptionTypeName = (
  productName: string
): SubscriptionType => {
  return productName?.split(" ")[1].toLowerCase() as SubscriptionType;
};

export const getSlugifiedName = (value) => {
  return slugify(value, {
    lower: true,
    remove: /[*+~()'"#${}|!:&%]/g,
    trim: true,
  });
};

export const hasAnsi = (str: string) => /\x1b\[[0-9;]*m/.test(str);

export const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

export const getApiLabel = (url: string, target: CollectionTarget) => {
  try {
    const domain = new URL(url).hostname;
    const cleanDomain = domain
      .replace(/^(www\.|app\.|api\.)/, "")
      .split(".")
      .slice(0, -1)
      .join(".");

    return cleanDomain
      ? getSlugifiedName(`${toCapitalize(cleanDomain)} ${target}`)
      : "";
  } catch (error) {
    return "";
  }
};

export const isReservedKeyword = (input: string): boolean => {
  const reservedKeywords = new Set([
    "abstract",
    "await",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "double",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "final",
    "finally",
    "float",
    "for",
    "function",
    "goto",
    "if",
    "implements",
    "import",
    "in",
    "instanceof",
    "int",
    "interface",
    "let",
    "long",
    "native",
    "new",
    "null",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "volatile",
    "while",
    "with",
    "yield",
  ]);
  return reservedKeywords.has(input);
};

export const stringifyTag = ([key, value]) => {
  return `${key ? key : ""}:${value}`;
};

type Repository = string | undefined;
type Branch = string | undefined;
type FilePath = string | undefined;

export const decodeFilePath = (
  path: string
): [Repository, Branch, FilePath] => {
  if (!path) return [undefined, undefined, undefined];
  try {
    const fragments = path
      ? JSON.parse(LZString.decompressFromEncodedURIComponent(path))
      : [];
    return [fragments[0], fragments[1], fragments[2]];
  } catch (error) {
    return [undefined, undefined, undefined];
  }
};

export const encodeFilePath = (
  fragments: [Repository, Branch, FilePath]
): string => {
  const json = JSON.stringify(fragments);
  return LZString.compressToEncodedURIComponent(json);
};

export const formatKeyboardShortcutForDisplay = (
  shortcut: string,
  withSpaces: boolean = true
): string => {
  if (!shortcut) return "";

  const isMacOS = isMac();

  // First format the shortcut
  let formatted = shortcut
    .replace(/\bCtrl\b/g, isMacOS ? "⌘" : "Ctrl")
    .replace(/\bCmd\b/g, isMacOS ? "⌘" : "Ctrl")
    .replace(/\bShift\b/g, "⇧")
    .replace(/\bAlt\b/g, isMacOS ? "⌥" : "Alt")
    .replace(/\bOption\b/g, isMacOS ? "⌥" : "Alt");

  if (withSpaces) {
    // Add spaces between symbols and letters for better readability
    formatted = formatted
      .replace(/([⌘⌥⇧])([A-Za-z])/g, "$1 $2")
      .replace(/([A-Za-z])([⌘⌥⇧])/g, "$1 $2")
      .replace(/([⌘⌥⇧])([⌘⌥⇧])/g, "$1 $2");
  }

  return formatted;
};

export const extractVideoId = (url: string) => {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/
  );
  return match ? match[1] : null;
};

export const userTypesToNameMap = {
  [EndUserType.USER]: "User",
  [EndUserType.API_CLIENT]: "API Client",
  [EndUserType.VISITOR]: "Visitor",
};

export const ISSUE_STATUS_OPTIONS = {
  resolved: { label: "Resolved", value: "resolved" },
  archived: { label: "Archived", value: "archived" },
};

export const getObfuscatedToken = (
  token: string,
  showMasking = true
): string => {
  if (!token) return "";
  if (!showMasking) return token;

  return token.length > 11
    ? `${token.slice(0, 5)}******************************${token.slice(-6)}`
    : token;
};
