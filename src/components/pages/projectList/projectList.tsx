import React from "react";
import { FaFolderOpen } from "react-icons/fa";
import { IProject } from "../../../models/applicationState";

interface IProjectsListItems {
  name: string;
  projects: IProject[];
}

interface IProjectsListProps {
  projectsListItems: IProjectsListItems[];
  onClick?: (project: IProject) => void;
}

const ProjectList: React.FC<IProjectsListProps> = (props) => {
  const { projectsListItems } = props;
  const sortedItems = projectsListItems.map((projectsListItem) => {
    return {
      name: projectsListItem.name,
      projects: projectsListItem.projects
        .slice()
        .sort((a, b) => (a.name > b.name ? 1 : -1)),
    };
  });

  const onItemClick = (project: IProject) => {
    props.onClick?.(project);
  };
  return (
    <div className="flex flex-1 flex-row relative">
      {sortedItems.map((items) => {
        const title = items.name;
        const projects = items.projects;
        return (
          <div
            key={title}
            className="flex flex-col w-1/4 border-r border-white/10"
          >
            <div className="text-base text-gray-100 m-0 uppercase sticky top-0 h-8 flex items-center p-2 bg-black/10">
              <FaFolderOpen />
              <div className="ml-2">{title}</div>
            </div>
            <div className="flex-grow flex overflow-auto flex-col relative h-[calc(100vh-112px)]">
              {projects.length === 0 && (
                <div className="p-3 text-center">No items found</div>
              )}
              {projects.length > 0 && (
                <>
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="list-none text-base text-gray-300 cursor-pointer w-full py-1 px-4 flex items-center hover:bg-white/10 active:bg-white/10"
                      onClick={() => {
                        onItemClick(project);
                      }}
                    >
                      <FaFolderOpen />
                      <div className="px-2">{project.name}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectList;
