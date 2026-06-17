import { Box, Text } from "@chakra-ui/react";
import { Y } from "@multiplayer/entity";
import { useEffect, useRef, useState } from "react";
import { Blocknote } from "@multiplayer/types";

import EnvironmentVariables from "./EnvironmentVariables";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";

interface DocumentVariablesDrawerProps {
  doc: Y.Doc;
  onClose: () => void;
  readonly: boolean;
}
type VarsType = Y.Array<Blocknote.AggregateVariable>;

const defaultEnv = Blocknote.SourceEnv.GLOBAL;

const DocumentVariablesDrawer = ({
  doc,
  onClose,
  readonly,
}: DocumentVariablesDrawerProps) => {
  const [currentEnv] = useState(defaultEnv);
  const envsRef = useRef<Y.Map<Y.Map<unknown>>>(doc.getMap("environments"));
  const envRef = useRef<Y.Map<unknown>>(envsRef.current.get(currentEnv));

  useEffect(() => {
    const envs = envsRef.current;
    const newEnv = envs.get(currentEnv) || envs.get(defaultEnv);
    envRef.current = newEnv;
  }, [currentEnv]);

  const yVariables = envRef.current?.get("variables") as VarsType;
  const ySecrets = envRef.current?.get("secrets") as VarsType;

  return (
    <Drawer isOpen={true}>
      <DrawerContent height="auto" onClose={onClose}>
        <Box p="4">
          <Text fontSize="lg" fontWeight="medium">
            Notebook Variables
          </Text>
        </Box>
        {yVariables && (
          <EnvironmentVariables
            yVariables={yVariables}
            ySecrets={ySecrets}
            readonly={readonly}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default DocumentVariablesDrawer;
