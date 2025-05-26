import React, { useEffect, useState, useRef } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import Form, { IChangeEvent } from '@rjsf/core'
import { RJSFSchema, CustomValidator } from '@rjsf/utils'
import { customizeValidator } from '@rjsf/validator-ajv8'
import {
    IReport,
    AppError,
    ErrorCode,
    IPrivateInfo,
    IPatientInfo,
    ILesion,
    LesionInfoKeys,
} from '../../../models/applicationState'
import ArrayFieldTemplate from '../../common/arrayField/arrayFieldTemplate'
import FieldTemplate from '../../common/customField/customFieldTemplate'
import { ObjectFieldTemplate } from '../../common/objectField/objectFieldTemplate'
import {
    metaInfoFormSchema as defaultMetaInfoFormSchema,
    metaInfoUIShema as defaultMetaInfoUiSchema,
} from './schema'
import { LocalFileSystem } from '../../../providers/storage/localFileSystem'
import { constants } from '../../../common/constants'
import AJV8Validator from '@rjsf/validator-ajv8/lib/validator.js'
import path from 'path-browserify'

const loadJson = async (
    folderPath: string,
    fileName: string,
    defaultSchema = {}
) => {
    let jsonObject = defaultSchema
    const filePath = path.join(folderPath, fileName)
    const exists = await LocalFileSystem.exists(filePath)
    if (!exists) {
        return jsonObject
    }
    try {
        jsonObject = JSON.parse(await LocalFileSystem.readText(filePath))
        return jsonObject
    } catch {
        throw new AppError(
            ErrorCode.FormSchemaImportError,
            `Error loading schema file ${fileName}`
        )
    }
}

export interface IReportFormProps {
    report: IReport
    onFormChange: (report: IReport) => void
    schemaDir: string
}

type TMetaInfo = Omit<
    IReport,
    'id' | 'name' | 'phase' | 'privateInfo' | 'patientInfo' | 'lesionInfo'
>

export const ReportForm: React.FC<IReportFormProps> = (props) => {
    const PrivateInfoForm = PartialReportForm<IPrivateInfo>
    const MetaInfoForm = PartialReportForm<TMetaInfo>
    const PatientInfoForm = PartialReportForm<IPatientInfo>
    const LesionInfoForm = PartialReportForm<ILesion>

    return (
        <div className="report-form">
            <Tabs defaultActiveKey="caseInfo" id="uncontrolled-tab-example">
                <Tab eventKey="caseInfo" title="Case Info1">
                    <div className="form-content p-3 bg-lighter-1">
                        <PrivateInfoForm
                            formData={props.report.privateInfo}
                            schemaDir={props.schemaDir}
                            formSchemaName={constants.privateInfoFormSchema}
                            uiSchemaName={constants.privateInfoUiSchema}
                            onFormChange={(privateInfo) => {
                                const report: IReport = {
                                    ...props.report,
                                    privateInfo,
                                }
                                props.onFormChange(report)
                            }}
                        />
                        <MetaInfoForm
                            formData={{
                                exclusion: props.report.exclusion,
                                noLesions: props.report.noLesions,
                                exclusionReason: props.report.exclusionReason,
                                examDateTime: props.report.examDateTime,
                                scopeType: props.report.scopeType,
                                informedConsent: props.report.informedConsent,
                            }}
                            schemaDir={props.schemaDir}
                            formSchemaName={constants.metaInfoFormSchema}
                            uiSchemaName={constants.metaInfoUiSchema}
                            defaultFormSchema={defaultMetaInfoFormSchema}
                            defaultUiSchema={defaultMetaInfoUiSchema}
                            onFormChange={(metaInfo) => {
                                const report: IReport = {
                                    ...props.report,
                                    ...metaInfo,
                                }
                                props.onFormChange(report)
                            }}
                        />
                    </div>
                </Tab>
                <Tab
                    eventKey="patientInfo"
                    title="Case Info2"
                    disabled={props.report.exclusion}
                >
                    <div className="form-content p-3 bg-lighter-1">
                        <PatientInfoForm
                            formData={props.report.patientInfo}
                            schemaDir={props.schemaDir}
                            formSchemaName={constants.privateInfoFormSchema}
                            uiSchemaName={constants.privateInfoUiSchema}
                            onFormChange={(patientInfo) => {
                                const report: IReport = {
                                    ...props.report,
                                    patientInfo,
                                }
                                props.onFormChange(report)
                            }}
                        />
                    </div>
                </Tab>
                {LesionInfoKeys.map((lesionKey) => {
                    return (
                        <Tab
                            key={lesionKey}
                            eventKey={`${lesionKey}Info`}
                            title={
                                lesionKey.charAt(0).toUpperCase() +
                                lesionKey.slice(1)
                            }
                            disabled={
                                props.report.exclusion || props.report.noLesions
                            }
                        >
                            <div className="form-content p-3 bg-lighter-1">
                                <LesionInfoForm
                                    formData={
                                        props.report.lesionInfo[lesionKey]
                                    }
                                    schemaDir={props.schemaDir}
                                    formSchemaName={
                                        constants.lesionInfoFormSchema
                                    }
                                    uiSchemaName={constants.lesionInfoUiSchema}
                                    onFormChange={(lesionInfo) => {
                                        const lesionInfos = {
                                            ...props.report.lesionInfo,
                                            [lesionKey]: lesionInfo,
                                        }
                                        const report: IReport = {
                                            ...props.report,
                                            lesionInfo: lesionInfos,
                                        }
                                        props.onFormChange(report)
                                    }}
                                />
                            </div>
                        </Tab>
                    )
                })}
            </Tabs>
        </div>
    )
}

