import { useSetAtom } from 'jotai'

import {
    IAppError,
    IAppSettings,
    IAssetMetadata,
    IProject,
    IReport,
    ITag,
} from '../models/applicationState'
import * as atoms from './atom'
import { constants } from '../common/constants'

export const saveAppSettingsAction = (appSettings: IAppSettings) => {
    const setAppSettings = useSetAtom(atoms.appSettingsAtom)
    setAppSettings(appSettings)
}

export const showErrorAction = (appError: IAppError) => {
    const setAppError = useSetAtom(atoms.appErrorAtom)
    setAppError(appError)
}

export const clearErrorAction = () => {
    const setAppError = useSetAtom(atoms.appErrorAtom)
    setAppError(undefined)
}

export const loadProjectAction = (project: IProject) => {
    const setCurrentProject = useSetAtom(atoms.currentProjectAtom)
    setCurrentProject({ ...project })
}

export const saveProjectAction = (project: IProject) => {
    const setRecentProjects = useSetAtom(atoms.recentProjectsAtom)
    setRecentProjects((projects) => [
        { ...project },
        ...projects.filter((p) => p.id !== project.id),
    ])
}

export const closeProjectAction = () => {
    const setCurrentProject = useSetAtom(atoms.currentProjectAtom)
    setCurrentProject(undefined)
}

export const deleteProjectAction = (project: IProject) => {
    const setCurrentProject = useSetAtom(atoms.currentProjectAtom)
    setCurrentProject(undefined)
    const setRecentProjects = useSetAtom(atoms.recentProjectsAtom)
    setRecentProjects((projects) => [
        ...projects.filter((p) => p.id !== project.id),
    ])
}

export const setProjectsAction = (projects: IProject[]) => {
    const setCurrentProject = useSetAtom(atoms.currentProjectAtom)
    setCurrentProject(undefined)
    const setRecentProjects = useSetAtom(atoms.recentProjectsAtom)
    setRecentProjects(projects)
}

export const saveAssetMetadataAction = (assetMetadata: IAssetMetadata) => {
    const setCurrentProject = useSetAtom(atoms.currentProjectAtom)
    setCurrentProject((project) => {
        if (!project) {
            return undefined
        }

        const updatedAssets = { ...project.assets }
        updatedAssets[assetMetadata.asset.name] = { ...assetMetadata.asset }

        const assetTags = new Set<string>()
        assetMetadata.regions.forEach((region) =>
            region.tags.forEach((tag) => assetTags.add(tag))
        )

        const newTags: ITag[] = project.tags ? [...project.tags] : []
        let updateTags = false
        const colors = Object.values(constants.tagColors)

        assetTags.forEach((tag: string) => {
            if (
                !project.tags ||
                project.tags.length === 0 ||
                !project.tags.find((projectTag) => tag === projectTag.name)
            ) {
                newTags.push({
                    name: tag,
                    color: colors[newTags.length % colors.length],
                })
                updateTags = true
            }
        })

        if (updateTags) {
            return {
                ...project,
                tags: newTags,
                assets: updatedAssets,
            }
        }

        return {
            ...project,
            assets: updatedAssets,
        }
    })
}

export const loadReportAction = (report: IReport) => {
    const setCurrentReport = useSetAtom(atoms.currentReportAtom)
    setCurrentReport({ ...report })
}

export const saveReportAction = (report: IReport) => {
    const setRecentReports = useSetAtom(atoms.recentReportsAtom)
    setRecentReports((reports) => [
        { ...report },
        ...reports.filter((p) => p.id !== report.id),
    ])
}

export const closeReportAction = () => {
    const setCurrentReport = useSetAtom(atoms.currentReportAtom)
    setCurrentReport(undefined)
}

export const deleteReportAction = (report: IReport) => {
    const setCurrentReport = useSetAtom(atoms.currentReportAtom)
    setCurrentReport(undefined)
    const setRecentReports = useSetAtom(atoms.recentReportsAtom)
    setRecentReports((reports) => [
        ...reports.filter((p) => p.id !== report.id),
    ])
}

export const setReportsAction = (reports: IReport[]) => {
    const setCurrentReport = useSetAtom(atoms.currentReportAtom)
    setCurrentReport(undefined)
    const setRecentReports = useSetAtom(atoms.recentReportsAtom)
    setRecentReports(reports)
}
