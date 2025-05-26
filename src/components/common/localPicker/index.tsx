import React, { useState, useEffect } from 'react'
import { strings } from '../../../common/strings'
import { normalizeSlashes } from '../../../common/utils'
import { LocalFileSystem } from '../../../providers/storage/localFileSystem'

type TLocalPickerProps = {
    id?: string
    defaultValue: string
    onChange: (value: string) => void
    buttonText: string
    needDirectory: boolean
    extension?: 'txt' | 'json' | 'py'
}

const LocalPicker: React.FC<TLocalPickerProps> = ({
    id,
    defaultValue,
    onChange,
    buttonText,
    needDirectory,
    extension,
}) => {
    const [value, setValue] = useState<string>(defaultValue)
    const normalizedPath = value ? normalizeSlashes(value) : ''

    useEffect(() => {
        setValue(defaultValue)
    }, [defaultValue])

    const onReset = () => {
        setValue('')
        onChange('')
    }

    const selectLocalFile = async () => {
        const selectedPath = needDirectory
            ? await LocalFileSystem.selectDirectory()
            : await LocalFileSystem.selectFile(undefined, extension)
        if (selectedPath) {
            const normalizedPath = normalizeSlashes(selectedPath)
            setValue(normalizedPath)
            onChange(normalizedPath)
        }
    }

    return (
        <div className="input-group">
            <input
                id={id}
                type="text"
                className="form-control"
                value={normalizedPath}
                readOnly={true}
            />
            <div className="input-group-append">
                <button
                    className="btn btn-primary"
                    type="button"
                    onClick={selectLocalFile}
                >
                    {buttonText}
                </button>
                <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={onReset}
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
export type ILocalDirectoryPickerProps = Omit<
    TLocalPickerProps,
    'needDirectory' | 'extension' | 'buttonText'
>
export type ILocalFilePickerProps = Omit<
    TLocalPickerProps,
    'needDirectory' | 'extension' | 'buttonText'
>

export const LocalFilePicker: React.FC<ILocalFilePickerProps> = (props) => (
    <LocalPicker
        needDirectory={false}
        buttonText={strings.homePage.selectFile}
        {...props}
    />
)
export const LocalDirectoryPicker: React.FC<ILocalFilePickerProps> = (
    props
) => (
    <LocalPicker
        needDirectory={true}
        buttonText={strings.homePage.selectDirectory}
        {...props}
    />
)
