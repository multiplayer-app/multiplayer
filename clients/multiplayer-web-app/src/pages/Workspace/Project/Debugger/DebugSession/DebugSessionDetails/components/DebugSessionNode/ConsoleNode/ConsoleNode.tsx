import { Box } from "@chakra-ui/react";

import MonoText from "shared/components/MonoText";
import { IConsoleNode, ISessionNodeProps } from "../../../../types";
import DebugSessionNodeIcon from "../DebugSessionNodeIcon";

const ConsoleNode = ({ node }: ISessionNodeProps<IConsoleNode>) => {
  const data = node.meta.data?.payload;
  if (!data) return <Box />;

  return (
    <>
      <DebugSessionNodeIcon node={node} />
      <MonoText
        flex="1"
        color="body"
        lineHeight="6"
        overflow="hidden"
        textOverflow="ellipsis"
        title={node.meta.message}
      >
        {node.meta.message}
      </MonoText>
    </>
  );
};

export default ConsoleNode;
