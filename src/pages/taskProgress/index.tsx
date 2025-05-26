import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectActions, useReportActions } from '../../atom/actions'
import {
    useAppSettings,
    useRecentProjects,
    useRecentReports,
} from '../../atom/state'

import TaskProgressPage from '../../components/pages/taskProgress/taskProgressPage'

const TaskProgress: React.FC = () => {
    const navigate = useNavigate()
    const recentProjects = useRecentProjects()
    const recentReports = useRecentReports()
    const appSettings = useAppSettings()
    const projectActions = useProjectActions()
    const reportActions = useReportActions()

    return (
        <TaskProgressPage
            navigate={navigate}
            recentProjects={recentProjects}
            recentReports={recentReports}
            appSettings={appSettings}
            projectActions={projectActions}
            reportActions={reportActions}
        />
    )
}

export default TaskProgress
