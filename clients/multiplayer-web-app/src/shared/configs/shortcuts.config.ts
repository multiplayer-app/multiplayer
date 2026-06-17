import { ShortcutTypes } from "shared/models/enums";
import { isTextSelected } from "shared/utils";

const IS_MAC = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export interface IShortcut {
  title: string;
  repeat: boolean;
  condition?: (e: any) => boolean;
  keys: {
    keyName: string;
    keyCode: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
  }[];
}

export type IShortcuts = Record<Partial<ShortcutTypes>, IShortcut>;

const config = {
  [ShortcutTypes.copy]: {
    title: "Copy",
    repeat: false,
    condition: (e) => {
      return isTextSelected();
    },
    keys: [
      {
        keyName: "C",
        keyCode: 67,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.cut]: {
    title: "Cut",
    repeat: false,
    condition: (e) => {
      return isTextSelected();
    },
    keys: [
      {
        keyName: "C",
        keyCode: 88,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.undo]: {
    title: "Undo",
    repeat: false,
    keys: [
      {
        keyName: "Z",
        keyCode: 90,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.redo]: {
    title: "Redo",
    repeat: false,
    keys: [
      {
        keyName: "Z",
        keyCode: 90,
        ctrlKey: true,
        shiftKey: true,
      },
    ],
  },
  [ShortcutTypes.group]: {
    title: "Group",
    repeat: false,
    keys: [
      {
        keyName: "G",
        keyCode: 71,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.ungroup]: {
    title: "ungroup",
    repeat: false,
    keys: [
      {
        keyName: "G",
        keyCode: 71,
        ctrlKey: true,
        shiftKey: true,
      },
    ],
  },
  [ShortcutTypes.select_all]: {
    title: "Select all objects",
    repeat: false,
    keys: [
      {
        keyName: "A",
        keyCode: 65,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.delete]: {
    title: "Delete selected objects",
    repeat: false,
    keys: [
      {
        keyName: "Delete",
        keyCode: 46,
      },
      {
        keyName: "Backspace",
        keyCode: 8,
      },
    ],
  },
  [ShortcutTypes.save]: {
    title: "Save",
    repeat: false,
    keys: [
      {
        keyName: "S",
        keyCode: 83,
        ctrlKey: true,
      },
    ],
  },
  [ShortcutTypes.esc]: {
    title: "Cancel",
    repeat: false,
    keys: [
      {
        keyName: "Esc",
        keyCode: 27,
      },
    ],
  },
  [ShortcutTypes.tool_select]: {
    title: "Select Tool",
    repeat: false,
    keys: [
      {
        keyName: "V",
        keyCode: 86,
      },
    ],
  },
  [ShortcutTypes.tool_hand]: {
    title: "Hand Tool",
    repeat: false,
    keys: [
      {
        keyName: "H",
        keyCode: 72,
      },
    ],
  },
};

const getShortcutKeys = (shortcut: IShortcut) => {
  const keys = {
    text: "",
    array: [],
  };

  for (const key of shortcut.keys) {
    const combo = [];
    if (key.ctrlKey) {
      combo.push("Ctrl");
    }
    if (key.metaKey) {
      combo.push("Cmd");
    }
    if (key.shiftKey) {
      combo.push("Shift");
    }
    if (key.altKey) {
      combo.push(IS_MAC ? "Option" : "Alt");
    }
    combo.push(key.keyName);
    keys.array.push(combo);
  }

  keys.text = keys.array.map((k) => k.join(" + ")).join(" / ");

  return keys;
};

for (const key of Object.keys(config)) {
  const shortcut = config[key];

  if (IS_MAC) {
    shortcut.keys
      .filter((k) => !!k.ctrlKey)
      .forEach((k) => {
        k.metaKey = k.ctrlKey;
        delete k.ctrlKey;
      });
  }

  const { text, array } = getShortcutKeys(shortcut);
  const tooltip = `${shortcut.title} (${text})`;

  config[key].formatted = {
    tooltip,
    keysText: text,
    keysArray: array,
  };
}

export default config;
