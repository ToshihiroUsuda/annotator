import React, { useState, useEffect, useRef } from 'react'
import { IRegion, ITag } from '../../../models/applicationState'
import TagInputItem, { ITagInputItemProps } from './tagInputItem'

export interface ITagInputProps {
    /** Current list of tags */
    tags: ITag[]
    /** Currently selected regions in canvas */
    selectedTag: string
    selectedRegions?: IRegion[]
    /** Place holder for input text box */
    placeHolder?: string
    /** Function to call on clicking individual tag */
    isLocked: boolean
    onTagClick?: (tag: ITag) => void
    onConfidenceChange: (region: IRegion, confidence: number) => void
}

export interface ITagInputState {
    tags: ITag[]
    clickedColor: boolean
}

export const TagInput: React.FC<ITagInputProps> = (props) => {
    const [tags, setTags] = useState(props.tags || [])
    const [clickedColor, setClickedColor] = useState(false)

    const tagItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    useEffect(() => {
        if (props.tags !== tags) {
            setTags(props.tags)
        }
    }, [props.tags])

    const renderTagItems = (tags: ITag[]) => {
        const propsList = createTagItemPropsList(tags)
        tagItemRefs.current.clear()

        return propsList.map((tagProps) => (
            <TagInputItem key={tagProps.tag.name} {...tagProps} />
        ))
    }

    const setTagItemRef = (item: HTMLDivElement | null, tag: ITag): void => {
        if (item) {
            tagItemRefs.current.set(tag.name, item)
        }
    }

    const createTagItemPropsList = (tags: ITag[]): ITagInputItemProps[] => {
        const selectedRegionTagSet = getSelectedRegionTagSet()

        return tags.map((tag, index) => ({
            tag,
            index,
            isSelected:
                props.isLocked || props.selectedTag === tag.name,
            appliedToSelectedRegions:
                props.isLocked || selectedRegionTagSet.has(tag.name),
            isLocked: props.isLocked,
            onTagClick: props.isLocked ? () => {} : handleClick,
            ref: (item) => setTagItemRef(item, tag),
        }))
    }

    const getSelectedRegionTagSet = (): Set<string> => {
        const result = new Set<string>()
        if (props.selectedRegions) {
            for (const region of props.selectedRegions) {
                for (const tag of region.tags) {
                    result.add(tag)
                }
            }
        }
        return result
    }

    const handleClick = (tag: ITag) => {
        props.onTagClick?.(tag)
    }

    // TODO
    return (
        <div className="h-full flex select-none bg-white/10 min-w-[250px]">
            <div className="flex-grow overflow-x-hidden overflow-y-auto">
                <div className={`taglist`}>
                    <div className="flex-grow flex overflow-auto flex-col relative">
                        <div className="tag-input-items">
                            {renderTagItems(tags)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

