import { EntityCommitChangeType } from "@multiplayer/types";
import {
  UpdatesIcon,
  AdditionsIcon,
  SubtractionsIcon,
} from "shared/icons";

export const changeTypeConfigs = {
  [EntityCommitChangeType.CREATE]: {
    color: "#00C889",
    icon: AdditionsIcon,
    label: "Added",
  },
  [EntityCommitChangeType.UPDATE]: {
    color: "#0069FF",
    icon: UpdatesIcon,
    label: "Changed",
  },
  [EntityCommitChangeType.DELETE]: {
    color: "#FF1950",
    icon: SubtractionsIcon,
    label: "Removed",
  },
  [EntityCommitChangeType.ARCHIVE]: {
    color: "#FF1950",
    icon: SubtractionsIcon,
    label: "Archived",
  },
  [EntityCommitChangeType.UNARCHIVE]: {
    color: "#FF1950",
    icon: SubtractionsIcon,
    label: "Unarchive",
  },
};