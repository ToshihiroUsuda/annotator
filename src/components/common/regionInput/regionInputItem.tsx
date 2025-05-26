import React, { MouseEvent, SyntheticEvent } from 'react'
import { IRegion, ITag, RegionState } from '../../../models/applicationState'

export interface IRegionClickProps {
    ctrlKey?: boolean
    altKey?: boolean
    clickedColor?: boolean
}

/**
 * Properties for region input item
 */
export interface IRegionInputItemProps {
    tags: ITag[]
    region: IRegion
    index: number
    isSelected: boolean
    appliedToSelectedRegions: boolean
    isFrozen: boolean
    isLocked: boolean
    isHided: boolean
    isFirst: boolean
    isLast: boolean
    onClick: (region: IRegion) => void
    onTagChange: (region: IRegion, tag: string) => void
    onConfidenceChange: (region: IRegion, confidence: number) => void
    onFirstAssetClick: (region: IRegion) => void
    onPreviousAssetClick: (region: IRegion) => void
    onNextAssetClick: (region: IRegion) => void
    onLastAssetClick: (region: IRegion) => void
    onHideClick: (region: IRegion) => void
    onLockClick: (region: IRegion) => void
    onDeleteClick: (region: IRegion) => void
    onInterpolateClick: (region: IRegion) => void
    onIdClick: (region: IRegion) => void
}

export interface IRegionInputItemState {
    /** Region is currently being edited */
    selectedTag: string
    selectedConfidence: number
    isBeingEdited: boolean
    /** Mode of region editing (text or color) */
}

const unknownTag: ITag = {
    name: 'Unknown',
    color: '#808080',
}

const regionStateIcon: { [key in RegionState]: string } = {
    [RegionState.Inputted]: 'fas fa-tag',
    [RegionState.Tracked]: 'fas fa-clone',
    [RegionState.Editted]: 'fas fa-edit',
    [RegionState.Interpolated]: 'fas fa-object-ungroup',
    [RegionState.PolygonInputted]: 'fas fa-draw-polygon',
    [RegionState.PolylineInputted]: 'fas fa-project-diagram',
} as const

export default class RegionInputItem extends React.Component<
    IRegionInputItemProps,
    IRegionInputItemState
