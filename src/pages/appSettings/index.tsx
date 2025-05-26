import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSettings } from '../../atom/state'
import {
    useAppSettingsActions,
    useProjectActions,
    useReportActions,
} from '../../atom/actions'

import AppSettingsPage from '../../components/pages/appSettings/appSettingsPage'

const AppSettings: React.FC = () => {
    const navigate = useNavigate()
    const appSettings = useAppSettings()
    const appSettingsActions = useAppSettingsActions()
    const projectActions = useProjectActions()
    const reportActions = useReportActions()

    return (
        <AppSettingsPage
            navigate={navigate}
            appSettings={appSettings}
            actions={appSettingsActions}
            projectActions={projectActions}
            reportActions={reportActions}
        />
    )
}

export default AppSettings
