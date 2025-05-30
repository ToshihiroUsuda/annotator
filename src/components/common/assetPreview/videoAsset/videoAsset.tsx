import path from "path-browserify";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import ReactDOMClient from "react-dom/client";
import { strings } from "../../../../common/strings";
import { encodeFileURI } from "../../../../common/utils";
import {
  AppError,
  AppMode,
  AssetState,
  AssetType,
  IAppSettings,
  IAsset,
  ErrorCode,
} from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import { IAssetProps } from "..";
import ControlBar from "./controlBar";
import AssetStateSelector from "./assetStateSelector";

export type VideoState = {
  readyState: number;
  paused: boolean;
  seeking: boolean;
  currentTime: number;
  duration: number;
  currentSrc: string;
};

export type IAssetWithTimestamp = Omit<IAsset, "timestamp"> & {
  timestamp: number;
};

export interface IVideoAssetProps extends IAssetProps {
  appSettings: IAppSettings;
  isForCanvas?: boolean;
  onSeekTimeClick: () => void;
  childAssets: IAssetWithTimestamp[];
}

export interface IVideoAssetRef {
  moveNextTaggedFrame: () => void;
  movePreviousTaggedFrame: () => void;
  moveNextExpectedFrame: () => void;
  movePreviousExpectedFrame: () => void;
  seekToTime: (time: number, beTracked?: boolean) => void;
}

