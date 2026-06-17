import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ComponentDetails from "../ComponentDetails";
import { useVersion } from "shared/providers/VersionContext";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import { useFullScreenContext } from "shared/providers/FullScreenContext";

const ComponentDetailsDrawer = ({
  onClose,
  containerRef,
  readonly = false,
  preSelectedComponentId,
}: {
  onClose: () => void;
  containerRef?: any;
  readonly?: boolean;
  preSelectedComponentId: string | null;
}) => {
  const { projectId } = useParams();
  const { currentBranchId } = useVersion();
  const fsContext = useFullScreenContext();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );

  const parentContainer =
    containerRef || fsContext?.contentContainerRef?.current || null;

  useEffect(() => {
    setSelectedComponentId(preSelectedComponentId);
  }, [preSelectedComponentId]);

  const onComponentClose = () => {
    setSelectedComponentId(null);
    onClose();
  };

  return (
    <Drawer isOpen={!!selectedComponentId}>
      <DrawerContent parentContainer={parentContainer} height="auto">
        <ComponentDetails
          readonly={readonly}
          branchId={currentBranchId}
          projectId={projectId}
          componentId={selectedComponentId}
          onClose={onComponentClose}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default ComponentDetailsDrawer;
