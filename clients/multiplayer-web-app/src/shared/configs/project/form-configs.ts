import * as yup from "yup";
import { EntityType } from "@multiplayer/types";
import { EntityCategories, EntityFormFieldType } from "shared/models/enums";

// Assets
import sketchPreview from "assets/images/previews/sketch.jpg";
import platformPreview from "assets/images/previews/platform.jpg";
import blocknotePreview from "assets/images/previews/blocknote.jpg";

const nameValidationSchema = yup
  .string()
  .required("This field is required")
  .matches(
    /^[a-z][a-z0-9-]*$/g,
    "Only lowercase letters, numbers, dashes are allowed. Must start with a letter only."
  );

const requiredStringSchema = yup.string().required("This field is required");

const createNameField = (
  label: string,
  placeholder: string,
  hint?: string
) => ({
  name: "key",
  label,
  type: EntityFormFieldType.TEXT,
  defaultValue: "",
  placeholder,
  hint,
  validation: nameValidationSchema,
});

const createHiddenTypeField = (entityType: EntityType) => ({
  name: "type",
  type: EntityFormFieldType.HIDDEN,
  defaultValue: entityType,
  validation: requiredStringSchema,
});

export const formConfigs = {
  [EntityCategories.DOCUMENT]: {
    title: "Create a new notebook",
    button: "Create a new notebook",
    preview: blocknotePreview,
    fields: [
      createNameField(
        "Notebook name",
        "Enter the notebook name",
        `The name may contain only lowercase letters, numbers or dashes. Must start with a letter only. E.g. 'feat-requirements', 'doc-version-3'.`
      ),
      createHiddenTypeField(EntityType.NOTEBOOK),
    ],
  },

  [EntityCategories.VARIABLE_GROUP]: {
    title: "Create a new variable group",
    description: "You'll then be able to edit, link and document your variables in Multiplayer.",
    button: "Create a new variable group",
    headerProps: { backgroundColor: "#F9FAFB", mb: 6 },
    fieldProps: {
      display: "flex",
      gap: 4,
      sx: { "& > *": { flexBasis: "100%" } },
    },
    buttonProps: { width: "auto" },
    fields: [
      {
        name: "key",
        label: "Name",
        type: EntityFormFieldType.TEXT,
        defaultValue: "",
        placeholder: "Enter the variable name",
        validation: requiredStringSchema,
      },
      createHiddenTypeField(EntityType.VARIABLE_GROUP),
    ],
  },

  [EntityCategories.SKETCH]: {
    title: "Create a new sketch",
    button: "Create a new sketch",
    preview: sketchPreview,
    fields: [
      createNameField(
        "Sketch name",
        "Enter the sketch name",
        `The name may contain only lowercase letters, numbers or dashes. Must start with a letter only. E.g. 'system-branches-diagram', 'db-relations-draft-1'.`
      ),
      createHiddenTypeField(EntityType.EXCALIDRAW),
    ],
  },

  [EntityCategories.PLATFORM]: {
    title: "Create a new platform",
    button: "Create a new platform",
    fields: [],
  },

  [EntityCategories.COMPONENT]: {
    title: "Create a new component",
    button: "Create a new component",
    preview: platformPreview,
    fields: [
      createNameField(
        "Component name",
        "Enter the component name",
        `The name may contain only lowercase letters, numbers or dashes. Must start with a letter only. E.g. 'auth-service', 'data-service'.`
      ),
      createHiddenTypeField(EntityType.PLATFORM_COMPONENT),
    ],
  },

  [EntityCategories.REPOSITORY]: {
    title: "Add a new repository",
    button: "Link repository",
    preview: platformPreview,
    fields: [
      {
        name: "key",
        type: EntityFormFieldType.HIDDEN,
        validation: requiredStringSchema,
      },
      {
        name: "repository",
        type: EntityFormFieldType.HIDDEN,
        validation: requiredStringSchema,
      },
      {
        name: "integration",
        type: EntityFormFieldType.REPO,
        validation: requiredStringSchema,
      },
    ],
  },

  [EntityCategories.SOURCE]: {
    title: "Add an API",
    button: "Add an API",
    fields: [],
  },

  [EntityCategories.ENVIRONMENT]: {
    title: "Create a new environment",
    button: "Create a new environment",
    preview: platformPreview,
    fields: [
      createNameField(
        "Environment name",
        "Enter the environment name",
        `The name may contain only lowercase letters, numbers or dashes. Must start with a letter only. E.g. 'production', 'test-1, demo-env'.`
      ),
      createHiddenTypeField(EntityType.ENVIRONMENT),
    ],
  },

  [EntityCategories.SCHEMA]: {
    title: "Create new schema",
    button: "Create new schema",
    preview: platformPreview,
    fields: [
      {
        name: "key",
        label: "Schema name",
        type: EntityFormFieldType.TEXT,
        defaultValue: "",
        placeholder: "Enter the schema name",
        validation: requiredStringSchema,
      },
      createHiddenTypeField(EntityType.SCHEMA),
    ],
  },
};