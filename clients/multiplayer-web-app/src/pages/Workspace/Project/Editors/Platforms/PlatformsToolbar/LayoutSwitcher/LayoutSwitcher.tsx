import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import {
  PlatformLayoutMode,
  PlatformLayoutAlgorithm,
  PlatformLayoutDirection,
  DEFAULT_LAYOUT,
  PlatformLayoutAlign,
} from "@multiplayer/types";
import { useMemo } from "react";
import SwitchButtons from "shared/components/SwitchButtons";
import { ToolbarButton } from "shared/components/Toolbar";
import {
  AutoLayoutIcon,
  ChevronDownIcon,
  LightningIcon,
  ManualLayoutIcon,
} from "shared/icons";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const LayoutSwitcher = ({ editor, state }) => {
  const layout = state.metadata?.layout || DEFAULT_LAYOUT;
  const { withSandboxCheck } = useProjectSandbox();

  if (!editor) return null;

  const layoutOptions = [
    {
      label: "Auto",
      tooltip: "Auto layout",
      icon: AutoLayoutIcon,
      value: PlatformLayoutMode.AUTO,
      menuContent: <LayoutMenu editor={editor} layout={layout} />,
    },
    {
      label: "Manual",
      tooltip: "Manual layout",
      icon: ManualLayoutIcon,
      value: PlatformLayoutMode.MANUAL,
      menuContent: <LayoutMenu editor={editor} layout={layout} />,
    },
  ];

  return (
    <>
      <SwitchButtons
        value={layout.mode}
        options={layoutOptions}
        onChange={(mode) => {
          if (mode === PlatformLayoutMode.MANUAL) {
            withSandboxCheck(() => editor.setLayout({ ...layout, mode }))();
          } else {
            editor.setLayout({ ...layout, mode });
          }
        }}
      />
      {layout.mode === PlatformLayoutMode.MANUAL && (
        <ToolbarButton
          label="Auto Layout"
          icon={<LightningIcon />}
          onClick={() => editor.forceLayout()}
        />
      )}
    </>
  );
};

const LayoutMenu = ({ editor, layout }) => {
  const onAlgorithmChange = (algorithm) => {
    editor.setLayout({ ...layout, algorithm });
  };

  const onDirectionChange = (direction) => {
    editor.setLayout({ ...layout, direction });
  };

  const onAlignmentChange = (align) => {
    editor.setLayout({ ...layout, align });
  };

  return (
    <>
      {layout.algorithm === PlatformLayoutAlgorithm.TREE && (
        <LayoutSelect
          label="Type"
          options={layoutAlgorithms}
          onChange={onAlgorithmChange}
          value={layout.algorithm}
        />
      )}

      <LayoutSelect
        label="Align"
        options={layoutAlignments}
        onChange={onAlignmentChange}
        value={layout.align || PlatformLayoutAlign.START}
      />

      <LayoutSelect
        label="Direction"
        options={layoutDirs}
        onChange={onDirectionChange}
        value={layout.direction}
      />
    </>
  );
};

const LayoutSelect = ({ label, value, options, onChange }) => {
  const val = useMemo(
    () => options.find((o) => o.value === value)?.label || options[0].label,
    [options, value]
  );

  return (
    <Flex alignItems="center" justifyContent="space-between" pl="2">
      {label}
      <Menu>
        <MenuButton
          as={Button}
          px="2"
          size="sm"
          variant="ghost"
          rounded="base"
          color="inherit"
          alignItems="center"
          rightIcon={<ChevronDownIcon />}
        >
          {val}
        </MenuButton>
        <MenuList minW="0">
          {options.map((opt, index) => {
            const isSelected = opt.value === value;

            return (
              <MenuItem
                onClick={() => onChange(opt.value)}
                key={opt.value}
                bg={isSelected ? "bg.subtle" : "transparent"}
                _hover={{ bg: isSelected ? "bg.subtle" : "bg.surface" }}
                mb={index !== options.length - 1 ? 1 : 0}
              >
                {opt.label}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </Flex>
  );
};

const layoutAlgorithms = [
  {
    label: "Flow",
    value: PlatformLayoutAlgorithm.FLOW,
  },
  {
    label: "Tree (Deprecated)",
    value: PlatformLayoutAlgorithm.TREE,
  },
];

const layoutDirs = [
  {
    label: "Vertical",
    value: PlatformLayoutDirection.VERTICAL,
  },
  {
    label: "Horizontal",
    value: PlatformLayoutDirection.HORIZONTAL,
  },
];

const layoutAlignments = [
  {
    label: "Start",
    value: PlatformLayoutAlign.START,
  },
  {
    label: "Center",
    value: PlatformLayoutAlign.CENTER,
  },
];

export default LayoutSwitcher;
