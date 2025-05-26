export interface IApplicationState {
  appSettings: IAppSettings;
  recentProjects: IProject[];
  currentProject?: IProject;
  recentReports: IReport[];
  currentReport?: IReport;
  appError?: IAppError;
}

export interface IAppError {
  errorCode: ErrorCode;
  message: string;
  title?: string;
}

/**
 * Enum of supported error codes
 */
export enum ErrorCode {
  // Note that the value of the enum is in camelCase while
  // the enum key is in Pascal casing
  Unknown = "unknown",
  GenericRenderError = "genericRenderError",
  CanvasError = "canvasError",
  ProjectImportError = "projectImportError",
  ProjectUploadError = "projectUploadError",
  ProjectDeleteError = "projectDeleteError",
  ProjectInvalidJson = "projectInvalidJson",
  AssetImportError = "assetImportError",
  AssetExportError = "assetExportError",
  ExportFormatNotFound = "exportFormatNotFound",
  PasteRegionTooBig = "pasteRegionTooBigError",
  OverloadedKeyBinding = "overloadedKeyBinding",
  ActiveLearningPredictionError = "activeLearningPredictionError",
  FormSchemaImportError = "formSchemaImportError",
  DatabaseJsonNotFoundError = "databaseJsonNotFoundError",
}

/**
 * Base application error
 */
export class AppError extends Error implements IAppError {
  public errorCode: ErrorCode;
  public message: string;
  public title?: string;

  constructor(
    errorCode: ErrorCode,
    message: string,
    title: string | undefined = undefined
  ) {
    super(message);
    this.errorCode = errorCode;
    this.message = message;
    this.title = title;
  }
}

export interface IProviderOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export enum AppMode {
  Internal = "internal",
  Hospital = "hospital",
  Examination = "examination",
}

export interface IAppSettings {
  rootDirectory: string;
  tags: ITag[];
  tagCategories: string[];
  appMode: AppMode;
  regionInformationSchema?: string;
  stepInformationSchema: string;
  confirmStepInfoInput?: boolean;
  instructionDirectory: string;
  thumbnailSize?: ISize;
  timingsFile: string;
  viimScript: string;
  viimSetting: string;
  reportSchema: string;
  frameExtractionRate: number;

  // privateReportSchema: string;
  // worker: string;
}

export enum ProjectPhase {
  Waiting = "Waiting",
  Working = "Working",
  Completed = "Completed",
}

export interface IProject {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags: ITag[];
  phase: ProjectPhase;
  videoSettings: IProjectVideoSettings;
  autoSave: boolean;
  isChanged?: boolean;
  assets: { [index: string]: IAsset };
  lastVisitedAssetName?: string;
}

export interface IFileInfo {
  content: string | ArrayBuffer;
  file: File;
}

export interface ITag {
  name: string;
  dispName?: string;
  title?: string;
  color: string;
}

export enum StorageType {
  Local = "local",
  Cloud = "cloud",
  Other = "other",
}

/**
 * @name - Video Tagging Settings for the project
 * @description - Defines the video settings within a VoTT project
 * @member frameExtractionRate - Extraction rate for a video (number of frames per second of video)
 */
export interface IProjectVideoSettings {
  frameExtractionRate: number;
}

/**
 * @name - Model Path Type
 * @description - Defines the mechanism to load the TF.js model for Active Learning
 * @member Coco - Specifies the default/generic pre-trained Coco-SSD model
 * @member File - Specifies to load a custom model from filesystem
 * @member Url - Specifies to load a custom model from a web server
 */
export enum ModelPathType {
  Coco = "coco",
  File = "file",
  Url = "url",
}

export interface IReport {
  id: string;
  name: string;
  phase: ReportPhase;
  examDateTime?: string;
  scopeType?: string;
  informedConsent?: string;
  exclusion?: boolean;
  exclusionReason?: string;
  noLesions: boolean;
  privateInfo?: IPrivateInfo;
  patientInfo?: IPatientInfo;
  lesionInfo: ILesionInfo;
}

export enum ReportPhase {
  Waiting = "Waiting",
  Working = "Working",
  Completed = "Completed",
}

