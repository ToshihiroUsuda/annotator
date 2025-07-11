import React from 'react'
import { ArrayFieldTemplateProps } from '@rjsf/utils'
import { FaPlusCircle, FaTrash } from 'react-icons/fa'
import { strings } from '../../../common/strings'

const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (
    props: ArrayFieldTemplateProps
) => {
    return (
        <div>
            {props.canAdd && (
                <div className="array-field-toolbar my-3">
                    <button
                        type="button"
                        className="btn btn-info"
                        onClick={props.onAddClick}
                    >
                        <FaPlusCircle />
                        <span className="ml-1">Add {props.schema.title}</span>
                    </button>
                </div>
            )}
            {props.items.map((item) => {
                return (
                    <div className="form-row" key={item.index}>
                        {item.children}
                        {item.hasRemove && (
                            <div className="array-item-toolbar">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={item.onDropIndexClick(item.index)}
                                >
                                    <FaTrash />
                                    <span className="ml-1">
                                        {strings.common.delete}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default ArrayFieldTemplate
