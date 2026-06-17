import { As, Icon, Text } from "@chakra-ui/react";

import { CursorClickIcon, PointerIcon } from "shared/icons";
import DebugNodeCollapseToggle from "shared/components/DebugNodeCollapseToggle";
import { IEventNode, ISessionNodeProps } from "../../../../types";

const EventNode = ({
  node,
  collapsable = true,
}: ISessionNodeProps<IEventNode>) => {
  const trace = node.meta;
  const isTouchEvent = trace.SpanAttributes["gesture.type"];
  return (
    <>
      {collapsable && <DebugNodeCollapseToggle node={node} />}
      {isTouchEvent ? (
        <>
          <EventNodeIcon icon={PointerIcon} />
          <Text noOfLines={1}>
            {getGestureDescription(trace.SpanAttributes)}
          </Text>
        </>
      ) : (
        <>
          <EventNodeIcon icon={CursorClickIcon} />
          <Text noOfLines={1}>
            {trace.SpanAttributes["target.innerText"] ? (
              <>
                Clicked on{" "}
                <Text as="span" fontWeight="medium">
                  "{trace.SpanAttributes["target.innerText"]}"
                </Text>
              </>
            ) : trace.SpanAttributes["target_element"] ? (
              <>
                Clicked on{" "}
                <Text as="span" fontWeight="medium" textTransform="capitalize">
                  {trace.SpanAttributes["target_element"].toLowerCase()}
                </Text>{" "}
                element
              </>
            ) : (
              "Clicked"
            )}
          </Text>
        </>
      )}
    </>
  );
};

const getGestureDescription = (spanAttributes) => {
  const gestureType = spanAttributes["gesture.type"];
  const role = spanAttributes["gesture.target.role"];
  const label = spanAttributes["gesture.target.label"];

  const gestureName =
    gestureType === "tap"
      ? "Tapped"
      : gestureType.charAt(0).toUpperCase() + gestureType.slice(1);

  if (role === "text" && label) {
    return `${gestureName} on "${label}"`;
  }

  return gestureName;
};

const EventNodeIcon = ({ icon }: { icon: As }) => {
  return (
    <Icon
      p="1"
      boxSize="6"
      color="inverse"
      bg="brand.900"
      borderRadius="base"
      as={icon}
    />
  );
};

export default EventNode;
