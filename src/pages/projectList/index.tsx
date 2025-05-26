import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useAppSettings,
    useCurrentProject,
    useRecentProjects,
} from '../../atom/state'
import { useProjectActions } from '../../atom/actions'
import ProjectListPage from '../../components/pages/projectList/projectListPage'

const ProjectList: React.FC = () => {
    const navigate = useNavigate()
    const currentProject = useCurrentProject()
    const recentProjects = useRecentProjects()
    const appSettings = useAppSettings()
    const projectActions = useProjectActions()

    return (
        <ProjectListPage
            navigate={navigate}
            currentProject={currentProject}
            recentProjects={recentProjects}
            appSettings={appSettings}
            actions={projectActions}
        />
    )
}

export default ProjectList
