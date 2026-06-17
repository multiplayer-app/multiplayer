import { TextProps } from "@chakra-ui/react";
import { IIssue } from "@multiplayer/types";

import TextEllipsis from "../TextEllipsis";
import { getDefaultTitle } from "./getDefaultTitle";

const IssueTitle = ({
  title,
  metadata,
  ...rest
}: Pick<IIssue, "title" | "metadata"> & TextProps) => {
  const message = getDefaultTitle(title, metadata);
  return (
    <TextEllipsis fontWeight="medium" title={message} {...rest}>
      {message}
    </TextEllipsis>
  );
};

export default IssueTitle;
