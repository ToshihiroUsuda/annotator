import React from 'react'
import { FieldProps, CustomValidator } from '@rjsf/utils'
import Form, { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { constants } from '../../../common/constants'
import {
    AppError,
    ErrorCode,
    IAppSettings,
    ITag,
} from '../../../models/applicationState'
import { LocalFileSystem } from '../../../providers/storage/localFileSystem'
import ArrayFieldTemplate from '../../common/arrayField/arrayFieldTemplate'
import { FileButtonSet } from './buttons/fileButtonSet'
import { CustomField } from '../../common/customField'
import FieldTemplate from '../../common/customField/customFieldTemplate'
import {
    ILocalFilePickerProps,
    LocalFilePicker,
    ILocalDirectoryPickerProps,
    LocalDirectoryPicker,
} from '../../common/localPicker'
import { ObjectFieldTemplate } from '../../common/objectField/objectFieldTemplate'
import { ITagsInputFormProps, TagsInputForm } from './tagsInputForm'
import { formSchema, uiSchema } from './schema'
import { strings } from '../../../common/strings'
import path from 'path-browserify'

export interface IAppSettingsFormProps {
    appSettings: IAppSettings
    onSubmit: (appSettings: IAppSettings) => void
    onCancel?: (appSettings: IAppSettings) => void
    onChange?: (appSettings: IAppSettings) => void
    onExport?: () => void
    onImport?: (appSettings: IAppSettings) => void
}

export interface IAppSettingsFormState {
    classNames: string[]
    appSettings: IAppSettings
}

export class AppSettingsForm extends React.Component<
    IAppSettingsFormProps,
    IAppSettingsFormState
> {
    private tagsInput: React.RefObject<ITagsInputFormProps | null>
    constructor(props: IAppSettingsFormProps) {
        super(props)

        this.state = {
            appSettings: { ...this.props.appSettings },
            classNames: ['needs-validation'],
        }
        this.tagsInput = React.createRef<ITagsInputFormProps>()
        this.onFormValidate = this.onFormValidate.bind(this)
        this.onFormCancel = this.onFormCancel.bind(this)
        this.onFormSubmit = this.onFormSubmit.bind(this)
    }

    public render() {
        const FormComponent = Form<IAppSettings>
        return (
            <div className="app-settings-page-form m-3">
                <h3 className="mb-3">
                    <i className="fas fa-cog fa-1x"></i>
                    <span className="px-2">{strings.appSettings.title}</span>
                </h3>
                <div className="app-settings-form m-3">
                    <FormComponent
                        className={this.state.classNames.join(' ')}
                        showErrorList={false}
                        liveValidate
                        noHtml5Validate
                        fields={this.fields()}
                        templates={{
                            ObjectFieldTemplate,
                            FieldTemplate,
                            ArrayFieldTemplate,
                        }}
                        validator={validator}
                        customValidate={this.onFormValidate}
                        schema={formSchema}
                        uiSchema={uiSchema}
                        formData={this.state.appSettings}
                        onChange={this.onFormChange}
                        onSubmit={this.onFormSubmit}
                    >
                        <div className="app-settings-button-set">
                            <div className="form-buttons">
                                <button
                                    type="submit"
                                    className="btn btn-success mr-1"
                                >
                                    {strings.appSettings.save}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-cancel"
                                    onClick={this.onFormCancel}
                                >
                                    {strings.common.cancel}
                                </button>
                            </div>
                            <FileButtonSet
                                onImport={this.onSettingsFileImport}
                                onExport={this.onSettingsFileExport}
                            />
                        </div>
                    </FormComponent>
                </div>
            </div>
        )
    }

    private fields() {
        return {
            folderPicker: CustomField<ILocalDirectoryPickerProps>(
                LocalDirectoryPicker,
                (props: FieldProps<string>) => {
                    return {
                        id: props.id,
                        defaultValue: props.formData || '',
                        onChange: (value: string) => {
                            props.onChange(value)
                        },
                    }
                }
            ),
            jsonFilePicker: CustomField<ILocalFilePickerProps>(
                LocalFilePicker,
                (props: FieldProps<string>) => {
                    return {
                        id: props.id,
                        defaultValue: props.formData || '',
                        onChange: (value: string) => {
                            props.onChange(value)
                        },
                        extension: 'json',
                    }
                }
            ),
            pythonFilePicker: CustomField<ILocalFilePickerProps>(
                LocalFilePicker,
                (props: FieldProps<string>) => {
                    return {
                        id: props.id,
                        defaultValue: props.formData || '',
                        onChange: (value: string) => {
                            props.onChange(value)
                        },
                        extension: 'py',
                    }
                }
            ),
            tagsInput: CustomField<ITagsInputFormProps>(
                TagsInputForm,
                (props: FieldProps<ITag[]>) => {
                    return {
                        ref: this.tagsInput,
                        tags: props.formData || [],
                        tagColors: constants.tagColors,
                        categries: [...this.state.appSettings.tagCategories],
                        onChange: props.onChange,
                        onImport: this.onTagsFileImport,
                    }
                }
            ),
        }
    }

    private onFormValidate: CustomValidator<IAppSettings> = (
        _formData,
        errors
    ) => {
        if (this.state.classNames.indexOf('was-validated') === -1) {
            this.setState({
                classNames: [...this.state.classNames, 'was-validated'],
            })
        }

        return errors
    }

    private onFormSubmit = (data: IChangeEvent<IAppSettings>): void => {
        if (data.formData) {
            const appSettings = { ...data.formData }
            this.setState({ appSettings })
            this.props.onSubmit(appSettings)
        }
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel(this.props.appSettings)
        }
    }

    private onFormChange = (data: IChangeEvent<IAppSettings>) => {
        if (data.formData) {
            const appSettings = { ...data.formData }
            this.setState({ appSettings: { ...data.formData } })
            this.props.onChange?.(appSettings)
        }
    }

    private onTagsFileImport = async (tags: ITag[]) => {
        const appSettings = {
            ...this.state.appSettings,
            tags: tags,
        }

        this.setState({
            appSettings: appSettings,
        })
    }

    private onSettingsFileImport = async (fileContent: string) => {
        try {
            const appSettings = JSON.parse(fileContent)
            this.setState(
                {
                    appSettings: appSettings,
                },
                () => {
                    if (this.props.onImport) {
                        this.props.onImport(appSettings)
                    }
                }
            )
        } catch {
            throw new AppError(
                ErrorCode.ProjectInvalidJson,
                'Error parsing JSON'
            )
        }
    }

    private onSettingsFileExport = async (folderPath: string) => {
        await LocalFileSystem.writeText(
            path.join(folderPath, constants.appSettingsFile),
            JSON.stringify(this.state.appSettings, null, 4)
        )
        this.props.onExport?.()
    }
}
