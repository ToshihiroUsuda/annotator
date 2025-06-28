import React from 'react'
import { Line } from 'rc-progress'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { FaFileVideo, FaVideo, FaCopy, FaTasks } from 'react-icons/fa'
import { normalizeSlashes } from '../../../common/utils'

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
        icon: React.ComponentType
        colSpan: number
    }
} = {
    fileName: {
        title: 'file name',
        icon: FaFileVideo,
        colSpan: 1,
    },
    duration: {
        title: 'duration',
        icon: FaVideo,
        colSpan: 1,
    },
    status: {
        title: 'status',
        icon: FaCopy,
        colSpan: 1,
    },
    progress: {
        title: 'progress',
        icon: FaTasks,
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
            <div className="w-full box-border relative">
                <table className="w-full table-fixed">
                    <thead>
                        <tr className="h-12 text-gray-100 font-normal text-center text-xl">
                            {newDataRecordKeys.map((headerName) => (
                                <th
                                    key={headerName}
                                    colSpan={header[headerName].colSpan}
                                >
                                    <span className="mr-2 text-base">
                                        {React.createElement(header[headerName].icon)}
                                    </span>
                                    <span className="uppercase">
                                        {header[headerName].title}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white/5">
                        {newDataRecords.map((record, index) => {
                            const fileName = normalizeSlashes(record.fileName)
                                .split('/')
                                .pop()
                            const duration = record.duration
                            const status = record.status
                            const progress = 100 * record.progress
                            return (
                                <tr key={index} className="h-12 text-gray-100 font-normal text-center text-xl">
                                    <td className="overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span>{fileName}</span>
                                    </td>
                                    <td className="overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span>{duration}</span>
                                    </td>
                                    <td className="overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span>{status}</span>
                                    </td>
                                    <td
                                        className="mx-2"
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
            </div>
        )
    }

    return (
        <Modal 
            size="xl" 
            centered 
            isOpen={props.isOpen}
            className="max-w-[80vw] min-h-[100px]"
        >
            <ModalHeader toggle={() => handleClose()}>
                Loading New Data
            </ModalHeader>
            <ModalBody>{renderTable()}</ModalBody>
        </Modal>
    )
}

export default NewDataModal
