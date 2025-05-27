import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  SyntheticEvent,
} from "react";
import { strings } from "../../../common/strings";
import {
  AssetType,
  IAppSettings,
  IAsset,
  IProjectVideoSettings,
  ITag,
} from "../../../models/applicationState";
import { ImageAsset } from "./imageAsset";
import { IAssetWithTimestamp, VideoAsset, IVideoAssetRef } from "./videoAsset";

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
  onLoaded?: (ContentSource: ContentSource) => void;
  onActivated?: (contentSource: ContentSource) => void;
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

    const handleAssetLoad = useCallback(
      (contentSource: ContentSource) => {
        setLoaded(true);
        if (onLoaded) {
          onLoaded(contentSource);
        }
      },
      [onLoaded]
    );

    const handleError = useCallback(
      (e: SyntheticEvent) => {
        setHasError(true);
        setLoaded(true);
        if (onError) {
          onError(e);
        }
      },
      [onError]
    );

    const handleChildAssetSelected = useCallback(
      (selectedAsset: IAsset) => {
        if (onBeforeAssetChanged && !onBeforeAssetChanged()) {
          return;
        }
        if (onChildAssetSelected) {
          onChildAssetSelected(selectedAsset);
        }
        if (onAssetChanged) {
          onAssetChanged(selectedAsset);
        }
      },
      [onBeforeAssetChanged, onChildAssetSelected, onAssetChanged]
    );

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
      const rootAsset = asset.parent || asset;
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
              autoPlay={autoPlay}
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
            <div className="asset-error">{strings.editorPage.assetError}</div>
          );
      }
    };

    const size = asset.size;
    const classNames = ["asset-preview"];
    if (size) {
      if (size.width > size.height) {
        classNames.push("landscape");
      } else {
        classNames.push("portrait");
      }
    }

    return (
      <div className={classNames.join(" ")}>
        <div className="asset-preview-container">
          {!loaded && (
            <div className="asset-loading">
              <div className="asset-loading-spinner">
                <i className="fas fa-circle-notch fa-spin" />
              </div>
            </div>
          )}
          {hasError && (
            <div className="asset-error text-danger">
              <i className="fas fa-2x fa-exclamation-circle" />
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
