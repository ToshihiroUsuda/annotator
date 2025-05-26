import React from 'react'
import { IProject } from '../../../models/applicationState'
import './projectList.scss'

interface IProjectsListItems {
    name: string
    projects: IProject[]
}

interface IProjectsListProps {
    projectsListItems: IProjectsListItems[]
    onClick?: (project: IProject) => void
}

const ProjectList: React.FC<IProjectsListProps> = (props) => {
    const { projectsListItems } = props
    const sortedItems = projectsListItems.map((projectsListItem) => {
        return {
            name: projectsListItem.name,
            projects: projectsListItem.projects
                .slice()
                .sort((a, b) => (a.name > b.name ? 1 : -1)),
        }
    })

    const onItemClick = (project: IProject) => {
        props.onClick?.(project)
    }
    return (
        <div className="projects-list">
            {sortedItems.map((items) => {
                const title = items.name
                const projects = items.projects
                return (
                    <div key={title} className="projects-list-row">
                        <h4 className="projects-list-header bg-darker-2 p-2">
                            <span>{title}</span>
                        </h4>
                        <div className="projects-list-body">
                            {projects.length === 0 && (
                                <div className="p-3 text-center">
                                    No items found
                                </div>
                            )}
                            {projects.length > 0 && (
                                <ul className="projects-list-items">
                                    {projects.map((project) => (
                                        <li
                                            key={project.id}
                                            className="recent-project-item"
                                        >
                                            <a
                                                onClick={() => {
                                                    onItemClick(project)
                                                }}
                                            >
                                                <i className="fas fa-folder-open"></i>
                                                <span className="px-2">
                                                    {project.name}
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ProjectList
