import { UseDisclosureReturn } from "@chakra-ui/react";
import { useThreads } from "shared/providers/ThreadsContext";
import ToolbarButton, { ToolbarButtonProps } from "../Toolbar/ToolbarButton";
import { NewCommentIcon, CommentIcon } from "shared/icons";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "../CheckAccess";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface CommentsToggleButtonProps extends ToolbarButtonProps {
  disclosure: UseDisclosureReturn;
  enforceSandboxCheck?: boolean;
}

const CommentsToggleButton = ({
  disclosure,
  enforceSandboxCheck,
  ...props
}: CommentsToggleButtonProps) => {
  const { threads } = useThreads();
  const { withSandboxCheck } = useProjectSandbox();

  return (
    <CheckAccess
      scope={RoleType.PROJECT}
      permission={RoleAccessAction.READ}
      entity={RoleProjectPermissionEntity.THREAD}
    >
      <ToolbarButton
        icon={threads?.data?.length ? <NewCommentIcon /> : <CommentIcon />}
        label="Comments"
        onClick={
          enforceSandboxCheck
            ? withSandboxCheck(disclosure.onToggle)
            : disclosure.onToggle
        }
        isActive={disclosure.isOpen}
        {...props}
      />
    </CheckAccess>
  );
};

export default CommentsToggleButton;
