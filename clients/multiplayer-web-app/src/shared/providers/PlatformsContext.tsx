import * as Y from "yjs";

import { useState, createContext, PropsWithChildren } from "react";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { ClientState } from "shared/models/interfaces";
import { useDisclosure } from "@chakra-ui/react";
import { ChangesViewMode } from "shared/models/enums";
import { ViewIdType } from "shared/models/types";
import { useVersion } from "./VersionContext";
import { VisualizationType } from "@multiplayer/types";

export const PlatformsContext = createContext(null);

interface PlatformProviderProps extends PropsWithChildren {
  doc: Y.Doc;
  provider: YjsSocketIOProvider;
  clients: ClientState[];
  readonly: boolean;
  initialData: any;
}

interface PlatformLocalState {
  viewMode: VisualizationType;
  currentView: ViewIdType;
  highlightingMode: ChangesViewMode;
}

export const PlatformsProvider = ({
  doc,
  provider,
  children,
  readonly,
  clients,
  initialData,
}: PlatformProviderProps) => {
  const { currentBranchId } = useVersion();
  const viewsDrawerDisclosure = useDisclosure();
  const entityThreadsDisclosure = useDisclosure();
  const componentsModalDisclosure = useDisclosure();
  const componentsDrawerDisclosure = useDisclosure();
  const [changesViewMode, setChangesViewMode] = useState(ChangesViewMode.NONE);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(
    VisualizationType.DIAGRAM
  );
  const [componentIdInDrawer, setComponentIdInDrawer] = useState<string | null>(
    null
  );

  return (
    <PlatformsContext.Provider value={{ doc }}>
      {children}
    </PlatformsContext.Provider>
  );
};
