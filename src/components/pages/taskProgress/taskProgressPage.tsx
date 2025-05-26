import _ from "lodash";
import React, { useEffect, useState } from "react";
import { IProjectActions } from "../../../atom/actions/project";
import { IReportActions } from "../../../atom/actions/report";
import { constants } from "../../../common/constants";
import { watchRootDirectory } from "./fileWatch";
import { normalizeSlashes } from "../../../common/utils";
import {
  IAppSettings,
  IProject,
  IReport,
  ProjectPhase,
  ReportPhase,
} from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import NameInputModal from "./nameInputModal";
import NewDataModal from "./newDataModal";
import TaskControlToolbar from "./taskControlToolbar";
import "./taskProgressPage.scss";
import TaskProgressTable from "./taskProgressTable";
import ViimProcess from "./viimProcess";

import moment from "moment";
import { AppError, ErrorCode } from "../../../models/applicationState";
import PropsWithNavigate from "../navigate";
import path from "path-browserify";
import { UnwatchFn } from "@tauri-apps/plugin-fs";

type TCaseData = Record<string, Record<string, string>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TNewData = Record<string, Record<string, any>>;

const readDatabaseFile = async (dirPath: string) => {
  let databaseJson: string;

  try {
    databaseJson = await LocalFileSystem.readText(
      path.join(dirPath, constants.databaseFileName)
    );
  } catch {
    throw new AppError(
      ErrorCode.DatabaseJsonNotFoundError,
      '"database.json" is not found.'
    );
  }

  let caseData: TCaseData;
  let newData: TNewData;
  try {
    const database = JSON.parse(databaseJson);
    caseData = "data" in database ? database["data"] : null;
    newData = "new_data" in database ? database["new_data"] : null;
  } catch {
    throw new Error("database.json is broken");
  }
  return [caseData, newData] as const;
};

interface ITaskProgressProps extends PropsWithNavigate {
  recentProjects: IProject[];
  recentReports: IReport[];
  appSettings: IAppSettings;
  projectActions: IProjectActions;
  reportActions: IReportActions;
}

