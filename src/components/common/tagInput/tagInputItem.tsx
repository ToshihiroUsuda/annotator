import React, { MouseEvent } from 'react'
import { ITag } from '../../../models/applicationState'

export interface ITagClickProps {
    ctrlKey?: boolean
    altKey?: boolean
    clickedColor?: boolean
}

export interface ITagInputItemProps extends React.ComponentPropsWithRef<'div'> {
    /** Tag represented by item */
    tag: ITag
    /** Index of tag within tags array */
    index: number
    /** Tag is currently selected */
    isSelected: boolean
    /** Tag is currently applied to one of the selected regions */
    appliedToSelectedRegions: boolean

    isLocked: boolean
    /** Function to call upon clicking item */
    onTagClick: (tag: ITag) => void
}

const TagInputItem: React.FC<ITagInputItemProps> = ({ ref, ...props }) => {
    const onNameClick = (e: MouseEvent) => {
        e.stopPropagation()
        props.onTagClick(props.tag)
    }

    const getItemClassName = () => {
        const classNames = ['tag-item']
        if (props.isSelected) {
            classNames.push('tag-item-selected')
        }
        if (props.appliedToSelectedRegions) {
            classNames.push('tag-item-applied')
        }
        if (props.isLocked) {
            classNames.push('tag-item-locked')
        }
        return classNames.join(' ')
    }

    return (
        <div className={'tag-item-block'} ref={ref}>
            {props.tag && (
                <li
                    className={getItemClassName()}
                    style={{ background: props.tag.color }}
                >
                    <div className={`tag-color`}></div>
                    <div
                        className={
                            props.isLocked
                                ? 'tag-content-locked'
                                : 'tag-content-unlocked'
                        }
                        onClick={onNameClick}
                    >
                        <div className="tag-name-container">
                            <div className="tag-name-body">
                                <span
                                    title={props.tag.title || props.tag.name}
                                    className={'tag-name-text px-2'}
                                >
                                    {props.tag.dispName || props.tag.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </li>
            )}
        </div>
    )
}

export default TagInputItem
