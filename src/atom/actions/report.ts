import shortid from 'shortid'
import { IReport, ReportPhase } from '../../models/applicationState'
import ReportService, { ExportFileType } from '../../services/reportService'
import { useAppSettings, useRecentReports } from '../state'
import { useSetAtom } from 'jotai'
import { recentReportsAtom, currentReportAtom } from '../atom'

export interface IReportActions {
    loadReport(report: IReport): IReport
    saveReport(report: IReport): Promise<IReport>
    closeReport(report: IReport): Promise<void>
    clearReport(report: IReport): Promise<void>
    createReport(name?: string, dateTime?: string): Promise<IReport>
    clearAllReports(): Promise<void>
    loadAllReports(): Promise<void>
    saveAllReports(): Promise<void>
    exportReports(folderPath: string): Promise<void>
}

const useReportActions = (): IReportActions => {
    const setCurrentReport = useSetAtom(currentReportAtom)
    const setRecentReports = useSetAtom(recentReportsAtom)
    const { rootDirectory } = useAppSettings()
    const recentReports = useRecentReports()

    const loadReport = (report: IReport) => {
        setCurrentReport({ ...report })
        return report
    }

    const saveReport = async (report: IReport) => {
        const savedReport = await ReportService.save(report, rootDirectory)
        setRecentReports((reports) => [
            { ...report },
            ...reports.filter((p) => p.id !== report.id),
        ])

        return loadReport(savedReport)
    }

    const setReportsAction = (reports: IReport[]) => {
        setCurrentReport(undefined)
        setRecentReports(reports)
    }

    const saveAllReports = async () => {
        ReportService.exportReportJSON(recentReports, rootDirectory)
    }
    const reportActions = {
        createReport: async (name?: string, dateTime?: string) => {
            const newReport: IReport = {
                name: name || '',
                id: shortid.generate(),
                phase: ReportPhase.Waiting,
                exclusion: false,
                noLesions: false,
                lesionInfo: {
                    lesion1: {},
                    lesion2: {},
                    lesion3: {},
                    lesion4: {},
                    lesion5: {},
                },
            }
            if (dateTime) {
                newReport.examDateTime = dateTime
            }
            saveReport(newReport)
            return newReport
        },

        loadReport: loadReport,

        saveReport: saveReport,

        saveAllReports: saveAllReports,

        clearReport: async (report: IReport) => {
            setCurrentReport(undefined)
            setRecentReports((reports) => [
                ...reports.filter((p) => p.id !== report.id),
            ])
        },

        clearAllReports: async () => {
            saveAllReports()
            setReportsAction([])
        },

        loadAllReports: async () => {
            const reports = await ReportService.loadReportJSON(rootDirectory)
            setReportsAction(reports)
        },

        closeReport: async () => {
            setCurrentReport(undefined)
        },

        exportReports: async (folderPath: string) => {
            ReportService.exportCSV(
                recentReports,
                folderPath,
                ExportFileType.Summary
            )
            ReportService.exportCSV(
                recentReports,
                folderPath,
                ExportFileType.Patient
            )
            ReportService.exportCSV(
                recentReports,
                folderPath,
                ExportFileType.Lesions
            )
            ReportService.exportCSV(
                recentReports,
                rootDirectory,
                ExportFileType.Private
            )
        },
    }

    return reportActions
}

export default useReportActions
