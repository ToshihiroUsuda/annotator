import localForage from "localforage";
import path from "path-browserify";
import _ from "lodash";
import React from "react";
import { toast } from "react-toastify";
// import SplitPane from "react-split-pane-v2";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import * as shortid from "shortid";
import { constants } from "../../../common/constants";
import HtmlFileReader from "../../../common/htmlFileReader";
import { strings } from "../../../common/strings";
import {
  encodeFileURI,
  formatTime,
  normalizeSlashes,
} from "../../../common/utils";
import {
  AppMode,
  AssetState,
  AssetType,
  EditorMode,
  LesionInfoKeys,
  IAppSettings,
  IAsset,
  IAssetMetadata,
  IAssetRegion,
  IEditorState,
  InterpolationMethod,
  IProject,
  IRegion,
  IRegionMetadata,
  IReport,
  ITag,
  ProjectPhase,
  RegionState,
  RegionType,
} from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import {
  IToolbarItemRegistration,
  ToolbarItemFactory,
} from "../../../providers/toolbar/toolbarItemFactory";
// import IApplicationActions from '../../../redux/actions/applicationActions'
import { IAppSettingsActions } from "../../../atom/actions/appSettings";
import { IProjectActions } from "../../../atom/actions/project";
import { ToolbarItemName } from "../../../registerToolbar";
import { AssetService } from "../../../services/assetService";
import { InterpolationService } from "../../../services/interpolationService";
import { SelectionMode } from "../../../services/vott-ct/ts/CanvasTools/Interface/ISelectorSettings";
import { AssetPreview, IAssetPreviewHandle } from "../../common/assetPreview";
import KeyboardBindings from "./keyboardBindings";
import { ProgressCircle } from "../../common/progressCircle";
import { RegionInput } from "../../common/regionInput";
import { TagInput } from "../../common/tagInput";
import PropsWithNavigate from "../navigate";
import Canvas, { ICanvasFilterSetting } from "./canvas/canvas";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import { EditorSlider } from "./toolbar/editorSlider";
import { EditorToolbar } from "./toolbar/editorToolbar";
import FrameLabelInput from "./frameLabelInput";
import { RJSFSchema } from "@rjsf/utils";
import { writeLog } from "../../../common/utils";
import EditorModals, { ShownModal } from "./modal/editorModals";

interface IEditorPageProps extends PropsWithNavigate {
  project: IProject;
  recentProjects: IProject[];
  recentReports: IReport[];
  appSettings: IAppSettings;
  actions: IProjectActions;
  appSettingsActions: IAppSettingsActions;
}

interface IAssetMetadataPair {
  assetMetadata1: IAssetMetadata;
  assetMetadata2: IAssetMetadata;
  regionId: string;
}

export interface IEditorPageState {
  /** Array of assets in project */
  project: IProject; // projectはpropsで渡す
  assets: IAsset[]; // いらない? props.project.assetsをそのまま渡す?
  /** The editor mode to set for canvas tools */
  editorMode: EditorMode;
  /** The selection mode to set for canvas tools */
  selectionMode: SelectionMode;
  /** The selected asset for the primary editing experience */
  selectedAsset?: IAssetMetadata;
  /** Currently selected region on current asset */
  selectedRegions?: IRegion[];
  /** The child assets used for nest asset typs */
  childAssets?: IAsset[];
  /** Most recently selected tag */
  selectedTag: string;
  /**
   * Whether or not the editor is in a valid state
   * State is invalid when a region has not been tagged
   */
  isValid: boolean;
  isStepValid: boolean;
  shownModal: ShownModal; // 現在表示されているモーダルの種類
  /** Whether the show invalid region warning alert should display */
  toolbarItems: IToolbarItemRegistration[];
  // showInvalidRegionWarning: boolean;
  enableTracking: boolean;
  lockSample: boolean;
  lockRectangle: boolean;
  hideRegionMenu: boolean;
  filterSetting: ICanvasFilterSetting;
  regionOpacity: number;
  sidebarWidth: number;
  isProgressCircleActive: boolean;
  progressValue: number;
  isDoubleCheckMode: boolean;
  assetMetadataRecord: { [assetName: string]: IAssetMetadata };
  regionMetadataRecord: { [regionId: string]: IRegionMetadata };
  modifiedAssetRecord: { [assetName: string]: IAssetMetadata };
  visibleState: AssetState[];
  visibleStatePolyInput: boolean; // 美しくないが、Poly-Inputのタイミングの位置の線の表示/非表示切り替えに使うフラグ
  forceShow: boolean;
}

export default class EditorPage extends React.Component<
  IEditorPageProps,
  IEditorPageState
