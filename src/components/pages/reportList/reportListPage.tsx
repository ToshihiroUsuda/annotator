import moment from "moment";
import { FaCheck, FaClipboard, FaFileDownload } from "react-icons/fa";
import React, { useState } from "react";
import { toast } from "react-toastify";
import shortid from "shortid";
import { IReportActions } from "../../../atom/actions/report";
import { IAppSettings, IReport } from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import Confirm from "../../common/confirm";
import PropsWithNavigate from "../navigate";

type TReportKeys = keyof IReport | "delete";

interface IReportListPageProps extends PropsWithNavigate {
  appSettings: IAppSettings;
  recentReports: IReport[];
  reportActions: IReportActions;
}

enum contentsType {
  icon = "icon",
  string = "string",
  boolean = "boolean",
}

interface IListContents {
  headerName: string;
  type: contentsType;
  icon?: string | { [key: string]: string };
  onClick?: (report: IReport) => void;
  convert?: (str: string) => string;
}

// temporary
const isIReportKeys = (key: string): key is TReportKeys => {
  return (
    key in
    {
      id: 1,
      name: 1,
      phase: 1,
      examDateTime: 1,
      scopeType: 1,
      informedConsent: 1,
      exclusion: 1,
      exclusionReason: 1,
      noLesions: 1,
      privateInfo: 1,
      patientInfo: 1,
      lesionInfo: 1,
      delete: 1,
    }
  );
};

