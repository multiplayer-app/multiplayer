import { Icon } from "@chakra-ui/react";
import { DebuggerIcon } from "shared/icons";
import EmptyScreen from "shared/components/EmptyScreen";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
const DebugSession = lazyModule(() => import("../../../Debugger/DebugSession"));

const RecordingTab = ({ debugSessionId }) => {
  if (!debugSessionId) {
    return (
      <EmptyScreen
        title="Recording not found"
        icon={<Icon as={DebuggerIcon} />}
        description="No recording is linked to this session."
      />
    );
  }
  return (
    <LazyContent
      element={<DebugSession sessionId={debugSessionId} isPreviewMode={true} />}
    />
  );
};

export default RecordingTab;
