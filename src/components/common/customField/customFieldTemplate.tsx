import React from 'react'
import { FieldTemplateProps } from '@rjsf/utils'

const CustomFieldTemplate: React.FC<FieldTemplateProps> = (props) => {
    const {
        id,
        label,
        required,
        description,
        rawErrors,
        schema,
        uiSchema,
        children,
    } = props

    const classNames = []
    if (props.schema.type === 'object') {
        classNames.push('object-wrapper')
    } else {
        classNames.push('form-group')
    }

    if (rawErrors && rawErrors.length > 0) {
        classNames.push('is-invalid')
    } else {
        classNames.push('is-valid')
    }

    return (
        <div className={classNames.join(' ')}>
            {/* Render label for non-objects except for when an object has defined a ui:field template */}
            {schema.type !== 'array' &&
                (schema.type !== 'object' ||
                    (schema.type === 'object' &&
                        uiSchema &&
                        uiSchema['ui:field'])) && (
                    <label htmlFor={id}>
                        <h4>
                            {label}
                            {required ? '*' : null}
                        </h4>
                    </label>
                )}
            {schema.type === 'array' && (
                <>
                    <h4>{label}</h4>
                    {description && <small>{description}</small>}
                </>
            )}
            {children}
            {schema.type !== 'array' && description && (
                <small className="text-muted">{description}</small>
            )}
            {rawErrors && rawErrors.length > 0 && (
                <div className="invalid-feedback">
                    {rawErrors.map((errorMessage, idx) => (
                        <div key={idx}>
                            {label} {errorMessage}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CustomFieldTemplate
