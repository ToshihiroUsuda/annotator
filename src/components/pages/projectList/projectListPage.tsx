import React, { useState, useEffect } from "react";
import { FaFolderPlus, FaTrash } from "react-icons/fa";
import localForage from "localforage";
import _ from "lodash";
import path from "path-browserify";
import { IProjectActions } from "../../../atom/actions/project";
import { constants } from "../../../common/constants";
import { strings } from "../../../common/strings";
import { normalizeSlashes } from "../../../common/utils";
import {
  AssetState,
  IAppSettings,
  IAssetMetadata,
  IEditorState,
  IProject,
  ProjectPhase,
} from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import Confirm from "../../common/confirm";
import { ProgressCircle } from "../../common/progressCircle";
import PropsWithNavigate from "../navigate";
import ProjectList from "./projectList";

export interface IProjectListPageProps extends PropsWithNavigate {
  recentProjects: IProject[];
  currentProject?: IProject;
  actions: IProjectActions;
  appSettings: IAppSettings;
}

const ProjectListPage: React.FC<IProjectListPageProps> = (props) => {
  const [isProgressCircleActive, setIsProgressCircleActive] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [shownModal, setShownModal] = useState<"none" | "importConfirm" | "clearAllConfirm">("none");

  useEffect(() => {
    const initializeComponent = async () => {
      const editorState = (await localForage.getItem(
        "editorState"
      )) as IEditorState;
      if (editorState) {
        saveAll(editorState);
      }
    };
    initializeComponent();
  }, []);

  const makeProjctsLists = () => {
    const recentProjectsItems = [
      {
        name: "Current Project",
        projects: props.currentProject ? [props.currentProject] : [],
      },
      {
        name: "Working Projects",
        projects: props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Working
        ),
      },
      {
        name: "Waiting Projects",
        projects: props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Waiting
        ),
      },
      {
        name: "Completed Projects",
        projects: props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Completed
        ),
      },
    ];
    return (
      <ProjectList
        projectsListItems={recentProjectsItems}
        onClick={loadSelectedProject}
      />
    );
  };

  const importProjects = async () => {
    setShownModal("none");

    if (isProgressCircleActive) {
      return;
    }
    const folderPaths = await LocalFileSystem.listDirectories(
      props.appSettings.rootDirectory
    );
    const numOfProject = folderPaths.length;
    setIsProgressCircleActive(true);
    setProgressValue(0);

    await Promise.all(
      folderPaths.map(async (folderPath) => {
        const projectName = path.basename(normalizeSlashes(folderPath));
        await props.actions.createOrLoadProject(projectName);
        setProgressValue((prevValue) => prevValue + 100 / numOfProject);
      })
    );

    setIsProgressCircleActive(false);
    setProgressValue(0);
  };

  const loadSelectedProject = async (project: IProject) => {
    await props.actions.loadProject(project);
    props.navigate(`/projects/${project.id}`);
  };

  const clearAllProjects = () => {
    props.actions.closeProject();
    props.actions.clearAllProjects();
    setShownModal("none");
  };

  const saveAll = async (editorState: IEditorState) => {
    let rootDirectory: string | null = editorState.rootDirectory;
    const project = editorState.project;
    const assetMetadataList = editorState.assetMetadataList;
    const regionMetadataList = editorState.regionMetadataList;
    const modifiedAssetList = editorState.modifiedAssetList;

    if (!(await LocalFileSystem.exists(rootDirectory))) {
      rootDirectory = await LocalFileSystem.selectDirectory();
    }
    if (rootDirectory) {
      const projectPath = [rootDirectory, project.name].join("/");
      if (!(await LocalFileSystem.exists(projectPath))) {
        await LocalFileSystem.createDirectory(projectPath);
      }
      const assetPath = [
        rootDirectory,
        project.name,
        constants.projectTargetDirectoryName,
      ].join("/");
      if (!(await LocalFileSystem.exists(assetPath))) {
        await LocalFileSystem.createDirectory(assetPath);
      }
      const numOfFile = 3 + _.keys(modifiedAssetList).length;
      setIsProgressCircleActive(true);
      let index = 0;
      setProgressValue((100 * index) / numOfFile);
      const assetFilePath = [
        assetPath,
        `${project.name}${constants.assetMetadataListFileExtension}`,
      ].join("/");
      await LocalFileSystem.writeText(
        assetFilePath,
        JSON.stringify(assetMetadataList)
      );
      index += 1;
      setProgressValue((100 * index) / numOfFile);
      const regionFilePath = [
        assetPath,
        `${project.name}${constants.regionMetadataListFileExtension}`,
      ].join("/");
      await LocalFileSystem.writeText(
        regionFilePath,
        JSON.stringify(regionMetadataList)
      );
      index += 1;
      setProgressValue((100 * index) / numOfFile);
      const updatedAssets = { ...project.assets };
      await _.values(modifiedAssetList).forEachAsync(
        async (assetMetadata: IAssetMetadata) => {
          index += 1;
          setProgressValue((100 * index) / numOfFile);
          await props.actions.saveAssetMetadata(project, assetMetadata);
          if (
            assetMetadata.asset.state === AssetState.Sample ||
            assetMetadata.asset.state === AssetState.Store ||
            assetMetadata.asset.state === AssetState.Freeze ||
            assetMetadata.asset.state === AssetState.FreezeStore ||
            assetMetadata.asset.state === AssetState.Tracked ||
            assetMetadata.asset.state === AssetState.Interpolated ||
            assetMetadata.asset.step
          ) {
            updatedAssets[assetMetadata.asset.name] = {
              ...assetMetadata.asset,
            };
          }
        }
      );
      await props.actions.saveProject({
        ...project,
        assets: updatedAssets,
      });
      setProgressValue(0);
      setIsProgressCircleActive(false);
      localForage.removeItem("editorState");
    }
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {isProgressCircleActive && (
        <ProgressCircle value={progressValue} />
      )}
      <div className="h-14 bg-black/10 border-b border-white/10">
        <div className="flex flex-row items-center justify-center">
          <ToolbarButton
            icon={FaFolderPlus}
            onClick={() => {
              setShownModal("importConfirm");
            }}
          />
          <ToolbarButton
            icon={FaTrash}
            onClick={() => {
              setShownModal("clearAllConfirm");
            }}
          />
        </div>
      </div>
      <div className="flex flex-grow flex-row">{makeProjctsLists()}</div>
      <Confirm
        show={shownModal === "clearAllConfirm"}
        title="Clear All Projects"
        message={() => `${strings.homePage.clearProject.confirmation}?`}
        confirmButtonColor="danger"
        onConfirm={clearAllProjects}
      />
      <Confirm
        show={shownModal === "importConfirm"}
        title="Import Projects"
        message={
          strings.homePage.importProject.confirmation +
          " " +
          props.appSettings.rootDirectory +
          "?"
        }
        confirmButtonColor="danger"
        onConfirm={importProjects}
      />
    </div>
  );
};

export default ProjectListPage;

const ToolbarButton: React.FC<{ icon: React.ComponentType; onClick: () => void }> = (
  props
) => (
  <div
    className="w-14 h-14 outline-none flex flex-row bg-transparent border-none text-gray-300 list-none items-center cursor-pointer hover:bg-white/10 hover:border hover:border-white/15 active:bg-black/10"
    onClick={props.onClick}
  >
    <span className="inline-flex m-auto">
      {React.createElement(props.icon, { style: { fontSize: '24px' } })}
    </span>
  </div>
);
