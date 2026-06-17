import { Text } from "@chakra-ui/react";
import Ansi from "ansi-to-react";
import MonoText from "shared/components/MonoText";
import DebugNodeCollapseToggle from "shared/components/DebugNodeCollapseToggle";

import { hasAnsi } from "shared/utils";
import SeverityObject from "../../SeverityObject";

import { ILogNode, ISessionNodeProps } from "../../../../types";
import DebugSessionNodeIcon from "../DebugSessionNodeIcon";

const LogNode = ({ node, collapsable = true }: ISessionNodeProps<ILogNode>) => {
  const { meta } = node;

  return (
    <>
      <DebugSessionNodeIcon node={node} />
      {collapsable && <DebugNodeCollapseToggle node={node} />}
      <Text whiteSpace="nowrap">{meta.ServiceName}</Text>
      {!meta.SeverityText ? null : hasAnsi(meta.SeverityText) ? (
        <Ansi>{meta.SeverityText}</Ansi>
      ) : (
        <SeverityObject severity={meta.SeverityText} />
      )}
      <MonoText
        minW={0}
        color="inherit"
        overflow="hidden"
        textOverflow="ellipsis"
        title={meta.Body}
      >
        {meta.Body}
      </MonoText>
    </>
  );
};
export default LogNode;
