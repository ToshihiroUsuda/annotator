import moment from "moment";
import React from "react";
import { toast } from "react-toastify";
import shortid from "shortid";
import { IReportActions } from "../../../atom/actions/report";
import { IAppSettings, IReport } from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import Confirm from "../../common/confirm";
import PropsWithNavigate from "../navigate";
import "./reportListPage.scss";

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

type IReportListPageState = {
  shownModal: "none" | "delete";
  selectedReport?: IReport;
};

export default class ReportListPage extends React.Component<
  IReportListPageProps,
  IReportListPageState
> {
  constructor(props: IReportListPageProps) {
    super(props);
    this.openReport = this.openReport.bind(this);
    this.deleteReport = this.deleteReport.bind(this);
    this.state = {
      shownModal: "none",
      selectedReport: undefined,
    };
  }

  private reportIconContents: Partial<Record<TReportKeys, IListContents>> = {
    phase: {
      headerName: "",
      type: contentsType.icon,
      icon: {
        Waiting: "fas fa-circle",
        Working: "fas fa-edit",
        Completed: "fas fa-check-circle done",
      },
      onClick: (report: IReport) => this.openReport(report),
    },
    delete: {
      headerName: "",
      type: contentsType.icon,
      icon: "fas fa-trash",
      onClick: (report: IReport) => {
        this.setState({
          shownModal: "delete",
          selectedReport: report,
        });
      },
    },
  };

  private commonReportContents: Partial<Record<TReportKeys, IListContents>> = {
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

  private namedReportContents: Partial<Record<TReportKeys, IListContents>> = {
    ...this.reportIconContents,
    name: {
      headerName: "Case Name",
      type: contentsType.string,
    },
    ...this.commonReportContents,
  };

  private unnamedReportContents: Partial<Record<TReportKeys, IListContents>> = {
    ...this.reportIconContents,
    id: {
      headerName: "Report ID",
      type: contentsType.string,
    },
    ...this.commonReportContents,
  };

  public render() {
    const unnamedReport = this.props.recentReports.filter((r) => !r.name);
    return (
      <div className="report-page-main m-3">
        <div className="report-list-toolbar">
          <ul>
            <li
              key={shortid.generate()}
              onClick={() => this.onNewReportClicked()}
              title="New Report"
            >
              <div className="button-item active">
                <div className="button-icon">
                  <a>
                    <i className="fas fa-clipboard"></i>
                  </a>
                </div>
                <div className="button-title">New Report</div>
              </div>
            </li>
            <li
              key={shortid.generate()}
              onClick={this.onExportClicked}
              title="Export Report"
            >
              <div className="button-item active">
                <div className="button-icon">
                  <a>
                    <i className="fas fa-file-download"></i>
                  </a>
                </div>
                <div className="button-title">Export Report</div>
              </div>
            </li>
          </ul>
        </div>
        <div className="main-table">
          {unnamedReport.length > 0 && (
            <div className="m-3">
              <table className="database-table bg-darker-2">
                {this.makeTableHead(false)}
              </table>
              <table className="database-table">
                {this.makeTableBody(false)}
              </table>
            </div>
          )}
          <div className="m-3">
            <table className="database-table bg-darker-2">
              {this.makeTableHead(true)}
            </table>
            {/* <div className="page-body"> */}
            <table className="database-table">{this.makeTableBody(true)}</table>
            {/* </div> */}
          </div>
        </div>
        <Confirm<IReport>
          show={this.state.shownModal === "delete"}
          title="Delete Report"
          params={
            this.state.selectedReport ? [this.state.selectedReport] : undefined
          }
          message={(report: IReport) =>
            `Are you sure you want to delete report ${report.name || report.id}?`
          }
          confirmButtonColor="danger"
          onConfirm={this.deleteReport}
        />
      </div>
    );
  }

  private makeTableHead = (named: boolean) => {
    const tableContents = named
      ? this.namedReportContents
      : this.unnamedReportContents;
    const columnKeys = Object.keys(tableContents).filter(isIReportKeys);
    return (
      <thead>
        <tr className="table-header-row">
          {columnKeys.map((key: TReportKeys) => {
            return (
              <th
                key={shortid.generate()}
                className={
                  tableContents[key]?.type === contentsType.icon
                    ? "table-header icon"
                    : "table-header"
                }
              >
                <span className="table-header-title">
                  {tableContents[key]?.headerName}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  };

  private makeTableBody(named: boolean) {
    const reports = named
      ? this.props.recentReports
          .filter((r) => !!r.name)
          .slice()
          .sort((a, b) => (a.name > b.name ? 1 : -1))
      : this.props.recentReports.filter((r) => !r.name);
    const tableContents = named
      ? this.namedReportContents
      : this.unnamedReportContents;
    const columnKeys = Object.keys(tableContents).filter(isIReportKeys);
    return (
      <tbody>
        {reports.map((report: IReport) => {
          return (
            <tr key={report.id}>
              {columnKeys.map((key) => {
                const cellItem = key === "delete" ? "" : report[key];
                const cellType = tableContents[key]?.type;
                const classNames = ["table-cell"];
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
                        <a>{cellItem && <i className="fas fa-check"></i>}</a>
                      </td>
                    );
                  case contentsType.icon: {
                    if (typeof cellItem !== "string") return null;
                    const icon =
                      typeof tableContents[key]?.icon !== "object"
                        ? tableContents[key]?.icon
                        : tableContents[key].icon[cellItem];
                    const onClick = tableContents[key]?.onClick;
                    classNames.push("icon");
                    if (onClick) {
                      classNames.push("clickable");
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
  }

  private openReport = (report: IReport) => {
    this.props.reportActions.closeReport(report);
    this.props.navigate(`/reports/${report.id}`);
  };

  private deleteReport = (report: IReport) => {
    this.props.reportActions.closeReport(report);
    this.props.reportActions.clearReport(report);
  };

  private onNewReportClicked = async () => {
    const newReport: IReport = await this.props.reportActions.createReport();
    this.props.navigate(`/reports/${newReport.id}`);
  };

  private onExportClicked = async () => {
    const folderPath = await LocalFileSystem.selectDirectory();
    if (folderPath) {
      this.props.reportActions.exportReports(folderPath);
      toast.info("Successfully exported reports");
    }
  };
}
