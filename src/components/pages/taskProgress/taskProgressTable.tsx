import _ from 'lodash'
import React, { MouseEvent, useEffect, useState } from 'react'
import { AutoSizer, Column, Table } from 'react-virtualized'
import './taskProgressPage.scss'

import moment from 'moment'
import { convertDateFormat } from '../../../common/utils'
import {
    IProject,
    IReport,
    ProjectPhase,
    ReportPhase,
} from '../../../models/applicationState'
import { IProjectActions } from '../../../atom/actions/project'
import { IReportActions } from '../../../atom/actions/report'
import { TextInputWithOptions } from '../../common/textInputWithOptions'
import './taskProgressTable.scss'

const STATUS = ['yet', 'doing', 'done', 'error', 'disabled'] as const
type TStatus = (typeof STATUS)[number]

const convertStatus = (value: string): TStatus => {
    if ((STATUS as readonly string[]).includes(value)) {
        return value as TStatus
    }
    return 'doing'
}

type TaskStatusRecord = {
    load: TStatus
    report: TStatus
    annotate: TStatus
    anonymize: TStatus
    send: TStatus
}

type TaskProgressRecord = {
    case: string
    date: string
    time: string
    doctor: string
    memo: string
} & TaskStatusRecord

type TaskType = keyof TaskStatusRecord
type ColumnType = keyof TaskProgressRecord

type TaskProgressTableProps = {
    caseData: Record<string, Record<string, string>>
    reportActions: IReportActions
    recentReports: IReport[]
    recentProjects?: IProject[]
    projectActions?: IProjectActions
    onReportClicked?: (caseName: string) => void
    onAnnotateClicked?: (caseName: string) => void
    onSendClicked?: (caseName: string) => void
    showColumnList: ColumnType[]
}

