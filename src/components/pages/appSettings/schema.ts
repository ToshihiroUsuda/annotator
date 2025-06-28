import { RJSFSchema } from "@rjsf/utils";
import { addLocValues } from "../../../common/strings";

export const formSchema: RJSFSchema = addLocValues({
  type: "object",
  properties: {
    appMode: {
      title: "Application Mode",
      type: "string",
      enum: ["hospital", "internal", "examination"],
    },
  },
  dependencies: {
    appMode: {
      oneOf: [
        {
          properties: {
            appMode: {
              enum: ["internal"],
            },
            rootDirectory: {
              title: "${strings.appSettings.rootDirectory}",
              type: "string",
            },
            tags: {
              title: "${strings.tags.title}",
              type: "array",
            },
            regionInformationSchema: {
              title: "Region Information Schema",
              type: "string",
            },
            stepInformationSchema: {
              title: "Step Information Schema",
              type: "string",
            },
            instructionDirectory: {
              title: "Instruction Directory",
              type: "string",
            },
          },
          required: ["rootDirectory", "tags", "tagCategories"],
        },
        {
          properties: {
            appMode: {
              enum: ["hospital"],
            },
            rootDirectory: {
              title: "${strings.appSettings.rootDirectory}",
              type: "string",
            },
            tags: {
              title: "${strings.tags.title}",
              type: "array",
            },
            regionInformationSchema: {
              title: "Region Information Schema",
              type: "string",
            },
            stepInformationSchema: {
              title: "Step Information Schema",
              type: "string",
            },
            confirmStepInfoInput: {
              title: "Confirmation for Step Information is required",
              type: "boolean",
            },
            instructionDirectory: {
              title: "Instruction Directory",
              type: "string",
            },
            timingsFile: {
              title: "Timings File",
              type: "string",
              enum: ["store", "freeze", "freeze_store", "both", "all", "none"],
              default: "all",
            },
            viimScript: {
              title: "ViiM Script",
              type: "string",
            },
            viimSetting: {
              title: "ViiM Setting",
              type: "string",
            },
            reportSchema: {
              title: "Report Schema",
              type: "string",
            },
          },
          required: [
            "rootDirectory",
            "tags",
            "timingsFile",
            "viimScript",
            "viimSetting",
          ],
        },
        {
          properties: {
            appMode: {
              enum: ["examination"],
            },
            rootDirectory: {
              title: "${strings.appSettings.rootDirectory}",
              type: "string",
            },
            tags: {
              title: "${strings.tags.title}",
              type: "array",
            },
            frameExtractionRate: {
              title:
                "${strings.projectSettings.videoSettings.frameExtractionRate}",
              description:
                "${strings.projectSettings.videoSettings.description}",
              type: "integer",
              default: 30,
              minimum: 1,
            },
            stepInformationSchema: {
              title: "Step Information Schema",
              type: "string",
            },
            instructionDirectory: {
              title: "Instruction Directory",
              type: "string",
            },
            timingsFile: {
              title: "Timings File",
              type: "string",
              enum: ["store", "freeze", "freeze_store", "both", "all", "none"],
              default: "all",
            },
          },
          required: ["rootDirectory", "tags", "timingsFile"],
        },
      ],
    },
  },
  required: ["appMode"],
});

export const uiSchema = {
  rootDirectory: {
    "ui:field": "folderPicker",
  },
  tags: {
    "ui:field": "tagsInput",
  },
  regionInformationSchema: {
    "ui:field": "jsonFilePicker",
  },
  stepInformationSchema: {
    "ui:field": "jsonFilePicker",
  },
  instructionDirectory: {
    "ui:field": "folderPicker",
  },
  viimScript: {
    "ui:field": "folderPicker",
  },
  viimSetting: {
    "ui:field": "pythonFilePicker",
  },
  reportSchema: {
    "ui:field": "folderPicker",
  },
};