export const VideoAsset = React.forwardRef<IVideoAssetRef, IVideoAssetProps>(
  (props, ref) => {
    const {
      isForCanvas = false,
      asset,
      projectName,
      appSettings,
      childAssets,
      onLoaded,
      onBeforeAssetChanged,
      onTrack,
      onChildAssetSelected,
      onActivated,
      onDeactivated,
    } = props;

    const videoPath = encodeFileURI(
      path.join(appSettings.rootDirectory, projectName, asset.name)
    );

    const [loaded, setLoaded] = useState(false);
    const [videoState, setVideoState] = useState<VideoState>({
      readyState: 0,
      paused: true,
      seeking: false,
      currentTime: 0,
      duration: 0,
      currentSrc: videoPath,
    });
    const prevVideoStateRef = useRef<VideoState>(videoState);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [visibleStates, setVisibleStates] = useState<AssetState[]>([]);
    const [visibleStatePolyInput, setvisibleStatePolyInput] = useState(false);

    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const updateReadyState = () => {
        setVideoState((prevState) => ({
          ...prevState,
          readyState: videoElement.readyState,
        }));
      };
      // イベントリスナーの設定
      const handlePlay = () => {
        setVideoState((prevState) => ({ ...prevState, paused: false }));
        updateReadyState();
      };
      const handlePause = () => {
        setVideoState((prevState) => ({
          ...prevState,
          paused: true,
          currentTime: videoElement.currentTime,
        }));
        updateReadyState();
      };
      const handleSeeking = () => {
        setVideoState((prevState) => ({
          ...prevState,
          seeking: true,
        }));
      };
      const handleSeeked = () => {
        if (videoElement.paused) {
          setVideoState((prevState) => ({
            ...prevState,
            seeking: false,
            currentTime: videoElement.currentTime,
          }));
        } else {
          videoElement.pause();
          setVideoState((prevState) => ({
            ...prevState,
            seeking: false,
          }));
        }
      };
      const handleLoadedMetadata = () => {
        videoElement.pause();
        setVideoState((prevState) => ({
          ...prevState,
          duration: videoElement.duration,
        }));
        updateReadyState();
      };

      const handleWaiting = () => {
        // バッファリングなどで一時停止したとき
        updateReadyState();
      };
      const handleCanPlay = () => {
        // 再生可能になったとき (readyState: 3)
        updateReadyState();
      };
      const handleCanPlayThrough = () => {
        // 最後まで一時停止なしで再生できると判断されたとき (readyState: 4)
        updateReadyState();
      };
      const handleStalled = () => {
        // データ取得に失敗したとき
        updateReadyState();
      };
      const handleError = (e: any) => {
        updateReadyState();
        throw new AppError(
          ErrorCode.VideoLoadError,
          strings.errors.videoLoadError.message,
          strings.errors.videoLoadError.title
        );
      };

      videoElement.addEventListener("play", handlePlay);
      videoElement.addEventListener("pause", handlePause);
      videoElement.addEventListener("seeking", handleSeeking); // 追加
      videoElement.addEventListener("seeked", handleSeeked); // 追加
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("waiting", handleWaiting);
      videoElement.addEventListener("canplay", handleCanPlay);
      videoElement.addEventListener("canplaythrough", handleCanPlayThrough); // 追加
      videoElement.addEventListener("stalled", handleStalled); // 追加
      videoElement.addEventListener("error", handleError);

      // ----- クリーンアップ関数 -----
      return () => {
        videoElement.removeEventListener("play", handlePlay);
        videoElement.removeEventListener("pause", handlePause);
        videoElement.removeEventListener("seeking", handleSeeking);
        videoElement.removeEventListener("seeked", handleSeeked);
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoElement.removeEventListener("waiting", handleWaiting);
        videoElement.removeEventListener("canplay", handleCanPlay);
        videoElement.removeEventListener(
          "canplaythrough",
          handleCanPlayThrough
        ); // 解除
        videoElement.removeEventListener("stalled", handleStalled); // 解除
        videoElement.removeEventListener("error", handleError);
      };
    }, [asset.name]); // srcが変わったらイベントリスナーを再設定

    useEffect(() => {
      const state = videoState;
      const prev = prevVideoStateRef.current;

      if (
        !loaded &&
        state.readyState === 4 &&
        state.readyState !== prev.readyState
      ) {
        setLoaded(true);
        if (onLoaded && videoRef.current) onLoaded(videoRef.current);
        if (onActivated && videoRef.current) onActivated();
        if (isForCanvas) {
          const seekTime = asset.lastVisitedTimestamp || 10.0;
          seekToTime(seekTime);
        }
      } else if (
        state.paused &&
        (state.currentTime !== prev.currentTime ||
          (!state.seeking && prev.seeking))
      ) {
        if (isValidKeyFrame()) {
          if (onChildAssetSelected) {
            const childAsset = childAssets.find(
              (a) => Math.abs(a.timestamp - state.currentTime) < 1e-4
            );
            if (childAsset) {
              onChildAssetSelected(childAsset);
            } else {
              const timestamp = getValidTimestamp(state.currentTime);
              const rootAsset = asset.parent || asset;
              const childName = `${rootAsset.name}#t=${timestamp}`;
              const newChildAsset: IAssetWithTimestamp = {
                ...AssetService.createAssetFromFileName(childName),
                timestamp,
                state: AssetState.NotVisited,
                type: AssetType.VideoFrame,
                parent: rootAsset,
                size: asset.size,
              };
              onChildAssetSelected(newChildAsset);
            }
          }
          if (onDeactivated && videoRef.current) {
            if (onLoaded && videoRef.current) onLoaded(videoRef.current);
            onDeactivated(videoRef.current);
          }
        }
      } else if (!state.paused && state.paused !== prev.paused) {
        if (onLoaded && videoRef.current && isForCanvas)
          onLoaded(videoRef.current);
        if (onActivated && videoRef.current) onActivated();
      }
      prevVideoStateRef.current = state;
    }, [asset.name, videoState]);

    // タイムスタンプの正規化
    const getValidTimestamp = useCallback(
      (timestamp: number) => {
        const frameSkipTime = 1 / appSettings.frameExtractionRate;
        const numberKeyFrames = Math.round(timestamp / frameSkipTime);
        return +(numberKeyFrames * frameSkipTime).toFixed(6);
      },
      [appSettings.frameExtractionRate]
    );

    // タグ判定
    const checkTagged = useCallback(
      (visibleState: AssetState[], asset: IAsset) => {
        const hasStep =
          asset.step &&
          !(
            asset.state === AssetState.Tracked ||
            asset.state === AssetState.Interpolated
          );
        const hasComment = !!asset.comment;
        const hasPolygon = asset.polygonNumber
          ? asset.polygonNumber > 0
          : false;
        const hasPolyline = asset.polylineNumber
          ? asset.polylineNumber > 0
          : false;
        const hasPoly = visibleStatePolyInput && (hasPolygon || hasPolyline);
        return (
          visibleState.indexOf(asset.state) >= 0 ||
          hasComment ||
          hasStep ||
          hasPoly
        );
      },
      [visibleStatePolyInput]
    );

    // 隣接タグフレーム探索
    const findAdjacentTaggedTimestamp = useCallback(
      (
        visibleState: AssetState[] | undefined,
        direction: "next" | "previous"
      ) => {
        if (!videoRef.current) return null;
        if (!visibleState || visibleState.length === 0) return null;
        const sign = direction === "next" ? 1 : -1;
        const currentTime = videoRef.current.currentTime;
        const frameSkipTime = 1 / appSettings.frameExtractionRate;
        const eps = frameSkipTime / 10;
        let adjacentTaggedTimestamp = null;
        let minDiff = Infinity;
        for (const asset of childAssets || []) {
          if (asset.timestamp === undefined) continue;
          if (!checkTagged(visibleState, asset)) continue;
          const diff = sign * (asset.timestamp - currentTime);
          if (diff < eps) continue;
          if (diff < minDiff) {
            minDiff = diff;
            adjacentTaggedTimestamp = asset.timestamp;
          }
        }
        return adjacentTaggedTimestamp;
      },
      [appSettings.frameExtractionRate, childAssets, checkTagged]
    );

    // 各種移動関数
    const seekToTime = useCallback(
      (time: number, beTracked: boolean = false) => {
        if (!videoRef.current) return;
        const seekTime = getValidTimestamp(time);
        if (seekTime >= 0) {
          if (onBeforeAssetChanged && !onBeforeAssetChanged()) return;

          if (onTrack) onTrack(beTracked);

          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = seekTime;
          }
        }
      },
      [getValidTimestamp, onBeforeAssetChanged, onTrack]
    );

    const movePreviousTaggedFrame = useCallback(() => {
      const previousTimestamp = findAdjacentTaggedTimestamp(
        visibleStates,
        "previous"
      );
      if (previousTimestamp) seekToTime(previousTimestamp);
    }, [findAdjacentTaggedTimestamp, seekToTime, visibleStates]);

    const moveNextTaggedFrame = useCallback(() => {
      const nextTimeStamp = findAdjacentTaggedTimestamp(visibleStates, "next");
      if (nextTimeStamp) seekToTime(nextTimeStamp);
    }, [findAdjacentTaggedTimestamp, seekToTime, visibleStates]);

    const moveNextExpectedFrame = useCallback(() => {
      if (!videoRef.current) return;
      const currentTime = videoRef.current.currentTime;
      const frameSkipTime = 1 / appSettings.frameExtractionRate;
      seekToTime(currentTime + frameSkipTime);
    }, [appSettings.frameExtractionRate, seekToTime]);

    const movePreviousExpectedFrame = useCallback(() => {
      if (!videoRef.current) return;
      const currentTime = videoRef.current.currentTime;
      const frameSkipTime = 1 / appSettings.frameExtractionRate;
      seekToTime(currentTime - frameSkipTime);
    }, [appSettings.frameExtractionRate, seekToTime]);

    const moveFrame = useCallback(
      (numFrames: number) => {
        if (!videoRef.current) return;
        const currentTime = videoRef.current.currentTime;
        const frameSkipTime = 1 / appSettings.frameExtractionRate;
        let seekTimestamp: number = currentTime + frameSkipTime;
        const visibleStateWithTracked = [
          ...(visibleStates || []),
          AssetState.Tracked,
        ];
        if (numFrames > 0) {
          const nextTimestamp = findAdjacentTaggedTimestamp(
            visibleStateWithTracked,
            "next"
          );
          if (nextTimestamp !== null && seekTimestamp > nextTimestamp) {
            seekTimestamp = nextTimestamp;
          }
        } else {
          const previousTimestamp = findAdjacentTaggedTimestamp(
            visibleStateWithTracked,
            "previous"
          );
          if (previousTimestamp !== null && seekTimestamp < previousTimestamp) {
            seekTimestamp = previousTimestamp;
          }
        }
        const beTracked = Math.abs(numFrames) === 5;
        seekToTime(seekTimestamp, beTracked);
      },
      [
        appSettings.frameExtractionRate,
        visibleStates,
        findAdjacentTaggedTimestamp,
        seekToTime,
      ]
    );

    // キーフレーム判定
    const isValidKeyFrame = useCallback((): boolean => {
      if (!videoRef.current) return false;
      const timestamp = videoRef.current.currentTime;
      const seekTime = getValidTimestamp(timestamp);
      const isSameTime = Math.abs(seekTime - timestamp) < 1e-4;
      if (!isSameTime) {
        seekToTime(seekTime);
      }
      return isSameTime;
    }, [getValidTimestamp, seekToTime]);

    // タイムライン描画
    // const renderChildAssetMarker = useCallback(
    //   (childAsset: IAssetWithTimestamp, videoDuration: number) => {
    //     let className = "";
    //     switch (childAsset.state) {
    //       case AssetState.Sample:
    //         className = "video-timeline-sample";
    //         break;
    //       case AssetState.Store:
    //         className = "video-timeline-store";
    //         break;
    //       case AssetState.Freeze:
    //         className = "video-timeline-freeze";
    //         break;
    //       case AssetState.FreezeStore:
    //         className = "video-timeline-freeze_store";
    //         break;
    //     }
    //     if (
    //       visibleStates.includes(childAsset.state) &&
    //       !childAsset.comment &&
    //       !childAsset.step &&
    //       childAsset.polylineNumber === 0 &&
    //       childAsset.polygonNumber === 0
    //     ) {
    //       return;
    //     }
    //     const childPosition = childAsset.timestamp / videoDuration;
    //     const style = {
    //       left: `calc( ${childPosition * 100}% - ${childPosition - 0.5}em)`,
    //     };
    //     return (
    //       <div key={childAsset.timestamp}>
    //         {childAsset.comment && (
    //           <div className="comment-flag" style={style} />
    //         )}
    //         {childAsset.step &&
    //           !(
    //             childAsset.state === AssetState.Tracked ||
    //             childAsset.state === AssetState.Interpolated
    //           ) && <div className="step-flag" style={style} />}
    //         {visibleStatePolyInput &&
    //           (childAsset.polygonNumber || childAsset.polylineNumber) && (
    //             <div className="poly-input-flag" style={style} />
    //           )}
    //         {visibleStates.indexOf(childAsset.state) >= 0 && (
    //           <div
    //             onClick={() => seekToTime(childAsset.timestamp)}
    //             className={className}
    //             style={style}
    //           />
    //         )}
    //       </div>
    //     );
    //   },
    //   [seekToTime, visibleStates, visibleStatePolyInput]
    // );

    // const renderTimeline = useCallback(
    //   (childAssets: IAssetWithTimestamp[], videoDuration: number) => (
    //     <div className={"video-timeline-container"}>
    //       {childAssets.map((childAsset) =>
    //         renderChildAssetMarker(childAsset, videoDuration)
    //       )}
    //     </div>
    //   ),
    //   [renderChildAssetMarker]
    // );

    // タイムラインタグ追加
    // const addAssetTimelineTags = useCallback(
    //   (childAssets: IAssetWithTimestamp[], videoDuration: number) => {
    //     if (!isForCanvas) return;
    //     const assetTimelineTagLines = renderTimeline(
    //       childAssets,
    //       videoDuration
    //     );
    //     const timelineSelector =
    //       ".editor-page-content-main-body .video-react-progress-control .video-timeline-root";
    //     timelineElement.current = document.querySelector(timelineSelector);
    //     if (!timelineElement.current) {
    //       const progressControlSelector =
    //         ".editor-page-content-main-body .video-react-progress-control";
    //       const progressHolderElement = document.querySelector(
    //         progressControlSelector
    //       );
    //       if (progressHolderElement) {
    //         timelineElement.current = document.createElement("div");
    //         timelineElement.current.className = "video-timeline-root";
    //         progressHolderElement.appendChild(timelineElement.current);
    //       }
    //     }
    //     if (timelineElement.current) {
    //       const root = ReactDOMClient.createRoot(timelineElement.current);
    //       root.render(assetTimelineTagLines);
    //     }
    //   },
    //   [isForCanvas, renderTimeline]
    // );

    // asset.name変更時
    useEffect(() => {
      setLoaded(false);
    }, [asset.name]);

    // childAssets, visibleState, visibleStatePolyInput変更時
    useEffect(() => {
      // if (!videoRef.current) return;
      // addAssetTimelineTags(childAssets, videoState.duration);
      console.log("videoAsset updated", childAssets);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childAssets, visibleStates, visibleStatePolyInput]);

    // 現在時刻表示

    useImperativeHandle(ref, () => ({
      moveNextTaggedFrame,
      movePreviousTaggedFrame,
      moveNextExpectedFrame,
      movePreviousExpectedFrame,
      seekToTime,
    }));

    return (
      <>
        <video
          ref={videoRef}
          autoPlay={isForCanvas}
          src={videoPath}
          crossOrigin="anonymous"
        />
        {isForCanvas && loaded && (
          <ControlBar
            video={videoRef.current || undefined}
            videoState={videoState}
            visibleStates={visibleStates}
            visibleStaetPolyInput={visibleStatePolyInput}
            frameExtractionRate={props.appSettings.frameExtractionRate}
            appMode={props.appSettings.appMode}
            moveFrame={moveFrame}
            movePreviousExpectedFrame={movePreviousExpectedFrame}
            moveNextExpectedFrame={moveNextExpectedFrame}
            movePreviousTaggedFrame={movePreviousTaggedFrame}
            moveNextTaggedFrame={moveNextTaggedFrame}
            onTimeInputClicked={props.onSeekTimeClick}
            seekToTime={seekToTime}
            childAssets={childAssets}
          />
        )}
        <AssetStateSelector
          show={!!props.showAssetStateSelector}
          selectedStates={visibleStates}
          onChange={setVisibleStates}
          showPolyInput={
            !!props.showAssetStateSelector &&
            props.appSettings.appMode === AppMode.Internal
          }
          isPolyInputEnabled={visibleStatePolyInput}
          onPolyInputChange={setvisibleStatePolyInput}
        />
      </>
    );
  }
);

VideoAsset.displayName = "VideoAsset";
