import React from 'react'
// import ReactDOM from 'react-dom'
import {
    IRegion,
    IRegionMetadata,
    ITag,
} from '../../../models/applicationState'
import RegionInputItem, { IRegionInputItemProps } from './regionInputItem'
import './regionInput.scss'

export interface IRegionInputProps {
    regions: IRegion[]
    regionMetadata: { [index: string]: IRegionMetadata }
    timestamp?: number
    tags: ITag[]
    selectedRegions: IRegion[]
    isFrozen: boolean
    onRegionClick: (region: IRegion) => void
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

export class RegionInput extends React.Component<IRegionInputProps> {
    private regionItemRefs: Map<string, RegionInputItem> = new Map<
        string,
        RegionInputItem
    >()
    // private portalDiv = document.createElement('div')

    public render() {
        let regions = this.props.regions
        if (this.props.selectedRegions.length > 0) {
            if (this.props.selectedRegions[0].tags.length === 0) {
                regions = [...regions, ...this.props.selectedRegions]
            }
        }
        return (
            <div className="region-input condensed-list">
                {this.renderRegionList(regions)}
            </div>
        )
    }

    private renderRegionList = (regions: IRegion[]) => {
        return (
            <div className="regionlist">
                <h6 className="condensed-list-header region-input-header bg-darker-2 p-2">
                    <span className="condensed-list-title region-input-title">
                        Regions
                    </span>
                </h6>
                <div className="condensed-list-body">
                    <div className="region-input-items">
                        {this.renderRegionItems(regions)}
                    </div>
                </div>
            </div>
        )
    }

    private renderRegionItems = (regions: IRegion[]) => {
        if (!regions) {
            return
        }
        const props = this.createRegionItemProps(regions)
        this.regionItemRefs.clear()
        return props.map((prop) => (
            <RegionInputItem
                key={prop.region.id}
                ref={(item) => this.setRegionItemRef(item, prop.region)}
                {...prop}
            />
        ))
    }

    private setRegionItemRef = (
        item: RegionInputItem | null,
        region: IRegion
    ) => {
        if (item) {
            this.regionItemRefs.set(region.id, item)
        }
    }

    private createRegionItemProps = (
        regions: IRegion[]
    ): IRegionInputItemProps[] => {
        // const selectedRegionSet = this.getSelectedRegionSet();

        return regions.map((region, index) => {
            const regionMetadata = this.props.regionMetadata
                ? this.props.regionMetadata[region.id]
                : null
            const isLocked = regionMetadata ? regionMetadata.isLocked : false
            const isHided = regionMetadata ? regionMetadata.isHidden : false
            const isFirst = regionMetadata
                ? !regionMetadata.firstTimestamp ||
                  regionMetadata.firstTimestamp === this.props.timestamp
                : false
            const isLast = regionMetadata
                ? !regionMetadata.lastTimestamp ||
                  regionMetadata.lastTimestamp === this.props.timestamp
                : false
            const props: IRegionInputItemProps = {
                index,
                region,
                tags: this.props.tags,
                isSelected: this.props.isFrozen
                    ? false
                    : this.props.selectedRegions.findIndex(
                          (r) => r.id === region.id
                      ) >= 0,
                appliedToSelectedRegions: this.props.isFrozen
                    ? false
                    : !!this.props.selectedRegions,
                isFrozen: this.props.isFrozen,
                isLocked: this.props.isFrozen || isLocked,
                isHided: isHided,
                isFirst: isFirst,
                isLast: isLast,
                onClick: this.props.isFrozen
                    ? () => {}
                    : this.props.onRegionClick,
                onTagChange: this.props.isFrozen
                    ? () => {}
                    : this.props.onTagChange,
                onConfidenceChange: this.props.isFrozen
                    ? () => {}
                    : this.props.onConfidenceChange,
                onFirstAssetClick: this.props.onFirstAssetClick,
                onPreviousAssetClick: this.props.onPreviousAssetClick,
                onNextAssetClick: this.props.onNextAssetClick,
                onLastAssetClick: this.props.onLastAssetClick,
                onHideClick: this.props.onHideClick,
                onLockClick:
                    this.props.isFrozen || isHided
                        ? () => {}
                        : this.props.onLockClick,
                onDeleteClick:
                    this.props.isFrozen || isLocked || isHided
                        ? () => {}
                        : this.props.onDeleteClick,
                onInterpolateClick:
                    this.props.isFrozen || isLocked || isHided
                        ? () => {}
                        : this.props.onInterpolateClick,
                onIdClick:
                    this.props.isFrozen || isLocked || isHided
                        ? () => {}
                        : this.props.onIdClick,
            }
            return props
        })
    }
}
