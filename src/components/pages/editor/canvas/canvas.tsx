import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import Clipboard from "../../../../common/clipboard";
import { createContentBoundingBox } from "../../../../common/layout";
import { strings } from "../../../../common/strings";
import {
  AppMode,
  AssetState,
  EditorMode,
  IAssetMetadata,
  IProject,
  IRegion,
  IRegionMetadata,
  ITag,
  RegionState,
  RegionType,
} from "../../../../models/applicationState";
import { Editor } from "../../../../services/vott-ct/ts/CanvasTools/CanvasTools.Editor";
import { Rect } from "../../../../services/vott-ct/ts/CanvasTools/Core/Rect";
import { RegionData } from "../../../../services/vott-ct/ts/CanvasTools/Core/RegionData";
import { SelectionMode } from "../../../../services/vott-ct/ts/CanvasTools/Interface/ISelectorSettings";
import { CanvasTools } from "../../../../services/vott-ct/ts/ct";
import {
  IAssetPreviewProps,
  ContentSource,
} from "../../../common/assetPreview";
import Confirm from "../../../common/confirm";
import CanvasHelpers from "./canvasHelpers";

export interface ICanvasFilterSetting {
  brightness: number;
  contrast: number;
}

export interface ICanvasProps {
  selectedAsset: IAssetMetadata;
  editorMode: EditorMode;
  selectionMode: SelectionMode;
  project: IProject;
  isFrozen: boolean;
  lockSample: boolean;
  lockRectangle: boolean;
  hideRegionMenu: boolean;
  regionMetadataList: { [index: string]: IRegionMetadata };
  children?: ReactElement<IAssetPreviewProps>;

  defaultTags: ITag[];
  forceShow: boolean;
  appMode: AppMode;
  onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
  onSelectedRegionsChanged?: (regions: IRegion[]) => void;
  onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
  onDeleteRegions?: (regions: IRegion[]) => void;
  onModalOpen?: (region: IRegion) => void;
  resetRegionData?: () => void;
}

export interface ICanvasDefaultProps {
  editorMode: EditorMode;
  selectionMode: SelectionMode;
  isFrozen: boolean;
  lockSample: boolean;
  lockRectangle: boolean;
  hideRegionMenu: boolean;
  regionMetadataList: { [index: string]: IRegionMetadata };
  defaultTags: ITag[];
  forceShow: boolean;
  appMode: AppMode;
}

export interface ICanvasState {
  currentAsset: IAssetMetadata;
  contentSource: ContentSource | null;
  enabled: boolean;
  videoEnabled: boolean;
  isConfirmOpen: boolean;
}

export default class Canvas extends React.Component<
  ICanvasProps,
  ICanvasState