const TaskProgressTable: React.FC<TaskProgressTableProps> = (props) => {
    // doctorName inputの候補をレポートから取得
    const [docterNames, setDoctorNames] = useState<string[]>([])

    useEffect(() => {
        const names = props.recentReports.reduce(
            (acc: string[], report: IReport) => {
                if (report.privateInfo && report.privateInfo.doctorName)
                    return [...acc, report.privateInfo.doctorName]
                return acc
            },
            []
        )
        setDoctorNames(Array.from(new Set(names)).sort())
    }, [props.recentReports])

    const createNewReport = async (
        caseName: string,
        date: string,
        time: string
    ) => {
        const dateTime = moment(
            `${date} ${time}`,
            'YYYY/MM/DD HH:mm:ss'
        ).toJSON()
        return await props.reportActions.createReport(caseName, dateTime)
    }

    // 各行の描画関数
    const caseNames = _.keys(props.caseData)
        .reverse()
        .filter((key) => props.caseData[key]['enable'])
    const getRow = (caseName: string): TaskProgressRecord => {
        const date: string = props.caseData[caseName]['start_date']
        const time: string = props.caseData[caseName]['start_time']

        let reportStatus: TStatus = 'disabled'
        let memo = ''
        let doctorName = ''

        const report = props.recentReports.find(
            (report) => report.name === caseName
        )
        if (report) {
            reportStatus =
                report.phase === ReportPhase.Waiting
                    ? 'yet'
                    : report.phase === ReportPhase.Completed
                      ? 'done'
                      : 'doing'
            if (report.privateInfo) {
                memo = report.privateInfo.memo || ''
                doctorName = report.privateInfo.doctorName || ''
            }
        }

        let annotateStatus: TStatus = 'disabled'
        if (props.recentProjects) {
            const project = props.recentProjects.find(
                (project) => project.name === caseName
            )
            if (project) {
                annotateStatus =
                    project.phase === ProjectPhase.Waiting
                        ? 'yet'
                        : project.phase === ProjectPhase.Completed
                          ? 'done'
                          : 'doing'
            }
        }

        return {
            case: caseName,
            date: date,
            time: time,
            load: convertStatus(props.caseData[caseName]['load']),
            report: reportStatus,
            annotate: annotateStatus,
            anonymize: convertStatus(props.caseData[caseName]['anonymize']),
            send: convertStatus(props.caseData[caseName]['send']),
            memo: memo,
            doctor: doctorName,
        }
    }

    // TODO 各種クリック時、インプット時のコールバック
    const onReportClicked = async (caseName: string) => {
        props.onReportClicked?.(caseName)
    }

    const onAnnotateClicked = async (caseName: string) => {
        props.onAnnotateClicked?.(caseName)
    }

    const onSendClicked = (caseName: string, e: MouseEvent) => {
        if (e.ctrlKey) {
            props.onSendClicked?.(caseName)
        }
    }

    const onInputBlurred = async (
        key: 'memo' | 'doctorName',
        value: string,
        caseName: string,
        date: string,
        time: string
    ) => {
        let report = props.recentReports.find(
            (report) => report.name === caseName
        )

        if (!report) {
            report = await createNewReport(caseName, date, time)
        }

        const privateInfo = { ...(report.privateInfo || {}), [key]: value }
        props.reportActions.saveReport({ ...report, privateInfo: privateInfo })
    }

    const divider = props.showColumnList.length
    return (
        <AutoSizer
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
            }}
        >
            {({ height, width }) => {
                return (
                    <Table
                        width={width}
                        height={height}
                        headerHeight={48}
                        rowHeight={48}
                        rowGetter={({ index }) => {
                            return getRow(caseNames[index])
                        }}
                        rowCount={caseNames.length}
                        headerClassName="task-progress-table-header"
                        rowClassName="task-progress-table-row"
                        gridClassName="task-progress-table-body"
                    >
                        {props.showColumnList.includes('case') && (
                            <Column
                                width={width / divider}
                                dataKey="case"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="case"
                                        icon="fas fa-folder-open"
                                    />
                                )}
                                cellRenderer={({ cellData }) => (
                                    <TextCell cellData={cellData} />
                                )}
                            />
                        )}
                        {props.showColumnList.includes('date') && (
                            <Column
                                width={width / divider}
                                dataKey="date"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="date"
                                        icon="fas fa-calendar"
                                    />
                                )}
                                cellRenderer={({ cellData }) => (
                                    <TextCell
                                        cellData={cellData}
                                        convert={convertDateFormat}
                                    />
                                )}
                            />
                        )}
                        {props.showColumnList.includes('time') && (
                            <Column
                                width={width / divider}
                                dataKey="time"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="time"
                                        icon="fas fa-clock"
                                    />
                                )}
                                cellRenderer={({ cellData }) => (
                                    <TextCell cellData={cellData} />
                                )}
                            />
                        )}
                        {props.showColumnList.includes('load') && (
                            <Column
                                width={width / divider}
                                dataKey="load"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="load"
                                        icon="fas fa-download"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={[]}
                                            icons={{
                                                yet: 'fas fa-circle',
                                                doing: 'fas fa-circle-notch fa-spin',
                                                done: 'fas fa-check-circle',
                                            }}
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('report') && (
                            <Column
                                width={width / divider}
                                dataKey="report"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="report"
                                        icon="fas fa-clipboard-list"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: 'fas fa-circle',
                                                doing: 'fas fa-edit',
                                                done: 'fas fa-check-circle',
                                            }}
                                            onClick={onReportClicked}
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('annotate') && (
                            <Column
                                width={width / divider}
                                dataKey="annotate"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="annotate"
                                        icon="fas fa-edit"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: 'fas fa-circle',
                                                doing: 'fas fa-edit',
                                                done: 'fas fa-check-circle',
                                            }}
                                            onClick={onAnnotateClicked}
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('anonymize') && (
                            <Column
                                width={width / divider}
                                dataKey="anonymize"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="anonymize"
                                        icon="fas fa-shield-alt"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: 'fas fa-circle',
                                                doing: 'fas fa-circle-notch fa-spin',
                                                done: 'fas fa-check-circle',
                                                error: 'fas fa-exclamation-triangle',
                                            }}
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('send') && (
                            <Column
                                width={width / divider}
                                dataKey="send"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="send"
                                        icon="fas fa-upload"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={[
                                                'load',
                                                'annotate',
                                                'anonymize',
                                            ]}
                                            icons={{
                                                yet: 'fas fa-circle',
                                                doing: 'fas fa-circle-notch fa-spin',
                                                done: 'fas fa-check-circle',
                                            }}
                                            onClick={onSendClicked}
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('doctor') && (
                            <Column
                                width={width / divider}
                                dataKey="doctor"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="doctor"
                                        icon="fas fa-user"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <InputCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            options={docterNames}
                                            onBlur={(value) =>
                                                onInputBlurred(
                                                    'doctorName',
                                                    value,
                                                    rowData.case,
                                                    rowData.date,
                                                    rowData.time
                                                )
                                            }
                                        />
                                    )
                                }}
                            />
                        )}
                        {props.showColumnList.includes('memo') && (
                            <Column
                                width={width / divider}
                                dataKey="memo"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="memo"
                                        icon="fas fa-file-alt"
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <InputCell
                                            cellData={cellData}
                                            onBlur={(value) =>
                                                onInputBlurred(
                                                    'memo',
                                                    value,
                                                    rowData.case,
                                                    rowData.date,
                                                    rowData.time
                                                )
                                            }
                                        />
                                    )
                                }}
                            />
                        )}
                    </Table>
                )
            }}
        </AutoSizer>
    )
}

