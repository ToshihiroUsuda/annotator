import _ from 'lodash'
import shortid from 'shortid'
import { constants } from '../common/constants'
import Guard from '../common/guard'
import { getDateTimeString } from '../common/utils'
import {
    BiopsyType,
    ILesion,
    ILesionInfo,
    IReport,
    ReportPhase,
} from '../models/applicationState'
import { LocalFileSystem } from '../providers/storage/localFileSystem'
import {
    exportLesionsReportFormat,
    exportPatientReportFormat,
    exportPrivateReportFormat,
    exportSummeryReportFormat,
} from './reportFormat'
import path from 'path-browserify'
/**
 * Functions required for a report service
 * @member save - Save a report
 * @member delete - Delete a report
 */
export interface IReportService {
    save(report: IReport, rootDirectory: string): Promise<IReport>
    delete(report: IReport, rootDirectory: string): Promise<void>
    exportCSV(
        reports: IReport[],
        folderPath: string,
        type: string
    ): Promise<void>
    isDuplicate(report: IReport, reportList: IReport[]): boolean
}

export enum ExportFileType {
    Summary = 'Summery',
    Patient = 'Patient',
    Lesions = 'Lesions',
    Private = 'Private',
}

export default class ReportService {
    public static async save(
        report: IReport,
        rootDirectory: string
    ): Promise<IReport> {
        Guard.null(report)

        if (!report.id) {
            report.id = shortid.generate()
        }

        if (!report.phase) {
            report.phase = ReportPhase.Waiting
        }
        // Initialize active learning settings if they don't exist
        if (report.name) {
            const targetDirectory = path.join(rootDirectory, report.name)
            const outputReport: IReport = { ...report, privateInfo: {} }
            await LocalFileSystem.writeText(
                path.join(
                    targetDirectory,
                    `${report.name}_${constants.reportFileName}`
                ),
                JSON.stringify(outputReport, null, 4)
            )
        }

        let phase = report.phase
        if (report.exclusion) {
            phase = ReportPhase.Completed
        } else {
            const patientInfo = report.patientInfo
            // 必須項目の入力が終わっていないとdoneにならない。
            // json schemaのrequiredと連携したいが、べた書きで。
            if (
                !patientInfo ||
                !patientInfo.patientInfo ||
                !patientInfo.examInfo ||
                !patientInfo.pancreasInfo ||
                !patientInfo.patientInfo.age ||
                !patientInfo.patientInfo.sex ||
                !patientInfo.patientInfo.anamnesis ||
                !patientInfo.patientInfo.surgicalHistory ||
                !patientInfo.examInfo.purpose ||
                !patientInfo.examInfo.transgastricApproach ||
                !patientInfo.pancreasInfo.condition
            ) {
                phase = ReportPhase.Working
            } else if (report.noLesions) {
                phase = ReportPhase.Completed
            } else {
                const lesionInfo = report.lesionInfo
                const keys = _.keys(report.lesionInfo) as (keyof ILesionInfo)[]
                const isEmpty =
                    keys.filter((key) => {
                        const lesion: ILesion = lesionInfo[key]
                        return !(
                            !lesion.imageDiagnosis ||
                            Object.keys(lesion.imageDiagnosis).length === 0
                        )
                    }).length === 0

                if (isEmpty) {
                    phase = ReportPhase.Working // NoLesionsではないのに、病変情報が空
                } else {
                    const isWorking =
                        keys.filter((key) => {
                            const lesion: ILesion = lesionInfo[key]
                            if (
                                !lesion.imageDiagnosis ||
                                Object.keys(lesion.imageDiagnosis).length === 0
                            ) {
                                // Lesionなし
                                return false // done
                            } else if (!lesion.biopsy) {
                                // Lesionあり biopsyなし
                                return true // yet
                            } else if (
                                lesion.biopsy === BiopsyType.NotPerformed
                            ) {
                                // Lesionあり biopsyあり 病理なし
                                return false // done
                            } else if (lesion.pathologicalResult) {
                                // Lesionあり biopsyなし 病理あり 病理結果あり
                                return false //done
                            } else {
                                // Lesionあり biopsyなし 病理あり 病理結果なし
                                return true //yet
                            }
                        }).length > 0
                    phase = isWorking
                        ? ReportPhase.Working
                        : ReportPhase.Completed
                }
            }
        }
        return { ...report, phase: phase }
    }

