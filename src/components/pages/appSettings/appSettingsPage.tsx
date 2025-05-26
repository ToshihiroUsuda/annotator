import React from "react";
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
import "./appSettingsPage.scss";

export interface IAppSettingsProps extends PropsWithNavigate {
  appSettings: IAppSettings;
  actions: IAppSettingsActions;
  projectActions: IProjectActions;
  reportActions: IReportActions;
}

interface IAppSettingsState {
  isClearAllConfirmOpen: boolean;
  isInitializeConfirmOpen: boolean;
}

export default class AppSettingsPage extends React.Component<
  IAppSettingsProps,
  IAppSettingsState
> {
  constructor(props: IAppSettingsProps) {
    super(props);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFormCancel = this.onFormCancel.bind(this);
    this.onFormImport = this.onFormImport.bind(this);
    this.onFormExport = this.onFormExport.bind(this);
    this.state = {
      isClearAllConfirmOpen: false,
      isInitializeConfirmOpen: false,
    };
  }
  public render() {
    return (
      <div className="app-settings-page">
        <AppSettingsForm
          appSettings={this.props.appSettings}
          onSubmit={this.onFormSubmit}
          // onChange={this.onFormChange}
          onCancel={this.onFormCancel}
          onExport={this.onFormExport}
          onImport={this.onFormImport}
        />
        <div className="app-settings-page-sidebar p-3 bg-lighter-1">
          <div className="my-3">
            <p>{`${strings.appSettings.version.description} ${appInfo.version}`}</p>
          </div>
          <span>
            <div className="my-3">
              <button
                id="clearProject"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  this.setState({ isClearAllConfirmOpen: true });
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
                  this.setState({ isInitializeConfirmOpen: true });
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
          onConfirm={this.clearAllProjects}
          onCancel={() => {
            this.setState({ isClearAllConfirmOpen: false });
          }}
          show={this.state.isClearAllConfirmOpen}
        />
        <Confirm
          title="Inilialize Application"
          message={`${strings.homePage.deleteProject.confirmation}?`}
          confirmButtonColor="danger"
          onConfirm={this.inilializeApp}
          onCancel={() => {
            this.setState({ isInitializeConfirmOpen: false });
          }}
          show={this.state.isInitializeConfirmOpen}
        />
      </div>
    );
  }

  private onFormSubmit(appSettings: IAppSettings) {
    if (
      appSettings.rootDirectory !== this.props.appSettings.rootDirectory ||
      appSettings.appMode !== this.props.appSettings.appMode ||
      JSON.stringify(appSettings.tags) !==
        JSON.stringify(this.props.appSettings.tags) ||
      appSettings.timingsFile !== this.props.appSettings.timingsFile
    ) {
      this.props.projectActions.clearAllProjects();
      if (
        appSettings.appMode === AppMode.Hospital ||
        this.props.appSettings.appMode === AppMode.Hospital
      ) {
        this.props.reportActions.clearAllReports();
      }
    }
    this.props.actions.saveAppSettings(appSettings);
    toast.success(strings.appSettings.messages.saveSuccess);
    this.props.navigate("/");
  }

  // private onFormChange(appSettings: IAppSettings) {
  //     // this.props.actions.saveAppSettings(appSettings);
  // }

  private onFormCancel(appSettings: IAppSettings) {
    this.props.actions.saveAppSettings(appSettings);
    this.props.navigate("/");
  }

  private onFormExport() {
    toast.success(strings.appSettings.messages.saveSuccess);
  }

  private onFormImport(appSettings: IAppSettings) {
    if (
      appSettings.rootDirectory !== this.props.appSettings.rootDirectory ||
      appSettings.appMode !== this.props.appSettings.appMode ||
      JSON.stringify(appSettings.tags) !==
        JSON.stringify(this.props.appSettings.tags) ||
      appSettings.timingsFile !== this.props.appSettings.timingsFile
    ) {
      this.props.projectActions.clearAllProjects();
      this.props.reportActions.clearAllReports();
    }
    this.props.actions.saveAppSettings(appSettings);
    toast.success(strings.appSettings.messages.saveSuccess);
  }

  private clearAllProjects = () => {
    this.props.projectActions.closeProject();
    this.props.projectActions.clearAllProjects();
    this.setState({ isClearAllConfirmOpen: false });
  };

  private inilializeApp = () => {
    // this.deleteAllProjects();
    localStorage.clear();
    this.props.actions.saveAppSettings(initialAppSettings);
    this.setState({ isInitializeConfirmOpen: false });
  };
}
