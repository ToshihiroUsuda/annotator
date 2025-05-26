import React from 'react'
import { IRegion, ITag } from '../../../models/applicationState'
import './tagInput.scss'
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

export class TagInput extends React.Component<ITagInputProps, ITagInputState> {
    public state: ITagInputState = {
        tags: this.props.tags || [],
        clickedColor: false,
    }

    private tagItemRefs: Map<string, HTMLDivElement> = new Map<
        string,
        HTMLDivElement
    >()

    public render() {
        // TODO
        return (
            <div className="tag-input condensed-list">
                <div className="tag-input-body">
                    <div className={`taglist`}>
                        <div className="condensed-list-body">
                            <div className="tag-input-items">
                                {this.renderTagItems(this.state.tags)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    public componentDidUpdate(prevProps: ITagInputProps) {
        if (prevProps.tags !== this.props.tags) {
            this.setState({
                tags: this.props.tags,
            })
        }
    }

    private renderTagItems = (tags: ITag[]) => {
        const propsList = this.createTagItemPropsList(tags)
        this.tagItemRefs.clear()

        return propsList.map((props) => (
            <TagInputItem key={props.tag.name} {...props} />
        ))
    }

    private setTagItemRef = (item: HTMLDivElement | null, tag: ITag): void => {
        if (item) {
            this.tagItemRefs.set(tag.name, item)
        }
    }

    private createTagItemPropsList = (tags: ITag[]): ITagInputItemProps[] => {
        const selectedRegionTagSet = this.getSelectedRegionTagSet()

        return tags.map((tag, index) => ({
            tag,
            index,
            isSelected:
                this.props.isLocked || this.props.selectedTag === tag.name,
            appliedToSelectedRegions:
                this.props.isLocked || selectedRegionTagSet.has(tag.name),
            isLocked: this.props.isLocked,
            onTagClick: this.props.isLocked ? () => {} : this.handleClick,
            ref: (item) => this.setTagItemRef(item, tag),
        }))
    }

    private getSelectedRegionTagSet = (): Set<string> => {
        const result = new Set<string>()
        if (this.props.selectedRegions) {
            for (const region of this.props.selectedRegions) {
                for (const tag of region.tags) {
                    result.add(tag)
                }
            }
        }
        return result
    }

    private handleClick = (tag: ITag) => {
        this.props.onTagClick?.(tag)
    }
}
