import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  SyntheticEvent,
} from "react";
import { FaCircleNotch, FaExclamationCircle } from "react-icons/fa";
import { strings } from "../../../common/strings";
import {
  AssetType,
  IAppSettings,
  IAsset,
  IProjectVideoSettings,
  ITag,
} from "../../../models/applicationState";
import { ImageAsset } from "./imageAsset";
import {
  IAssetWithTimestamp,
  VideoAsset,
  IVideoAssetRef,
} from "./videoAsset/videoAsset";

export interface IGenericContentSource {
  width: number;
  height: number;
  offsetWidth: number;
  offsetHeight: number;
  offsetTop: number;
  offsetLeft: number;
}
export type ContentSource =
  | HTMLCanvasElement
  | HTMLImageElement
  | HTMLVideoElement;

export interface IAssetProps {
  projectName: string;
  asset: IAsset;
  appSettings: IAppSettings;
  childAssets?: IAsset[];
  controlsEnabled?: boolean;
  tags?: ITag[];
  onLoaded?: (contentSource: ContentSource) => void;
  onActivated?: (contentSource?: ContentSource) => void;
  onDeactivated?: (contentSource: ContentSource) => void;
  onChildAssetSelected?: (asset: IAsset) => void;
  onError?: (event: React.SyntheticEvent) => void;
  onAssetChanged?: (asset: IAsset) => void;
  onBeforeAssetChanged?: () => boolean;
  onSeekTimeClick?: () => void;
  onTrack?: (beTraked: boolean) => void;
  showAssetStateSelector?: boolean;
}

export interface IAssetPreviewProps extends IAssetProps {
  autoPlay?: boolean;
}

export interface IAssetPreviewSettings {
  videoSettings: IProjectVideoSettings;
}

// refで公開するメソッド型
export interface IAssetPreviewHandle {
  moveNextTaggedVideoFrame: () => void;
  movePreviousTaggedVideoFrame: () => void;
  moveNextExpectedVideoFrame: () => void;
  movePreviousExpectedVideoFrame: () => void;
  seekToTime: (timestamp: number, beTracked?: boolean) => void;
}

export const AssetPreview = forwardRef<IAssetPreviewHandle, IAssetPreviewProps>(
  (
    {
      projectName,
      asset,
      appSettings,
      childAssets = [],
      controlsEnabled = true,
      tags,
      onLoaded,
      onActivated,
      onDeactivated,
      onChildAssetSelected,
      onError,
      onAssetChanged,
      onBeforeAssetChanged,
      onSeekTimeClick,
      onTrack,
      showAssetStateSelector = false,
      autoPlay = false,
    },
    ref
  ) => {
    const [loaded, setLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const videoPreview = useRef<IVideoAssetRef | null>(null);
    const rootAsset = asset.parent || asset;

    useEffect(() => {
      setLoaded(false);
      setHasError(false);
      if (onAssetChanged) {
        onAssetChanged(asset);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asset.name]);

    const hasTimestamp = (a: IAsset): a is IAssetWithTimestamp => {
      return (a as IAssetWithTimestamp).timestamp !== undefined;
    };

    const handleAssetLoad = (contentSource: ContentSource) => {
      setLoaded(true);
      onLoaded?.(contentSource);
    };

    const handleError = (e: SyntheticEvent) => {
      setHasError(true);
      setLoaded(true);
      onError?.(e);
    };

    const handleChildAssetSelected = (selectedAsset: IAsset) => {
      if (onBeforeAssetChanged && !onBeforeAssetChanged()) {
        return;
      }
      if (onChildAssetSelected) {
        onChildAssetSelected(selectedAsset);
      }
      if (onAssetChanged) {
        onAssetChanged(selectedAsset);
      }
    };

    // refで外部公開するメソッド
    useImperativeHandle(ref, () => ({
      moveNextTaggedVideoFrame: () =>
        videoPreview.current?.moveNextTaggedFrame(),
      movePreviousTaggedVideoFrame: () =>
        videoPreview.current?.movePreviousTaggedFrame(),
      moveNextExpectedVideoFrame: () =>
        videoPreview.current?.moveNextExpectedFrame(),
      movePreviousExpectedVideoFrame: () =>
        videoPreview.current?.movePreviousExpectedFrame(),
      seekToTime: (timestamp: number, beTracked: boolean = false) =>
        videoPreview.current?.seekToTime(timestamp, beTracked),
    }));

    const renderAsset = () => {
      const filteredChildAssets = (childAssets || []).filter(hasTimestamp);
      switch (asset.type) {
        case AssetType.Image:
          return (
            <ImageAsset
              projectName={projectName}
              asset={rootAsset}
              appSettings={appSettings}
              onLoaded={handleAssetLoad}
              onError={handleError}
              onActivated={onActivated}
              onDeactivated={onDeactivated}
            />
          );
        case AssetType.Video:
        case AssetType.VideoFrame:
          return (
            <VideoAsset
              ref={videoPreview}
              projectName={projectName}
              asset={rootAsset}
              appSettings={appSettings}
              controlsEnabled={controlsEnabled}
              childAssets={filteredChildAssets}
              isForCanvas={autoPlay}
              onLoaded={handleAssetLoad}
              onError={handleError}
              onBeforeAssetChanged={onBeforeAssetChanged}
              onChildAssetSelected={handleChildAssetSelected}
              onSeekTimeClick={onSeekTimeClick || (() => {})}
              onTrack={onTrack}
              onActivated={onActivated}
              onDeactivated={onDeactivated}
              tags={tags}
              showAssetStateSelector={showAssetStateSelector}
            />
          );
        default:
          return (
            <div className="text-sm font-medium mx-auto text-[85%]">
              {strings.editorPage.assetError}
            </div>
          );
      }
    };

    const size = asset.size;
    const classNames = ["flex flex-grow"];
    if (size) {
      if (size.width > size.height) {
        classNames.push("landscape");
      } else {
        classNames.push("portrait", "mx-auto");
      }
    }
    return (
      <div className={classNames.join(" ")}>
        <div className="flex relative flex-col w-full text-center">
          {!loaded && (
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-black/80">
              <div className="absolute top-[45%] left-1/2">
                <FaCircleNotch className="fa-spin" />
              </div>
            </div>
          )}
          {hasError && (
            <div className="text-sm font-medium mx-auto text-danger text-[85%]">
              <FaExclamationCircle className="text-2xl" />
              <p className="m-2">{strings.editorPage.assetError}</p>
            </div>
          )}
          {!hasError && renderAsset()}
        </div>
      </div>
    );
  }
);

AssetPreview.displayName = "AssetPreview";
