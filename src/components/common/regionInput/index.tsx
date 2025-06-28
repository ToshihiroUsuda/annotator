import React, { useRef } from 'react'
// import ReactDOM from 'react-dom'
import {
    IRegion,
    IRegionMetadata,
    ITag,
} from '../../../models/applicationState'
import RegionInputItem, { IRegionInputItemProps } from './regionInputItem'

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

export const RegionInput: React.FC<IRegionInputProps> = (props) => {
    const regionItemRefs = useRef<Map<string, any>>(new Map())
    // const portalDiv = document.createElement('div')

    const renderRegionList = (regions: IRegion[]) => {
        return (
            <div className="h-full overflow-x-hidden overflow-y-auto">
                <h6 className="text-xs text-gray-100 m-0 uppercase bg-black/10 p-2 flex flex-row">
                    <span className="flex-1">
                        Regions
                    </span>
                </h6>
                <div className="flex-grow flex overflow-auto flex-col relative">
                    <div className="region-input-items">
                        {renderRegionItems(regions)}
                    </div>
                </div>
            </div>
        )
    }

    const renderRegionItems = (regions: IRegion[]) => {
        if (!regions) {
            return
        }
        const propsList = createRegionItemProps(regions)
        regionItemRefs.current.clear()
        return propsList.map((prop) => (
            <RegionInputItem
                key={prop.region.id}
                {...prop}
            />
        ))
    }

    const setRegionItemRef = (
        item: any,
        region: IRegion
    ) => {
        if (item) {
            regionItemRefs.current.set(region.id, item)
        }
    }

    const createRegionItemProps = (
        regions: IRegion[]
    ): IRegionInputItemProps[] => {
        // const selectedRegionSet = getSelectedRegionSet();

        return regions.map((region, index) => {
            const regionMetadata = props.regionMetadata
                ? props.regionMetadata[region.id]
                : null
            const isLocked = regionMetadata ? regionMetadata.isLocked : false
            const isHided = regionMetadata ? regionMetadata.isHidden : false
            const isFirst = regionMetadata
                ? !regionMetadata.firstTimestamp ||
                  regionMetadata.firstTimestamp === props.timestamp
                : false
            const isLast = regionMetadata
                ? !regionMetadata.lastTimestamp ||
                  regionMetadata.lastTimestamp === props.timestamp
                : false
            const regionProps: IRegionInputItemProps = {
                index,
                region,
                tags: props.tags,
                isSelected: props.isFrozen
                    ? false
                    : props.selectedRegions.findIndex(
                          (r) => r.id === region.id
                      ) >= 0,
                appliedToSelectedRegions: props.isFrozen
                    ? false
                    : !!props.selectedRegions,
                isFrozen: props.isFrozen,
                isLocked: props.isFrozen || isLocked,
                isHided: isHided,
                isFirst: isFirst,
                isLast: isLast,
                onClick: props.isFrozen
                    ? () => {}
                    : props.onRegionClick,
                onTagChange: props.isFrozen
                    ? () => {}
                    : props.onTagChange,
                onConfidenceChange: props.isFrozen
                    ? () => {}
                    : props.onConfidenceChange,
                onFirstAssetClick: props.onFirstAssetClick,
                onPreviousAssetClick: props.onPreviousAssetClick,
                onNextAssetClick: props.onNextAssetClick,
                onLastAssetClick: props.onLastAssetClick,
                onHideClick: props.onHideClick,
                onLockClick:
                    props.isFrozen || isHided
                        ? () => {}
                        : props.onLockClick,
                onDeleteClick:
                    props.isFrozen || isLocked || isHided
                        ? () => {}
                        : props.onDeleteClick,
                onInterpolateClick:
                    props.isFrozen || isLocked || isHided
                        ? () => {}
                        : props.onInterpolateClick,
                onIdClick:
                    props.isFrozen || isLocked || isHided
                        ? () => {}
                        : props.onIdClick,
            }
            return regionProps
        })
    }

    let regions = props.regions
    if (props.selectedRegions.length > 0) {
        if (props.selectedRegions[0].tags.length === 0) {
            regions = [...regions, ...props.selectedRegions]
        }
    }
    
    return (
        <div className="select-none bg-white/10 min-w-[250px] flex flex-grow flex-col">
            {renderRegionList(regions)}
        </div>
    )
}

