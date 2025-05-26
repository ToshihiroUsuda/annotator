import React from "react";
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
import "./projectListpage.scss";

export interface IProjectListPageProps extends PropsWithNavigate {
  recentProjects: IProject[];
  currentProject?: IProject;
  actions: IProjectActions;
  appSettings: IAppSettings;
}

export interface IProjectListPageState {
  isProgressCircleActive: boolean;
  progressValue: number;
  shownModal: "none" | "importConfirm" | "clearAllConfirm";
}

export default class ProjectListPage extends React.Component<
  IProjectListPageProps,
  IProjectListPageState
> {
  public state: IProjectListPageState = {
    isProgressCircleActive: false,
    progressValue: 0,
    shownModal: "none",
  };

  public componentDidMount = async () => {
    const editorState = (await localForage.getItem(
      "editorState"
    )) as IEditorState;
    if (editorState) {
      this.saveAll(editorState);
    }
  };

  public render() {
    return (
      <div className="app-homepage">
        {this.state.isProgressCircleActive && (
          <ProgressCircle value={this.state.progressValue} />
        )}
        <div className="app-homepage-toolbar">
          <div className="app-homepage-toolbar-buttons">
            <ToolbarButton
              icon="fa-folder-plus"
              onClick={() => {
                this.setState({ shownModal: "importConfirm" });
              }}
            />
            <ToolbarButton
              icon="fa-trash"
              onClick={() => {
                this.setState({ shownModal: "clearAllConfirm" });
              }}
            />
          </div>
        </div>
        <div className="app-homepage-list">{this.makeProjctsLists()}</div>
        <Confirm
          show={this.state.shownModal === "clearAllConfirm"}
          title="Clear All Projects"
          message={() => `${strings.homePage.clearProject.confirmation}?`}
          confirmButtonColor="danger"
          onConfirm={this.clearAllProjects}
        />
        <Confirm
          show={this.state.shownModal === "importConfirm"}
          title="Import Projects"
          message={
            strings.homePage.importProject.confirmation +
            " " +
            this.props.appSettings.rootDirectory +
            "?"
          }
          confirmButtonColor="danger"
          onConfirm={this.importProjects}
        />
      </div>
    );
  }

  private makeProjctsLists = () => {
    const recentProjectsItems = [
      {
        name: "Current Project",
        projects: this.props.currentProject ? [this.props.currentProject] : [],
      },
      {
        name: "Working Projects",
        projects: this.props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Working
        ),
      },
      {
        name: "Waiting Projects",
        projects: this.props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Waiting
        ),
      },
      {
        name: "Completed Projects",
        projects: this.props.recentProjects.filter(
          (project) => project.phase === ProjectPhase.Completed
        ),
      },
    ];
    return (
      <ProjectList
        projectsListItems={recentProjectsItems}
        onClick={this.loadSelectedProject}
      />
    );
  };

  private importProjects = async () => {
    // this.props.actions.closeProject();
    this.setState({ shownModal: "none" });

    if (this.state.isProgressCircleActive) {
      return;
    }
    const folderPaths = await LocalFileSystem.listDirectories(
      this.props.appSettings.rootDirectory
    );
    const numOfProject = folderPaths.length;
    this.setState({ isProgressCircleActive: true, progressValue: 0 });
    // for (const folderPath of folderPaths) {
    //     const projectName = path.basename(normalizeSlashes(folderPath))
    //     await this.props.actions.createOrLoadProject(projectName)
    //     index += 1
    //     this.setState({ progressValue: (100 * index) / numOfProject })
    // }

    await Promise.all(
      folderPaths.map(async (folderPath) => {
        const projectName = path.basename(normalizeSlashes(folderPath));
        await this.props.actions.createOrLoadProject(projectName);
        this.setState((prevState) => ({
          progressValue: prevState.progressValue + 100 / numOfProject,
        }));
      })
    );
    // this.props.actions.closeProject();
    // toast.success(interpolate(strings.projectSettings.messages.saveSuccess, { project }))
    this.setState({
      isProgressCircleActive: false,
      progressValue: 0,
    });
  };

  private loadSelectedProject = async (project: IProject) => {
    await this.props.actions.loadProject(project);
    this.props.navigate(`/projects/${project.id}`);
  };

  private clearAllProjects = () => {
    this.props.actions.closeProject();
    this.props.actions.clearAllProjects();
    this.setState({ shownModal: "none" });
  };

  private saveAll = async (editorState: IEditorState) => {
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
      this.setState({ isProgressCircleActive: true });
      let index = 0;
      this.setState({ progressValue: (100 * index) / numOfFile });
      const assetFilePath = [
        assetPath,
        `${project.name}${constants.assetMetadataListFileExtension}`,
      ].join("/");
      await LocalFileSystem.writeText(
        assetFilePath,
        JSON.stringify(assetMetadataList)
      );
      index += 1;
      this.setState({ progressValue: (100 * index) / numOfFile });
      const regionFilePath = [
        assetPath,
        `${project.name}${constants.regionMetadataListFileExtension}`,
      ].join("/");
      await LocalFileSystem.writeText(
        regionFilePath,
        JSON.stringify(regionMetadataList)
      );
      index += 1;
      this.setState({ progressValue: (100 * index) / numOfFile });
      const updatedAssets = { ...project.assets };
      await _.values(modifiedAssetList).forEachAsync(
        async (assetMetadata: IAssetMetadata) => {
          index += 1;
          this.setState({ progressValue: (100 * index) / numOfFile });
          await this.props.actions.saveAssetMetadata(project, assetMetadata);
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
      await this.props.actions.saveProject({
        ...project,
        assets: updatedAssets,
      });
      this.setState({ progressValue: 0, isProgressCircleActive: false });
      localForage.removeItem("editorState");
    }
  };
}

const ToolbarButton: React.FC<{ icon: string; onClick: () => void }> = (
  props
) => (
  <div className="toolbar-btn" onClick={props.onClick}>
    <a>
      <i className={`fas ${props.icon}`}></i>
    </a>
  </div>
);