> {
  public state: IEditorPageState = {
    project: this.props.project,
    selectedTag: "",
    selectionMode: SelectionMode.NONE,
    assets: [],
    childAssets: [],
    editorMode: EditorMode.Select,
    isValid: true,
    isStepValid: true,
    shownModal: "none",
    toolbarItems: ToolbarItemFactory.getToolbarItems(),
    enableTracking: false,
    lockSample: false,
    lockRectangle: false,
    hideRegionMenu: false,
    filterSetting: { brightness: 0, contrast: 0 },
    regionOpacity: 100,
    sidebarWidth: 10,
    isProgressCircleActive: false,
    progressValue: 0,
    assetMetadataRecord: {},
    regionMetadataRecord: {},
    modifiedAssetRecord: {},
    isDoubleCheckMode: false,
    visibleState:
      this.props.appSettings.appMode !== AppMode.Internal
        ? [
            AssetState.Sample,
            AssetState.Store,
            AssetState.Freeze,
            AssetState.FreezeStore,
          ]
        : [AssetState.Sample],
    visibleStatePolyInput: true,
    forceShow: false,
  };

  private loadingProjectAssets: boolean = false;
  private changeingAsset: boolean = false;
  private canvas: React.RefObject<Canvas | null> = React.createRef<Canvas>();

  private assetPreview: React.RefObject<IAssetPreviewHandle | null> =
    React.createRef<IAssetPreviewHandle>();
  private previousAsset: IAssetMetadata | null = null;
  private stepInformationSchema: RJSFSchema = {};
  private stepInformation: { [step: string]: string } = {};
  private numOfBuffer: number = 10;
  private assetBuffer: { [idx: number]: string } = {};
  private bufferIdx: number = 0;
  private isChanged: boolean = false;
  private previousStep: string = "";
  declare private dispTags: ITag[];
  private doubleCheckedRegionIds: string[] = [];

  public async componentDidMount() {
    let project: IProject;
    const editorState: IEditorState | null =
      await localForage.getItem("editorState");
    if (editorState) {
      project = editorState.project;
      if (project.id !== this.props.project.id) {
        await this.saveAll(editorState);
      }
    }
    if (this.state.project) {
      project = { ...this.state.project };
      await this.loadProjectAssets();
    } else {
      project = this.props.project;
    }

    this.dispTags = project.tags.map((tag: ITag) => {
      if (tag.name.indexOf("Lesion") >= 0) {
        const thisReport: IReport | undefined = this.props.recentReports.find(
          (r) => r.name === project.name
        );
        if (!thisReport) {
          return tag;
        }
        // const key = tag.name.toLowerCase()
        const key = LesionInfoKeys.find((k) => k === tag.name.toLowerCase());
        if (key === undefined) {
          return tag;
        }
        if (
          !thisReport.lesionInfo[key] ||
          !thisReport.lesionInfo[key].imageDiagnosis ||
          !thisReport.lesionInfo[key].imageDiagnosis.bodyRegion
        ) {
          return tag;
        }
        let title = thisReport.lesionInfo[key].imageDiagnosis.bodyRegion;
        const lesionType = thisReport.lesionInfo[key].imageDiagnosis.lesionType;
        if (lesionType) {
          title = `${title} - ${lesionType}`;
        }
        return { ...tag, title: title };
      } else {
        return tag;
      }
    });

    try {
      if (!!this.props.appSettings.stepInformationSchema) {
        this.stepInformationSchema = JSON.parse(
          await LocalFileSystem.readText(
            this.props.appSettings.stepInformationSchema
          )
        );
      }
    } catch {
      this.stepInformationSchema = { properties: {} };
    }
    this.stepInformation = {};
    if (this.stepInformationSchema.properties !== undefined) {
      const properties = this.stepInformationSchema.properties;
      if ("step" in properties) {
        const step = properties["step"];
        if (typeof step === "object" && step["anyOf"]) {
          step.anyOf.forEach((option) => {
            if (typeof option === "object" && "enum" in option) {
              const enumValue = option.enum;
              if (typeof enumValue === "string") {
                if ("title" in option && typeof option.title === "string") {
                  this.stepInformation[enumValue] = option.title;
                } else {
                  this.stepInformation[enumValue] = enumValue;
                }
              }
            }
          });
        }
      }
    }

    this.bufferIdx = 0;
    this.assetBuffer = {};
    if (this.props.appSettings.appMode !== AppMode.Internal) {
      project = await this.props.actions.saveProject({
        ...project,
        isChanged: false,
      });
    }

    const filterSettingContent = localStorage.getItem("filterSetting");
    const filterSetting: ICanvasFilterSetting = filterSettingContent
      ? JSON.parse(filterSettingContent)
      : { brightness: 0, contrast: 0 };
    const regionOpacityContent = localStorage.getItem("regionOpacity");
    const regionOpacity: number = regionOpacityContent
      ? JSON.parse(regionOpacityContent)
      : 100;

    const sidebarWidth = JSON.parse(
      localStorage.getItem("react-resizable-panels:sideBar") ||
        '{"defaultSize":10}'
    )["defaultSize"];

    writeLog(
      `Open Project: ${normalizeSlashes(
        path.join(this.props.appSettings.rootDirectory, this.props.project.name)
      )}`,
      normalizeSlashes(
        path.join(
          this.props.appSettings.rootDirectory,
          this.props.project.name,
          constants.projectTargetDirectoryName,
          `${this.props.project.name}.log`
        )
      )
    );
    this.setState({
      project: project,
      filterSetting: filterSetting,
      regionOpacity: regionOpacity,
      sidebarWidth: sidebarWidth,
    });
  }

  public async componentDidUpdate(
    _prevProps: Readonly<IEditorPageProps>,
    prevState: Readonly<IEditorPageState>
  ) {
    if (this.state.project && this.state.assets.length === 0) {
      await this.loadProjectAssets();
    }

    if (
      this.state.selectedRegions &&
      JSON.stringify(this.state.selectedRegions) !==
        JSON.stringify(prevState.selectedRegions)
    ) {
      const selectedRegions: IRegion[] = this.state.selectedRegions.map(
        (region: IRegion) => {
          if (region.confidence === null) {
            region.confidence = 1;
          }
          return region;
        }
      );
      this.canvas.current?.selectRegions([...selectedRegions]);
    }

    if (this.state.selectedAsset !== prevState.selectedAsset) {
      if (this.state.selectedAsset && prevState.selectedAsset) {
        if (
          this.state.selectedAsset.asset.name !==
          prevState.selectedAsset.asset.name
        ) {
          this.canvas.current?.selectRegions([]);
          this.assetBuffer = {};
          this.bufferIdx = 0;
          if (this.state.selectedAsset.asset.type !== AssetType.VideoFrame) {
            this.previousAsset = null;
            this.setState({ enableTracking: false });
          }
        } else {
          if (!this.state.project.isChanged) {
            this.isChanged = true;
            const project = {
              ...this.state.project,
              isChanged: this.isChanged,
            };
            if (this.props.appSettings.appMode !== AppMode.Internal) {
              await this.props.actions.saveProject(project);
            }
            this.setState({ project: project });
            if (this.state.project.phase === ProjectPhase.Waiting) {
              const phase = ProjectPhase.Working;
              await this.changePhase(phase);
            }
          }
        }

        if (!this.assetBuffer) {
          this.assetBuffer = {};
          this.bufferIdx = 0;
        }

        const asset = JSON.stringify(this.state.selectedAsset);
        if (this.bufferIdx in this.assetBuffer) {
          if (asset !== this.assetBuffer[this.bufferIdx]) {
            const indicies = _.keys(this.assetBuffer);
            indicies.forEach((idx) => {
              if (parseInt(idx) >= this.bufferIdx) {
                delete this.assetBuffer[parseInt(idx)];
              }
            });
          }
        }
        this.assetBuffer[this.bufferIdx] = asset;
        this.bufferIdx += 1;
        if (this.bufferIdx - this.numOfBuffer - 1 in this.assetBuffer) {
          delete this.assetBuffer[this.bufferIdx - this.numOfBuffer - 1];
        }
      }
    }

    if (this.state.editorMode !== prevState.editorMode) {
      if (this.canvas.current) {
        this.canvas.current.selectRegions([]);
      }
    }

    if (this.state.enableTracking !== prevState.enableTracking) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (toolbarItem.config.name === ToolbarItemName.TrackRegions) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.enableTracking,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (this.state.lockSample !== prevState.lockSample) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (toolbarItem.config.name === ToolbarItemName.LockSample) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.lockSample,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (this.state.lockRectangle !== prevState.lockRectangle) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (toolbarItem.config.name === ToolbarItemName.LockRectangle) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.lockRectangle,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (this.state.hideRegionMenu !== prevState.hideRegionMenu) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (toolbarItem.config.name === ToolbarItemName.HideRegionMenu) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.hideRegionMenu,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (this.state.forceShow !== prevState.forceShow) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (toolbarItem.config.name === ToolbarItemName.ForceShow) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.forceShow,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (this.state.isDoubleCheckMode !== prevState.isDoubleCheckMode) {
      this.setState({
        toolbarItems: this.state.toolbarItems.map((toolbarItem) => {
          if (
            toolbarItem.config.name === ToolbarItemName.EnableDoubleCheckMode
          ) {
            return {
              ...toolbarItem,
              config: {
                ...toolbarItem.config,
                isSelected: this.state.isDoubleCheckMode,
              },
            };
          } else {
            return toolbarItem;
          }
        }),
      });
    }
    if (
      this.state.project &&
      prevState.project &&
      this.state.project.tags !== prevState.project.tags
    ) {
      this.updateRootAssets();
    }

    if (this.props.appSettings.appMode === AppMode.Internal) {
      if (
        this.state.project !== prevState.project ||
        this.state.assetMetadataRecord !== prevState.assetMetadataRecord ||
        this.state.regionMetadataRecord !== prevState.regionMetadataRecord ||
        this.state.modifiedAssetRecord !== prevState.modifiedAssetRecord
      ) {
        this.saveEditorState();
      }
    }

    if (this.state.filterSetting !== prevState.filterSetting) {
      if (this.canvas.current) {
        this.canvas.current.changeCanvasFilter(this.state.filterSetting);
        localStorage.setItem(
          "filterSetting",
          JSON.stringify(this.state.filterSetting)
        );
      }
    }

    if (this.state.regionOpacity !== prevState.regionOpacity) {
      if (this.canvas.current) {
        this.canvas.current.changeAllRegionsOpacity(this.state.regionOpacity);
        localStorage.setItem(
          "regionOpacity",
          JSON.stringify(this.state.regionOpacity)
        );
      }
    }
  }

  public componentWillUnmount() {
    const projectAssets = _.values(this.props.project.assets);
    const sampleNumber = projectAssets.filter((asset) => {
      return (
        asset.state === AssetState.Sample &&
        (asset.type === AssetType.Image || asset.type === AssetType.VideoFrame)
      );
    }).length;
    const trackedNumber = projectAssets.filter((asset) => {
      return (
        asset.state === AssetState.Tracked &&
        (asset.type === AssetType.Image || asset.type === AssetType.VideoFrame)
      );
    }).length;

    const polygonNumber = projectAssets.reduce((sum, asset) => {
      const assetSum = asset.polygonNumber || 0;
      return sum + assetSum;
    }, 0);

    const polylineNumber = projectAssets.reduce((sum, asset) => {
      const assetSum = asset.polylineNumber || 0;
      return sum + assetSum;
    }, 0);

    const logText = `Close Project:${normalizeSlashes([this.props.appSettings.rootDirectory, this.props.project.name].join("/"))}`;
    const logFile = normalizeSlashes(
      path.join(
        this.props.appSettings.rootDirectory,
        this.props.project.name,
        constants.projectTargetDirectoryName,
        `${this.props.project.name}.log`
      )
    );
    writeLog(logText, logFile);
    const resultText = `Result: Sample=${sampleNumber} Tracked=${trackedNumber} Polygon=${polygonNumber} Polyline=${polylineNumber}`;
    writeLog(resultText, logFile);
  }

  public render() {
    const { project } = this.state;
    const { assets, selectedAsset } = this.state;
    const rootAssets = assets.filter((asset) => !asset.parent);

    if (!project) {
      return <div>Loading...</div>;
    }

    const defaultTags: ITag[] =
      this.props.appSettings.tags.length === 1
        ? [this.props.appSettings.tags[0]]
        : [];
    const appMode: AppMode = this.props.appSettings.appMode;

    return (
      <div className="editor-page">
        <PanelGroup
          direction="horizontal"
          autoSaveId="sideBar"
          storage={localStorage}
        >
          <Panel
            defaultSize={this.state.sidebarWidth}
            minSize={10}
            maxSize={20}
            onResize={this.onSideBarResize}
            className="editor-page-sidebar bg-lighter-1" // カスタムスタイル用
          >
            <EditorSideBar
              assets={rootAssets
                .slice()
                .sort((a, b) => (a.name > b.name ? 1 : -1))}
              project={this.state.project}
              appSettings={this.props.appSettings}
              selectedAsset={selectedAsset ? selectedAsset.asset : undefined}
              onBeforeAssetSelected={this.onBeforeAssetSelected}
              onAssetSelected={this.selectAsset}
              sideBarWidth={this.state.sidebarWidth}
            />
          </Panel>
          <PanelResizeHandle className="resizer-handle" />

          <Panel className="editor-page-content">
            <div className="editor-page-content-main">
              <div className="editor-page-content-main-header">
                <EditorToolbar
                  project={this.state.project}
                  items={this.state.toolbarItems}
                  actions={this.props.actions}
                  isLocked={this.state.project.phase === ProjectPhase.Completed}
                  appMode={appMode}
                  onToolbarItemSelected={this.onToolbarItemSelected}
                  onToggleClicked={this.onToggleClicked}
                />
                <EditorSlider
                  filterSetting={this.state.filterSetting}
                  regionOpacity={this.state.regionOpacity}
                  onFilterSettingChanged={this.onFilterSettingChanged}
                  onRegionOpacityChanged={this.onRegionOpacityChanged}
                />
              </div>
              <div
                className="editor-page-content-main-body"
                onWheel={this.onWheelUpDown}
              >
                {selectedAsset && (
                  <>
                    <Canvas
                      ref={this.canvas}
                      selectedAsset={selectedAsset}
                      onAssetMetadataChanged={this.onAssetMetadataChanged}
                      onCanvasRendered={this.onCanvasRendered}
                      onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                      onDeleteRegions={this.onDeleteRegions}
                      onModalOpen={this.onRegionInfoInputModalOpen}
                      resetRegionData={this.resetRegionData}
                      editorMode={this.state.editorMode}
                      selectionMode={this.state.selectionMode}
                      project={{
                        ...this.state.project,
                        tags: this.dispTags,
                      }}
                      isFrozen={
                        this.state.project.phase === ProjectPhase.Completed
                      }
                      lockSample={this.state.lockSample}
                      lockRectangle={this.state.lockRectangle}
                      hideRegionMenu={this.state.hideRegionMenu}
                      regionMetadataList={this.state.regionMetadataRecord}
                      defaultTags={defaultTags}
                      forceShow={this.state.forceShow}
                      appMode={appMode}
                    >
                      <AssetPreview
                        ref={this.assetPreview}
                        autoPlay={true}
                        tags={this.state.project.tags}
                        controlsEnabled={
                          this.state.isValid && this.state.isStepValid
                        }
                        onBeforeAssetChanged={this.onBeforeAssetSelected}
                        onChildAssetSelected={this.onChildAssetSelected}
                        onSeekTimeClick={this.onSeekTimeClick}
                        // loadAssetMetadata={
                        //     this.loadAssetMetadata
                        // }
                        onTrack={this.onTrack}
                        asset={selectedAsset.asset}
                        projectName={this.state.project.name}
                        appSettings={this.props.appSettings}
                        visibleState={this.state.visibleState}
                        visibleStatePolyInput={
                          appMode === AppMode.Internal &&
                          this.state.visibleStatePolyInput
                        }
                        childAssets={this.state.childAssets}
                      />
                    </Canvas>
                    {(selectedAsset.asset.type === AssetType.Video ||
                      selectedAsset.asset.type === AssetType.VideoFrame) && (
                      <div className="state-checkbox">
                        <a
                          className="checkbox sample"
                          onClick={() =>
                            this.onStateCheckboxClick(AssetState.Sample)
                          }
                        >
                          <i
                            className={`${this.state.visibleState.indexOf(AssetState.Sample) >= 0 ? "fas" : "far"} fa-circle`}
                          ></i>
                        </a>
                        <a
                          className="checkbox store"
                          onClick={() =>
                            this.onStateCheckboxClick(AssetState.Store)
                          }
                        >
                          <i
                            className={`${this.state.visibleState.indexOf(AssetState.Store) >= 0 ? "fas" : "far"} fa-circle`}
                          ></i>
                        </a>
                        <a
                          className="checkbox freeze"
                          onClick={() =>
                            this.onStateCheckboxClick(AssetState.Freeze)
                          }
                        >
                          <i
                            className={`${this.state.visibleState.indexOf(AssetState.Freeze) >= 0 ? "fas" : "far"} fa-circle`}
                          ></i>
                        </a>
                        <a
                          className="checkbox freeze_store"
                          onClick={() =>
                            this.onStateCheckboxClick(AssetState.FreezeStore)
                          }
                        >
                          <i
                            className={`${this.state.visibleState.indexOf(AssetState.FreezeStore) >= 0 ? "fas" : "far"} fa-circle`}
                          ></i>
                        </a>
                        {/* 入力したPolygonの線を表示/非表示するボタン */}
                        {appMode === AppMode.Internal && (
                          <a
                            className="checkbox poly-input"
                            onClick={() =>
                              this.setState({
                                visibleStatePolyInput:
                                  !this.state.visibleStatePolyInput,
                              })
                            }
                          >
                            <i
                              className={`${this.state.visibleStatePolyInput ? "fas" : "far"} fa-circle`}
                            ></i>
                          </a>
                        )}
                      </div>
                    )}
                    {selectedAsset.asset.step && (
                      <div className="step-info">
                        {this.stepInformation[selectedAsset.asset.step] ||
                          selectedAsset.asset.step}
                      </div>
                    )}
                    {selectedAsset.asset.comment && (
                      <div className="comment-content">
                        {selectedAsset.asset.comment}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="editor-page-right-sidebar">
              <div className="editor-page-right-sidebar-taginput">
                {appMode !== AppMode.Internal && (
                  <TagInput
                    tags={this.dispTags}
                    selectedTag={this.state.selectedTag}
                    selectedRegions={this.state.selectedRegions}
                    onConfidenceChange={this.onConfidenceChange}
                    onTagClick={this.onTagClicked}
                    isLocked={
                      this.state.project.phase === ProjectPhase.Completed
                    }
                  />
                )}
                {appMode === AppMode.Internal && (
                  <RegionInput
                    regions={this.state.selectedAsset?.regions || []}
                    regionMetadata={this.state.regionMetadataRecord}
                    timestamp={this.state.selectedAsset?.asset.timestamp}
                    tags={this.state.project.tags}
                    selectedRegions={this.state.selectedRegions || []}
                    onRegionClick={this.onRegionClicked}
                    onTagChange={this.onRegionTagChanged}
                    onConfidenceChange={this.onConfidenceChange}
                    onFirstAssetClick={this.onRegionFirstAssetClick}
                    onPreviousAssetClick={this.onRegionPreviousAssetClick}
                    onNextAssetClick={this.onRegionNextAssetClick}
                    onLastAssetClick={this.onRegionLastAssetClick}
                    onHideClick={this.onRegionHideClick}
                    onLockClick={this.onRegionLockClick}
                    onDeleteClick={this.onRegionDeleteClick}
                    onInterpolateClick={this.onRegionInterpolateClick}
                    onIdClick={this.onRegionIdClick}
                    isFrozen={
                      this.state.project.phase === ProjectPhase.Completed
                    }
                  />
                )}
              </div>
              {this.stepInformationSchema && (
                <FrameLabelInput
                  step={this.state.selectedAsset?.asset.step || ""}
                  onChange={this.onFrameLabelModalSave}
                  formSchema={this.stepInformationSchema || {}}
                  uiSchema={{}}
                  isFrozen={this.state.project.phase === ProjectPhase.Completed}
                />
              )}
            </div>
          </Panel>
        </PanelGroup>
        <KeyboardBindings
          appMode={appMode}
          selectedAsset={this.state.selectedAsset}
          copyRegions={() => this.canvas.current?.copyRegions()}
          pasteRegions={() => this.canvas.current?.pasteRegions()}
          copyAllPolygons={async () => {
            if (!this.canvas.current) {
              return 0;
            }
            return await this.canvas.current.copyAllPolygons();
          }}
          copyAllRectangles={async () => {
            if (!this.canvas.current) {
              return 0;
            }
            return await this.canvas.current.copyAllRectangles();
          }}
          convertPolygonToRect={this.convertPolygonToRect}
          saveAllAssetMetadata={this.saveAllAssetMetadata}
          onAssetMetadataChanged={this.onAssetMetadataChanged}
          onRegionHideClick={this.onRegionHideClick}
          undoAsset={this.undoAsset}
          redoAsset={this.redoAsset}
          prevStep={this.previousStep}
          setPrevStep={(step: string) => {
            this.previousStep = step;
          }}
        />
        <EditorModals
          shownModal={this.state.shownModal}
          selectedAsset={this.state.selectedAsset}
          selectedRegion={this.state.selectedRegions?.[0]}
          appMode={appMode}
          appSettings={this.props.appSettings}
          isFrozen={this.state.project.phase === ProjectPhase.Completed}
          onAssetMetadataChanged={this.onAssetMetadataChanged}
          onSaveOrConfirm={{
            frameLabelInput: () => {
              this.setState({
                isStepValid: true,
              });
            },
            timeSeek: (timestamp: number) =>
              this.assetPreview.current?.seekToTime(timestamp),
            interpolatationConfirm: this.interpolateAllRegions,
            untaggedRegionConfirm: () => {
              this.canvas.current?.removeEmptyRegions();
              // this.setState({ showInvalidRegionWarning: false, isValid: true});
              this.setState({ isValid: true });
            },
            missedFrameLabelConfirm: () => {
              this.setState({ shownModal: "frameLabelInput" });
            },
          }}
          onClose={() => {
            this.setState({ shownModal: "none" });
          }}
        />
        {this.state.isProgressCircleActive && (
          <ProgressCircle value={this.state.progressValue} />
        )}
      </div>
    );
  }

  private saveEditorState = () => {
    const editorState: IEditorState = {
      rootDirectory: this.props.appSettings.rootDirectory,
      project: this.state.project,
      assetMetadataList: this.state.assetMetadataRecord,
      regionMetadataList: this.state.regionMetadataRecord,
      modifiedAssetList: this.state.modifiedAssetRecord,
    };
    localForage.setItem("editorState", editorState);
  };

  private onWheelUpDown = async (e: React.WheelEvent<HTMLDivElement>) => {
    if (this.changeingAsset) {
      return;
    }
    this.changeingAsset = true;
    e.preventDefault();
    const delta = e.deltaY;
    if (delta > 0) {
      await this.goToRootAsset(1);
    } else {
      await this.goToRootAsset(-1);
    }
    this.changeingAsset = false;
  };

  private onSideBarResize = (newSize: number) => {
    this.setState({ sidebarWidth: newSize });
    this.canvas.current?.forceResize();
  };

  private onStateCheckboxClick = (state: AssetState) => {
    let visibleState = [...this.state.visibleState];
    if (visibleState.indexOf(state) >= 0) {
      visibleState = visibleState.filter((s) => s !== state);
    } else {
      visibleState.push(state);
    }
    this.setState({ visibleState: visibleState });
  };

  private onTagClicked = (tag: ITag): void => {
    this.canvas.current?.applyTag(tag.name);
    this.setState({
      selectedTag: tag.name,
    });
    // }, () => this.canvas.current.applyTag(tag.name));
  };

  private onRegionClicked = (region: IRegion): void => {
    this.canvas.current?.selectRegions([region]);
  };

  private onRegionTagChanged = async (region: IRegion, tag: string) => {
    this.canvas.current?.selectRegions([region]);
    if (this.state.regionMetadataRecord[region.id]) {
      const assetMetadataList = { ...this.state.assetMetadataRecord };
      for (const assetName of _.keys(
        this.state.regionMetadataRecord[region.id].assets
      )) {
        const updatedFamilyRegions = this.state.assetMetadataRecord[
          assetName
        ].regions.map((r) => {
          if (r.id === region.id) {
            return { ...r, tags: [tag] };
          } else {
            return r;
          }
        });
        const familyAssetMetadata = {
          ...this.state.assetMetadataRecord[assetName],
          regions: updatedFamilyRegions,
        };
        await this.saveAssetMetadata(this.state.project, familyAssetMetadata);
        assetMetadataList[assetName] = familyAssetMetadata;
      }
      this.setState({ assetMetadataRecord: assetMetadataList });
    }
    this.setState(
      {
        selectedTag: tag,
      },
      () => this.canvas.current?.applyTag(tag)
    );
  };

  private onConfidenceChange = async (region: IRegion, confidence: number) => {
    if (!this.state.selectedAsset) {
      return;
    }
    const updatedRegions = this.state.selectedAsset.regions.map((r) => {
      if (r.id === region.id) {
        return { ...r, confidence: confidence };
      } else {
        return r;
      }
    });
    if (this.state.regionMetadataRecord[region.id]) {
      const assetMetadataList = { ...this.state.assetMetadataRecord };
      for (const assetName of _.keys(
        this.state.regionMetadataRecord[region.id].assets
      )) {
        const updatedFamilyRegions = this.state.assetMetadataRecord[
          assetName
        ].regions.map((r) => {
          if (r.id === region.id) {
            return { ...r, confidence: confidence };
          } else {
            return r;
          }
        });
        const familyAssetMetadata = {
          ...this.state.assetMetadataRecord[assetName],
          regions: updatedFamilyRegions,
        };
        await this.saveAssetMetadata(this.state.project, familyAssetMetadata);
        assetMetadataList[assetName] = familyAssetMetadata;
      }
      this.setState({ assetMetadataRecord: assetMetadataList });
    }

    const assetMetadata = {
      ...this.state.selectedAsset,
      regions: updatedRegions,
    };
    await this.onAssetMetadataChanged(assetMetadata);
    const selectedRegions = updatedRegions.filter((r) => r.id === region.id);
    this.canvas.current?.selectRegions(selectedRegions);
  };

  private calcTimestamps = (regionId: string) => {
    const regionAsset = this.state.regionMetadataRecord[regionId].assets;
    const timestamps = this.getKeyFrameAssetName(regionId).reduce<number[]>(
      (acc, assetName) => {
        if (regionAsset[assetName].timestamp) {
          acc.push(regionAsset[assetName].timestamp);
        }
        return acc;
      },
      []
    );

    return timestamps;
  };

  private getKeyFrameAssetName = (regionId: string) => {
    const regionAsset = this.state.regionMetadataRecord[regionId].assets;
    if (_.keys(regionAsset).length < 2) {
      return [];
    }
    const assetNames = _.keys(regionAsset)
      .reduce<{ name: string; timestamp: number }[]>((acc, assetName) => {
        if (regionAsset[assetName].timestamp) {
          acc.push({
            name: assetName,
            timestamp: regionAsset[assetName].timestamp,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((nameTimestamp) => nameTimestamp.name);

    return assetNames.filter((name, index) => {
      return (
        [
          RegionState.Editted,
          RegionState.Inputted,
          RegionState.Tracked,
        ].includes(regionAsset[name].regionState) ||
        index === 0 ||
        index === _.keys(regionAsset).length - 1
      );
    });
  };

  private onRegionFirstAssetClick = (region: IRegion): void => {
    if (
      this.state.selectedAsset &&
      this.state.selectedAsset.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }
    const timestamps = this.calcTimestamps(region.id);
    if (timestamps.length === 0) {
      return;
    }
    const seekTime = timestamps[0];
    this.setState(
      {
        enableTracking: false,
      },
      () => this.assetPreview.current?.seekToTime(seekTime)
    );
  };

  private onRegionPreviousAssetClick = (region: IRegion): void => {
    if (
      this.state.selectedAsset === undefined ||
      this.state.selectedAsset?.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }
    const timestamps = this.calcTimestamps(region.id);
    if (timestamps.length === 0) {
      return;
    }
    const currentTime = this.state.selectedAsset.asset.timestamp;
    if (currentTime === undefined) {
      return;
    }
    const seekTime = timestamps
      .reverse()
      .find((timestamp) => timestamp < currentTime);

    if (seekTime) {
      this.setState(
        {
          enableTracking: false,
        },
        () => this.assetPreview.current?.seekToTime(seekTime)
      );
    }
  };

  private onRegionNextAssetClick = (region: IRegion): void => {
    if (
      this.state.selectedAsset === undefined ||
      this.state.selectedAsset.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }
    const timestamps = this.calcTimestamps(region.id);
    if (timestamps.length === 0) {
      return;
    }
    const currentTime = this.state.selectedAsset.asset.timestamp;
    if (currentTime === undefined) {
      return;
    }
    const seekTime = timestamps.find((timestamp) => timestamp > currentTime);
    if (seekTime) {
      this.setState(
        {
          enableTracking: false,
        },
        () => this.assetPreview.current?.seekToTime(seekTime)
      );
    }
  };

  private onRegionLastAssetClick = (region: IRegion): void => {
    if (
      this.state.selectedAsset === undefined ||
      this.state.selectedAsset.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }
    const timestamps = this.calcTimestamps(region.id);
    if (timestamps.length === 0) {
      return;
    }
    const seekTime = timestamps[timestamps.length - 1];
    this.setState(
      {
        enableTracking: false,
      },
      () => this.assetPreview.current?.seekToTime(seekTime)
    );
  };

  private onRegionHideClick = async (region: IRegion) => {
    const regionMetadataList = { ...this.state.regionMetadataRecord };
    const isHided = !regionMetadataList[region.id].isHidden;
    regionMetadataList[region.id].isHidden = isHided;
    // if (isHided) {
    //     // this.canvas.current.editor.RM.hideRegionById(region.id);
    //     this.canvas.current.editor.RM.blindRegionById(region.id);
    // }else{
    //     this.canvas.current.editor.RM.showRegionById(region.id);
    // }
    this.setState({ regionMetadataRecord: regionMetadataList }, () =>
      this.canvas.current?.refreshCanvasToolsRegions()
    );
  };

  private onRegionLockClick = async (region: IRegion) => {
    const regionMetadataList = { ...this.state.regionMetadataRecord };
    const isLocked = !regionMetadataList[region.id].isLocked;
    if (isLocked) {
      this.canvas.current?.editor.RM.lockRegionById(region.id);
    } else {
      this.canvas.current?.editor.RM.unlockRegionById(region.id);
    }
    regionMetadataList[region.id].isLocked = isLocked;
    this.setState({ regionMetadataRecord: regionMetadataList });
  };

  private onRegionDeleteClick = (region: IRegion): void => {
    this.canvas.current?.deleteRegions([region]);
  };

  private onRegionInterpolateClick = async (region: IRegion) => {
    // this.canvas.current.deleteRegions([region])
    const assetMetadataPairs = this.getInterpolatePairs(region.id);
    await this.interpolateByPairs(assetMetadataPairs);
  };

  // private onRegionSelectClick = async (region: IRegion): Promise<void> => {
  //     if (this.state.selectedAsset === undefined) {
  //         return
  //     }
  //     const assetMetadataList = { ...this.state.assetMetadataRecord }
  //     const assetName = this.state.selectedAsset.asset.name
  //     let assetMetadata = assetMetadataList[assetName]
  //     const regions = assetMetadata.regions.map((r) => {
  //         if (region.id !== r.id) {
  //             return region
  //         }
  //         switch (r.state) {
  //             case RegionState.Tracked:
  //                 return { ...r, state: RegionState.Editted }
  //             case RegionState.Editted:
  //                 return { ...r, state: RegionState.Tracked }
  //             default:
  //                 return r
  //         }
  //     })
  //     assetMetadata = { ...assetMetadata, regions: regions }
  //     await this.onAssetMetadataChanged(assetMetadata)
  // }

  private onRegionIdClick = (region: IRegion): void => {
    // this.canvas.current.deleteRegions([region])
    const newRegion = { ...region, id: shortid.generate() };
    // this.canvas.current.addRegions([newRegion])
    this.canvas.current?.addDeleteRegions([newRegion], [region]);
  };

  private convertPolygonToRect = () => {
    if (this.state.selectedAsset === undefined) {
      return;
    }
    const polygons = this.state.selectedAsset.regions.filter(
      (region) => region.type === RegionType.Polygon
    );
    const rects = polygons.map((polygon: IRegion) => {
      const points = [
        { x: polygon.boundingBox.left, y: polygon.boundingBox.top },
        {
          x: polygon.boundingBox.left + polygon.boundingBox.width,
          y: polygon.boundingBox.top,
        },
        {
          x: polygon.boundingBox.left + polygon.boundingBox.width,
          y: polygon.boundingBox.top + polygon.boundingBox.height,
        },
        {
          x: polygon.boundingBox.left,
          y: polygon.boundingBox.top + polygon.boundingBox.height,
        },
      ];
      const rect: IRegion = {
        ...polygon,
        type: RegionType.Rectangle,
        points: [...points],
        id: shortid.generate(),
      };
      return rect;
    });
    this.canvas.current?.addRegions(rects);
  };

  private onSeekTimeClick = () => {
    if (this.state.selectedAsset === undefined) {
      return;
    }
    const assetType = this.state.selectedAsset.asset.type;

    if (assetType !== AssetType.VideoFrame) {
      return;
    }

    this.setState({
      shownModal: "timeSeek",
    });
  };

  private onTrack = (beTracked: boolean) => {
    if (this.state.selectedAsset === undefined) {
      return;
    }
    if (this.state.enableTracking && beTracked) {
      this.previousAsset = { ...this.state.selectedAsset };
    } else {
      this.previousAsset = null;
    }
  };

  /**
   * Raised when a child asset is selected on the Asset Preview
   * ex) When a video is paused/seeked to on a video
   */
  private onChildAssetSelected = async (childAsset: IAsset) => {
    if (
      this.state.selectedAsset &&
      this.state.selectedAsset.asset.name !== childAsset.name
    ) {
      await this.selectAsset(childAsset);
    }
  };

  /**
   * Returns a value indicating whether the current asset is taggable
   */
  private isTaggableAssetType = (asset: IAsset): boolean => {
    return asset.type !== AssetType.Unknown && asset.type !== AssetType.Video;
  };

  /**
   * Raised when the selected asset has been changed.
   * This can either be a parent or child asset
   */
  private onAssetMetadataChanged = async (
    assetMetadata: IAssetMetadata
  ): Promise<void> => {
    // If the asset contains any regions without tags, don't proceed.
    const regionsWithoutTags = assetMetadata.regions.filter(
      (region) => region.tags.length === 0
    );
    if (regionsWithoutTags.length > 0) {
      this.setState({ isValid: false });
      return;
    }

    // If the asset contains any step info, inform the user that the step info is not valid.
    let isStepValid = true;
    if (
      this.props.appSettings.appMode === AppMode.Hospital &&
      this.props.appSettings.confirmStepInfoInput &&
      assetMetadata.regions.length > 0 &&
      !!assetMetadata.asset.step
    ) {
      isStepValid = false;
    }

    const initialState = assetMetadata.asset.state;
    const regions = assetMetadata.regions;
    const assetMetadataList = { ...this.state.assetMetadataRecord };

    // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
    // asset selected from the side bar (image/video).
    const rootAsset = {
      ...(assetMetadata.asset.parent || assetMetadata.asset),
    };

    // Decide the state of the asset based on the initial state and the regions.

    if (this.isTaggableAssetType(assetMetadata.asset)) {
      const hasRegions = regions.length > 0;
      if (
        (initialState === AssetState.Store ||
          initialState === AssetState.Freeze ||
          initialState === AssetState.FreezeStore ||
          initialState === AssetState.NotVisited) &&
        hasRegions
      ) {
        assetMetadata.asset.state = AssetState.Sample;
      }
      if (
        (initialState === AssetState.Sample ||
          initialState === AssetState.Tracked ||
          initialState === AssetState.Interpolated) &&
        !hasRegions
      ) {
        assetMetadata.asset.state = AssetState.NotVisited;
      }
      if (
        initialState === AssetState.NotVisited ||
        initialState === AssetState.Tracked ||
        initialState === AssetState.Interpolated
      ) {
        if (
          hasRegions &&
          regions.every(
            (region) =>
              region.state === RegionState.Tracked ||
              region.state === RegionState.Editted
          )
        ) {
          assetMetadata.asset.state = AssetState.Tracked;
        }
      }
    }
    // Register Polygon Number
    assetMetadata.asset.polygonNumber = assetMetadata.regions.filter(
      (r) => r.state === RegionState.PolygonInputted
    ).length;
    // Register Polygon Number
    assetMetadata.asset.polylineNumber = assetMetadata.regions.filter(
      (r) => r.state === RegionState.PolylineInputted
    ).length;

    // Update root asset if not already in the "Tagged" state
    // This is primarily used in the case where a Video Frame is being edited.
    // We want to ensure that in this case the root video asset state is accurately
    // updated to match that state of the asset.
    if (rootAsset.name === assetMetadata.asset.name) {
      rootAsset.state = assetMetadata.asset.state;
    } else {
      let rootAssetMetadata: IAssetMetadata | undefined = _.values(
        this.state.assetMetadataRecord
      ).find((assetMetadata) => assetMetadata.asset.name === rootAsset.name);

      if (!rootAssetMetadata) {
        rootAssetMetadata = await this.props.actions.loadAssetMetadata(
          this.state.project,
          rootAsset
        );
      }
      if (
        this.state.childAssets?.some((asset) => {
          return (
            asset.state === AssetState.Sample ||
            asset.state === AssetState.Tracked ||
            asset.state === AssetState.Interpolated ||
            !!asset.step ||
            !!asset.comment
          );
        })
      ) {
        rootAssetMetadata.asset.state = AssetState.Sample;
        rootAsset.state = AssetState.Sample;
      } else {
        rootAssetMetadata.asset.state = AssetState.NotVisited;
        rootAsset.state = AssetState.NotVisited;
      }
      // rootAssetMetadata.asset.state = assetMetadata.asset.state;
      if (assetMetadata.asset.type === AssetType.VideoFrame) {
        rootAssetMetadata.asset.lastVisitedTimestamp =
          assetMetadata.asset.timestamp;
        rootAsset.lastVisitedTimestamp = assetMetadata.asset.timestamp;
      }
      await this.saveAssetMetadata(this.state.project, rootAssetMetadata);
      assetMetadataList[rootAssetMetadata.asset.name] = rootAssetMetadata;
    }

    // Only update asset metadata if state changes or is different
    if (
      initialState !== assetMetadata.asset.state ||
      this.state.selectedAsset !== assetMetadata
    ) {
      await this.saveAssetMetadata(this.state.project, assetMetadata);
      assetMetadataList[assetMetadata.asset.name] = assetMetadata;
    }
    const regionMetadataList = this.updateRegionMetadataList([assetMetadata]);

    const project = {
      ...this.state.project,
      lastVisitedAssetName: rootAsset.name,
      isChanged: this.isChanged,
    };
    if (this.props.appSettings.appMode !== AppMode.Internal) {
      await this.props.actions.saveProject(project);
    }

    const assetService = new AssetService(
      this.state.project,
      this.props.appSettings.rootDirectory
    );
    const childAssets = assetService.getChildAssets(rootAsset);
    // Find and update the root asset in the internal state
    // This forces the root assets that are displayed in the sidebar to
    // accurately show their correct state (not-visited, visited or tagged)
    const assets = [...this.state.assets];
    const assetIndex = assets.findIndex(
      (asset) => asset.name === rootAsset.name
    );
    if (assetIndex > -1) {
      assets[assetIndex] = {
        ...rootAsset,
      };
    }

    this.canvas.current?.changeAllRegionsOpacity(this.state.regionOpacity);
    this.setState({
      project,
      childAssets,
      assets,
      isValid: true,
      isStepValid: isStepValid,
      selectedAsset: assetMetadata,
      assetMetadataRecord: assetMetadataList,
      regionMetadataRecord: regionMetadataList,
    });
  };

  private saveAssetMetadata = async (
    project: IProject,
    assetMetadata: IAssetMetadata
  ) => {
    if (this.props.appSettings.appMode !== AppMode.Internal) {
      await this.props.actions.saveAssetMetadata(project, assetMetadata);
    }
    const modifiedAssetList = { ...this.state.modifiedAssetRecord };
    modifiedAssetList[assetMetadata["asset"]["name"]] = { ...assetMetadata };
    const assets = { ...project.assets };
    assets[assetMetadata.asset.name] = { ...assetMetadata.asset };
    project = { ...project, assets: assets };
    this.setState({
      project: project,
      modifiedAssetRecord: modifiedAssetList,
    });
  };

  /**
   * Raised when the asset binary has been painted onto the canvas tools rendering canvas
   */
  private onCanvasRendered = async () => {
    if (this.state.enableTracking && this.state.selectedAsset) {
      await this.trackRegions();
    }
    if (this.canvas.current) {
      this.canvas.current.changeAllRegionsOpacity(this.state.regionOpacity);
    }
  };

  private onDeleteRegions = (regions: IRegion[]) => {
    const regionMetadataList = { ...this.state.regionMetadataRecord };
    regions.forEach((region) => {
      if (this.state.selectedAsset && region.id in regionMetadataList) {
        delete regionMetadataList[region.id].assets[
          this.state.selectedAsset.asset.name
        ];
        if (
          regionMetadataList[region.id].firstTimestamp &&
          regionMetadataList[region.id].firstTimestamp ===
            this.state.selectedAsset.asset.timestamp
        ) {
          const timestamps = this.calcTimestamps(region.id);
          regionMetadataList[region.id].firstTimestamp = timestamps[1];
        }
        if (
          regionMetadataList[region.id].lastTimestamp &&
          regionMetadataList[region.id].lastTimestamp ===
            this.state.selectedAsset.asset.timestamp
        ) {
          const timestamps = this.calcTimestamps(region.id);
          regionMetadataList[region.id].lastTimestamp =
            timestamps[timestamps.length - 2];
        }
      }
    });
    this.setState({ regionMetadataRecord: regionMetadataList });
  };

  private undoAsset = async () => {
    if (this.bufferIdx - 2 in this.assetBuffer) {
      const assetMetadata = JSON.parse(
        this.assetBuffer[this.bufferIdx - 2]
      ) as IAssetMetadata;
      this.bufferIdx -= 2;
      await this.onAssetMetadataChanged(assetMetadata);
      this.canvas.current?.refreshCanvasToolsRegions();
    }
  };

  private redoAsset = async () => {
    if (this.bufferIdx in this.assetBuffer) {
      const assetMetadata = JSON.parse(
        this.assetBuffer[this.bufferIdx]
      ) as IAssetMetadata;
      await this.onAssetMetadataChanged(assetMetadata);
      this.canvas.current?.refreshCanvasToolsRegions();
    }
  };

  private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
    this.setState(
      {
        selectedRegions: selectedRegions,
      },
      () =>
        this.canvas.current?.changeAllRegionsOpacity(this.state.regionOpacity)
    );
  };

  private updateRegionMetadataList = (assetMetadataList: IAssetMetadata[]) => {
    let regionMetadataList: { [index: string]: IRegionMetadata } = {};
    if (this.state.regionMetadataRecord) {
      regionMetadataList = { ...this.state.regionMetadataRecord };
    }
    assetMetadataList.forEach((assetMetadata) => {
      const regions = assetMetadata.regions;
      regions.forEach((region) => {
        if (!(region.id in regionMetadataList)) {
          regionMetadataList[region.id] = {
            assets: {},
            isLocked: false,
            isHidden: false,
          } as IRegionMetadata;
        }
        const assetRegion: IAssetRegion = {
          regionState: region.state,
          type: assetMetadata.asset.type,
        };
        if (
          assetMetadata.asset.type === AssetType.VideoFrame &&
          assetMetadata.asset.timestamp
        ) {
          const timestamp = assetMetadata.asset.timestamp;
          let firstTimestamp = regionMetadataList[region.id].firstTimestamp;
          let lastTimestamp = regionMetadataList[region.id].lastTimestamp;
          if (firstTimestamp > timestamp) {
            firstTimestamp = timestamp;
          }
          if (lastTimestamp < timestamp) {
            lastTimestamp = timestamp;
          }
          assetRegion.timestamp = timestamp;
          regionMetadataList[region.id].firstTimestamp = firstTimestamp;
          regionMetadataList[region.id].lastTimestamp = lastTimestamp;
        }

        regionMetadataList[region.id].assets[assetMetadata.asset.name] =
          assetRegion;
      });
    });
    return regionMetadataList;
  };

  private exportRegionMetadataListCSV = async () => {
    const regionMetadataList = this.updateRegionMetadataList(
      _.values(this.state.assetMetadataRecord)
    );
    const regionList: { id: string; regionMetadata: IRegionMetadata }[] =
      _.keys(regionMetadataList)
        .filter((key) => _.keys(regionMetadataList[key].assets).length > 0)
        .slice()
        .sort((k1, k2) => {
          const minTime1 = regionMetadataList[k1].firstTimestamp;
          const minTime2 = regionMetadataList[k2].firstTimestamp;
          return minTime1 - minTime2;
        })
        .map((id) => {
          return { id: id, regionMetadata: regionMetadataList[id] };
        });

    const regionDataList: {
      [fileName: string]: {
        id: string;
        regionMetadata: IRegionMetadata;
      }[];
    } = {};
    regionList.forEach((regionData) => {
      const assetID = _.keys(regionData.regionMetadata.assets)[0];
      const assetMetadata = this.state.assetMetadataRecord[assetID];
      const fileName = assetMetadata.asset.parent
        ? assetMetadata.asset.parent.name
        : assetMetadata.asset.name;
      if (_.keys(regionDataList).findIndex((f) => f === fileName) === -1) {
        regionDataList[fileName] = [];
      }
      regionDataList[fileName].push(regionData);
    });

    let output =
      "No.,File Name,Tag,Region ID,First Timestamp,Last Timestamp,Tagged,Tracked,Interpolated,Status\n";
    let index = 0;
    _.keys(regionDataList)
      .slice()
      .sort()
      .forEach((fileName) => {
        regionDataList[fileName].forEach((regionData) => {
          const assetID = _.keys(regionData.regionMetadata.assets)[0];

          let id = "";
          let tag = "";
          let firstTimestamp = "";
          let lastTimestamp = "";
          let tagged = "";
          let tracked = "";
          let interpolated = "";
          try {
            id = regionData.id;
            const assetMetadata = this.state.assetMetadataRecord[assetID];
            const region = assetMetadata.regions.find(
              (region) => region.id == id
            );
            if (region && region.type !== RegionType.Rectangle) {
              return;
            }
            tag = region?.tags[0] || "";
            firstTimestamp = formatTime(
              regionData.regionMetadata.firstTimestamp
            );
            lastTimestamp = formatTime(regionData.regionMetadata.lastTimestamp);
            tagged = String(
              _.values(regionData.regionMetadata.assets).filter(
                (asset) =>
                  asset.regionState === RegionState.Inputted ||
                  asset.regionState === RegionState.PolylineInputted ||
                  asset.regionState === RegionState.PolygonInputted
              ).length
            );
            tracked = String(
              _.values(regionData.regionMetadata.assets).filter(
                (asset) =>
                  asset.regionState === RegionState.Tracked ||
                  asset.regionState === RegionState.Editted
              ).length
            );
            interpolated = String(
              _.values(regionData.regionMetadata.assets).filter(
                (asset) => asset.regionState === RegionState.Interpolated
              ).length
            );
          } catch {
            id = "-";
            tag = "-";
            firstTimestamp = "-";
            lastTimestamp = "-";
            tagged = "-";
            tracked = "-";
            interpolated = "-";
          }
          index += 1;
          output +=
            [
              index,
              fileName,
              tag,
              `'${id}`,
              `'${firstTimestamp}`,
              `'${lastTimestamp}`,
              tagged,
              tracked,
              interpolated,
              "",
            ].join(",") + "\n";
        });
      });

    const filePath = path.join(
      this.props.appSettings.rootDirectory,
      this.state.project.name,
      `${this.state.project.name}.csv`
    );
    await LocalFileSystem.writeText(filePath, output);
    toast.success("Successfully exported CSV");
  };

  private resetRegionData = () => {
    this.setState({
      selectedTag: "",
    });
  };

  private changePhase = async (phase: ProjectPhase) => {
    const project = {
      ...this.state.project,
      phase,
    };
    if (this.props.appSettings.appMode !== AppMode.Internal) {
      await this.props.actions.saveProject(project);
    }
    this.setState({
      project: project,
    });
  };

  private onRegionInfoInputModalOpen = (region: IRegion) => {
    this.setState({
      shownModal: "regionInfoInput",
      selectedRegions: [region],
    });
  };

  private onFrameLabelModalSave = async (step: string) => {
    if (this.state.selectedAsset) {
      const asset = { ...this.state.selectedAsset.asset, step: step };
      const assetMetadata = {
        ...this.state.selectedAsset,
        asset: asset,
      };
      this.setState(
        {
          isStepValid: true,
        },
        async () => await this.onAssetMetadataChanged(assetMetadata)
      );
    }
  };

  private importAsset = async () => {
    const selectedFile = await LocalFileSystem.selectFile();
    if (selectedFile) {
      let asset: IAsset;
      try {
        asset = (JSON.parse(selectedFile) as IAssetMetadata).asset;
      } catch {
        toast.error("Error importing asset file");
        return;
      }
      const assetMetadata = await this.props.actions.loadAssetMetadata(
        this.state.project,
        asset
      );
      if (
        this.state.selectedAsset &&
        assetMetadata.asset.name !== this.state.selectedAsset.asset.name
      ) {
        if (assetMetadata.asset.timestamp) {
          this.assetPreview.current?.seekToTime(assetMetadata.asset.timestamp);
        } else {
          await this.selectAsset(assetMetadata.asset);
        }
      }
      await this.onAssetMetadataChanged(assetMetadata);
      this.canvas.current?.refreshCanvasToolsRegions();

      toast.success("Successfully imported asset");
    }
  };

  private exportAsset = async () => {
    if (this.state.selectedAsset) {
      const exportDirectory = await LocalFileSystem.selectDirectory();
      if (exportDirectory) {
        const assetService = new AssetService(
          this.state.project,
          exportDirectory
        );
        await assetService.save(this.state.selectedAsset);
        toast.success("Successfully exported asset");
      }
    }
  };

  private onToolbarItemSelected = async (
    toolbarItemName: ToolbarItemName
  ): Promise<void> => {
    switch (toolbarItemName) {
      case ToolbarItemName.DrawRectangle:
        this.setState({
          selectionMode: SelectionMode.RECT,
          editorMode: EditorMode.Rectangle,
        });
        break;
      case ToolbarItemName.DrawPolygon:
        this.setState({
          selectionMode: SelectionMode.POLYGON,
          editorMode: EditorMode.Polygon,
        });
        break;
      case ToolbarItemName.DrawPolyline:
        this.setState({
          selectionMode: SelectionMode.POLYLINE,
          editorMode: EditorMode.Polyline,
        });
        break;
      case ToolbarItemName.TrackRegions:
        this.setState({
          enableTracking: !this.state.enableTracking,
        });
        break;
      case ToolbarItemName.LockSample:
        this.setState(
          {
            lockSample: !this.state.lockSample,
          },
          () => this.canvas.current?.refreshCanvasToolsRegions()
        );
        break;
      case ToolbarItemName.LockRectangle:
        this.setState(
          {
            lockRectangle: !this.state.lockRectangle,
          },
          () => this.canvas.current?.refreshCanvasToolsRegions()
        );
        break;
      case ToolbarItemName.HideRegionMenu: {
        const hidden = !this.state.hideRegionMenu;
        this.setState(
          {
            hideRegionMenu: hidden,
          },
          () => {
            this.canvas.current?.editor.RM.setRegionMenuHidden(hidden);
            this.canvas.current?.refreshCanvasToolsRegions();
          }
        );
        break;
      }
      case ToolbarItemName.ForceShow: {
        const forceShow = !this.state.forceShow;
        this.setState(
          {
            forceShow: forceShow,
          },
          () => this.canvas.current?.refreshCanvasToolsRegions()
        );
        break;
      }
      case ToolbarItemName.EnableDoubleCheckMode: {
        const isDoubleCheckMode = !this.state.isDoubleCheckMode;
        this.setState(
          {
            isDoubleCheckMode: isDoubleCheckMode,
          },
          async () => {
            await this.onDoubleCheckMode(isDoubleCheckMode);
          }
        );
        break;
      }
      case ToolbarItemName.SelectCanvas:
        this.setState({
          selectionMode: SelectionMode.NONE,
          editorMode: EditorMode.Select,
        });
        break;
      case ToolbarItemName.PreviousAsset:
        await this.goToRootAsset(-1);
        break;
      case ToolbarItemName.NextAsset:
        await this.goToRootAsset(1);
        break;
      case ToolbarItemName.InputComment:
        if (
          this.state.selectedAsset &&
          this.state.selectedAsset.asset.type !== AssetType.Video
        ) {
          this.setState({
            shownModal: "commentInput",
          });
        }
        break;
      case ToolbarItemName.InputStep:
        if (
          this.state.selectedAsset &&
          this.state.selectedAsset.asset.type === AssetType.Video
        ) {
          this.setState({
            shownModal: "frameLabelInput",
          });
        }
        break;
      case ToolbarItemName.InterpolateRegions:
        this.setState({ shownModal: "interpolatationConfirm" });
        break;
      case ToolbarItemName.RemoveAllRegions:
        this.canvas.current?.confirmRemoveAllRegions();
        break;
      case ToolbarItemName.ActiveLearning:
        this.canvas.current?.editor.RM.toggleFreezeMode();
        break;
      case ToolbarItemName.ZoomIn:
        if (this.canvas.current) {
          this.canvas.current.editor.ZM.isZoomEnabled = true;
          this.canvas.current.editor.ZM.callbacks.onZoomingIn();
        }
        break;
      case ToolbarItemName.ZoomOut:
        if (this.canvas.current) {
          this.canvas.current.editor.ZM.isZoomEnabled = true;
          this.canvas.current.editor.ZM.callbacks.onZoomingOut();
        }
        break;
      case ToolbarItemName.ImportAsset:
        this.importAsset();
        break;
      case ToolbarItemName.ExportAsset:
        await this.exportAsset();
        break;
      case ToolbarItemName.ExportProject:
        await this.exportRegionMetadataListCSV();
        break;
      case ToolbarItemName.SaveProject: {
        const editorState: IEditorState = {
          rootDirectory: this.props.appSettings.rootDirectory,
          project: { ...this.state.project },
          assetMetadataList: { ...this.state.assetMetadataRecord },
          regionMetadataList: { ...this.state.regionMetadataRecord },
          modifiedAssetList: { ...this.state.modifiedAssetRecord },
        };
        await this.saveAll(editorState);
        toast.success(`${this.state.project.name} saved successfully!`);
        break;
      }
    }
  };

  private saveAll = async (editorState: IEditorState) => {
    let rootDirectory: string | null = editorState.rootDirectory;
    const project = editorState.project;
    const assetMetadataList = editorState.assetMetadataList;
    const regionMetadataList = editorState.regionMetadataList;
    const modifiedAssetList = editorState.modifiedAssetList;

    if (!(await LocalFileSystem.exists(rootDirectory))) {
      rootDirectory = await LocalFileSystem.selectDirectory();
    }
    if (rootDirectory) {
      const projectPath = [rootDirectory, project.name].join("/");
      if (!(await LocalFileSystem.exists(projectPath))) {
        await LocalFileSystem.createDirectory(projectPath);
      }
      const assetPath = path.join(
        rootDirectory,
        project.name,
        constants.projectTargetDirectoryName
      );
      if (!(await LocalFileSystem.exists(assetPath))) {
        await LocalFileSystem.createDirectory(assetPath);
      }
      const numOfFile = 3 + _.keys(modifiedAssetList).length;
      this.setState({ isProgressCircleActive: true });
      let index = 0;
      const assetFilePath = path.join(
        assetPath,
        `${project.name}${constants.assetMetadataListFileExtension}`
      );
      await LocalFileSystem.writeText(
        assetFilePath,
        JSON.stringify(assetMetadataList)
      );
      index += 1;
      this.setState({ progressValue: (100 * index) / numOfFile });
      const regionFilePath = [
        assetPath,
        `${project.name}${constants.regionMetadataListFileExtension}`,
      ].join("/");
      await LocalFileSystem.writeText(
        regionFilePath,
        JSON.stringify(regionMetadataList)
      );
      index += 1;
      this.setState({ progressValue: (100 * index) / numOfFile });
      const updatedAssets = { ...project.assets };
      await _.values(modifiedAssetList).forEachAsync(
        async (assetMetadata: IAssetMetadata) => {
          index += 1;
          this.setState({ progressValue: (100 * index) / numOfFile });
          await this.props.actions.saveAssetMetadata(project, assetMetadata);
          if (
            assetMetadata.asset.state === AssetState.Sample ||
            assetMetadata.asset.state === AssetState.Store ||
            assetMetadata.asset.state === AssetState.Freeze ||
            assetMetadata.asset.state === AssetState.FreezeStore ||
            assetMetadata.asset.state === AssetState.Tracked ||
            assetMetadata.asset.state === AssetState.Interpolated ||
            assetMetadata.asset.step
          ) {
            updatedAssets[assetMetadata.asset.name] = {
              ...assetMetadata.asset,
            };
          }
        }
      );
      await this.props.actions.saveProject({
        ...project,
        assets: updatedAssets,
      });
      this.setState({ progressValue: 0, isProgressCircleActive: false });
      localForage.removeItem("editorState");
    }
  };

  private saveAllAssetMetadata = async () => {
    const numOfFile = _.keys(this.state.assetMetadataRecord).length;
    this.setState({ isProgressCircleActive: true });
    let index = 0;

    this.setState({ progressValue: (100 * index) / numOfFile });
    await _.values(this.state.assetMetadataRecord).forEachAsync(
      async (assetMetadata: IAssetMetadata) => {
        index += 1;
        this.setState({ progressValue: (100 * index) / numOfFile });
        await this.props.actions.saveAssetMetadata(
          this.state.project,
          assetMetadata
        );
      }
    );
    this.setState({ progressValue: 0, isProgressCircleActive: false });
  };

  private onToggleClicked = async () => {
    const phase =
      this.state.project.phase !== ProjectPhase.Completed
        ? ProjectPhase.Completed
        : ProjectPhase.Working;
    if (phase === ProjectPhase.Completed) {
      this.setState({
        selectionMode: SelectionMode.NONE,
        editorMode: EditorMode.Select,
      });
    }
    await this.changePhase(phase);
  };

  private onFilterSettingChanged = (filterSetting: ICanvasFilterSetting) => {
    this.setState({
      filterSetting: filterSetting,
    });
  };

  private onRegionOpacityChanged = (regionOpacity: number) => {
    this.setState({
      regionOpacity: regionOpacity,
    });
  };

  private trackRegions = async () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return;
    }
    if (
      this.state.selectedAsset === undefined ||
      this.state.selectedAsset.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }
    if (
      this.previousAsset === null ||
      this.previousAsset.regions.length === 0 ||
      this.previousAsset.asset.type !== AssetType.VideoFrame
    ) {
      return;
    }

    const previousTimestamp = this.previousAsset.asset.timestamp;
    const currentTimestamp = this.state.selectedAsset.asset.timestamp;
    if (previousTimestamp === undefined || currentTimestamp === undefined) {
      return;
    }

    const previousRegions = this.previousAsset.regions.filter((region) => {
      const isLocked = this.state.regionMetadataRecord[region.id].isLocked;
      const isHided = this.state.regionMetadataRecord[region.id].isHidden;
      const isFirst =
        this.state.regionMetadataRecord[region.id].firstTimestamp &&
        this.state.regionMetadataRecord[region.id].firstTimestamp ===
          previousTimestamp &&
        previousTimestamp > currentTimestamp;
      const isLast =
        this.state.regionMetadataRecord[region.id].lastTimestamp &&
        this.state.regionMetadataRecord[region.id].lastTimestamp ===
          previousTimestamp &&
        previousTimestamp < currentTimestamp;
      return (
        region.type === RegionType.Rectangle &&
        !isLocked &&
        !isHided &&
        !isFirst &&
        !isLast
      );
    });
    const currentRegions = this.state.selectedAsset.regions.filter((region) => {
      const isLocked = this.state.regionMetadataRecord[region.id].isLocked;
      const isHided = this.state.regionMetadataRecord[region.id].isHidden;
      return region.type === RegionType.Rectangle && !isLocked && !isHided;
    });
    let addRegions: IRegion[] = [...previousRegions];
    let deleteRegions: IRegion[] = [];
    if (currentRegions.length > 0) {
      currentRegions.forEach((curRegion) => {
        const preRegion = previousRegions.find(
          (region) => region.id === curRegion.id
        );
        if (preRegion) {
          if (curRegion.state === RegionState.Inputted) {
            addRegions = addRegions.filter(
              (region) => region.id !== preRegion.id
            );
          } else {
            if (
              JSON.stringify(curRegion.points) !==
              JSON.stringify(preRegion.points)
            ) {
              deleteRegions = deleteRegions.concat(curRegion);
            } else {
              addRegions = addRegions.filter(
                (region) => region.id !== preRegion.id
              );
            }
          }
        }
      });
    }
    addRegions = addRegions.map((region) => {
      return { ...region, state: RegionState.Tracked };
    });

    if (addRegions.length > 0) {
      if (this.previousAsset.asset.step) {
        if (!this.state.selectedAsset.asset.step) {
          const currentAsset = {
            ...this.state.selectedAsset.asset,
            step: this.previousAsset.asset.step,
          };
          await this.onAssetMetadataChanged({
            ...this.state.selectedAsset,
            asset: currentAsset,
          });
        }
      }
    }

    this.canvas.current?.addDeleteRegions(addRegions, deleteRegions);
  };

  private getInterpolatePairs = (regionId: string) => {
    const assetMetadataPairs: IAssetMetadataPair[] = [];
    const assetNames = this.getKeyFrameAssetName(regionId);
    for (let i = 0; i < assetNames.length - 1; i++) {
      const assetMetadata1 = this.state.assetMetadataRecord[assetNames[i]];
      const assetMetadata2 = this.state.assetMetadataRecord[assetNames[i + 1]];
      if (
        assetMetadata1.asset.timestamp === undefined ||
        assetMetadata2.asset.timestamp === undefined
      ) {
        continue;
      }
      const timeDellta =
        assetMetadata2.asset.timestamp - assetMetadata1.asset.timestamp;
      if (
        Math.round(timeDellta * this.props.appSettings.frameExtractionRate) <= 5
      ) {
        assetMetadataPairs.push({
          assetMetadata1: assetMetadata1,
          assetMetadata2: assetMetadata2,
          regionId: regionId,
        });
      }
    }
    return assetMetadataPairs;
  };

  private interpolateByPairs = async (
    assetMetadataPairs: IAssetMetadataPair[]
  ) => {
    if (this.state.isProgressCircleActive) {
      return;
    }
    this.setState({ isProgressCircleActive: true, enableTracking: false });
    const interpolateService = new InterpolationService({
      method: InterpolationMethod.Linear,
      frameExtractionRate: this.props.appSettings.frameExtractionRate,
    });
    const numOfPairs = assetMetadataPairs.length;
    const assetMetadataList = { ...this.state.assetMetadataRecord };
    const newAssetMetadataList: IAssetMetadata[] = [];
    let index = 0;
    await assetMetadataPairs.forEachAsync(async (pair) => {
      const interpolatedAssetMetadata =
        await interpolateService.interpolateRegions(
          pair.assetMetadata1,
          pair.assetMetadata2,
          pair.regionId
        );
      const assetNames = _.keys(interpolatedAssetMetadata);
      await assetNames.forEachAsync(async (assetName) => {
        let updatedMetadata: IAssetMetadata | null = null;
        const newMetadata = interpolatedAssetMetadata[assetName];
        if (assetName in assetMetadataList) {
          const newRegion = newMetadata.regions[0];
          const updatedRegions = [...assetMetadataList[assetName].regions];
          const regionIndex = updatedRegions.findIndex(
            (region) => region.id === newRegion.id
          );
          if (regionIndex >= 0) {
            const region = updatedRegions[regionIndex];
            updatedRegions[regionIndex] = {
              ...region,
              boundingBox: { ...newRegion.boundingBox },
              points: [...newRegion.points],
            };
          } else {
            updatedRegions.push(newRegion);
          }

          updatedMetadata = {
            ...assetMetadataList[assetName],
            regions: updatedRegions,
          };
        } else {
          updatedMetadata = { ...newMetadata };
        }
        await this.saveAssetMetadata(this.state.project, updatedMetadata);
        assetMetadataList[assetName] = updatedMetadata;
        newAssetMetadataList.push(updatedMetadata);
      });
      index += 1;
      this.setState({ progressValue: 100 * (index / numOfPairs) });
    });
    const regionMetadataList =
      this.updateRegionMetadataList(newAssetMetadataList);
    this.setState({
      assetMetadataRecord: assetMetadataList,
      regionMetadataRecord: regionMetadataList,
      isProgressCircleActive: false,
      progressValue: 0,
    });
  };

  private interpolateAllRegions = async () => {
    let assetMetadataPairs: IAssetMetadataPair[] = [];
    _.keys(this.state.regionMetadataRecord).forEach((regionId) => {
      assetMetadataPairs = assetMetadataPairs.concat(
        this.getInterpolatePairs(regionId)
      );
    });
    await this.interpolateByPairs(assetMetadataPairs);
  };

  private goToRootAsset = async (direction: number) => {
    if (this.state.selectedAsset === undefined) {
      return;
    }
    if (this.state.selectedAsset.asset.type === AssetType.VideoFrame) {
      if (direction > 0) {
        this.assetPreview.current?.moveNextTaggedVideoFrame();
      } else {
        this.assetPreview.current?.movePreviousTaggedVideoFrame();
      }
    } else {
      const selectedRootAsset =
        this.state.selectedAsset.asset.parent || this.state.selectedAsset.asset;
      const currentIndex = this.state.assets.findIndex(
        (asset) => asset.name === selectedRootAsset.name
      );

      if (direction > 0) {
        await this.selectAsset(
          this.state.assets[
            Math.min(this.state.assets.length - 1, currentIndex + 1)
          ]
        );
      } else {
        await this.selectAsset(
          this.state.assets[Math.max(0, currentIndex - 1)]
        );
      }
    }
  };

  private onBeforeAssetSelected = (): boolean => {
    if (!this.state.isValid) {
      this.setState({
        shownModal: "untaggedRegionConfirm",
      });
    } else if (!this.state.isStepValid) {
      const currentAsset = this.state.selectedAsset;
      if (currentAsset) {
        this.setState({ shownModal: "missedFrameLabelConfirm" });
      }
    }

    return this.state.isValid && this.state.isStepValid;
  };

  private selectAsset = async (asset: IAsset): Promise<void> => {
    // Nothing to do if we are already on the same asset.
    if (
      this.state.selectedAsset &&
      this.state.selectedAsset.asset.name === asset.name
    ) {
      return;
    }

    let assetMetadata = this.state.assetMetadataRecord[asset.name];
    if (!assetMetadata) {
      assetMetadata = await this.props.actions.loadAssetMetadata(
        this.state.project,
        asset
      );
    }
    try {
      if (assetMetadata.asset.size?.width === 0) {
        if (assetMetadata.asset.type === AssetType.VideoFrame) {
          assetMetadata.asset.size = assetMetadata.asset.parent?.size || {
            width: 0,
            height: 0,
          };
        } else {
          const assetPath = encodeFileURI(
            path.join(
              this.props.appSettings.rootDirectory,
              this.state.project.name,
              asset.name
            )
          );
          const assetProps = await HtmlFileReader.readAssetAttributes(
            assetPath,
            asset.type
          );
          assetMetadata.asset.size = {
            width: assetProps.width,
            height: assetProps.height,
          };
        }
      }
    } catch {
      console.warn("Error computing asset size");
    }
    // await this.onAssetMetadataChanged(assetMetadata);
    this.setState(
      {
        selectedAsset: assetMetadata,
      },
      async () => {
        await this.onAssetMetadataChanged(assetMetadata);
      }
    );
  };

  private loadProjectAssets = async (): Promise<void> => {
    if (this.loadingProjectAssets || this.state.assets.length > 0) {
      return;
    }
    this.loadingProjectAssets = true;

    // Get all root project assets
    const rootProjectAssets = _.values(this.state.project.assets).filter(
      (asset) => !asset.parent
    );

    let assetMetadataList = {};
    let regionMetadataList = {};

    const assetPath = path.join(
      this.props.appSettings.rootDirectory,
      this.state.project.name,
      constants.projectTargetDirectoryName
    );
    const assetFilePath = path.join(
      assetPath,
      `${this.state.project.name}${constants.assetMetadataListFileExtension}`
    );
    if (await LocalFileSystem.exists(assetFilePath)) {
      assetMetadataList = JSON.parse(
        await LocalFileSystem.readText(assetFilePath)
      );
    }
    const regionFilePath = path.join(
      assetPath,
      `${this.state.project.name}${constants.regionMetadataListFileExtension}`
    );
    if (await LocalFileSystem.exists(regionFilePath)) {
      regionMetadataList = JSON.parse(
        await LocalFileSystem.readText(regionFilePath)
      );
    }

    if (
      this.props.appSettings.appMode === AppMode.Internal &&
      _.keys(assetMetadataList).length === 0 &&
      this.state.assetMetadataRecord
    ) {
      const assets = _.values(this.state.project.assets).filter(
        (asset) => asset.state !== AssetState.NotVisited
      );
      assetMetadataList = await this.loadAssetMetadata(_.values(assets));
      regionMetadataList = this.updateRegionMetadataList(
        _.values(assetMetadataList)
      );
    }
    // Get all root assets from source asset provider
    const sourceAssets = await this.props.actions.loadAssets(
      this.state.project
    );

    // Merge and uniquify
    const rootAssets = _(rootProjectAssets)
      .concat(sourceAssets)
      .uniqBy((asset) => asset.name)
      .value()
      .sort((a, b) => (a.name > b.name ? 1 : -1));

    const lastVisited = rootAssets.find(
      (asset) => asset.name === this.state.project.lastVisitedAssetName
    );

    this.setState(
      {
        assets: rootAssets,
        assetMetadataRecord: assetMetadataList,
        regionMetadataRecord: regionMetadataList,
      },
      async () => {
        if (rootAssets.length > 0) {
          await this.selectAsset(lastVisited ? lastVisited : rootAssets[0]);
        }
        this.loadingProjectAssets = false;
      }
    );
  };

  private loadAssetMetadata = async (assets: IAsset[]) => {
    this.setState({ isProgressCircleActive: true });
    const numOfAsset = assets.length;
    let index = 0;
    const assetMetadata: { [index: string]: IAssetMetadata } = {};
    await assets.forEachAsync(async (asset) => {
      let metadata = this.state.assetMetadataRecord[asset.name];
      if (!metadata) {
        metadata = await this.props.actions.loadAssetMetadata(
          this.state.project,
          asset
        );
      }
      metadata.asset.polygonNumber = metadata.regions.filter(
        (r) => r.state == RegionState.PolygonInputted
      ).length;
      metadata.asset.polylineNumber = metadata.regions.filter(
        (r) => r.state == RegionState.PolylineInputted
      ).length;
      assetMetadata[metadata.asset.name] = metadata;
      index += 1;
      this.setState({ progressValue: (100 * index) / numOfAsset });
    });
    this.setState({
      isProgressCircleActive: false,
      progressValue: 0,
    });
    return assetMetadata;
  };

  private onDoubleCheckMode = async (enable: boolean) => {
    let regionMetadataList = { ...this.state.regionMetadataRecord };
    if (this.doubleCheckedRegionIds.length === 0 && enable) {
      const assets = _.values(this.state.project.assets).filter(
        (asset) => asset.state === AssetState.Sample
      );
      const assetMetadataList = await this.loadAssetMetadata(_.values(assets));
      regionMetadataList = this.updateRegionMetadataList(
        _.values(assetMetadataList)
      );
      this.doubleCheckedRegionIds = [..._.keys(regionMetadataList)];
    }
    this.doubleCheckedRegionIds.forEach((id: string) => {
      regionMetadataList[id].isHidden = enable;
    });
    this.setState(
      {
        regionMetadataRecord: regionMetadataList,
      },
      () => {
        this.canvas.current?.editor.RM.onDoubleCheck(enable);
        this.canvas.current?.editor.RM.setRegionMenuHidden(enable);
        this.canvas.current?.refreshCanvasToolsRegions();
      }
    );
  };
  /**
   * Updates the root asset list from the project assets
   */
  private updateRootAssets = () => {
    const updatedAssets = [...this.state.assets];
    updatedAssets.forEach((asset) => {
      const projectAsset = this.state.project.assets[asset.name];
      if (projectAsset) {
        asset.state = projectAsset.state;
      }
    });

    this.setState({ assets: updatedAssets });
  };
}
