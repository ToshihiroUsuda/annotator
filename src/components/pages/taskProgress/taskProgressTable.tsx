import _ from 'lodash'
import React, { MouseEvent, useEffect, useState } from 'react'
import { AutoSizer, Column, Table } from 'react-virtualized'
import moment from 'moment'
import { 
    FaFolderOpen, 
    FaCalendar, 
    FaClock, 
    FaDownload, 
    FaClipboardList, 
    FaEdit, 
    FaShieldAlt, 
    FaUpload, 
    FaUser, 
    FaFileAlt,
    FaCircle,
    FaCircleNotch,
    FaCheckCircle,
    FaExclamationTriangle
} from 'react-icons/fa'
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
                        headerClassName=""
                        rowClassName="flex flex-row bg-white/5 hover:bg-white/10"
                        gridClassName="outline-none"
                    >
                        {props.showColumnList.includes('case') && (
                            <Column
                                width={width / divider}
                                dataKey="case"
                                headerRenderer={() => (
                                    <HeaderCell
                                        name="case"
                                        icon={FaFolderOpen}
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
                                        icon={FaCalendar}
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
                                        icon={FaClock}
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
                                        icon={FaDownload}
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={[]}
                                            icons={{
                                                yet: FaCircle,
                                                doing: () => <FaCircleNotch className="fa-spin" />,
                                                done: FaCheckCircle,
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
                                        icon={FaClipboardList}
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: FaCircle,
                                                doing: FaEdit,
                                                done: FaCheckCircle,
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
                                        icon={FaEdit}
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: FaCircle,
                                                doing: FaEdit,
                                                done: FaCheckCircle,
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
                                        icon={FaShieldAlt}
                                    />
                                )}
                                cellRenderer={({ rowData, cellData }) => {
                                    return (
                                        <IconCell
                                            rowData={rowData}
                                            cellData={cellData}
                                            prevTasks={['load']}
                                            icons={{
                                                yet: FaCircle,
                                                doing: () => <FaCircleNotch className="fa-spin" />,
                                                done: FaCheckCircle,
                                                error: FaExclamationTriangle,
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
                                        icon={FaUpload}
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
                                                yet: FaCircle,
                                                doing: () => <FaCircleNotch className="fa-spin" />,
                                                done: FaCheckCircle,
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
                                        icon={FaUser}
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
                                        icon={FaFileAlt}
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

const HeaderCell: React.FC<{ name: string; icon: React.ComponentType }> = ({
    name,
    icon,
}) => {
    return (
        <div className="bg-black/40 w-full h-12 flex text-xl justify-center items-center text-gray-100 font-bold">
            <span className="mr-2 text-base">
                {React.createElement(icon)}
            </span>
            <span className="uppercase">{name}</span>
        </div>
    )
}

const TextCell: React.FC<{
    cellData: string
    convert?: (data: string) => string
}> = ({ cellData, convert }) => {
    const displayText = convert ? convert(cellData) : cellData
    return (
        <div className="w-full h-12 flex justify-center items-center text-xl text-gray-100 font-normal hover:bg-white/5">
            <span>{displayText}</span>
        </div>
    )
}

type TIconCell = {
    rowData: TaskProgressRecord
    cellData: TStatus
    icons: Record<string, React.ComponentType>
    prevTasks: TaskType[]
    onClick?: (caseName: string, e: MouseEvent) => void | Promise<void>
}

const IconCell: React.FC<TIconCell> = (props) => {
    const classNameClickable = props.onClick ? 'cursor-pointer' : ''
    const isPrevDone = props.prevTasks.every(
        (task) => props.rowData[task] === 'done'
    )
    const status: TStatus = isPrevDone ? props.cellData : 'disabled'

    const handleClick = (e: MouseEvent) => {
        if (props.onClick) {
            props.onClick(props.rowData.case, e)
        }
    }
    
    const getIconColor = (status: TStatus) => {
        switch (status) {
            case 'done': return 'text-green-500'
            case 'error': return 'text-red-500'
            default: return ''
        }
    }

    return (
        <div
            className={`w-full h-12 flex justify-center items-center text-xl text-gray-100 font-normal hover:bg-white/5 ${classNameClickable}`}
            onClick={handleClick}
        >
            <span className={`${getIconColor(status)}`}>
                {status !== 'disabled' && React.createElement(props.icons[status])}
            </span>
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
        <div className="w-full h-12 flex justify-center items-center text-xl text-gray-100 font-normal hover:bg-white/5">
            <div className="w-[95%] h-[95%]">
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
