import _ from 'lodash'
import React from 'react'
import { FaFolderOpen, FaEdit, FaInfoCircle } from 'react-icons/fa'
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
                <FaFolderOpen />
                <span className="metric-source-connection-name">
                    {project.name}
                </span>
            </li>
            <li className="text-green-500">
                <FaEdit />
                <span className="metric-sample-asset-count">
                    {sampleAssets.length}
                </span>
            </li>
            <li className="text-fuchsia-500">
                <FaInfoCircle />
                <span className="metric-step-asset-count">
                    {stepAssets.length}
                </span>
            </li>
        </ul>
    )
}