const HeaderCell: React.FC<{ name: string; icon: string }> = ({
    name,
    icon,
}) => {
    return (
        <div className="table-header-cell">
            <a className="table-header-cell-icon">
                <i className={icon} />
            </a>
            <span className="table-header-cell-title">{name}</span>
        </div>
    )
}

const TextCell: React.FC<{
    cellData: string
    convert?: (data: string) => string
}> = ({ cellData, convert }) => {
    const displayText = convert ? convert(cellData) : cellData
    return (
        <div className="table-cell">
            <span>{displayText}</span>
        </div>
    )
}

type TIconCell = {
    rowData: TaskProgressRecord
    cellData: TStatus
    icons: Record<string, string>
    prevTasks: TaskType[]
    onClick?: (caseName: string, e: MouseEvent) => void | Promise<void>
}

const IconCell: React.FC<TIconCell> = (props) => {
    const classNameClickable = props.onClick ? 'clickable' : ''
    const isPrevDone = props.prevTasks.every(
        (task) => props.rowData[task] === 'done'
    )
    const status: TStatus = isPrevDone ? props.cellData : 'disabled'

    const handleClick = (e: MouseEvent) => {
        if (props.onClick) {
            props.onClick(props.rowData.case, e)
        }
    }
    return (
        <div
            className={`table-cell ${classNameClickable}`}
            onClick={handleClick}
        >
            <a className={`icon ${status} `}>
                {status !== 'disabled' && <i className={props.icons[status]} />}
            </a>
        </div>
    )
}

type TInputCellProps = {
    rowData?: TaskProgressRecord
    cellData: string
    onChange?: (value: string) => void
    onBlur?: (value: string) => void
    options?: string[]
}

const InputCell: React.FC<TInputCellProps> = ({
    cellData,
    onChange,
    onBlur,
    options,
}) => {
    const handleChange = (value: string) => {
        if (onChange) {
            onChange(value)
        }
    }
    const handleBlur = (value: string) => {
        if (onBlur) {
            onBlur(value)
        }
    }
    return (
        <div className="table-cell">
            <div className="input">
                <TextInputWithOptions
                    value={cellData}
                    options={options}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            </div>
        </div>
    )
}

export default TaskProgressTable
