import React, { useEffect, useState } from 'react'
import { IReport } from '../../models/applicationState'
import { useNavigate, useParams } from 'react-router-dom'
import { useReportActions } from '../../atom/actions'
import {
    useAppSettings,
    useRecentProjects,
    useRecentReports,
} from '../../atom/state'

import ReportPage from '../../components/pages/report/reportPage'

const Report: React.FC = () => {
    const [report, setReport] = useState<IReport | undefined>()

    const { reportId } = useParams<{ reportId: string }>()
    const navigate = useNavigate()

    const recentProjects = useRecentProjects()
    const recentReports = useRecentReports()
    const appSettings = useAppSettings()

    const reportActions = useReportActions()

    useEffect(() => {
        const report = recentReports.find((r) => r.id === reportId)
        if (report) {
            setReport(report)
        }
    }, [])

    if (!report) return null
    return (
        <ReportPage
            navigate={navigate}
            report={report}
            recentReports={recentReports}
            recentProjects={recentProjects}
            appSettings={appSettings}
            reportActions={reportActions}
        />
    )
}

export default Report
