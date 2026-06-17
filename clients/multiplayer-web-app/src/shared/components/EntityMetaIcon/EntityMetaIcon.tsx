import { useState } from "react";
import { Image } from "@chakra-ui/react";
import { EntityType, ComponentType } from "@multiplayer/types";
import EntityIcon from "../EntityIcon";
import NodeIcon from "../NodeIcon";

const EntityMetaIcon = ({ type, metadata, ...rest }) => {
  const [isError, setIsError] = useState(false);

  if (type === EntityType.PLATFORM_COMPONENT) {
    const meta = metadata || { iconUrl: null, type: ComponentType.GENERIC };
    return (
      <>
        {!isError && meta.iconUrl ? (
          <Image
            boxSize="6!"
            verticalAlign="top"
            src={meta.iconUrl}
            onError={() => setIsError(true)}
            {...rest}
          />
        ) : (
          <NodeIcon type={meta.type} boxSize="6" {...rest} />
        )}
      </>
    );
  }
  return <EntityIcon color="muted" name={type} boxSize="6" {...rest} />;
};

export default EntityMetaIcon;
