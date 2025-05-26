import path from "path-browserify";
import { appInfo } from "../../common/appInfo";
import { constants } from "../../common/constants";
import {
  AppMode,
  IAsset,
  IAssetMetadata,
  IProject,
  ITag,
  ProjectPhase,
  RegionState,
} from "../../models/applicationState";
import { LocalFileSystem } from "../../providers/storage/localFileSystem";
import { AssetService } from "../../services/assetService";
import ProjectService from "../../services/projectService";
import { useAppSettings } from "../state";
import { useSetAtom } from "jotai";
import { currentProjectAtom, recentProjectsAtom } from "../atom";

export interface IProjectActions {
  loadProject(project: IProject): Promise<IProject>;
  saveProject(project: IProject): Promise<IProject>;
  createOrLoadProject(projectName: string): Promise<IProject>;
  clearProject(project: IProject): Promise<void>;
  clearAllProjects(): void;
  closeProject(): void;
  loadAssets(project: IProject): Promise<IAsset[]>;
  loadAssetMetadata(project: IProject, asset: IAsset): Promise<IAssetMetadata>;
  saveAssetMetadata(
    project: IProject,
    assetMetadata: IAssetMetadata
  ): Promise<IAssetMetadata>;
}

const useProjectActions = (): IProjectActions => {
  const setCurrentProject = useSetAtom(currentProjectAtom);
  const setRecentProjects = useSetAtom(recentProjectsAtom);
  const appSettings = useAppSettings();
  const { rootDirectory, tags, appMode } = appSettings;

  const loadProject = (project: IProject) => {
    setCurrentProject({ ...project });
  };

  const saveProject = async (project: IProject) => {
    const projectService = new ProjectService();
    const savedProject = await projectService.save(project, rootDirectory);
    setRecentProjects((projects) => [
      { ...savedProject },
      ...projects.filter((p) => p.id !== project.id),
    ]);
    return savedProject;
  };

  const closeProject = () => {
    setCurrentProject(undefined);
  };

  const clearProject = (project: IProject) => {
    setCurrentProject(undefined);
    setRecentProjects((projects) => [
      ...projects.filter((p) => p.id !== project.id),
    ]);
  };

  const setProjects = (projects: IProject[]) => {
    setCurrentProject(undefined);
    setRecentProjects(projects);
  };

  const saveAssetMetadata = (assetMetadata: IAssetMetadata) => {
    setCurrentProject((project) => {
      if (!project) {
        return undefined;
      }

      const updatedAssets = { ...project.assets };
      updatedAssets[assetMetadata.asset.name] = { ...assetMetadata.asset };

      const assetTags = new Set<string>();
      assetMetadata.regions.forEach((region) =>
        region.tags.forEach((tag) => assetTags.add(tag))
      );

      const newTags: ITag[] = project.tags ? [...project.tags] : [];
      let updateTags = false;
      const colors = Object.values(constants.tagColors);

      assetTags.forEach((tag: string) => {
        if (
          !project.tags ||
          project.tags.length === 0 ||
          !project.tags.find((projectTag) => tag === projectTag.name)
        ) {
          newTags.push({
            name: tag,
            color: colors[newTags.length % colors.length],
          });
          updateTags = true;
        }
      });

      if (updateTags) {
        return {
          ...project,
          tags: newTags,
          assets: updatedAssets,
        };
      }

      return {
        ...project,
        assets: updatedAssets,
      };
    });
  };

  const projectActions = {
    loadProject: async (project: IProject) => {
      const projectService = new ProjectService();
      const loadedProject = await projectService.load(project);
      loadProject(loadedProject);
      return loadedProject;
    },
    saveProject: async (project: IProject) => {
      return await saveProject(project);
    },
    closeProject: async () => {
      closeProject();
    },

    clearProject: async (project: IProject) => {
      clearProject(project);
    },

    clearAllProjects: async () => {
      setProjects([]);
    },
    loadAssets: async (project: IProject) => {
      const assetService = new AssetService(project, rootDirectory);
      const assets: IAsset[] = await assetService.getAssets();

      return assets;
    },
    loadAssetMetadata: async (project: IProject, asset: IAsset) => {
      const assetService = new AssetService(project, rootDirectory);
      const assetMetadata = await assetService.getAssetMetadata(asset);
      return {
        ...assetMetadata,
        regions: assetMetadata.regions.map((region) => {
          return {
            ...region,
            state: region.state || RegionState.Inputted,
          };
        }),
      };
    },
    saveAssetMetadata: async (
      project: IProject,
      assetMetadata: IAssetMetadata
    ) => {
      const newAssetMetadata = {
        ...assetMetadata,
        version: appInfo.version,
      };
      const assetService = new AssetService(project, rootDirectory);
      const savedMetadata = await assetService.save(newAssetMetadata);
      saveAssetMetadata(savedMetadata);
      return savedMetadata;
    },

    createOrLoadProject: async (projectName: string) => {
      let project = {
        name: projectName,
        phase: ProjectPhase.Waiting,
        tags: [...tags],
        assets: {},
      } as IProject;

      const targetPath = path.join(
        rootDirectory,
        projectName,
        constants.projectTargetDirectoryName
      );
      if (!(await LocalFileSystem.exists(targetPath))) {
        try {
          await LocalFileSystem.createDirectory(targetPath);
        } catch (e) {
          console.log(e);
        }
      }

      const projectFile = path.join(
        targetPath,
        `${projectName}${constants.projectFileExtension}`
      );
      const exists = await LocalFileSystem.exists(projectFile);
      if (exists) {
        const projectData = await LocalFileSystem.readText(projectFile);
        let importedProject: IProject;
        try {
          importedProject = JSON.parse(projectData) as IProject;
          project = {
            ...importedProject,
            tags: [...project.tags],
            version: appInfo.version,
          };
        } catch {
          console.log(projectData);
        }
      }

      if (appMode !== AppMode.Internal) {
        const projectService = new ProjectService();
        project = await projectService.loadTimingsFile(project, appSettings);
      }
      return await saveProject(project);
    },
  };

  return projectActions;
};

export default useProjectActions;
