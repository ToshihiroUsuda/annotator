import React from 'react'
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

export default class ReportSideBar extends React.Component<IReportSideBarProps> {
    private listRef: React.RefObject<List | null> = React.createRef()

    public render() {
        return (
            <div className="editor-page-sidebar-nav">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            ref={this.listRef}
                            className="asset-list"
                            height={height}
                            width={width}
                            rowCount={this.props.assets.length}
                            rowHeight={() => this.getRowHeight(width)}
                            rowRenderer={this.rowRenderer}
                            overscanRowCount={2}
                        />
                    )}
                </AutoSizer>
            </div>
        )
    }

    public componentDidUpdate(prevProps: IReportSideBarProps) {
        if (prevProps.thumbnailSize !== this.props.thumbnailSize) {
            this.listRef.current?.recomputeRowHeights()
        }
    }

    private getRowHeight = (width: number) => {
        return width / (4 / 3) + 16
    }

    private onAssetClicked = (asset: IAsset): void => {
        this.props.onAssetSelected?.(asset)
    }

    private rowRenderer: ListRowRenderer = ({ key, index, style }) => {
        const asset = this.props.assets[index]

        return (
            <div
                key={key}
                style={style}
                className="asset-item"
                onClick={() => this.onAssetClicked(asset)}
            >
                <div className="asset-item-image">
                    <AssetPreview
                        asset={asset}
                        projectName={this.props.reportName}
                        appSettings={this.props.appSettings}
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
}
