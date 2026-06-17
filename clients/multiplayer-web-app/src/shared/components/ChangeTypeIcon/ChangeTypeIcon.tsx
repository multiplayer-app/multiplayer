import { Icon, IconProps } from "@chakra-ui/react";
import { EntityCommitChangeType } from "@multiplayer/types";
import {
  UpdatesIcon,
  AdditionsIcon,
  SubtractionsIcon,
} from "shared/icons";

interface ChangeTypeIconProps extends IconProps {
  name: EntityCommitChangeType;
}

const ChangeTypeIcon = ({ name, ...rest }: ChangeTypeIconProps) => {
  switch (name) {
    case EntityCommitChangeType.CREATE:
      return <Icon as={AdditionsIcon} {...rest} />;
    case EntityCommitChangeType.DELETE:
      return <Icon as={SubtractionsIcon} {...rest} />;
    case EntityCommitChangeType.UPDATE:
      return <Icon as={UpdatesIcon} {...rest} />;
    case EntityCommitChangeType.ARCHIVE:
      return <Icon as={SubtractionsIcon} {...rest} />;
    default:
      return null;
  }
};

export default ChangeTypeIcon;
