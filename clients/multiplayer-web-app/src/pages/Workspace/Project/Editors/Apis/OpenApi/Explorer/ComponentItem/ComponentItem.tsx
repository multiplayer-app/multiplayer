import { useRef, useLayoutEffect } from "react";
import { Button } from "@chakra-ui/react";

import { useOpenApi } from "shared/providers/OpenApiContext";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import ViewsCheckbox from "../ViewsCheckbox";

const ComponentItem = ({ data, componentKey, isActive, onOpen }) => {
  const { presenceState, getVisibilityStyles, getHighlightingStyles } =
    useOpenApi();

  const itemRef = useRef();

  useLayoutEffect(() => {
    if (isActive) {
      setTimeout(() => {
        // wait for collapse animation end
        (itemRef as any).current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 1000);
    }
  }, []);

  return (
    <Button
      px="2"
      as="div"
      ref={itemRef}
      variant="base"
      _hover={{ bg: "bg.subtle" }}
      justifyContent="flex-start"
      transition="all .2s cubic-bezier(.87, 0, .13, 1)"
      bg={isActive ? "bg.subtle" : "bg.primary"}
      onClick={() => onOpen(componentKey)}
      leftIcon={
        <ViewsCheckbox
          type="components"
          id={componentKey}
          data={data}
          changeType={data.changeType}
        />
      }
      rightIcon={<PresenceAvatarGroup users={presenceState[componentKey]} />}
      {...getVisibilityStyles(data.changeType)}
      {...getHighlightingStyles(data.changeType)}
    >
      {data.name}
    </Button>
  );
};
export default ComponentItem;
