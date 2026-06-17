export interface DiagramThemeColors {
  background: {
    dotColor: string;
    cellColor: string;
    cellAlpha: number;
  };
  edge: {
    color: string;
    selectedColor: string;
  };
  connectionPoint: {
    dotColor: string;
  };
  selection: {
    color: number;
  };
  emptyBox: {
    textColor: string;
    borderColor: string;
    stripeColor: string;
    bgColor: string;
  };
  iconButton: {
    fill: string;
  };
  groupNode: {
    iconFill: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  sequence: {
    textFill: string;
    bgFill: string;
    bgStroke: string;
    arrowStroke: string;
  };
  flow: {
    columnHeader: string;
  };
}

const lightTheme: DiagramThemeColors = {
  background: {
    dotColor: "#CBD5E0",
    cellColor: "white",
    cellAlpha: 0.1,
  },
  edge: {
    color: "#dadada",
    selectedColor: "#473cfb",
  },
  connectionPoint: {
    dotColor: "#4f46e5",
  },
  selection: {
    color: 0x3c8cec,
  },
  emptyBox: {
    textColor: "#59645F",
    borderColor: "#59645F",
    stripeColor: "#59645F",
    bgColor: "#000",
  },
  iconButton: {
    fill: "#edf2f7",
  },
  groupNode: {
    iconFill: "#59645F",
  },
  text: {
    primary: "#2D3748",
    secondary: "#718096",
  },
  sequence: {
    textFill: "#2D3748",
    bgFill: "#ffffff",
    bgStroke: "#E0E7FF",
    arrowStroke: "#E5E7EB",
  },
  flow: {
    columnHeader: "#0091ff",
  },
};

const darkTheme: DiagramThemeColors = {
  background: {
    dotColor: "#3f3f46",
    cellColor: "black",
    cellAlpha: 0.15,
  },
  edge: {
    color: "#52525b",
    selectedColor: "#818cf8",
  },
  connectionPoint: {
    dotColor: "#818cf8",
  },
  selection: {
    color: 0x6366f1,
  },
  emptyBox: {
    textColor: "#2D3748",
    borderColor: "black",
    stripeColor: "black",
    bgColor: "#18181b",
  },
  iconButton: {
    fill: "#27272a",
  },
  groupNode: {
    iconFill: "#a1a1aa",
  },
  text: {
    primary: "#2D3748",
    secondary: "#a1a1aa",
  },
  sequence: {
    textFill: "#e4e4e7",
    bgFill: "#000000",
    bgStroke: "#E0E7FF",
    arrowStroke: "#E5E7EB",
  },
  flow: {
    columnHeader: "#3b82f6",
  },
};

let currentTheme: DiagramThemeColors = lightTheme;
let clearCacheFn: (() => void) | null = null;

export function registerCacheClear(fn: () => void): void {
  clearCacheFn = fn;
}

export function setDiagramTheme(isDark: boolean): void {
  currentTheme = isDark ? darkTheme : lightTheme;
  clearCacheFn?.();
}

export function getDiagramTheme(): DiagramThemeColors {
  return currentTheme;
}

export function isDarkTheme(): boolean {
  return currentTheme === darkTheme;
}