type TPartialReportFormProps<T> = {
    formData: T | undefined
    schemaDir: string
    formSchemaName: string
    uiSchemaName: string
    defaultFormSchema?: RJSFSchema
    defaultUiSchema?: object
    onFormChange: (formData: T) => void
}

const PartialReportForm = <T,>({
    defaultFormSchema = {},
    defaultUiSchema = {},
    ...props
}: TPartialReportFormProps<T>) => {
    const [isMounted, setIsMounted] = useState(false)
    const [formData, setFormData] = useState(props.formData)
    const [classNames, setClassNames] = useState<string[]>(['needs-validation'])
    const [formSchema, setFormSchema] = useState<RJSFSchema>(defaultFormSchema)
    const [uiSchema, setUiSchema] = useState(defaultUiSchema)
    const validatorRef = useRef<AJV8Validator<T> | null>(null)

    useEffect(() => {
        setFormData(props.formData)
    }, [props.formData])

    useEffect(() => {
        ;(async () => {
            setFormSchema(
                await loadJson(
                    props.schemaDir,
                    props.formSchemaName,
                    defaultFormSchema
                )
            )
            setUiSchema(
                await loadJson(
                    props.schemaDir,
                    props.uiSchemaName,
                    defaultUiSchema
                )
            )
        })()
        if (!validatorRef.current) {
            validatorRef.current = customizeValidator<T>()
        }
        setIsMounted(true)
        return () => {
            if (validatorRef.current) {
                validatorRef.current = null
            }
        }
    }, [])

    const onChange = (event: IChangeEvent<T>) => {
        if (event.formData) {
            setFormData(event.formData)
        }
    }

    const onBlur = () => {
        if (formData) {
            props.onFormChange(formData)
        }
    }

    const onValidate: CustomValidator<T> = (_formData, errors) => {
        if (classNames.indexOf('was-validated') === -1) {
            setClassNames((prev) => [...prev, 'was-validated'])
        }
        return errors
    }

    const FormComponent = Form<T>
    if (isMounted) {
        return (
            <FormComponent
                className={classNames.join(' ')}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                validator={validatorRef.current!}
                customValidate={onValidate}
                templates={{
                    ObjectFieldTemplate,
                    FieldTemplate,
                    ArrayFieldTemplate,
                }}
                schema={formSchema}
                uiSchema={uiSchema}
                formData={formData}
                onChange={onChange}
                onBlur={onBlur}
            >
                <button
                    style={{
                        display: 'none',
                    }}
                    type="submit"
                ></button>
            </FormComponent>
        )
    }
}
