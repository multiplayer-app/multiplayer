import { memo, useMemo } from "react";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { useOpenApi } from "shared/providers/OpenApiContext";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import { useApis } from "shared/providers/ApisContext";

interface SummaryProps {
  value: any;
  readonly?: boolean;
}

const Summary = memo(({ readonly = false, value = "" }: SummaryProps) => {
  const {
    presenceState,
    onMethodChange,
    onAwarenessUpdate,
    getHighlightingStylesByChanges,
    endpoint: { changes, key },
  } = useOpenApi();
  const { readonly: isReadOnly } = useApis();

  const handleChange = (summary) => {
    onMethodChange({ summary });
  };

  const handleFocus = () => {
    onAwarenessUpdate("focusElement", "summary");
  };

  const handleBlur = () => {
    onAwarenessUpdate("focusElement", null);
  };

  const users = useMemo(() => {
    return presenceState[key]?.filter((u) => u.focusElement === "summary");
  }, [presenceState, key]);

  return (
    <Box>
      <Flex justifyContent="space-between">
        <Text color="muted" mb="2">
          Summary
        </Text>
        <PresenceAvatarGroup users={users} />
      </Flex>
      <Input
        value={value}
        isReadOnly={readonly || isReadOnly}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={(e) => handleChange(e.target.value)}
        {...getHighlightingStylesByChanges(changes.summary)}
      />
    </Box>
  );
});

export default Summary;
