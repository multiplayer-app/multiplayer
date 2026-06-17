import Icon from "shared/components/Icon";

import { SESSION_KIND, SPAN_KIND, SNAPSHOT_KIND, ELEMENT_KIND } from "./kinds";

export const attachmentIcons = {
  [SESSION_KIND]: <Icon name="SquarePlay" boxSize="4" px="0.5" mx="1" />,
  [SPAN_KIND]: <Icon name="Form" boxSize="4" px="0.5" mx="1" />,
  [SNAPSHOT_KIND]: <Icon name="Camera" boxSize="4" px="0.5" mx="1" />,
  [ELEMENT_KIND]: <Icon name="Code" boxSize="4" px="0.5" mx="1" />,
};
