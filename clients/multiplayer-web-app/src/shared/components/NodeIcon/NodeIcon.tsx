import { ReactComponent as Client } from "assets/icons/node/client.svg";
import { ReactComponent as Component } from "assets/icons/node/component.svg";
import { ReactComponent as Service } from "assets/icons/node/service.svg";
import { ReactComponent as Platform } from "assets/icons/node/platform.svg";
import { ReactComponent as GroupIcon } from "assets/icons/node/group.svg";

import { ComponentType } from "@multiplayer/types";
import { Icon } from "@chakra-ui/react";

const iconTypes = {
  group: GroupIcon,
  [ComponentType.CLIENT]: Client,
  [ComponentType.SERVICE]: Service,
  [ComponentType.PLATFORM]: Platform,
  [ComponentType.GENERIC]: Component,
};

const NodeIcon = ({ type, ...rest }) => {
  const nodeTypeIcon = iconTypes[type] || Component;
  return <Icon as={nodeTypeIcon} {...rest} />;
};

export default NodeIcon;