export interface IPrivateInfo {
  doctorName?: string;
  memo?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IPatientInfo {
  patientInfo?: {
    age?: string;
    sex?: string;
    anamnesis?: string;
    surgicalHistory?: string;
    remarks?: string;
  };
  examInfo?: {
    purpose?: string;
    transgastricApproach?: string;
    remarks?: string;
  };
  pancreasInfo?: {
    condition?: string;
    pancreaticParenchyma?: string[];
    pancreaticDuct?: string[];
    others?: string[];
  };
}

export const LesionInfoKeys = [
  "lesion1",
  "lesion2",
  "lesion3",
  "lesion4",
  "lesion5",
] as const;
export type ILesionInfoKeys = (typeof LesionInfoKeys)[number];
export type ILesionInfo = { [K in ILesionInfoKeys]: ILesion };

export enum BiopsyType {
  Performed = "Performed",
  SurgicalResection = "SurgicalResection",
  NotPerformed = "NotPerformed",
}
export interface ILesion {
  imageDiagnosis?: {
    bodyRegion: string;
    lesionType: string;
  };
  biopsy?: BiopsyType;
  pathologicalResult?: string;
  detail?: string;
  remarks?: string;
}
export enum TrackingMethod {
  Copy = 0,
  MeanShift = 1,
  OSVOS = 2,
}

export interface ITrackingSettings {
  method: TrackingMethod;
}
/**
 * @name - Asset Video Settings
 * @description - Defines the settings for video assets
 * @member shouldAutoPlayVideo - true if the video should auto play when loaded, false otherwise
 * @member posterSource - Source location of the image to display when the video is not playing,
 * null for default (first frame of video)
 */

export enum InterpolationMethod {
  Linear = 0,
  MeanShift = 1,
  OSVOS = 2,
}

export interface IInterpolationSettings {
  method: InterpolationMethod;
  frameExtractionRate: number;
}

export interface IAssetVideoSettings {
  shouldAutoPlayVideo: boolean;
  posterSource: string;
  shouldShowPlayControls: boolean;
}

export interface IAsset {
  type: AssetType;
  state: AssetState;
  name: string;
  size: ISize;
  format?: string;
  timestamp?: number;
  lastVisitedTimestamp?: number;
  parent?: IAsset;
  predicted?: boolean;
  comment?: string;
  step?: string;
  polygonNumber?: number;
  polylineNumber?: number;
  firstCreatingWorker?: string;
  lastUpdatingWorker?: string;
}

/**
 * @name - Asset Metadata
 * @description - Format to store asset metadata for each asset within a project
 * @member asset - References an asset within the project
 * @member regions - The list of regions drawn on the asset
 */
export interface IAssetMetadata {
  asset: IAsset;
  regions: IRegion[];
  version: string;
}

/**
 * @name - Size
 * @description - Defines the size and/or diminsion for an asset
 * @member width - The actual width of an asset
 * @member height - The actual height of an asset
 */
export type ISize = {
  width: number;
  height: number;
};

export enum RegionState {
  Inputted = 0,
  Tracked = 1,
  Editted = 2,
  Interpolated = 3,
  PolygonInputted = 4,
  PolylineInputted = 5,
}

export interface IRegion {
  id: string;
  type: RegionType;
  tags: string[];
  confidence: number;
  points: IPoint[];
  boundingBox: IBoundingBox;
  state: RegionState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regionInfo?: any;
  comments?: string;
}

export interface IAssetRegion {
  regionState: RegionState;
  type: AssetType;
  timestamp?: number;
}

export interface IRegionMetadata {
  assets: { [index: string]: IAssetRegion };
  isHidden: boolean;
  isLocked: boolean;
  firstTimestamp: number;
  lastTimestamp: number;
}
/**
 * @name - Bounding Box
 * @description - Defines the tag usage within a bounding box region
 * @member left - Defines the left x boundary for the start of the bounding box
 * @member top - Defines the top y boundary for the start of the boudning box
 * @member width - Defines the width of the bounding box
 * @member height - Defines the height of the bounding box
 */
export interface IBoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface IEditorState {
  rootDirectory: string;
  project: IProject;
  assetMetadataList: { [assetName: string]: IAssetMetadata };
  regionMetadataList: { [regionId: string]: IRegionMetadata };
  modifiedAssetList: { [assetName: string]: IAssetMetadata };
}
/**
 * @name - Point
 * @description - Defines a point / coordinate within a region
 * @member x - The x value relative to the asset
 * @member y - The y value relative to the asset
 */
export interface IPoint {
  x: number;
  y: number;
}

/**
 * @name - Asset Type
 * @description - Defines the type of asset within a project
 * @member Image - Specifies an asset as an image
 * @member Video - Specifies an asset as a video
 */
export enum AssetType {
  Unknown = 0,
  Image = 1,
  Video = 2,
  VideoFrame = 3,
  TFRecord = 4,
}

/**
 * @name - Asset State
 * @description - Defines the state of the asset with regard to the tagging process
 * @member NotVisited - Specifies as asset that has not yet been visited or tagged
 * @member Visited - Specifies an asset has been visited, but not yet tagged
 * @member Tagged - Specifies an asset has been visited and tagged
 */
export enum AssetState {
  NotVisited = 0,
  Store = 1,
  Freeze = 2,
  FreezeStore = 2.5,
  Sample = 3,
  Tracked = 4,
  Interpolated = 5,
}

/**
 * @name - Region Type
 * @description - Defines the region type within the asset metadata
 * @member Square - Specifies a region as a square
 * @member Rectangle - Specifies a region as a rectangle
 * @member Polygon - Specifies a region as a multi-point polygon
 */
export enum RegionType {
  Polyline = "POLYLINE",
  Point = "POINT",
  Rectangle = "RECTANGLE",
  Polygon = "POLYGON",
  Square = "SQUARE",
}

export enum EditorMode {
  Rectangle = "RECT",
  Polygon = "POLYGON",
  Polyline = "POLYLINE",
  Point = "POINT",
  Select = "SELECT",
  CopyRect = "COPYRECT",
  None = "NONE",
}

export interface ITFRecordMetadata {
  width: number;
  height: number;
  xminArray: number[];
  yminArray: number[];
  xmaxArray: number[];
  ymaxArray: number[];
  textArray: string[];
}
