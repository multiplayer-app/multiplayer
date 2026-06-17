import { Box, Flex, Text, Textarea } from "@chakra-ui/react";
import { getNestedProperty } from "shared/utils";
import { useOpenApi } from "shared/providers/OpenApiContext";
import { useMemo } from "react";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import { useApis } from "shared/providers/ApisContext";

interface DescriptionProps {
  value: any;
  rows?: number;
  path?: string[];
  readonly?: boolean;
  onChange: (value: string) => void;
}

const Description = ({
  rows = 4,
  value = "",
  readonly = false,
  path = ["description"],
  onChange,
}: DescriptionProps) => {
  const { readonly: isReadOnly } = useApis();
  const {
    presenceState,
    onAwarenessUpdate,
    getHighlightingStylesByChanges,
    endpoint: { changes, key },
  } = useOpenApi();
  const pathKey = path.join(".");
  const handleFocus = () => {
    onAwarenessUpdate("focusElement", pathKey);
  };

  const handleBlur = () => {
    onAwarenessUpdate("focusElement", null);
  };

  const users = useMemo(() => {
    return presenceState[key]?.filter((u) => u.focusElement === pathKey);
  }, [presenceState, key]);

  return (
    <Box>
      <Flex justifyContent="space-between">
        <Text color="muted" mb="2">
          Description
        </Text>
        <PresenceAvatarGroup users={users} />
      </Flex>
      <Textarea
        rows={rows}
        value={value}
        resize="none"
        isReadOnly={readonly || isReadOnly}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={(e) => onChange(e.target.value)}
        {...getHighlightingStylesByChanges(getNestedProperty(changes, path))}
      ></Textarea>
    </Box>
  );
};

export default Description;
