import _ from 'lodash'
import shortid from 'shortid'
import { appInfo } from '../common/appInfo'
import { constants } from '../common/constants'
import Guard from '../common/guard'
import {
    AssetState,
    AssetType,
    IAppSettings,
    IAsset,
    IProject,
    IProjectVideoSettings,
    ProjectPhase,
} from '../models/applicationState'
import { LocalFileSystem } from '../providers/storage/localFileSystem'
import { AssetService } from './assetService'
import path from 'path-browserify'

export interface IProjectService {
    load(project: IProject): Promise<IProject>
    save(project: IProject, rootDirectory: string): Promise<IProject>
    delete(project: IProject, rootDirectory: string): Promise<void>
    isDuplicate(project: IProject, projectList: IProject[]): boolean
    loadTimingsFile(
        project: IProject,
        appSettings: IAppSettings
    ): Promise<IProject>
}

const defaultVideoSettings: IProjectVideoSettings = {
    frameExtractionRate: 30,
}

export default class ProjectService implements IProjectService {
    public load(project: IProject): Promise<IProject> {
        Guard.null(project)

        const loadedProject = { ...project }
        // Ensure tags is always initialized to an array
        if (!loadedProject.tags) {
            loadedProject.tags = []
        }

        if (!loadedProject.phase) {
            loadedProject.phase = ProjectPhase.Waiting
        }

        // this.ensureBackwardsCompatibility(loadedProject);

        return Promise.resolve({ ...loadedProject })
    }

    public async save(
        project: IProject,
        rootDirectory: string
    ): Promise<IProject> {
        Guard.null(project)

        if (!project.id) {
            project.id = shortid.generate()
        }

        // Ensure tags is always initialized to an array
        if (!project.tags) {
            project.tags = []
        }

        // if (!project.regionMetadata) {
        //     project.regionMetadata = {}
        // }

        if (!project.phase) {
            project.phase = ProjectPhase.Waiting
        }
        if (!project.videoSettings) {
            project.videoSettings = defaultVideoSettings
        }
        project.version = appInfo.version
        const targetDirectory = path.join(
            rootDirectory,
            project.name,
            constants.projectTargetDirectoryName
        )
        await LocalFileSystem.writeText(
            path.join(
                targetDirectory,
                `${project.name}${constants.projectFileExtension}`
            ),
            JSON.stringify(project, null, 4)
        )

        return project
    }

    public async delete(
        project: IProject,
        rootDirectory: string
    ): Promise<void> {
        Guard.null(project)

        const targetDirectory = path.join(
            rootDirectory,
            project.name,
            constants.projectTargetDirectoryName
        )
        // Delete all asset metadata files created for project
        const deleteFiles = _.values(project.assets).map((asset) =>
            LocalFileSystem.deleteFile(
                path.join(
                    targetDirectory,
                    `${asset.name}${constants.assetMetadataFileExtension}`
                )
            )
        )

        await Promise.all(deleteFiles)
        await LocalFileSystem.deleteFile(
            path.join(
                targetDirectory,
                `${project.name}${constants.projectFileExtension}`
            )
        )
    }

    public isDuplicate(project: IProject, projectList: IProject[]): boolean {
        const duplicateProjects = projectList.find(
            (p) => p.id !== project.id && p.name === project.name
        )
        return duplicateProjects !== undefined
    }

    public async loadTimingsFile(
        project: IProject,
        appSettings: IAppSettings
    ): Promise<IProject> {
        const assetService = new AssetService(
            project,
            appSettings.rootDirectory
        )
        const rootAssets: IAsset[] = await assetService.getAssets()

        if (project.assets !== undefined) {
            const assets: Record<string, IAsset> = {}
            _.keys(project.assets).forEach(async (key) => {
                const asset = project.assets[key]
                if (
                    asset.state === AssetState.Store ||
                    asset.state === AssetState.Freeze ||
                    asset.state === AssetState.FreezeStore
                ) {
                    const fileName = [
                        project.name,
                        constants.projectTargetDirectoryName,
                        `${asset.name}${constants.assetMetadataFileExtension}`,
                    ].join('/')
                    try {
                        await LocalFileSystem.deleteFile(
                            path.join(appSettings.rootDirectory, fileName)
                        )
                    } catch {
                        return
                    }
                } else {
                    assets[key] = asset
                }
            })
            project.assets = { ...assets }
        } else {
            const newAssets: Record<string, IAsset> = {}
            rootAssets.forEach((rootAsset) => {
                newAssets[rootAsset.name] = rootAsset
            })
            project.assets = { ...newAssets }
        }

        const timingsFiles: Record<string, string> = {}
        const timing = appSettings.timingsFile
        if (timing === 'store' || timing === 'both ' || timing === 'all') {
            timingsFiles['store'] = [project.name, constants.storeJSON].join(
                '/'
            )
        }
        if (timing === 'freeze' || timing === 'both' || timing === 'all') {
            timingsFiles['freeze'] = [project.name, constants.freezeJSON].join(
                '/'
            )
        }
        if (timing === 'freeze_store' || timing === 'all') {
            timingsFiles['freeze_store'] = [
                project.name,
                constants.freezeStoreJSON,
            ].join('/')
        }
        const newAssets: Record<string, IAsset> = {}
        for (const state of _.keys(timingsFiles)) {
            const timingsFile = timingsFiles[state]
            const exists = await LocalFileSystem.exists(timingsFile)
            if (!exists) {
                continue
            }
            const timingsText = await LocalFileSystem.readText(timingsFile)
            const timingsList: { filename: string; timestamp: number }[] =
                JSON.parse(timingsText)
            timingsList.forEach((timing) => {
                const keyFrameTime = 1 / appSettings.frameExtractionRate
                const numberKeyFrames = Math.round(
                    timing.timestamp / keyFrameTime
                )
                const timestamp = +(numberKeyFrames * keyFrameTime).toFixed(6)
                const filename = timing.filename

                const rootAssetIndex = rootAssets.findIndex(
                    (asset: IAsset) => asset.name === filename
                )
                if (rootAssetIndex === -1) {
                    return
                }
                const rootAsset: IAsset = { ...rootAssets[rootAssetIndex] }

                const childAsset: IAsset = AssetService.createAssetFromFileName(
                    `${rootAsset.name}#t=${timestamp}`
                )
                if (project.assets) {
                    if (
                        _.values(project.assets).findIndex(
                            (asset) => asset.name === childAsset.name
                        ) >= 0
                    ) {
                        return
                    }
                }
                switch (state) {
                    case 'store':
                    default:
                        childAsset.state = AssetState.Store
                        break
                    case 'freeze':
                        childAsset.state = AssetState.Freeze
                        break
                    case 'freeze_store':
                        childAsset.state = AssetState.FreezeStore
                        break
                }
                childAsset.type = AssetType.VideoFrame
                childAsset.parent = rootAsset
                childAsset.timestamp = timestamp
                newAssets[childAsset.name] = { ...childAsset }
            })
        }
        return { ...project, assets: newAssets }
    }
}