const TaskProgressPage: React.FC<ITaskProgressProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const [caseData, setCaseData] = useState<TCaseData>({});
  const [newData, setNewData] = useState<TNewData>({});

  const [newCaseData, setNewCaseData] = useState<TCaseData>({});

  const [isNewDataModalOpen, setIsNewDataModalOpen] = useState(false);
  const [isNameInputModalOpen, setIsNameInputModalOpen] = useState(false);

  const [lockedProcess, setLockedProcess] = useState<string[]>([]);
  const [viimProcess, setViimProcess] = useState<ViimProcess>();

  const updateData = async () => {
    try {
      const [caseDataRead, newDataRead] = await readDatabaseFile(
        props.appSettings.rootDirectory
      );
      if (_.keys(newDataRead).length > 0) {
        setIsNewDataModalOpen(true);
      } else {
        setIsNewDataModalOpen(false);
      }

      setCaseData(caseDataRead);
      setNewData(newDataRead);
      return [caseDataRead, newDataRead] as const;
    } catch {
      // console.log("database.json broken, skip update")
      return [caseData, newData] as const;
    }
  };

  // File Wathcer関係
  const onFileChanged = async (fileName: string) => {
    if (fileName === constants.databaseFileName) {
      await updateData();
    }
  };
  const onFileCreated = (fileName: string) => {
    if (
      fileName.split(".").pop() === constants.lockFileExtention &&
      fileName !== "update.lock"
    ) {
      const processName = fileName.split(".")[0];
      setLockedProcess([
        processName,
        ...lockedProcess.filter((t) => t !== processName),
      ]);
    }
  };
  const onFileRemoved = (fileName: string) => {
    if (
      fileName.split(".").pop() === constants.lockFileExtention &&
      fileName !== "update.lock"
    ) {
      const processName = fileName.split(".")[0];
      setLockedProcess(lockedProcess.filter((t) => t !== processName));
    }
  };

  const executeLoad = async () => {
    setLockedProcess(["load", ...lockedProcess.filter((t) => t !== "load")]);
    const prevCaseNames = _.keys(caseData);
    await viimProcess?.executeLoad();
    await updateData();
    const caseNames = _.keys(caseData);
    const newCaseData: TCaseData = {};
    caseNames.forEach((caseName) => {
      if (!prevCaseNames.includes(caseName)) {
        newCaseData[caseName] = caseData[caseName];
      }
    });
    if (_.keys(newCaseData).length > 0) {
      setNewCaseData(newCaseData);
      setIsNameInputModalOpen(true);
    }
    setLockedProcess(lockedProcess.filter((t) => t !== "load"));
  };

  const executeSend = async (dstDirectory: string) => {
    setLockedProcess(["send", ...lockedProcess.filter((t) => t !== "send")]);
    await viimProcess?.executeSend(dstDirectory);
    await updateData();
    setLockedProcess(lockedProcess.filter((t) => t !== "sednd"));
  };

  useEffect(() => {
    // 初回マウント時

    let unwatch: UnwatchFn | undefined;
    (async () => {
      unwatch = await watchRootDirectory(
        props.appSettings.rootDirectory,
        onFileCreated,
        onFileChanged,
        onFileRemoved
      );
    })();

    setViimProcess(
      new ViimProcess(
        props.appSettings.viimScript,
        props.appSettings.viimSetting
      )
    );
    // rootDirectryが変わってrecentReportsがリセットされたときなど
    // recentReportsをすべて読み込む
    (async () => {
      if (props.recentProjects.length === 0) {
        await props.reportActions.loadAllReports();
      }
      setInitializing(false);
    })();

    return () => {
      if (unwatch) {
        unwatch();
        unwatch = undefined;
      }
      viimProcess?.release();
    };
  }, []);

  useEffect(() => {
    if (!initializing) {
      (async () => {
        // 初回のdatabase.json読み込み
        // project, reportとstatusが違ったら変更する。
        const [caseData] = await updateData();

        const updateKeyValues: string[] = [];

        props.recentProjects.forEach(async (project) => {
          const status =
            project.phase === ProjectPhase.Waiting
              ? "yet"
              : project.phase === ProjectPhase.Completed
                ? "done"
                : "doing";
          if (
            project.name in caseData &&
            status !== caseData[project.name]["annotate"]
          ) {
            updateKeyValues.push(`data.${project.name}.annotate-${status}`);
          }
        });

        props.recentReports.forEach(async (report) => {
          const status =
            report.phase === ReportPhase.Waiting
              ? "yet"
              : report.phase === ReportPhase.Completed
                ? "done"
                : "doing";
          if (
            report.name in caseData &&
            status !== caseData[report.name]["report"]
          ) {
            updateKeyValues.push(`data.${report.name}.report-${status}`);
          }
        });
        viimProcess?.executeUpdateDatabase(updateKeyValues);
      })();
      (async () => {
        // 初回のlockファイルリスト取得
        try {
          const processNames = (
            await LocalFileSystem.listFiles(props.appSettings.rootDirectory)
          )
            .filter((fileName) => {
              return (
                fileName.split(".").pop() === constants.lockFileExtention &&
                normalizeSlashes(fileName).split("/").pop() !== "update.lock"
              );
            })
            .map((fileName) => {
              return path.basename(
                fileName,
                path.extname(normalizeSlashes(fileName))
              );
            });
          setLockedProcess(processNames);
        } catch {
          setLockedProcess([]);
        }
      })();

      // 最初にTableを表示するまではLoading
      setLoading(false);
    }

    return () => {
      props.reportActions.saveAllReports();
    };
  }, [initializing]);

  const createNewReport = async (
    caseName: string,
    date: string,
    time: string
  ) => {
    const dateTime = moment(`${date} ${time}`, "YYYY/MM/DD HH:mm:ss").toJSON();
    props.reportActions.createReport(caseName, dateTime);
  };

  useEffect(() => {
    const projectNames = props.recentProjects.map((project) => project.name);
    const newProjectNames = _.keys(caseData).filter(
      (caseName: string) =>
        caseData[caseName]["load"] == "done" && !projectNames.includes(caseName)
    );
    const reportNames = props.recentReports.map((report) => report.name);
    const newReportNames = _.keys(caseData).filter(
      (caseName: string) =>
        caseData[caseName]["load"] == "done" && !reportNames.includes(caseName)
    );
    Promise.all([
      ...newProjectNames.map((name) => {
        props.projectActions.createOrLoadProject(name);
      }),
      ...newReportNames.map((name) =>
        createNewReport(
          name,
          caseData[name]["start_date"],
          caseData[name]["start_time"]
        )
      ),
    ]);
  }, [caseData]);

  const onAnnotateClicked = async (caseName: string) => {
    const project = props.recentProjects.find(
      (project) => project.name === caseName
    );
    if (project) {
      await props.projectActions.loadProject(project);
      props.navigate(`/projects/${project.id}`);
    }
  };

  const onReportClicked = async (caseName: string) => {
    const report = props.recentReports.find(
      (report) => report.name === caseName
    );
    if (report) {
      await props.reportActions.loadReport(report);
      props.navigate(`/reports/${report.id}`);
    }
  };

  const onSendClicked = async (caseName: string) => {
    if (!lockedProcess.includes("send")) {
      viimProcess?.executeUpdateDatabase([`data.${caseName}.send-yet`]);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-main m-3">
      <div className="toolbar">
        <TaskControlToolbar
          lockedTypes={lockedProcess}
          viimScriptDirectory={props.appSettings.viimScript}
          viimSettingsFile={props.appSettings.viimSetting}
          executeLoad={executeLoad}
          executeSend={executeSend}
        />
      </div>
      <div className="task-progress-table">
        <TaskProgressTable
          caseData={caseData}
          recentProjects={props.recentProjects}
          recentReports={props.recentReports}
          projectActions={props.projectActions}
          reportActions={props.reportActions}
          onReportClicked={onReportClicked}
          onAnnotateClicked={onAnnotateClicked}
          onSendClicked={onSendClicked}
          showColumnList={
            props.appSettings.reportSchema
              ? [
                  "case",
                  "date",
                  "time",
                  "load",
                  "report",
                  "annotate",
                  "anonymize",
                  "send",
                  "doctor",
                  "memo",
                ]
              : [
                  "case",
                  "date",
                  "time",
                  "load",
                  "annotate",
                  "anonymize",
                  "send",
                  "doctor",
                  "memo",
                ]
          }
        />
      </div>
      <NewDataModal
        isOpen={isNewDataModalOpen}
        newData={newData}
        onClose={async () => {
          await viimProcess?.kill("load");
          setIsNewDataModalOpen(false);
          viimProcess?.executeReset();
        }}
      />
      <NameInputModal
        isOpen={isNameInputModalOpen}
        caseData={newCaseData}
        recentReports={props.recentReports}
        reportActions={props.reportActions}
        onClose={() => {
          setIsNameInputModalOpen(false);
          setNewCaseData({});
        }}
      />
    </div>
  );
};

export default TaskProgressPage;
