import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";
import {
  entityCategoryMap,
  getPathForConfig,
  projectCategoryConfigs,
  projectSourceTypeMap,
} from "shared/configs/project.configs";
import { ProjectSourceType } from "shared/models/enums";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { NavBarItemType } from "shared/models/interfaces";
import DynamicBreadcrumbItem from "./DynamicBreadcrumbItem";
import EntityBreadcrumbItem from "./EntityBreadcrumbItem";
import RepositoryBreadcrumbItem from "./RepositoryBreadcrumbItem";
import RadarBreadcrumbItem from "./RadarBreadcrumbItem";

const settingsPageNameMap: Record<string, string> = {
  general: "General",
  members: "Members",
  projects: "Projects",
  billing: "Billing",
  integrations: "Integrations",
  "alert-rules": "Notifications",
  profile: "Profile",
  "linked-accounts": "Linked Accounts",
  team: "Team",
  project: "Project",
};

const projectSettingsPageNameMap: Record<string, string> = {
  access: "Access",
  issues: "Issues",
  "api-keys": "API keys",
  "otel-keys": "Session Recorder",
  danger: "Danger zone",
};

const getSettingsCrumbs = (segments: string[]): string[] => {
  if (!segments.length) {
    return [];
  }

  const [section, subsection] = segments;

  if (section === "project") {
    return subsection
      ? ["Project", projectSettingsPageNameMap[subsection] || "General"]
      : ["Project"];
  }

  return [settingsPageNameMap[section] || "Settings"];
};

const HeaderBreadCrumbs = () => {
  const location = useLocation();
  const { sourceType, path, type } = useParams();
  const settingsPathPrefix = "/settings";
  const isSettingsRoute =
    sourceType === ProjectSourceType.SETTINGS ||
    location.pathname.includes(settingsPathPrefix);
  const settingsRelativePath = location.pathname.includes(settingsPathPrefix)
    ? location.pathname.split(settingsPathPrefix)[1].replace(/^\/+/, "")
    : "";
  const settingsSegments = settingsRelativePath.split("/").filter(Boolean);
  const settingsCrumbs = getSettingsCrumbs(settingsSegments);

  if (isSettingsRoute) {
    return (
      <Breadcrumb
        pl="2"
        flex="1"
        minW="0"
        fontSize="sm"
        color="muted"
        zIndex="dropdown"
        fontWeight="medium"
        position="relative"
        overflow="hidden"
      >
        <BreadcrumbItem isCurrentPage={settingsCrumbs.length === 0}>
          <BreadcrumbLink>Settings</BreadcrumbLink>
        </BreadcrumbItem>
        {settingsCrumbs.map((crumb, index) => (
          <BreadcrumbItem
            key={`${crumb}-${index}`}
            isCurrentPage={index === settingsCrumbs.length - 1}
            minW="0"
          >
            <BreadcrumbLink
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxW="400px"
            >
              {crumb}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    );
  }

  const category = projectSourceTypeMap[sourceType] || entityCategoryMap[type];
  const config = projectCategoryConfigs[category];

  let categoryLinkProps: any = {};
  if (!path) {
    categoryLinkProps = { as: "div" };
  } else if (config?.type === NavBarItemType.link) {
    categoryLinkProps = { as: Link, to: getPathForConfig(config) };
  }

  return (
    <Breadcrumb
      pl="2"
      flex="1"
      minW="0"
      fontSize="sm"
      color="muted"
      zIndex="dropdown"
      fontWeight="medium"
      position="relative"
      overflow="hidden"
    >
      {config && (
        <BreadcrumbItem isCurrentPage={!categoryLinkProps.to}>
          <BreadcrumbLink {...categoryLinkProps} textDecoration="none">
            {config.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}
      {path && (
        <BreadcrumbItem isCurrentPage minW="0">
          <BreadcrumbLink
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxW="400px"
          >
            <SourceBreadcrumbItem type={type} path={path} category={category} />
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}
    </Breadcrumb>
  );
};

const SourceBreadcrumbItem = ({ type, path, category }) => {
  const { sourceType } = useParams();

  const sourceTypeItem = useMemo(() => {
    switch (sourceType) {
      case ProjectSourceType.ENTITY:
        return <EntityBreadcrumbItem path={path} category={category} />;
      case ProjectSourceType.FILE:
        return (
          <RepositoryBreadcrumbItem
            type={type}
            path={path}
            sourceType={sourceType}
          />
        );
      case ProjectSourceType.RADAR:
        return (
          <RadarBreadcrumbItem
            type={type}
            path={path}
            sourceType={sourceType}
          />
        );
      case ProjectSourceType.DEBUGGER:
      case ProjectSourceType.AGENTS:
      case ProjectSourceType.FLOWS:
      case ProjectSourceType.ISSUES:
      case ProjectSourceType.END_USERS:
        return <DynamicBreadcrumbItem path={path} sourceType={sourceType} />;
      default:
        return null;
    }
  }, [sourceType, category, type, path]);

  return sourceTypeItem;
};

export default HeaderBreadCrumbs;
