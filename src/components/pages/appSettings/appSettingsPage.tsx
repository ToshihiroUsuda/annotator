import React, { useState } from "react";
import { toast } from "react-toastify";
import { IAppSettingsActions } from "../../../atom/actions/appSettings";
import { IProjectActions } from "../../../atom/actions/project";
import { IReportActions } from "../../../atom/actions/report";
import { initialAppSettings } from "../../../atom/initialState";
import { appInfo } from "../../../common/appInfo";
import { strings } from "../../../common/strings";
import { AppMode, IAppSettings } from "../../../models/applicationState";
import Confirm from "../../common/confirm";
import PropsWithNavigate from "../navigate";
import { AppSettingsForm } from "./appSettingsForm";

export interface IAppSettingsProps extends PropsWithNavigate {
  appSettings: IAppSettings;
  actions: IAppSettingsActions;
  projectActions: IProjectActions;
  reportActions: IReportActions;
}

const AppSettingsPage = (props: IAppSettingsProps) => {
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isInitializeConfirmOpen, setIsInitializeConfirmOpen] = useState(false);
  const onFormSubmit = (appSettings: IAppSettings) => {
    if (
      appSettings.rootDirectory !== props.appSettings.rootDirectory ||
      appSettings.appMode !== props.appSettings.appMode ||
      JSON.stringify(appSettings.tags) !==
        JSON.stringify(props.appSettings.tags) ||
      appSettings.timingsFile !== props.appSettings.timingsFile
    ) {
      props.projectActions.clearAllProjects();
      if (
        appSettings.appMode === AppMode.Hospital ||
        props.appSettings.appMode === AppMode.Hospital
      ) {
        props.reportActions.clearAllReports();
      }
    }
    props.actions.saveAppSettings(appSettings);
    toast.success(strings.appSettings.messages.saveSuccess);
    props.navigate("/");
  };

  const onFormCancel = (appSettings: IAppSettings) => {
    props.actions.saveAppSettings(appSettings);
    props.navigate("/");
  };

  const onFormExport = () => {
    toast.success(strings.appSettings.messages.saveSuccess);
  };

  const onFormImport = (appSettings: IAppSettings) => {
    if (
      appSettings.rootDirectory !== props.appSettings.rootDirectory ||
      appSettings.appMode !== props.appSettings.appMode ||
      JSON.stringify(appSettings.tags) !==
        JSON.stringify(props.appSettings.tags) ||
      appSettings.timingsFile !== props.appSettings.timingsFile
    ) {
      props.projectActions.clearAllProjects();
      props.reportActions.clearAllReports();
    }
    props.actions.saveAppSettings(appSettings);
    toast.success(strings.appSettings.messages.saveSuccess);
  };

  const clearAllProjects = () => {
    props.projectActions.closeProject();
    props.projectActions.clearAllProjects();
    setIsClearAllConfirmOpen(false);
  };

  const inilializeApp = () => {
    // this.deleteAllProjects();
    localStorage.clear();
    props.actions.saveAppSettings(initialAppSettings);
    setIsInitializeConfirmOpen(false);
  };

  return (
    <div className="flex flex-row flex-grow">
      <div className="flex-grow">
        <AppSettingsForm
          appSettings={props.appSettings}
          onSubmit={onFormSubmit}
          // onChange={this.onFormChange}
          onCancel={onFormCancel}
          onExport={onFormExport}
          onImport={onFormImport}
        />
      </div>
      <div className="p-3 bg-white/5 basis-[30vw]">
        <div className="my-3">
          <p>{`${strings.appSettings.version.description} ${appInfo.version}`}</p>
        </div>
        <span>
          <div className="my-3">
            <button
              id="clearProject"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setIsClearAllConfirmOpen(true);
              }}
            >
              Clear All Projects
            </button>
          </div>
          <div className="my-3">
            <button
              id="initializeApp"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setIsInitializeConfirmOpen(true);
              }}
            >
              Initialize Application
            </button>
          </div>
        </span>
      </div>
      <Confirm
        title="Clear All Projects"
        message={`${strings.homePage.clearProject.confirmation}?`}
        confirmButtonColor="danger"
        onConfirm={clearAllProjects}
        onCancel={() => {
          setIsClearAllConfirmOpen(false);
        }}
        show={isClearAllConfirmOpen}
      />
      <Confirm
        title="Inilialize Application"
        message={`${strings.homePage.deleteProject.confirmation}?`}
        confirmButtonColor="danger"
        onConfirm={inilializeApp}
        onCancel={() => {
          setIsInitializeConfirmOpen(false);
        }}
        show={isInitializeConfirmOpen}
      />
    </div>
  );
};

export default AppSettingsPage;
