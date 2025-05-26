import React from 'react'
import { ObjectFieldTemplateProps } from '@rjsf/utils'

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (
    props
) => {
    return (
        <>
            {props.title}
            {props.description}
            {props.properties.map((item) => item.content)}
        </>
    )
}