    public static async exportCSV(
        reports: IReport[],
        folderPath: string,
        type: ExportFileType
    ): Promise<void> {
        Guard.null(reports)

        let header = ''
        let data = ''
        let fileName = ''
        switch (type) {
            case ExportFileType.Summary:
                header = this.makeHeader(exportSummeryReportFormat)
                fileName = constants.exportSummaryReportFile
                reports
                    .filter((r) => !!r.name)
                    .slice()
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .forEach((report: IReport) => {
                        data += this.makeDataRow(
                            exportSummeryReportFormat,
                            report.name,
                            report
                        )
                    })
                break
            case ExportFileType.Patient:
                header = this.makeHeader(exportPatientReportFormat)
                fileName = constants.exportPatientReportFile
                reports
                    .filter((r) => !!r.name)
                    .slice()
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .forEach((report: IReport) => {
                        data += this.makeDataRow(
                            exportPatientReportFormat,
                            report.name,
                            report.patientInfo
                        )
                    })
                break
            case ExportFileType.Lesions:
                header = this.makeHeader(exportLesionsReportFormat, true)
                fileName = constants.exportLesionsReportFile
                reports
                    .filter((r) => !!r.name)
                    .slice()
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .forEach((report: IReport) => {
                        if (report.exclusion) {
                            return
                        }
                        if (report.noLesions) {
                            return
                        }
                        const keys = _.keys(
                            report.lesionInfo
                        ) as (keyof ILesionInfo)[]
                        keys.forEach(
                            (key: keyof ILesionInfo, index: number) => {
                                if (
                                    !report.lesionInfo[key].imageDiagnosis ||
                                    _.keys(
                                        report.lesionInfo[key].imageDiagnosis
                                    ).length === 0
                                ) {
                                    return
                                }
                                data += this.makeDataRow(
                                    exportLesionsReportFormat,
                                    report.name,
                                    report.lesionInfo[key],
                                    index + 1
                                )
                            }
                        )
                    })
                break
            case ExportFileType.Private: {
                const privateHeaderFormat = reports.reduce<
                    Record<string, { header: string; type: string }>
                >((acc, cur) => {
                    const keys = cur.privateInfo ? _.keys(cur.privateInfo) : []
                    keys.forEach((key) => {
                        if (!(key in acc)) {
                            acc[key] = {
                                header: key,
                                type: 'string',
                            }
                        }
                    })
                    return acc
                }, {})

                const format = {
                    ...privateHeaderFormat,
                    ...exportPrivateReportFormat,
                }
                header = this.makeHeader(format)
                fileName = constants.exportPrivateReportFile
                reports
                    .filter((r) => !!r.name)
                    .slice()
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .forEach((report: IReport) => {
                        const rowData = {
                            ...(report.privateInfo || {}),
                            examDateTime: report.examDateTime,
                            informedConsent: report.informedConsent,
                            exclusion: report.exclusion,
                            exclusionReason: report.exclusionReason,
                        }
                        data += this.makeDataRow(format, report.name, rowData)
                    })
                break
            }
            default:
                return
        }

        const csvText = header + data
        await LocalFileSystem.writeText(
            path.join(folderPath, fileName),
            csvText
        )
    }

    public static async exportReportJSON(
        reports: IReport[],
        targetDirectory: string,
        backup: boolean = true
    ): Promise<void> {
        LocalFileSystem.writeText(
            path.join(targetDirectory, 'Report.json'),
            JSON.stringify(reports, null, 4)
        )
        if (backup) {
            const prefix = getDateTimeString()
            const backupDirectory = path.join(targetDirectory, 'backup')
            if (!(await LocalFileSystem.exists(backupDirectory))) {
                LocalFileSystem.createDirectory(backupDirectory)
            }
            LocalFileSystem.writeText(
                path.join(backupDirectory, `${prefix}_Report.json`),
                JSON.stringify(reports, null)
            )
        }
    }

    public static async loadReportJSON(
        targetDirectory: string
    ): Promise<IReport[]> {
        let reports: IReport[]
        try {
            reports = JSON.parse(
                await LocalFileSystem.readText(
                    path.join(targetDirectory, 'Report.json')
                )
            )
        } catch {
            reports = []
        }

        return reports
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static makeHeader = (format: any, needIndex: boolean = false) => {
        const header: string[] = ['Case']
        if (needIndex) {
            header.push('Index')
        }
        _.keys(format).forEach((key) => {
            const content = format[key]
            if (!content.header) {
                _.keys(content).forEach((key_) => {
                    header.push(content[key_].header)
                })
            } else {
                header.push(content.header)
            }
        })

        return (
            header
                .map((h: string) => {
                    return !h ? '' : h
                })
                .join(',') + '\n'
        )
    }
    private static makeDataRow = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        format: any,
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        index?: number
    ) => {
        if (!data) {
            return ''
        }
        const info: string[] = [name]

        if (index) {
            info.push(index.toString())
        }
        _.keys(format).forEach((key) => {
            const content = format[key]
            if (!content.header) {
                _.keys(content).forEach((key_) => {
                    if (key in data) {
                        if (key_ in data[key]) {
                            if (content[key_].type === 'boolean') {
                                info.push(data[key][key_] ? 'TRUE' : 'FALSE')
                            } else if (content[key_].type === 'array') {
                                info.push(data[key][key_].join('/'))
                            } else if (content[key_].type == 'dateTime') {
                                const dateTime = new Date(
                                    data[key][key_]
                                ).toLocaleString()
                                info.push(dateTime)
                            } else {
                                info.push(data[key][key_])
                            }
                        } else {
                            info.push('')
                        }
                    } else {
                        info.push('')
                    }
                })
            } else {
                if (key in data) {
                    if (content.type === 'boolean') {
                        info.push(data[key] ? 'TRUE' : 'FALSE')
                    } else if (content.type === 'array') {
                        info.push(`"${data[key].join('/')}"`)
                    } else if (content.type == 'dateTime') {
                        const dateTime = new Date(data[key]).toLocaleString()
                        info.push(dateTime)
                    } else {
                        info.push(data[key])
                    }
                } else {
                    info.push('')
                }
            }
        })

        return (
            info
                .map((i: string) => {
                    return !i ? '' : i
                })
                .join(',') + '\n'
        )
    }

    public static async delete(
        report: IReport,
        rootDirectory: string
    ): Promise<void> {
        Guard.null(report)

        const targetDirectory = path.join(rootDirectory, report.name)
        await LocalFileSystem.deleteFile(
            path.join(
                targetDirectory,
                `${report.name}_${constants.reportFileName}`
            )
        )
    }

    public static isDuplicate(report: IReport, reportList: IReport[]): boolean {
        const duplicateReports = reportList.find(
            (p) => p.id !== report.id && p.name === report.name
        )
        return duplicateReports !== undefined
    }
}
