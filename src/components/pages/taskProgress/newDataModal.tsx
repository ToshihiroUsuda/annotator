import React from 'react'
import { Line } from 'rc-progress'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { normalizeSlashes } from '../../../common/utils'
import './newDataModal.scss'

export type TNewDataRecord = {
    fileName: string
    duration: string
    status: string
    progress: number
}

type TNewDataRecordKeys = keyof TNewDataRecord

const newDataRecordKeys: TNewDataRecordKeys[] = [
    'fileName',
    'duration',
    'status',
    'progress',
] as const

const header: {
    [key in TNewDataRecordKeys]: {
        title: string
        icon: string
        colSpan: number
    }
} = {
    fileName: {
        title: 'file name',
        icon: 'fas fa-file-video',
        colSpan: 1,
    },
    duration: {
        title: 'duration',
        icon: 'fas fa-video',
        colSpan: 1,
    },
    status: {
        title: 'status',
        icon: 'fas fa-copy',
        colSpan: 1,
    },
    progress: {
        title: 'progress',
        icon: 'fas fa-tasks',
        colSpan: 3,
    },
}

type TNewDataModalProps = {
    isOpen: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newData: Record<string, Record<string, any>>
    onClose?: () => void
}

const NewDataModal: React.FC<TNewDataModalProps> = (props) => {
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }

    const renderTable = () => {
        const newDataRecords: TNewDataRecord[] = Object.values(
            props.newData
        ).map((data) => {
            return {
                fileName: data['file_name'],
                duration: data['duration'],
                status: data['status'],
                progress: data['progress'],
            }
        })

        return (
            <table className="new-data-table bg-darker-2">
                <thead>
                    <tr className="table-header">
                        {newDataRecordKeys.map((headerName) => (
                            <th
                                key={headerName}
                                colSpan={header[headerName].colSpan}
                            >
                                <a className="table-header-icon">
                                    <i className={header[headerName].icon} />
                                </a>
                                <span className="table-header-title">
                                    {header[headerName].title}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {newDataRecords.map((record, index) => {
                        const fileName = normalizeSlashes(record.fileName)
                            .split('/')
                            .pop()
                        const duration = record.duration
                        const status = record.status
                        const progress = 100 * record.progress
                        return (
                            <tr key={index}>
                                <td className="td-props">
                                    <span>{fileName}</span>
                                </td>
                                <td className="td-props">
                                    <span>{duration}</span>
                                </td>
                                <td className="td-props">
                                    <span>{status}</span>
                                </td>
                                <td
                                    className="td-progress"
                                    colSpan={header.progress.colSpan}
                                >
                                    {progress > 0 && (
                                        <Line
                                            percent={progress}
                                            strokeWidth={2.5}
                                            strokeColor={'green'}
                                            trailWidth={2.5}
                                        />
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )
    }

    return (
        <Modal size="xl" centered isOpen={props.isOpen}>
            <ModalHeader toggle={() => handleClose()}>
                Loading New Data
            </ModalHeader>
            <ModalBody>{renderTable()}</ModalBody>
        </Modal>
    )
}

export default NewDataModal
