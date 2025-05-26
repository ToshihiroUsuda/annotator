import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useReportActions } from '../../atom/actions'
import { useAppSettings, useRecentReports } from '../../atom/state'

import ReportListPage from '../../components/pages/reportList/reportListPage'

const ReportList: React.FC = () => {
    const navigate = useNavigate()
    const recentReports = useRecentReports()
    const appSettings = useAppSettings()
    const reportActions = useReportActions()
    return (
        <ReportListPage
            navigate={navigate}
            recentReports={recentReports}
            appSettings={appSettings}
            reportActions={reportActions}
        />
    )
}

export default ReportList
