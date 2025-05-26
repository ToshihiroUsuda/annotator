import React from 'react'
import { appInfo } from '../../common/appInfo'
import './statusBar.scss'

export const StatusBar: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <div className="status-bar">
            <div className="status-bar-main">{children}</div>
            <div className="status-bar-version">
                <ul>
                    <li>
                        <i className="fas fa-code-branch"></i>
                        <span>{appInfo.version}</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}
