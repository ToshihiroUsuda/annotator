import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import {
    IAppError,
    IAppSettings,
    IProject,
    IReport,
} from '../models/applicationState'
import initialState from './initialState'

export const appSettingsAtom = atomWithStorage<IAppSettings>(
    'appSettings',
    initialState.appSettings,
    undefined,
    { getOnInit: true }
)
export const recentProjectsAtom = atomWithStorage<IProject[]>(
    'recentProjects',
    initialState.recentProjects,
    undefined,
    { getOnInit: true }
)
export const recentReportsAtom = atomWithStorage<IReport[]>(
    'recentProjects',
    initialState.recentReports,
    undefined,
    { getOnInit: true }
)
export const currentProjectAtom = atomWithStorage<IProject | undefined>(
    'currentProject',
    initialState.currentProject,
    undefined,
    { getOnInit: true }
)
export const currentReportAtom = atomWithStorage<IReport | undefined>(
    'currentReport',
    initialState.currentReport,
    undefined,
    { getOnInit: true }
)
export const appErrorAtom = atom<IAppError | undefined>(initialState.appError)
