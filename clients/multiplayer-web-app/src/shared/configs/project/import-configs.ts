import { EntityCategories } from "shared/models/enums";

export const importConfigs = {
  [EntityCategories.DOCUMENT]: {
    button: "Import an API collection",
    hint: {
      icons: [],
      text: "You can now import API collections from Postman",
    },
    modal: {
      title: "Import an API collection",
      background: "",
      description: "Import your whole API collection from compatible clients like Postman.",
      successMessage: "You've successfully imported an API collection.",

    },
    input: {
      accept: ["application/json"],
      title: "Import from a file from your computer",
      description: "Only the JSON format is supported.",
    },
  },

  [EntityCategories.PLATFORM]: {
    button: "Import a platform",
    hint: {
      icons: [],
      text: "You can now import platforms from CSV files",
    },
    modal: {
      title: "Import a platform",
      background: "",
      description: "Import your list of components with dependencies to create a platform right from a CSV file.",
      successMessage: "You've successfully imported components.",
      learnMore: {
        url: "/templates/import-platform-template.csv",
        text: "Download a template of csv with example data",
        download: "import-platform-template.csv",
      },
    },
    input: {
      accept: ["text/csv"],
      title: "Import from a file from your computer",
      description: "Only CSV format is supported.",
    },
  },

  [EntityCategories.COMPONENT]: {
    button: "Import components",
    hint: {
      icons: [],
      text: "You can now import components from CSV files",
    },
    modal: {
      title: "Import components",
      background: "",
      description: "Import your list of components right from a CSV file.",
      successMessage: "You've successfully imported components.",
      learnMore: {
        url: "/templates/import-components-template.csv",
        text: "Download a template of csv with example data",
        download: "import-components-template.csv",
      },
    },
    input: {
      accept: ["text/csv"],
      title: "Import from a file from your computer",
      description: "Only CSV format is supported.",
    },
  },
};