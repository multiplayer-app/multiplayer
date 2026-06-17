import { EntityCommitChangeType } from "@multiplayer/types";
import { MetroMinusIcon, MetroPlusIcon, MetroTriangleIcon } from "shared/icons";

interface IChangedInputProps {
  icon: any;
  accentColor: string;
  lightBackground: string;
  tooltipStaticText: string;
}

export const changeTypeConfig: {
  [changeType: string]: IChangedInputProps;
} = {
  [EntityCommitChangeType.CREATE]: {
    accentColor: "m.green",
    lightBackground: "green.50",
    icon: MetroPlusIcon,
    tooltipStaticText: "Click to delete ",
  },
  [EntityCommitChangeType.UPDATE]: {
    accentColor: "m.blue",
    lightBackground: "blue.50",
    icon: MetroTriangleIcon,
    tooltipStaticText: "Reset value to: ",
  },
  [EntityCommitChangeType.DELETE]: {
    accentColor: "m.red",
    lightBackground: "red.50",
    icon: MetroMinusIcon,
    tooltipStaticText: "Click to undo deletion ",
  },
};
