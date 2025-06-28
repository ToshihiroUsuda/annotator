import React from 'react'
import { FileExportButton } from './fileExportButton'
import { FileImportButton } from './fileImportButton'

interface IFileButtonSetProps {
    onImport: (fileContents: string) => void
    onExport: (folderPath: string) => void
}

export const FileButtonSet: React.FC<IFileButtonSetProps> = (props) => {
    return (
        <div className="flex flex-row [&>button]:mr-1">
            <FileExportButton onExport={props.onExport} />
            <FileImportButton onImport={props.onImport} />
        </div>
    )
}
