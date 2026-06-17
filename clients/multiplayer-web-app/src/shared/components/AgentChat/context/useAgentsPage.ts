import { useParams } from "react-router-dom";

import { ProjectSourceType } from "shared/models/enums";

export function useAgentsPage(): boolean {
  const { sourceType } = useParams();
  return sourceType === ProjectSourceType.AGENTS;
}
