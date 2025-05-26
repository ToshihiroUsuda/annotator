import React from 'react'
import { LocalFileSystem } from '../../../../providers/storage/localFileSystem'

interface IFileImportButtonProps {
    onImport: (fileContents: string) => void
}

export const FileImportButton: React.FC<IFileImportButtonProps> = (props) => {
    const handleClick = async () => {
        const selectedFile = await LocalFileSystem.selectFile(undefined, 'json')
        if (selectedFile) {
            props.onImport(selectedFile)
        }
    }

    return (
        <div>
            <button
                type="button"
                className="btn btn-secondary btn-import"
                onClick={handleClick}
            >
                Import
            </button>
        </div>
    )
}
