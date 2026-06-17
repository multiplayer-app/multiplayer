import { Icon, IconProps } from "@chakra-ui/react";
import {
  FlowIcon,
  RadarIcon,
  DebuggerIcon,
  CopilotFlatIcon,
  EntityApiIcon,
  EntityCodeIcon,
  EntitySketchIcon,
  EntitySchemaIcon,
  EntityDocumentIcon,
  EntityPlatformIcon,
  EntityComponentIcon,
  EntityEnvironmentIcon,
  EntityVariableGroupIcon,
  UserEntityIcon,
  IssuesIcon,
} from "shared/icons";
import { EntityCategories, ProjectSourceType } from "shared/models/enums";

interface CategoryIconProps extends IconProps {
  name: string;
}
const CategoryIcon = ({
  name,
  color = "muted",
  ...rest
}: CategoryIconProps) => {
  switch (name) {
    case ProjectSourceType.FLOWS:
      return <Icon color={color} as={FlowIcon} {...rest} />;
    case ProjectSourceType.RADAR:
      return <Icon color={color} as={RadarIcon} {...rest} />;
    case ProjectSourceType.DEBUGGER:
      return <Icon color={color} as={DebuggerIcon} {...rest} />;
    case ProjectSourceType.AGENTS:
      return <Icon color={color} as={CopilotFlatIcon} {...rest} />;
    case ProjectSourceType.ISSUES:
      return <Icon color={color} as={IssuesIcon} {...rest} />;
    case ProjectSourceType.END_USERS:
      return <Icon color={color} as={UserEntityIcon} {...rest} />;
    case EntityCategories.DOCUMENT:
      return <Icon color={color} as={EntityDocumentIcon} {...rest} />;
    case EntityCategories.SKETCH:
      return <Icon color={color} as={EntitySketchIcon} {...rest} />;
    case EntityCategories.PLATFORM:
      return <Icon color={color} as={EntityPlatformIcon} {...rest} />;
    case EntityCategories.COMPONENT:
      return <Icon color={color} as={EntityComponentIcon} {...rest} />;
    case EntityCategories.REPOSITORY:
      return <Icon color={color} as={EntityCodeIcon} {...rest} />;
    case EntityCategories.SOURCE:
      return <Icon color={color} as={EntityApiIcon} {...rest} />;
    case EntityCategories.ENVIRONMENT:
      return <Icon color={color} as={EntityEnvironmentIcon} {...rest} />;
    case EntityCategories.SCHEMA:
      return <Icon color={color} as={EntitySchemaIcon} {...rest} />;
    case EntityCategories.VARIABLE_GROUP:
      return <Icon color={color} as={EntityVariableGroupIcon} {...rest} />;
  }
};

export default CategoryIcon;
