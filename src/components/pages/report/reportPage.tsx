import React, { useState, useEffect } from "react";
import { FaClipboard, FaRedo, FaPaste } from "react-icons/fa";
// import SplitPane from "react-split-pane-v2";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useProjectActions, IReportActions } from "../../../atom/actions";
import {
  IAppSettings,
  IAsset,
  IProject,
  IReport,
  ReportPhase,
  AssetType,
} from "../../../models/applicationState";
import Confirm from "../../common/confirm";
import PropsWithNavigate from "../navigate";
import OverwriteModal from "./overwriteModal";
import { ReportForm } from "./reportForm";
import ReportSideBar from "./reportSideBar";
import _ from "lodash";
export interface IReportPageProps extends PropsWithNavigate {
  report: IReport;
  recentReports: IReport[];
  recentProjects: IProject[];
  appSettings: IAppSettings;
  reportActions: IReportActions;
}

const DEFAULT_THUMBNAIL_SIZE = { width: 300, height: 225 };

const loadImageAssets = async (
  project: IProject,
  loadAssetsFn: (project: IProject) => Promise<IAsset[]>
): Promise<IAsset[]> => {
  const rootProjectAssets = _.values(project.assets).filter(
    (asset) => !asset.parent
  );
  const sourceAssets = await loadAssetsFn(project);
  return _(rootProjectAssets)
    .concat(sourceAssets)
    .uniqBy((asset) => asset.name)
    .value()
    .filter((asset) => !asset.parent && asset.type === AssetType.Image)
    .slice()
    .sort((a, b) => (a.name > b.name ? 1 : -1));
};

const ReportPage: React.FC<IReportPageProps> = (props) => {
  const [thumbnailSize, setThumbnailSize] = useState(DEFAULT_THUMBNAIL_SIZE);
  const [referenceAssets, setReferenceAssets] = useState<IAsset[]>([]);
  const [shownModal, setShownModal] = useState<"none" | "overwrite" | "reset">(
    "none"
  );
  const { loadAssets } = useProjectActions();

  useEffect(() => {
    const project = props.recentProjects.find(
      (p) => p.name === props.report.name
    );
    (async () => {
      const referenceAssets = project
        ? await loadImageAssets(project, loadAssets)
        : [];
      setReferenceAssets(referenceAssets);
    })();
  }, [props.recentProjects, props.report.name]);

  const onFormChange = (report: IReport) => {
    props.reportActions.saveReport(report);
  };

  const onOverwrite = (id: string) => {
    const oldReport = props.recentReports.find((r) => r.id === id);
    if (!oldReport) return;
    const report: IReport = {
      ...oldReport,
      name: props.report.name,
      id: props.report.id,
    };
    props.reportActions.saveReport(report);
    props.reportActions.clearReport(oldReport);
  };

  const onReset = (oldReport: IReport) => {
    const report: IReport = {
      id: oldReport.id,
      name: oldReport.name,
      phase: ReportPhase.Waiting,
      exclusion: false,
      noLesions: false,
      lesionInfo: {
        lesion1: {},
        lesion2: {},
        lesion3: {},
        lesion4: {},
        lesion5: {},
      },
    };
    props.reportActions.saveReport(report);
    setShownModal("none");
  };

  const onSideBarResize = (newWidth: number) => {
    setThumbnailSize({
      width: newWidth,
      height: newWidth / (4 / 3),
    });
  };
  const reportName: string = props.report.name || "New Report";
  return (
    <div className="flex-grow flex flex-col overflow-hidden relative m-3">
      <div className="flex flex-row m-auto m-3">
        <h3 className="mb-3">
          <FaClipboard />
          <span className="px-2">{reportName}</span>
        </h3>
        <div className="ml-auto mr-2.5">
          <a
            className="ml-5 cursor-pointer text-3xl"
            onClick={() => {
              setShownModal("reset");
            }}
          >
            <FaRedo />
          </a>
          <a
            className="ml-5 cursor-pointer text-3xl"
            onClick={() => {
              setShownModal("overwrite");
            }}
          >
            <FaPaste />
          </a>
        </div>
      </div>
      <div>
        <PanelGroup direction="horizontal">
          <Panel
            defaultSize={thumbnailSize.width / 10} // react-resizable-panelsは%単位
            minSize={10}
            maxSize={50}
            onResize={onSideBarResize}
            className="flex flex-col"
          >
            {referenceAssets.length > 0 && (
              <ReportSideBar
                assets={referenceAssets}
                reportName={reportName}
                appSettings={props.appSettings}
                onAssetSelected={() => {}}
                thumbnailSize={thumbnailSize}
              />
            )}
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-200" />
          <Panel className="flex-grow flex-row">
            <ReportForm
              report={props.report}
              schemaDir={props.appSettings.reportSchema}
              onFormChange={onFormChange}
            />
          </Panel>
        </PanelGroup>
      </div>

      <OverwriteModal
        show={shownModal === "overwrite"}
        recentReports={props.recentReports}
        onOverwrite={onOverwrite}
      />
      <Confirm<IReport>
        show={shownModal === "reset"}
        params={[props.report]}
        title="Reset Report"
        message={(report: IReport) =>
          `Are you sure you want to reset report ${report.name || report.id}?`
        }
        confirmButtonColor="danger"
        onConfirm={onReset}
      />
    </div>
  );
};

export default ReportPage;
