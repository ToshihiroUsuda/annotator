import React, { useRef, useEffect } from 'react'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import List, { ListRowRenderer } from 'react-virtualized/dist/commonjs/List'

import { IAppSettings, IAsset, ISize } from '../../../models/applicationState'
import { AssetPreview } from '../../common/assetPreview'

export interface IReportSideBarProps {
    assets: IAsset[]
    reportName: string
    appSettings: IAppSettings
    onAssetSelected?: (asset: IAsset) => void
    thumbnailSize: ISize
}

const ReportSideBar: React.FC<IReportSideBarProps> = (props) => {
    const listRef = useRef<List | null>(null)

    useEffect(() => {
        listRef.current?.recomputeRowHeights()
    }, [props.thumbnailSize])

    const getRowHeight = (width: number) => {
        return width / (4 / 3) + 16
    }

    const onAssetClicked = (asset: IAsset): void => {
        props.onAssetSelected?.(asset)
    }

    const rowRenderer: ListRowRenderer = ({ key, index, style }) => {
        const asset = props.assets[index]

        return (
            <div
                key={key}
                style={style}
                className="asset-item"
                onClick={() => onAssetClicked(asset)}
            >
                <div className="asset-item-image">
                    <AssetPreview
                        asset={asset}
                        projectName={props.reportName}
                        appSettings={props.appSettings}
                    />
                </div>
                <div className="asset-item-metadata">
                    <span className="asset-filename" title={asset.name}>
                        {asset.name}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="editor-page-sidebar-nav">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        className="asset-list"
                        height={height}
                        width={width}
                        rowCount={props.assets.length}
                        rowHeight={() => getRowHeight(width)}
                        rowRenderer={rowRenderer}
                        overscanRowCount={2}
                    />
                )}
            </AutoSizer>
        </div>
    )
}

export default ReportSideBar