> {
  public static defaultProps: Partial<ICanvasDefaultProps> = {
    selectionMode: SelectionMode.NONE,
    editorMode: EditorMode.Select,
    isFrozen: true,
    lockSample: false,
    lockRectangle: false,
    hideRegionMenu: false,
    regionMetadataList: {},
    defaultTags: [],
    forceShow: false,
    appMode: AppMode.Internal,
  };

  declare public editor: Editor;

  public state: ICanvasState = {
    currentAsset: this.props.selectedAsset,
    contentSource: null,
    enabled: false,
    videoEnabled: false,
    isConfirmOpen: false,
  };

  private canvasZone: React.RefObject<HTMLDivElement | null> =
    React.createRef();
  private template: Rect = new Rect(20, 20);

  public componentDidMount = () => {
    const sz = document.getElementById("editor-zone");
    if (sz instanceof HTMLDivElement && this.editor === undefined) {
      this.editor = new Editor(sz);
      this.editor.autoResize = false;
      this.editor.onSelectionBegin = this.onSelectionBegin;
      this.editor.onSelectionEnd = this.onSelectionEnd;
      this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
      this.editor.onRegionDelete = this.onRegionDelete;
      this.editor.onRegionSelected = this.onRegionSelected;
      this.editor.onRegionInfo = this.onRegionInfoClicked;
      this.editor.AS.setSelectionMode({ mode: this.props.selectionMode });
      window.addEventListener("resize", this.onWindowResize);
    }
  };

  public componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
  }

  public componentDidUpdate = async (
    prevProps: Readonly<ICanvasProps>,
    prevState: Readonly<ICanvasState>
  ) => {
    // Handles asset changing
    if (this.props.selectedAsset !== prevProps.selectedAsset) {
      this.setState({ currentAsset: this.props.selectedAsset });
    }

    // Handle selection mode changes
    if (this.props.selectionMode !== prevProps.selectionMode) {
      if (this.props.selectionMode === SelectionMode.COPYRECT) {
        this.editor.AS.setSelectionMode({
          mode: SelectionMode.COPYRECT,
          template: this.template,
        });
      } else {
        this.editor.AS.setSelectionMode(this.props.selectionMode);
      }

      this.editor.RM.showAllRegions();

      if (this.props.editorMode === EditorMode.Select) {
        this.editor.RM.unfreeze();
        this.refreshCanvasToolsRegions();
      } else {
        this.editor.RM.freeze();
        this.editor.AS.show();
        this.refreshCanvasToolsRegions();
      }
    }

    const assetNameChanged =
      this.state.currentAsset.asset.name !== prevState.currentAsset.asset.name;

    // When the selected asset has changed but is still the same asset id
    // if (!assetNameChanged && JSON.stringify(this.state.currentAsset) !== JSON.stringify(prevState.currentAsset)) {
    // if (!assetNameChanged && this.state.currentAsset.regions.length !== prevState.currentAsset.regions.length) {
    if (
      !assetNameChanged &&
      this.state.currentAsset !== prevState.currentAsset
    ) {
      this.refreshCanvasToolsRegions();
    }

    // When the project tags change re-apply tags to regions
    if (this.props.project.tags !== prevProps.project.tags) {
      this.updateCanvasToolsRegionTags();
    }

    if (this.props.isFrozen !== prevProps.isFrozen) {
      //     this.editor.RM.toggleFreezeMode();
      if (!this.props.isFrozen) {
        this.editor.RM.unfreeze();
      } else {
        this.editor.RM.freeze();
      }
    }

    // Handles when the canvas is enabled & disabled
    if (prevState.enabled !== this.state.enabled) {
      // When the canvas is ready to display
      if (this.state.enabled && this.state.contentSource !== null) {
        this.refreshCanvasToolsRegions();
        this.setContentSource(this.state.contentSource);
        this.editor.AS.setSelectionMode({
          mode: this.props.selectionMode,
        });
        this.editor.AS.enable();

        if (this.props.onSelectedRegionsChanged) {
          this.props.onSelectedRegionsChanged(this.getSelectedRegions());
        }
      } else {
        // When the canvas has been disabled
        this.editor.AS.disable();
        // TODO 本当に消していいか要検証
        // this.clearAllRegions();
        this.editor.AS.setSelectionMode({
          mode: this.props.selectionMode,
        });
      }
    }
  };

  public render = () => {
    // 動画での切り替え時に背景の動画プレイヤーが出ないようにする
    // Zoom時などに一度元の解像度に戻って、再度Zoomするといった挙動を防ぐ
    const className = this.state.videoEnabled
      ? ["canvas-enabled"]
      : ["canvas-disabled"];
    const frameClassName = ["frame"];
    if (this.state.currentAsset) {
      switch (this.state.currentAsset.asset.state) {
        case AssetState.Sample:
          frameClassName.push("canvas-sample");
          break;
        case AssetState.Store:
          frameClassName.push("canvas-store");
          break;
        case AssetState.Freeze:
          frameClassName.push("canvas-freeze");
          break;
        case AssetState.FreezeStore:
          frameClassName.push("canvas-freeze_store");
          break;
        case AssetState.Tracked:
          frameClassName.push("canvas-tracked");
          break;
        default:
          break;
      }
    }

    return (
      <>
        <Confirm
          show={this.state.isConfirmOpen}
          title={strings.editorPage.canvas.removeAllRegions.title}
          message={strings.editorPage.canvas.removeAllRegions.confirmation}
          confirmButtonColor="danger"
          onConfirm={this.removeAllRegions}
        />

        <div
          id="ct-zone"
          ref={this.canvasZone}
          className={className.join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div id="selection-zone">
            <div id="editor-zone" className="full-size" />
          </div>
          <div className={frameClassName.join(" ")}>
            {this.state.currentAsset.asset.comment && (
              <div className="comment-frame" />
            )}
            {this.state.currentAsset.asset.step && (
              <div className="step-frame" />
            )}
          </div>
        </div>

        {this.renderChildren()}
      </>
    );
  };

  public applyTag = (tag: string) => {
    const prevSelectedRegions = this.getSelectedRegions();
    const selectedRegions = prevSelectedRegions.map((selectedRegion) => {
      if (tag !== selectedRegion.tags[0]) {
        if (selectedRegion.regionInfo) {
          delete selectedRegion.regionInfo;
        }
        selectedRegion.tags = [tag];
      }
      return selectedRegion;
    });
    this.updateRegions(selectedRegions);
    // this.selectRegions(selectedRegions);
  };

  public copyRegions = async () => {
    await Clipboard.writeObject(this.getSelectedRegions());
  };

  public copyAllRectangles = async () => {
    const regions = this.state.currentAsset.regions.filter((region) => {
      return region.type === RegionType.Rectangle;
    });
    await Clipboard.writeObject(regions);
    return regions.length;
  };

  public copyAllPolygons = async () => {
    const regions = this.state.currentAsset.regions.filter((region) => {
      return region.type === RegionType.Polygon;
    });
    await Clipboard.writeObject(regions);
    return regions.length;
  };

  public cutRegions = async () => {
    const selectedRegions = this.getSelectedRegions();
    await Clipboard.writeObject(selectedRegions);
    this.deleteRegions(selectedRegions);
  };

  public pasteRegions = async () => {
    const regionsToPaste: IRegion[] = await Clipboard.readObject();
    const asset = this.state.currentAsset;
    const duplicates = CanvasHelpers.duplicateRegionsAndMove(
      regionsToPaste,
      asset.regions,
      asset.asset.size.width,
      asset.asset.size.height
    );
    this.addRegions(duplicates);
  };

  public confirmRemoveAllRegions = () => {
    this.setState({ isConfirmOpen: true });
  };

  public getSelectedRegions = (): IRegion[] => {
    const selectedRegions = this.editor.RM.getSelectedRegions().map(
      (rb) => rb.id
    );
    return this.state.currentAsset.regions.filter((r) =>
      selectedRegions.find((id) => r.id === id)
    );
  };

  public getEmptyRegions = (): IRegion[] => {
    const emptyRegions = this.editor.RM.getEmptyRegions();
    return this.state.currentAsset.regions.filter((r) => {
      return (
        emptyRegions.findIndex((er) => r.id === er.id) > -1 ||
        r.tags.length === 0
      );
    });
  };

  public selectRegions = (regions: IRegion[]) => {
    if (regions.length === 0) {
      this.editor.RM.selectRegionById("");
    } else {
      regions.forEach((region) => this.editor.RM.selectRegionById(region.id));
    }

    if (this.props.onSelectedRegionsChanged) {
      this.props.onSelectedRegionsChanged(regions);
    }
  };

  public updateCanvasToolsRegionTags = (): void => {
    for (const region of this.state.currentAsset.regions) {
      this.editor.RM.updateTagsById(
        region.id,
        CanvasHelpers.getTagsDescriptor(this.props.project.tags, region)
      );
    }
  };

  public forceResize = (): void => {
    this.onWindowResize();
  };

  public removeAllRegions = () => {
    this.deleteRegions(this.state.currentAsset.regions);
    this.setState({ isConfirmOpen: false });
    // const ids = this.state.currentAsset.regions.map((r) => r.id);
    // for (const id of ids) {
    //     this.editor.RM.deleteRegionById(id);
    // }
    // this.deleteRegionsFromAsset(this.state.currentAsset.regions);
  };

  public removeEmptyRegions = () => {
    const emptyRegions = this.getEmptyRegions();
    this.deleteRegions(emptyRegions);
  };

  public addRegions = (regions: IRegion[]) => {
    this.addRegionsToCanvasTools(regions);
    this.addRegionsToAsset(regions);
  };

  private addRegionsToAsset = (regions: IRegion[]) => {
    this.updateAssetRegions(this.state.currentAsset.regions.concat(regions));
  };

  public addRegionsToCanvasTools = (regions: IRegion[]) => {
    for (const region of regions) {
      const regionData = CanvasHelpers.getRegionData(region);
      const scaledRegionData = this.editor.scaleRegionToFrameSize(
        regionData,
        this.state.currentAsset.asset.size.width,
        this.state.currentAsset.asset.size.height
      );
      this.editor.RM.addRegion(
        region.id,
        scaledRegionData,
        CanvasHelpers.getTagsDescriptor(this.props.project.tags, region)
      );
    }
  };

  public deleteRegions = (regions: IRegion[]) => {
    if (this.props.onDeleteRegions) {
      this.props.onDeleteRegions(regions);
    }
    // this.selectRegions([]);
    // this.deleteRegionsFromCanvasTools(regions);
    this.deleteRegionsFromAsset(regions);
  };

  private deleteRegionsFromAsset = (regions: IRegion[]) => {
    const filteredRegions = this.state.currentAsset.regions.filter(
      (assetRegion) => {
        return !regions.find((r) => r.id === assetRegion.id);
      }
    );
    this.updateAssetRegions(filteredRegions);
  };

  public deleteRegionsFromCanvasTools = (regions: IRegion[]) => {
    for (const region of regions) {
      this.editor.RM.deleteRegionById(region.id);
    }
  };

  public addDeleteRegions = (
    addRegions: IRegion[],
    deleteRegions: IRegion[]
  ) => {
    this.deleteRegionsFromCanvasTools(deleteRegions);
    const filteredRegions = this.state.currentAsset.regions.filter(
      (assetRegion) => {
        return !deleteRegions.find((r) => r.id === assetRegion.id);
      }
    );
    this.addRegionsToCanvasTools(addRegions);
    this.updateAssetRegions(filteredRegions.concat(addRegions));
  };

  private onSelectionBegin = () => {
    if (this.props.resetRegionData) {
      this.props.resetRegionData();
    }
  };

  private onSelectionEnd = (regionData: RegionData) => {
    if (CanvasHelpers.isEmpty(regionData)) {
      return;
    }
    if (CanvasHelpers.isInvalid(regionData)) {
      return;
    }
    const id = shortid.generate();

    this.editor.RM.addRegion(id, regionData); // TODO
    this.template = new Rect(regionData.width, regionData.height);

    // RegionData not serializable so need to extract data
    const scaledRegionData = this.editor.scaleRegionToSourceSize(
      regionData,
      this.state.currentAsset.asset.size.width,
      this.state.currentAsset.asset.size.height
    );

    const tags: string[] = this.props.defaultTags.map((tag: ITag) => tag.name);
    const type = this.editorModeToType(this.props.editorMode);
    if (!type) return;
    let regionState = RegionState.Inputted;
    if (this.props.appMode === AppMode.Internal) {
      if (type === RegionType.Polygon) {
        regionState = RegionState.PolygonInputted;
      } else if (type === RegionType.Polyline) {
        regionState = RegionState.PolylineInputted;
      }
    }
    const newRegion: IRegion = {
      id,
      type,
      tags: tags,
      confidence: 1,
      boundingBox: {
        height: scaledRegionData.height,
        width: scaledRegionData.width,
        left: scaledRegionData.x,
        top: scaledRegionData.y,
      },
      points: scaledRegionData.points,
      state: regionState,
    };
    if (
      this.state.currentAsset.asset.state === AssetState.Tracked ||
      this.state.currentAsset.asset.state === AssetState.Interpolated
    ) {
      const currentAsset = {
        ...this.state.currentAsset,
        asset: {
          ...this.state.currentAsset.asset,
          state: AssetState.Sample,
        },
      };
      this.setState({ currentAsset: currentAsset });
    }
    // すでにある空のregionを削除
    // const emptyRegions = this.getEmptyRegions(); // TODO 本当になくてもいいのか?
    // this.deleteRegionsFromCanvasTools(emptyRegions); // TODO 本当になくてもいいのか?
    const taggeedRegions = this.state.currentAsset.regions.filter(
      (r) => r.tags.length > 0
    );
    this.updateAssetRegions([...taggeedRegions, newRegion]);
    this.selectRegions([newRegion]);
  };

  private updateAssetRegions = (regions: IRegion[]) => {
    const currentAsset: IAssetMetadata = {
      ...this.state.currentAsset,
      regions,
    };
    this.setState(
      {
        currentAsset,
      },
      () => {
        this.props.onAssetMetadataChanged?.(currentAsset);
      }
    );
  };

  private onRegionMoveEnd = (id: string, regionData: RegionData) => {
    const currentRegions = this.state.currentAsset.regions;
    const movedRegionIndex = currentRegions.findIndex(
      (region) => region.id === id
    );
    const movedRegion = currentRegions[movedRegionIndex];
    const scaledRegionData = this.editor.scaleRegionToSourceSize(
      regionData,
      this.state.currentAsset.asset.size.width,
      this.state.currentAsset.asset.size.height
    );
    if (movedRegion) {
      movedRegion.points = scaledRegionData.points;
      movedRegion.boundingBox = {
        height: scaledRegionData.height,
        width: scaledRegionData.width,
        left: scaledRegionData.x,
        top: scaledRegionData.y,
      };
      if (
        this.state.currentAsset.asset.state === AssetState.Tracked ||
        this.state.currentAsset.asset.state === AssetState.Interpolated
      ) {
        movedRegion.state = RegionState.Editted;
      }
    }

    currentRegions[movedRegionIndex] = movedRegion;
    this.updateAssetRegions(currentRegions);
  };

  private onRegionDelete = (id: string) => {
    // Remove from Canvas Tools
    // this.editor.RM.deleteRegionById(id);
    // this.editor.AS.disable();
    // Remove from project
    const currentRegions = this.state.currentAsset.regions;
    // const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);
    // currentRegions.splice(deletedRegionIndex, 1);

    // this.updateAssetRegions(currentRegions);
    // this.selectRegions([])
    const regions = currentRegions.filter((region) => region.id === id);

    if (this.props.onDeleteRegions) {
      this.props.onDeleteRegions(regions);
    }
    // this.selectRegions([]);
    // this.deleteRegionsFromCanvasTools(regions);
    this.deleteRegionsFromAsset(regions);
  };

  private onRegionSelected = (id: string) => {
    const selectedRegions = this.getSelectedRegions();
    if (this.props.onSelectedRegionsChanged) {
      this.props.onSelectedRegionsChanged(selectedRegions);
    }
    // Gets the scaled region data
    const regions = this.editor.RM.getSelectedRegionsBounds();
    const selectedRegionsData = regions.find((region) => region.id === id);

    if (selectedRegionsData) {
      this.template = new Rect(
        selectedRegionsData.width,
        selectedRegionsData.height
      );
    }
  };

  private onRegionInfoClicked = (id: string) => {
    const region = this.state.currentAsset.regions.find(
      (region) => region.id === id
    );
    if (region) {
      if (this.props.onModalOpen) {
        this.props.onModalOpen(region);
      }
    }
  };

  private renderChildren = () => {
    if (!this.props.children) return null;
    return React.cloneElement(this.props.children, {
      onAssetChanged: this.onAssetChanged,
      onLoaded: this.onAssetLoaded,
      onError: this.onAssetError,
      onActivated: this.onAssetActivated,
      onDeactivated: this.onAssetDeactivated,
    });
  };

  private onAssetChanged = () => {
    // Videoのtimestampが変わったときにcanvas-enabled状態を解除しないようにする
    // TODO 動画が最後まで再生されたときに、最後のフレームが表示されない問題が残っている
    this.setState({ enabled: false, videoEnabled: true });
  };

  private onAssetLoaded = (contentSource: ContentSource) => {
    this.setState({ contentSource });
    this.positionCanvas(contentSource);
  };

  private onAssetError = () => {
    this.setState({
      enabled: false,
      videoEnabled: false,
    });
  };

  /**
   * Raised when the asset is taking control over the rendering
   */
  private onAssetActivated = () => {
    // VideoAssetの再生が押された時だけcanvas-disabledにできるようにする。
    this.setState({ enabled: false, videoEnabled: false });
  };

  /**
   * Raise when the asset is handing off control of rendering
   */
  private onAssetDeactivated = (contentSource: ContentSource) => {
    this.setState({
      contentSource,
      enabled: true,
      videoEnabled: true,
    });
  };

  private setContentSource = async (contentSource: ContentSource) => {
    try {
      await this.editor.addContentSource(contentSource);

      if (this.props.onCanvasRendered) {
        const canvas = this.canvasZone.current?.querySelector("canvas");
        if (!canvas) return;
        this.props.onCanvasRendered(canvas);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  private positionCanvas = (contentSource: ContentSource) => {
    if (!contentSource) {
      return;
    }

    const canvas = this.canvasZone.current;
    if (canvas) {
      const boundingBox = createContentBoundingBox(contentSource);
      canvas.style.top = `${boundingBox.top}px`;
      canvas.style.left = `${boundingBox.left}px`;
      canvas.style.width = `${boundingBox.width}px`;
      canvas.style.height = `${boundingBox.height}px`;
      this.editor.resize(boundingBox.width, boundingBox.height);
    }
  };

  private onWindowResize = async () => {
    if (!this.state.contentSource) {
      return;
    }

    this.positionCanvas(this.state.contentSource);
  };

  private updateRegions = (updates: IRegion[]) => {
    const updatedRegions = CanvasHelpers.updateRegions(
      this.state.currentAsset.regions,
      updates
    );
    for (const update of updates) {
      this.editor.RM.updateTagsById(
        update.id,
        CanvasHelpers.getTagsDescriptor(this.props.project.tags, update)
      );
    }
    this.updateAssetRegions(updatedRegions);
    this.updateCanvasToolsRegionTags();
  };

  private clearAllRegions = () => {
    this.editor.RM.deleteAllRegions();
  };

  public refreshCanvasToolsRegions = () => {
    this.clearAllRegions();

    if (
      !this.state.currentAsset.regions ||
      this.state.currentAsset.regions.length === 0
    ) {
      return;
    }

    // Add regions to the canvas
    this.state.currentAsset.regions.forEach((region: IRegion) => {
      const loadedRegionData = CanvasHelpers.getRegionData(region);
      this.editor.RM.addRegion(
        region.id,
        this.editor.scaleRegionToFrameSize(
          loadedRegionData,
          this.state.currentAsset.asset.size.width,
          this.state.currentAsset.asset.size.height
        ),
        CanvasHelpers.getTagsDescriptor(this.props.project.tags, region)
      );
    });

    this.state.currentAsset.regions.forEach((region: IRegion) => {
      if (region.id in this.props.regionMetadataList) {
        if (this.props.forceShow) {
          this.editor.RM.showRegionById(region.id);
        } else if (this.props.regionMetadataList[region.id].isHidden) {
          this.editor.RM.blindRegionById(region.id);
        }
        if (this.props.regionMetadataList[region.id].isLocked) {
          this.editor.RM.lockRegionById(region.id);
        } else {
          if (this.props.lockSample && region.state === RegionState.Inputted) {
            this.editor.RM.lockRegionById(region.id);
          } else if (
            this.props.lockRectangle &&
            region.type === RegionType.Rectangle
          ) {
            this.editor.RM.lockRegionById(region.id);
          }
        }
      }
    });

    if (this.props.editorMode !== EditorMode.Select) {
      this.editor.RM.freeze();
    }
  };

  private editorModeToType = (editorMode: EditorMode) => {
    let type;
    switch (editorMode) {
      case EditorMode.CopyRect:
      case EditorMode.Rectangle:
        type = RegionType.Rectangle;
        break;
      case EditorMode.Polygon:
        type = RegionType.Polygon;
        break;
      case EditorMode.Point:
        type = RegionType.Point;
        break;
      case EditorMode.Polyline:
        type = RegionType.Polyline;
        break;
      default:
        break;
    }
    return type;
  };

  public changeCanvasFilter = async (canvasFilter: ICanvasFilterSetting) => {
    if (this.state.contentSource) {
      this.editor.FP.clearFilters();
      this.editor.FP.addFilter(
        CanvasTools.Filters.BrightnessFilter(canvasFilter.brightness)
      );
      this.editor.FP.addFilter(
        CanvasTools.Filters.ContrastFilter(canvasFilter.contrast)
      );
      this.setContentSource(this.state.contentSource);
    }
  };

  public changeAllRegionsOpacity = (opacity: number) => {
    const regions = document.getElementsByClassName("regionStyle");

    if (regions) {
      for (let i = 0; i < regions.length; i++) {
        const region = regions[i] as HTMLElement;
        const opacityStyle = opacity / 100;
        region.style.opacity = String(opacityStyle);
        const tagTexts = region.getElementsByClassName("primaryTagTextStyle");
        if (tagTexts) {
          for (let j = 0; j < tagTexts.length; j++) {
            const tagText = tagTexts[j] as HTMLElement;
            tagText.style.opacity = String(opacityStyle);
          }
        }
        const tagTextBGs = region.getElementsByClassName(
          "primaryTagTextBGStyle"
        );
        if (tagTextBGs) {
          for (let j = 0; j < tagTextBGs.length; j++) {
            const tagTextBG = tagTextBGs[j] as HTMLElement;
            tagTextBG.style.opacity = String(opacityStyle);
          }
        }
      }
    }
  };
}
