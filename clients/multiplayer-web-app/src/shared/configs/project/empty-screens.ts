import {
  GithubIcon,
  GitlabIcon,
  BitbucketIcon,
  EntityCodeIcon,
  EntityComponentIcon,
} from "shared/icons";
import { EntityCategories } from "shared/models/enums";

export const emptyScreenConfigs = {
  [EntityCategories.DOCUMENT]: {
    title: "You don't have a notebook yet!",
    description: "Kickstart your project by creating your very first notebook and set the stage for innovation.",
  },

  [EntityCategories.VARIABLE_GROUP]: {
    title: "You don't have variable groups yet!",
    description: "Kickstart your project by creating your very first variable group and set the stage for innovation.",
  },

  [EntityCategories.SKETCH]: {
    title: "You don't have a sketch yet!",
    description: "Kickstart your project by creating your very first sketch and set the stage for innovation.",
  },

  [EntityCategories.PLATFORM]: {
    title: "You don't have a platform yet!",
    description: "Kickstart your project by creating your very first platform and set the stage for innovation.",
  },

  [EntityCategories.COMPONENT]: {
    title: "You don't have a component yet!",
    description: "Kickstart your project by creating your very first component and set the stage for innovation.",
    icons: [EntityComponentIcon],
  },

  [EntityCategories.REPOSITORY]: {
    title: "You currently have no linked repositories.",
    description: "Start by adding a Git integration like GitHub and you'll be able to sync your whole platform in minutes.",
    icons: [GithubIcon, GitlabIcon, BitbucketIcon],
  },

  [EntityCategories.SOURCE]: {
    title: "You currently have no APIs.",
    description: "Kickstart your project by creating your very first API and set the stage for innovation.",
    icons: [EntityCodeIcon],
  },

  [EntityCategories.ENVIRONMENT]: {
    title: "You don't have an environment yet!",
    description: "Kickstart your project by creating your very first environment and set the stage for innovation.",
    icons: [EntityCodeIcon],
  },

  [EntityCategories.SCHEMA]: {
    title: "You don't have a schema yet!",
    description: "Kickstart your project by creating your very first schema and set the stage for innovation.",
    icons: [EntityCodeIcon],
  },
};