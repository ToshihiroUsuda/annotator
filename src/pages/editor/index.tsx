import React, { useEffect, useState } from 'react'
import { IProject } from '../../models/applicationState'
import { useNavigate, useParams } from 'react-router-dom'
import {
    useAppSettings,
    useRecentProjects,
    useRecentReports,
} from '../../atom/state'
import { useAppSettingsActions, useProjectActions } from '../../atom/actions'

import EditorPage from '../../components/pages/editor/editorPage'

const Editor: React.FC = () => {
    const [project, setProject] = useState<IProject | null>(null)

    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()

    const recentProjects = useRecentProjects()
    const recentReports = useRecentReports()
    const appSettings = useAppSettings()

    const appSettingsActions = useAppSettingsActions()
    const projectActions = useProjectActions()

    useEffect(() => {
        const project = recentProjects.find((p) => p.id === projectId)
        if (project) {
            setProject(project)
        }
    }, [])

    if (!project) return null
    return (
        <EditorPage
            navigate={navigate}
            project={project}
            recentProjects={recentProjects}
            recentReports={recentReports}
            appSettings={appSettings}
            actions={projectActions}
            appSettingsActions={appSettingsActions}
        />
    )
}

export default Editor
