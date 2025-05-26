import { useAtomValue } from 'jotai'
import * as atoms from './atom'

export const useAppSettings = () => useAtomValue(atoms.appSettingsAtom)
export const useRecentProjects = () => useAtomValue(atoms.recentProjectsAtom)
export const useRecentReports = () => useAtomValue(atoms.recentReportsAtom)
export const useCurrentProject = () => useAtomValue(atoms.currentProjectAtom)
export const useCurrentReport = () => useAtomValue(atoms.currentReportAtom)
export const useAppError = () => useAtomValue(atoms.appErrorAtom)
