import { EntityCategories, SystemCatalogTabTypes } from "shared/models/enums";

export const selectedTabToCategoryMap = {
  [SystemCatalogTabTypes.Components]: EntityCategories.COMPONENT,
  [SystemCatalogTabTypes.Environments]: EntityCategories.ENVIRONMENT,
  [SystemCatalogTabTypes.Platforms]: EntityCategories.PLATFORM,
};
