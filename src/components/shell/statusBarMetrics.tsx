import _ from 'lodash'
import React from 'react'
import {
    AppMode,
    AssetState,
    AssetType,
    IAppSettings,
    IProject,
} from '../../models/applicationState'

export interface IStatusBarMetricsProps {
    project?: IProject
    appSettings: IAppSettings
}

export const StatusBarMetrics: React.FC<IStatusBarMetricsProps> = (props) => {
    const { project } = props

    if (!project || props.appSettings.appMode === AppMode.Internal) {
        return null
    }

    const projectAssets = _.values(project.assets)

    const sampleAssets = projectAssets.filter((asset) => {
        return (
            asset.state === AssetState.Sample &&
            (asset.type === AssetType.Image ||
                asset.type === AssetType.VideoFrame)
        )
    })
    const stepAssets = projectAssets.filter((asset) => {
        return !!asset.step
    })
    return (
        <ul>
            <li>
                <i className="fas fa-folder-open"></i>
                <span className="metric-source-connection-name">
                    {project.name}
                </span>
            </li>
            <li className="sample-metric">
                <i className="fas fa-edit"></i>
                <span className="metric-sample-asset-count">
                    {sampleAssets.length}
                </span>
            </li>
            <li className="step-metric">
                <i className="fas fa-info-circle"></i>
                <span className="metric-step-asset-count">
                    {stepAssets.length}
                </span>
            </li>
        </ul>
    )
}
