import { IAppStrings } from "../strings";

/**
 * App Strings for English language
 */
export const english: IAppStrings = {
  appName: "Visual Object Tagging Tool",
  common: {
    displayName: "Display Name",
    description: "Description",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    provider: "Provider",
    homePage: "Home Page",
  },
  titleBar: {
    help: "Help",
    minimize: "Minimize",
    maximize: "Maximize",
    restore: "Restore",
    close: "Close",
  },
  homePage: {
    newProject: "New Project",
    openLocalProject: {
      title: "Open Local Project",
    },
    recentProjects: "Recent Projects",
    deleteProject: {
      title: "Delete Project",
      confirmation: "Are you sure you want to delete project",
    },
    clearProject: {
      title: "Clear Project",
      confirmation: "Are you sure you want to clear project",
    },
    importProject: {
      title: "Import Project",
      confirmation: "Are you sure you want to import project from",
    },
    messages: {
      deleteSuccess: "Successfully deleted ${project.name}",
    },
    selectDirectory: "Select Directory",
    selectFile: "Select File",
    chooseDirectory: "Choose Directory",
  },
  appSettings: {
    title: "Application Settings",
    storageTitle: "Storage Settings",
    uiHelp: "Where your settings are stored",
    save: "Save Settings",
    securityToken: {
      name: {
        title: "Name",
      },
      key: {
        title: "Key",
      },
    },
    securityTokens: {
      title: "Security Tokens",
      description:
        "Security tokens are used to encrypt sensitive data within your project configuration",
    },
    version: {
      description: "Version:",
    },
    commit: "Commit SHA",
    devTools: {
      description: "Open application developer tools to help diagnose issues",
      button: "Toggle Developer Tools",
    },
    reload: {
      description: "Reload the app discarding all current changes",
      button: "Refresh Application",
    },
    messages: {
      saveSuccess: "Successfully saved application settings",
    },
    rootDirectory: "Root Directory",
  },
  projectSettings: {
    title: "Project Settings",
    securityToken: {
      title: "Security Token",
      description: "Used to encrypt sensitive data within project files",
    },
    save: "Save Project",
    sourcePath: "Directory Name",
    videoSettings: {
      title: "Video Settings",
      description: "The rate at which frames are extracted for tagging.",
      frameExtractionRate: "Frame Extraction Rate (frames per a video second)",
    },
    addConnection: "Add Connection",
    messages: {
      saveSuccess: "Successfully saved ${project.name} project settings",
    },
  },
  projectMetrics: {
    title: "Project Metrics",
    assetsSectionTitle: "Assets",
    totalAssetCount: "Total Assets",
    visitedAssets: "Visited Assets (${count})",
    taggedAssets: "Tagged Assets (${count})",
    nonTaggedAssets: "Not Tagged Assets (${count})",
    nonVisitedAssets: "Not Visited Assets (${count})",
    tagsSectionTitle: "Tags & Labels",
    totalRegionCount: "Total Tagged Regions",
    totalTagCount: "Total Tags",
    avgTagCountPerAsset: "Average tags per asset",
  },
  tags: {
    title: "Tags",
    placeholder: "Add new tag",
    editor: "Tags Editor",
    modal: {
      name: "Tag Name",
      color: "Tag Color",
    },
    colors: {
      white: "White",
      gray: "Gray",
      red: "Red",
      maroon: "Maroon",
      yellow: "Yellow",
      olive: "Olive",
      lime: "Lime",
      green: "Green",
      aqua: "Aqua",
      teal: "Teal",
      blue: "Blue",
      navy: "Navy",
      fuschia: "Fuschia",
      purple: "Purple",
    },
    warnings: {
      existingName: "Tag name already exists. Choose another name",
      emptyName: "Cannot have an empty tag name",
      unknownTagName: "Unknown",
    },
    toolbar: {
      add: "Add new tag",
      search: "Search tags",
      edit: "Edit tag",
      lock: "Lock tag",
      moveUp: "Move tag up",
      moveDown: "Move tag down",
      delete: "Delete tag",
    },
  },
  editorPage: {
    width: "Width",
    height: "Height",
    tagged: "Tagged",
    visited: "Visited",
    toolbar: {
      select: "Select",
      pan: "Pan",
      drawRectangle: "Draw Rectangle",
      drawPolygon: "Draw Polygon",
      copyRectangle: "Copy Rectangle",
      trackRegions: "Track Regions",
      interpolateRegions: "Interpolate Regions",
      copy: "Copy Regions",
      cut: "Cut Regions",
      paste: "Paste Regions",
      removeAllRegions: "Remove All Regions",
      previousAsset: "Previous Asset",
      nextAsset: "Next Asset",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      saveProject: "Save Project",
      exportProject: "Export Project",
      activeLearning: "Active Learning",
    },
    videoPlayer: {
      previousTaggedFrame: {
        tooltip: "Previous Key Frame",
      },
      nextTaggedFrame: {
        tooltip: "Next Key Frame",
      },
      previousExpectedFrame: {
        tooltip: "Previous Frame",
      },
      nextExpectedFrame: {
        tooltip: "Next Frame",
      },
      previous5ExpectedFrame: {
        tooltip: "Previous 5 Frame",
      },
      next5ExpectedFrame: {
        tooltip: "Next 5 Frame",
      },
      previous30ExpectedFrame: {
        tooltip: "Previous 30 Frame",
      },
      next30ExpectedFrame: {
        tooltip: "Next 30 Frame",
      },
    },
    help: {
      title: "Toggle Help Menu",
      escape: "Escape Help Menu",
    },
    assetError: "Unable to load asset",
    tags: {
      hotKey: {
        apply: "Apply Tag with Hot Key",
        lock: "Lock Tag with Hot Key",
      },
      rename: {
        title: "Rename Tag",
        confirmation:
          "Are you sure you want to rename this tag? It will be renamed throughout all assets",
      },
      delete: {
        title: "Delete Tag",
        confirmation:
          "Are you sure you want to delete this tag? It will be deleted throughout all assets \
                and any regions where this is the only tag will also be deleted",
      },
    },
    canvas: {
      removeAllRegions: {
        title: "Remove All Regions",
        confirmation: "Are you sure you want to remove all regions?",
      },
      interpolation: {
        title: "Interpolate Regions",
        confirmation: "Are you sure you want to interpolate regions?",
      },
      untaggedRegion: {
        title: "There are unttagged regions",
        confirmation:
          'There are unttagged regions. If you want to delete untagged regions, press "Yes".',
      },
      missedFrameLabel: {
        title: "No frame label Information",
        confirmation:
          "Frame label information has not been entered. Would you like to enter it?",
      },
    },
    messages: {
      enforceTaggedRegions: {
        title: "Invalid region(s) detected",
        description:
          "1 or more regions have not been tagged.  Ensure all regions are tagged before \
                    continuing to next asset.",
      },
    },
  },
  export: {
    title: "Export",
    settings: "Export Settings",
    saveSettings: "Save Export Settings",
    providers: {
      common: {
        properties: {
          assetState: {
            title: "Asset State",
            description: "Which assets to include in the export",
            options: {
              all: "All Assets",
              visited: "Only Visited Assets",
              tagged: "Only tagged Assets",
            },
          },
          testTrainSplit: {
            title: "Test / Train Split",
            description: "The test train split to use for exported data",
          },
          includeImages: {
            title: "Include Images",
            description:
              "Whether or not to include binary image assets in target connection",
          },
        },
      },
      vottJson: {
        displayName: "VoTT JSON",
      },
      azureCV: {
        displayName: "Azure Custom Vision Service",
        regions: {
          australiaEast: "Australia East",
          centralIndia: "Central India",
          eastUs: "East US",
          eastUs2: "East US 2",
          japanEast: "Japan East",
          northCentralUs: "North Central US",
          northEurope: "North Europe",
          southCentralUs: "South Central US",
          southeastAsia: "Southeast Asia",
          ukSouth: "UK South",
          westUs2: "West US 2",
          westEurope: "West Europe",
        },
        properties: {
          apiKey: {
            title: "API Key",
          },
          region: {
            title: "Region",
            description: "The Azure region where your service is deployed",
          },
          classificationType: {
            title: "Classification Type",
            options: {
              multiLabel: "Multiple tags per image",
              multiClass: "Single tag per image",
            },
          },
          name: {
            title: "Project Name",
          },
          description: {
            title: "Project Description",
          },
          domainId: {
            title: "Domain",
          },
          newOrExisting: {
            title: "New or Existing Project",
            options: {
              new: "New Project",
              existing: "Existing Project",
            },
          },
          projectId: {
            title: "Project Name",
          },
          projectType: {
            title: "Project Type",
            options: {
              classification: "Classification",
              objectDetection: "Object Detection",
            },
          },
        },
      },
      tfRecords: {
        displayName: "Tensorflow Records",
      },
      pascalVoc: {
        displayName: "Pascal VOC",
        exportUnassigned: {
          title: "Export Unassigned",
          description:
            "Whether or not to include unassigned tags in exported data",
        },
      },
      cntk: {
        displayName: "Microsoft Cognitive Toolkit (CNTK)",
      },
      csv: {
        displayName: "Comma Separated Values (CSV)",
      },
    },
    messages: {
      saveSuccess: "Successfully saved export settings",
    },
  },
  activeLearning: {
    title: "Active Learning",
    form: {
      properties: {
        modelPathType: {
          title: "Model Provider",
          description: "Where to load the training model from",
          options: {
            preTrained: "Pre-trained Coco SSD",
            customFilePath: "Custom (File path)",
            customWebUrl: "Custom (Url)",
          },
        },
        autoDetect: {
          title: "Auto Detect",
          description:
            "Whether or not to automatically make predictions as you navigate between assets",
        },
        modelPath: {
          title: "Model path",
          description: "Select a model from your local file system",
        },
        modelUrl: {
          title: "Model URL",
          description: "Load your model from a public web URL",
        },
        predictTag: {
          title: "Predict Tag",
          description:
            "Whether or not to automatically include tags in predictions",
        },
      },
    },
    messages: {
      loadingModel: "Loading active learning model...",
      errorLoadModel: "Error loading active learning model",
      saveSuccess: "Successfully saved active learning settings",
    },
  },
  profile: {
    settings: "Profile Settings",
  },
  errors: {
    unknown: {
      title: "Unknown Error",
      message: "The app encountered an unknown error. Please try again.",
    },
    projectUploadError: {
      title: "Error Uploading File",
      message: `There was an error uploading the file.
                Please verify the file is of the correct format and try again.`,
    },
    genericRenderError: {
      title: "Error Loading Application",
      message:
        "An error occured while rendering the application. Please try again",
    },
    projectInvalidJson: {
      title: "Error parsing project file",
      message:
        "The selected project files does not contain valid JSON. Please check the file any try again.",
    },
    projectDeleteError: {
      title: "Error deleting project",
      message: `An error occured while deleting the project.
                Validate the project file and security token exist and try again`,
    },
    canvasError: {
      title: "Error loading canvas",
      message:
        "There was an error loading the canvas, check the project's assets and try again.",
    },
    exportFormatNotFound: {
      title: "Error exporting project",
      message:
        "Project is missing export format.  Please select an export format in the export setting page.",
    },
    activeLearningPredictionError: {
      title: "Active Learning Error",
      message:
        "An error occurred while predicting regions in the current asset. \
                Please verify your active learning configuration and try again",
    },
    projectImportError: {
      title: "Error Importing Project",
      message:
        "An error occurred while importing the project. Please verify the project file and try again.",
    },
    assetImportError: {
      title: "Error Importing Asset",
      message:
        "An error occurred while importing the asset. Please verify the asset file and try again.",
    },
    assetExportError: {
      title: "Error Exporting Asset",
      message:
        "An error occurred while exporting the asset. Please verify the export settings and try again.",
    },
    pasteRegionTooBigError: {
      title: "Error Pasting Region",
      message:
        "The region being pasted is too large for the current asset. Please try pasting to a larger asset.",
    },
    overloadedKeyBinding: {
      title: "Keyboard Shortcut Conflict",
      message:
        "The keyboard shortcut is already assigned to another action. Please choose a different shortcut.",
    },
    formSchemaImportError: {
      title: "Error Importing Form Schema",
      message:
        "An error occurred while importing the form schema. Please verify the schema file and try again.",
    },
    databaseJsonNotFoundError: {
      title: "Database Configuration Error",
      message:
        "The database configuration file could not be found. Please verify the database settings and try again.",
    },
    videoLoadError: {
      title: "Error Loading Video",
      message:
        "An error occurred while loading the video asset. Please check the video file and try again.",
    },
  },
};
