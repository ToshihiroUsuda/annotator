import React from "react";
import { NavLink } from "react-router-dom";
import { strings } from "../../common/strings";
import {
  AppMode,
  IAppSettings,
  IProject,
  IReport,
} from "../../models/applicationState";
import ConditionalNavLink from "../common/conditionalNavLink";

interface ISidebarProps {
  project?: IProject;
  report?: IReport;
  appSettings: IAppSettings;
}

const Sidebar: React.FC<ISidebarProps> = (props: ISidebarProps) => {
  const projectId = props.project ? props.project.id : null;
  const reportId = props.report ? props.report.id : null;
  const showReportButton =
    props.appSettings.reportSchema &&
    props.appSettings.appMode === AppMode.Hospital;

  return (
    <div className="bg-lighter-2 app-sidebar">
      {props.appSettings.appMode && (
        <ul>
          <li>
            <NavLink title={"Home"} to={"/"}>
              <i className="fas fa-home"></i>
            </NavLink>
          </li>
          <li>
            {showReportButton && (
              <NavLink title={"Report List"} to={`/reportList`}>
                <i className="fas fa-folder-open fa-fw"></i>
              </NavLink>
            )}
          </li>
          <li>
            <ConditionalNavLink
              disabled={!projectId}
              title={strings.tags.editor}
              to={`/projects/${projectId}`}
            >
              <i className="fas fa-edit fa-fw"></i>
            </ConditionalNavLink>
          </li>
          <li>
            {showReportButton && (
              <ConditionalNavLink
                disabled={!reportId}
                title={"Current Report"}
                to={`/reports/${reportId}`}
              >
                <i className="fas fa-clipboard-list fa-fw"></i>
              </ConditionalNavLink>
            )}
          </li>
          <li>
            <ConditionalNavLink
              disabled={!props.appSettings.instructionDirectory}
              title={"Instruction"}
              to={"/instruction"}
            >
              <i className="fas fa-question-circle fa-fw"></i>
            </ConditionalNavLink>
          </li>
        </ul>
      )}
      <div className="app-sidebar-fill"></div>
      <ul>
        <li>
          <NavLink title={strings.appSettings.title} to={`/settings`}>
            <i className="fas fa-cog fa-fw"></i>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