> {
    public state: IRegionInputItemState = {
        isBeingEdited: false,
        selectedTag:
            this.props.region.tags.length > 0
                ? this.props.region.tags[0]
                : unknownTag.name,
        selectedConfidence: this.props.region.confidence || 1,
    }
    private confidenceLevels = [
        { value: 1, label: 'High' },
        { value: 2, label: 'Middle' },
        { value: 3, label: 'Low' },
    ]

    public render() {
        let tagNames = this.props.tags.map((tag) => tag.name)
        let color: string = unknownTag.color
        if (this.props.region.tags.length > 0) {
            const tag = this.props.tags.find(
                (tag) => tag.name === this.props.region.tags[0]
            )
            if (tag) {
                color = tag.color
            }
        } else {
            tagNames = [...tagNames, unknownTag.name]
        }

        const style = {
            background: color,
        }
        const isDeactive =
            this.props.isFrozen || this.props.isHided || this.props.isLocked
        return (
            <div className={'region-item-block'}>
                {this.props.region && (
                    <li className={this.getItemClassName()} style={style}>
                        <div
                            className={`region-color ${isDeactive ? 'deactive' : 'active'}`}
                        ></div>
                        <div
                            className={`region-content ${isDeactive ? 'deactive' : 'active'}`}
                            onClick={this.onNameClick}
                        >
                            {this.getRegionInformation()}
                            {this.getSelector(tagNames)}
                            {this.getToolbar()}
                        </div>
                    </li>
                )}
            </div>
        )
    }

    private onNameClick = (e: MouseEvent) => {
        e.stopPropagation()
        this.props.onClick(this.props.region)
    }

    private onTagChange = (e: SyntheticEvent) => {
        e.stopPropagation()
        const target = e.target as HTMLSelectElement
        this.setState({ selectedTag: target.value }, () =>
            this.props.onTagChange(this.props.region, target.value)
        )
        target.blur()
    }

    private onConfidenceChange = (e: SyntheticEvent) => {
        e.stopPropagation()
        const target = e.target as HTMLSelectElement
        this.setState({ selectedConfidence: parseInt(target.value) }, () =>
            this.props.onConfidenceChange(
                this.props.region,
                parseInt(target.value)
            )
        )
        target.blur()
    }

    private getItemClassName = () => {
        const classNames = ['region-item']
        if (this.props.isSelected) {
            classNames.push('selected')
        }
        if (this.props.appliedToSelectedRegions) {
            classNames.push('applied')
        }
        return classNames.join(' ')
    }

    private getRegionInformation = () => {
        let name = unknownTag.name
        if (this.props.region.tags.length > 0) {
            const regionTag = this.props.tags.find(
                (tag) => this.props.region.tags[0] === tag.name
            )
            if (regionTag) {
                name = regionTag.dispName || regionTag.name
            }
        }

        return (
            <div className={'region-name-container'}>
                <div
                    title={`${name}-${this.props.region.id}`}
                    className="region-name-body"
                >
                    <div className="region-name-title">
                        <a className="region-state-icon">
                            <i
                                className={
                                    regionStateIcon[this.props.region.state]
                                }
                            />
                        </a>
                        <span className="region-name-text px-2">{name}</span>
                        <span className="region-id-text px-2">
                            <div
                                onClick={(e) => {
                                    if (e.shiftKey && e.ctrlKey) {
                                        this.props.onIdClick(this.props.region)
                                    }
                                }}
                            >
                                {this.props.region.id}
                            </div>
                        </span>
                        <span
                            className={`delete-region ${this.props.isFrozen || this.props.isHided || this.props.isLocked ? 'deactive' : 'active'}`}
                            onClick={() =>
                                this.props.onDeleteClick(this.props.region)
                            }
                        >
                            <i className="fas fa-times"></i>
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    private getSelector = (tagNames: string[]) => {
        return (
            <div className="tag-select">
                <div className="tag selecter">
                    <select
                        value={this.state.selectedTag}
                        onClick={this.onNameClick}
                        onChange={this.onTagChange}
                        disabled={this.props.isLocked}
                    >
                        {tagNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="confidence selecter">
                    <select
                        value={this.state.selectedConfidence}
                        onClick={this.onNameClick}
                        onChange={this.onConfidenceChange}
                        disabled={this.props.isLocked}
                    >
                        {this.confidenceLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        )
    }

    private getToolbar = () => {
        return (
            <div className="region-toolbar">
                <div
                    className={`button first-region ${this.props.isFirst ? 'deactive' : 'active'}`}
                    onClick={() =>
                        this.props.onFirstAssetClick(this.props.region)
                    }
                >
                    <i className="fas fa-fast-backward"></i>
                </div>
                <div
                    className={`button previous-region ${this.props.isFirst ? 'deactive' : 'active'}`}
                    onClick={() =>
                        this.props.onPreviousAssetClick(this.props.region)
                    }
                >
                    <i className="fas fa-backward"></i>
                </div>
                <div
                    className={`button next-region ${this.props.isLast ? 'deactive' : 'active'}`}
                    onClick={() =>
                        this.props.onNextAssetClick(this.props.region)
                    }
                >
                    <i className="fas fa-forward"></i>
                </div>
                <div
                    className={`button last-region ${this.props.isLast ? 'deactive' : 'active'}`}
                    onClick={() =>
                        this.props.onLastAssetClick(this.props.region)
                    }
                >
                    <i className="fas fa-fast-forward"></i>
                </div>
                <div
                    className={`button lock-region ${this.props.isFrozen || this.props.isHided ? 'deactive' : 'active'}`}
                    onClick={() => this.props.onLockClick(this.props.region)}
                >
                    <i
                        className={`fas fa-${this.props.isLocked ? 'unlock' : 'lock'}`}
                    ></i>
                </div>
                <div
                    className={`button hide-region ${this.props.isFrozen ? 'deactive' : 'active'}`}
                    onClick={() => this.props.onHideClick(this.props.region)}
                >
                    <i
                        className={`fas fa-${this.props.isHided ? 'eye' : 'eye-slash'}`}
                    ></i>
                </div>
                {/* <div className={`button delete-region ${this.props.isFrozen || this.props.isHided || this.props.isLocked ? "deactive": "active"}`}
                    onClick={() => this.props.onDeleteClick(this.props.region)}
               >
                   <i className="fas fa-trash"></i>
               </div> */}
                <div
                    className={`button interpolate-region ${this.props.isFrozen || this.props.isHided || this.props.isLocked ? 'deactive' : 'active'}`}
                    onClick={() =>
                        this.props.onInterpolateClick(this.props.region)
                    }
                >
                    <i className="fas fa-object-ungroup"></i>
                </div>
            </div>
        )
    }
}
