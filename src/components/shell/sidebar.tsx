import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaFolderOpen,
  FaEdit,
  FaClipboardList,
  FaQuestionCircle,
  FaCog,
} from "react-icons/fa";
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
    <div className="bg-white/10 text-xl flex flex-col py-2">
      {props.appSettings.appMode && (
        <>
          <div className="p-2 flex justify-center">
            <NavLink title={"Home"} to={"/"}>
              <FaHome size={24} className="text-gray-200 hover:text-white" />
            </NavLink>
          </div>

          {showReportButton && (
            <div className="p-2 flex justify-center">
              <NavLink title={"Report List"} to={`/reportList`}>
                {/* <i className="fas fa-folder-open fa-fw"></i> */}
                <FaFolderOpen
                  size={24}
                  className="text-gray-200 hover:text-white"
                />
              </NavLink>
            </div>
          )}
          <div className="p-2 flex justify-center">
            <ConditionalNavLink
              disabled={!projectId}
              title={strings.tags.editor}
              to={`/projects/${projectId}`}
            >
              <FaEdit size={24} className="text-gray-200 hover:text-white" />
            </ConditionalNavLink>
          </div>
          {showReportButton && (
            <div className="p-2 flex justify-center">
              <ConditionalNavLink
                disabled={!reportId}
                title={"Current Report"}
                to={`/reports/${reportId}`}
              >
                <FaClipboardList
                  size={24}
                  className="text-gray-200 hover:text-white "
                />
              </ConditionalNavLink>
            </div>
          )}
          <div className="p-2 flex justify-center">
            <ConditionalNavLink
              disabled={!props.appSettings.instructionDirectory}
              title={"Instruction"}
              to={"/instruction"}
            >
              <FaQuestionCircle
                size={24}
                className="text-gray-200 hover:text-white cursor-pointer"
              />
            </ConditionalNavLink>
          </div>
        </>
      )}
      <div className="flex-grow"></div>
      <div className="p-2 flex justify-center">
        <NavLink title={strings.appSettings.title} to={`/settings`}>
          <FaCog size={24} className="text-gray-200 hover:text-white" />
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
