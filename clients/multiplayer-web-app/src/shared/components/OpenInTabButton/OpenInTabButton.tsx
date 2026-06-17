import { ExternalLinkIcon } from "shared/icons";
import { ToolbarButton } from "../Toolbar";
import { useProject } from "shared/providers/ProjectContext";

const OpenInTabButton = ({ id, type }: { id: string; type: string }) => {
  const { navigate } = useProject();

  const openEntityInTab = () => {
    navigate(`entity/${type}/${id}`);
  };

  return (
    <ToolbarButton
      label="Open in full screen"
      icon={<ExternalLinkIcon />}
      onClick={openEntityInTab}
    />
  );
};

export default OpenInTabButton;