const ReportListPage = (props: IReportListPageProps) => {
  const [shownModal, setShownModal] = useState<"none" | "delete">("none");
  const [selectedReport, setSelectedReport] = useState<IReport | undefined>(
    undefined
  );

  const openReport = (report: IReport) => {
    props.reportActions.closeReport(report);
    props.navigate(`/reports/${report.id}`);
  };

  const deleteReport = (report: IReport) => {
    props.reportActions.closeReport(report);
    props.reportActions.clearReport(report);
  };

  const onNewReportClicked = async () => {
    const newReport: IReport = await props.reportActions.createReport();
    props.navigate(`/reports/${newReport.id}`);
  };

  const onExportClicked = async () => {
    const folderPath = await LocalFileSystem.selectDirectory();
    if (folderPath) {
      props.reportActions.exportReports(folderPath);
      toast.info("Successfully exported reports");
    }
  };

  const reportIconContents: Partial<Record<TReportKeys, IListContents>> = {
    phase: {
      headerName: "",
      type: contentsType.icon,
      icon: {
        Waiting: "fas fa-circle",
        Working: "fas fa-edit",
        Completed: "fas fa-check-circle done",
      },
      onClick: (report: IReport) => openReport(report),
    },
    delete: {
      headerName: "",
      type: contentsType.icon,
      icon: "fas fa-trash",
      onClick: (report: IReport) => {
        setShownModal("delete");
        setSelectedReport(report);
      },
    },
  };

  const commonReportContents: Partial<Record<TReportKeys, IListContents>> = {
    exclusion: {
      headerName: "Exclusion",
      type: contentsType.boolean,
    },
    examDateTime: {
      headerName: "Exam Date Time",
      type: contentsType.string,
      convert: (datetime: string) => {
        const timezone = -moment().toDate().getTimezoneOffset() / 60;
        let format: string;
        switch (timezone) {
          case 0:
          case 1:
          case 2:
            format = "DD/MM/YYYY HH:mm:ss";
            break;
          case 9:
          default:
            format = "YYYY/MM/DD HH:mm:ss";
            break;
        }
        return moment(datetime).format(format);
      },
    },
    informedConsent: {
      headerName: "Infomed Consent",
      type: contentsType.string,
    },
    noLesions: {
      headerName: "No Lesions",
      type: contentsType.boolean,
    },
    scopeType: {
      headerName: "Scope Type",
      type: contentsType.string,
    },
  };

  const namedReportContents: Partial<Record<TReportKeys, IListContents>> = {
    ...reportIconContents,
    name: {
      headerName: "Case Name",
      type: contentsType.string,
    },
    ...commonReportContents,
  };

  const unnamedReportContents: Partial<Record<TReportKeys, IListContents>> = {
    ...reportIconContents,
    id: {
      headerName: "Report ID",
      type: contentsType.string,
    },
    ...commonReportContents,
  };

  const makeTableHead = (named: boolean) => {
    const tableContents = named ? namedReportContents : unnamedReportContents;
    const columnKeys = Object.keys(tableContents).filter(isIReportKeys);
    return (
      <thead>
        <tr className="uppercase">
          {columnKeys.map((key: TReportKeys) => {
            return (
              <th
                key={shortid.generate()}
                className={
                  tableContents[key]?.type === contentsType.icon ? "w-12" : ""
                }
              >
                <span className="uppercase">
                  {tableContents[key]?.headerName}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  };

  const makeTableBody = (named: boolean) => {
    const reports = named
      ? props.recentReports
          .filter((r) => !!r.name)
          .slice()
          .sort((a, b) => (a.name > b.name ? 1 : -1))
      : props.recentReports.filter((r) => !r.name);
    const tableContents = named ? namedReportContents : unnamedReportContents;
    const columnKeys = Object.keys(tableContents).filter(isIReportKeys);
    return (
      <tbody>
        {reports.map((report: IReport) => {
          return (
            <tr key={report.id}>
              {columnKeys.map((key) => {
                const cellItem = key === "delete" ? "" : report[key];
                const cellType = tableContents[key]?.type;
                const classNames = [""];
                switch (cellType) {
                  case contentsType.string: {
                    classNames.push("string");
                    if (typeof cellItem !== "string") return null;
                    const text =
                      !tableContents[key]?.convert || !cellItem
                        ? cellItem
                        : tableContents[key].convert(cellItem);
                    return (
                      <td
                        key={shortid.generate()}
                        className={classNames.join(" ")}
                      >
                        <span> {text} </span>
                      </td>
                    );
                  }
                  case contentsType.boolean:
                    classNames.push("boolean");
                    return (
                      <td
                        key={shortid.generate()}
                        className={classNames.join(" ")}
                      >
                        <a>
                          {cellItem && <FaCheck className="text-green-500" />}
                        </a>
                      </td>
                    );
                  case contentsType.icon: {
                    if (typeof cellItem !== "string") return null;
                    const icon =
                      typeof tableContents[key]?.icon !== "object"
                        ? tableContents[key]?.icon
                        : tableContents[key].icon[cellItem];
                    const onClick = tableContents[key]?.onClick;
                    classNames.push("w-12");
                    if (onClick) {
                      classNames.push("cursor-pointer");
                    }
                    return (
                      <td
                        key={shortid.generate()}
                        className={classNames.join(" ")}
                        onClick={() => onClick?.(report)}
                      >
                        <a>
                          <i className={icon}></i>
                        </a>
                      </td>
                    );
                  }
                }
              })}
            </tr>
          );
        })}
      </tbody>
    );
  };

  const unnamedReport = props.recentReports.filter((r) => !r.name);
  return (
    <div className="flex flex-grow flex-col m-3">
      <div className="flex h-30">
        <ul className="flex flex-row m-auto flex-wrap">
          <li
            key={shortid.generate()}
            onClick={() => onNewReportClicked()}
            title="New Report"
            className="flex list-none mx-2.5"
          >
            <div className="flex flex-col w-30 h-30 hover:cursor-pointer hover:bg-white/10">
              <div className="m-auto">
                <a className="flex flex-row text-center items-center mx-auto">
                  <FaClipboard className="text-center text-8xl" />
                </a>
              </div>
              <div className="m-auto">New Report</div>
            </div>
          </li>
          <li
            key={shortid.generate()}
            onClick={onExportClicked}
            title="Export Report"
            className="flex list-none mx-2.5"
          >
            <div className="flex flex-col w-30 h-30 hover:cursor-pointer hover:bg-white/10">
              <div className="m-auto">
                <a className="flex flex-row text-center items-center mx-auto">
                  <FaFileDownload className="text-center text-8xl" />
                </a>
              </div>
              <div className="m-auto">Export Report</div>
            </div>
          </li>
        </ul>
      </div>
      <div className="flex-grow overflow-y-scroll">
        {unnamedReport.length > 0 && (
          <div className="m-3">
            <table className="w-full box-border relative table-fixed mx-auto bg-black/10">
              {makeTableHead(false)}
            </table>
            <table className="w-full box-border relative table-fixed mx-auto text-xl text-gray-100 font-normal text-center bg-white/5">
              {makeTableBody(false)}
            </table>
          </div>
        )}
        <div className="m-3">
          <table className="w-full box-border relative table-fixed mx-auto bg-black/10">
            {makeTableHead(true)}
          </table>
          {/* <div className="page-body"> */}
          <table className="w-full box-border relative table-fixed mx-auto text-xl text-gray-100 font-normal text-center bg-white/5">
            {makeTableBody(true)}
          </table>
          {/* </div> */}
        </div>
      </div>
      <Confirm<IReport>
        show={shownModal === "delete"}
        title="Delete Report"
        params={selectedReport ? [selectedReport] : undefined}
        message={(report: IReport) =>
          `Are you sure you want to delete report ${report.name || report.id}?`
        }
        confirmButtonColor="danger"
        onConfirm={deleteReport}
      />
    </div>
  );
};

export default ReportListPage;
