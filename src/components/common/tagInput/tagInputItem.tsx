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
        const classNames = ['flex flex-row']
        if (props.isSelected) {
            classNames.push('[&_.tag-content-unlocked]:text-white [&_.tag-content-unlocked]:mx-0.5 [&_.tag-content-unlocked]:my-0 [&_.tag-content-unlocked]:mr-0 [&_.tag-content-unlocked]:!bg-black/40')
        }
        if (props.appliedToSelectedRegions) {
            classNames.push('[&_.tag-content-unlocked]:text-white [&_.tag-content-unlocked]:font-semibold [&_.tag-content-unlocked]:!bg-black/40')
        }
        return classNames.join(' ')
    }

    return (
        <div className={'my-0.5'} ref={ref}>
            {props.tag && (
                <li
                    className={getItemClassName()}
                    style={{ background: props.tag.color }}
                >
                    <div className={`w-3`}></div>
                    <div
                        className={
                            props.isLocked
                                ? 'flex-1 bg-black/60 cursor-default'
                                : 'flex-1 bg-black/60 hover:bg-black/32 cursor-pointer tag-content-unlocked'
                        }
                        onClick={onNameClick}
                    >
                        <div className="flex flex-row min-h-[1.8rem] items-center">
                            <div className="flex-grow">
                                <span
                                    title={props.tag.title || props.tag.name}
                                    className={'max-w-[195px] block text-ellipsis overflow-hidden whitespace-nowrap px-2'}
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
