import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Route, Routes } from "react-router-dom";
import { ErrorHandler } from "./components/common/errorHandler";
import { KeyboardManager } from "./components/common/keyboardManager";
import AppSettings from "./pages/appSettings";
import Editor from "./pages/editor";
import ProjectList from "./pages/projectList";
import Report from "./pages/report";
import ReportList from "./pages/reportList";
import TaskProgress from "./pages/taskProgress";

import Sidebar from "./components/shell/sidebar";
import { StatusBar } from "./components/shell/statusBar";
import { StatusBarMetrics } from "./components/shell/statusBarMetrics";
import { ErrorCode, IAppError } from "./models/applicationState";
import PageRouter from "./pages/pageRouter";

import {
  useAppError,
  useAppSettings,
  useCurrentProject,
  useCurrentReport,
} from "./atom/state";
import { useAppErrorActions, IAppErrorActions } from "./atom/actions";

interface IErrorHandler extends React.PropsWithChildren {
  appError?: IAppError;
  appErrorActions: IAppErrorActions;
}

class ErrorHandlerWrapper extends React.Component<IErrorHandler> {
  public componentDidCatch(error: Error) {
    this.props.appErrorActions.showError({
      errorCode: ErrorCode.GenericRenderError,
      title: error.name,
      message: error.message,
    });
  }

  public render() {
    return (
      <>
        <ErrorHandler
          error={this.props.appError}
          onError={this.props.appErrorActions.showError}
          onClearError={this.props.appErrorActions.clearError}
        />
        {(!this.props.appError ||
          this.props.appError.errorCode !== ErrorCode.GenericRenderError) &&
          this.props.children}
      </>
    );
  }
}

const App: React.FC = () => {
  const currentProject = useCurrentProject();
  const currentReport = useCurrentReport();
  const appError = useAppError();
  const appSettings = useAppSettings();
  const appErrorActions = useAppErrorActions();

  return (
    <ErrorHandlerWrapper appError={appError} appErrorActions={appErrorActions}>
      <KeyboardManager>
        <BrowserRouter>
          <div className={`app-shell platform-win32`}>
            <div className="app-main">
              <Sidebar
                project={currentProject}
                report={currentReport}
                appSettings={appSettings}
              />
              <div className="app-content text-light">
                <Routes>
                  <Route path="/" element={<PageRouter />} />
                  <Route path="/hospital-home" element={<TaskProgress />} />
                  <Route path="/internal-home" element={<ProjectList />} />
                  <Route path="/reportList" element={<ReportList />} />
                  <Route path="/settings" element={<AppSettings />} />
                  <Route path="/projects/:projectId" element={<Editor />} />
                  <Route path="/reports/:reportId" element={<Report />} />
                </Routes>
              </div>
            </div>
            <StatusBar>
              <StatusBarMetrics
                project={currentProject}
                appSettings={appSettings}
              />
            </StatusBar>
            <ToastContainer className="vott-toast-container" />
          </div>
        </BrowserRouter>
      </KeyboardManager>
    </ErrorHandlerWrapper>
  );
};

export default App;
