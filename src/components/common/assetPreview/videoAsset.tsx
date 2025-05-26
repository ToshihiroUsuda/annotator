import path from "path-browserify";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import ReactDOMClient from "react-dom/client";
import {
  BigPlayButton,
  ControlBar,
  CurrentTimeDisplay,
  DurationDisplay,
  PlaybackRateMenuButton,
  Player,
  PlayerReference,
} from "video-react";
import { strings } from "../../../common/strings";
import { encodeFileURI, formatTime } from "../../../common/utils";
import {
  AppMode,
  AssetState,
  AssetType,
  IAppSettings,
  IAsset,
} from "../../../models/applicationState";
import { AssetService } from "../../../services/assetService";
import { CustomVideoPlayerButton } from "../videoPlayer/customVideoPlayerButton";
import { IAssetProps } from ".";

export type IAssetWithTimestamp = Omit<IAsset, "timestamp"> & {
  timestamp: number;
};

export interface IVideoAssetProps extends IAssetProps {
  appSettings: IAppSettings;
  autoPlay?: boolean;
  onSeekTimeClick: () => void;
  childAssets: IAssetWithTimestamp[];
  visibleState: AssetState[];
  visibleStatePolyInput: boolean;
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
      autoPlay = true,
      controlsEnabled = true,
      asset,
      projectName,
      appSettings,
      onSeekTimeClick,
      childAssets,
      visibleState,
      visibleStatePolyInput,
      onLoaded,
      onBeforeAssetChanged,
      onTrack,
      onChildAssetSelected,
      onActivated,
      onDeactivated,
    } = props;

    const [loaded, setLoaded] = useState(false);
    const videoPlayer = useRef<PlayerReference | null>(null);
    const timelineElement = useRef<Element | null>(null);

    // プレイヤーの状態取得
    const getVideoPlayerState = useCallback(() => {
      if (!videoPlayer.current)
        throw new Error("videoPlayer have'nt been loaded yet.");
      return videoPlayer.current.getState().player;
    }, []);

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
        if (!visibleState || visibleState.length === 0) return null;
        const sign = direction === "next" ? 1 : -1;
        const currentTime = getVideoPlayerState().currentTime;
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
      [
        appSettings.frameExtractionRate,
        childAssets,
        checkTagged,
        getVideoPlayerState,
      ]
    );

    // 各種移動関数
    const seekToTime = useCallback(
      (time: number, beTracked: boolean = false) => {
        const playerState = getVideoPlayerState();
        const seekTime = getValidTimestamp(time);
        if (seekTime >= 0) {
          if (onBeforeAssetChanged && !onBeforeAssetChanged()) return;
          if (!playerState.paused) {
            videoPlayer.current?.pause();
          }
          if (onTrack) onTrack(beTracked);
          videoPlayer.current?.seek(seekTime);
        }
      },
      [getVideoPlayerState, getValidTimestamp, onBeforeAssetChanged, onTrack]
    );

    const movePreviousTaggedFrame = useCallback(() => {
      const previousTimestamp = findAdjacentTaggedTimestamp(
        visibleState,
        "previous"
      );
      if (previousTimestamp) seekToTime(previousTimestamp);
    }, [findAdjacentTaggedTimestamp, seekToTime, visibleState]);

    const moveNextTaggedFrame = useCallback(() => {
      const nextTimeStamp = findAdjacentTaggedTimestamp(visibleState, "next");
      if (nextTimeStamp) seekToTime(nextTimeStamp);
    }, [findAdjacentTaggedTimestamp, seekToTime, visibleState]);

    const moveNextExpectedFrame = useCallback(() => {
      const currentTime = getVideoPlayerState().currentTime;
      const frameSkipTime = 1 / appSettings.frameExtractionRate;
      seekToTime(currentTime + frameSkipTime);
    }, [getVideoPlayerState, appSettings.frameExtractionRate, seekToTime]);

    const movePreviousExpectedFrame = useCallback(() => {
      const currentTime = getVideoPlayerState().currentTime;
      const frameSkipTime = 1 / appSettings.frameExtractionRate;
      seekToTime(currentTime - frameSkipTime);
    }, [getVideoPlayerState, appSettings.frameExtractionRate, seekToTime]);

    const moveFrame = useCallback(
      (numFrames: number) => {
        const currentTime = getVideoPlayerState().currentTime;
        const frameSkipTime = 1 / appSettings.frameExtractionRate;
        let seekTimestamp: number = currentTime + frameSkipTime;
        const visibleStateWithTracked = [
          ...(visibleState || []),
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
        getVideoPlayerState,
        appSettings.frameExtractionRate,
        visibleState,
        findAdjacentTaggedTimestamp,
        seekToTime,
      ]
    );

    // キーフレーム判定
    const isValidKeyFrame = useCallback((): boolean => {
      const timestamp = getVideoPlayerState().currentTime;
      const seekTime = getValidTimestamp(timestamp);
      const isSameTime = Math.abs(seekTime - timestamp) < 1e-4;
      if (!isSameTime) {
        seekToTime(seekTime);
      }
      return isSameTime;
    }, [getVideoPlayerState, getValidTimestamp, seekToTime]);

    // タイムライン描画
    const renderChildAssetMarker = useCallback(
      (childAsset: IAssetWithTimestamp, videoDuration: number) => {
        let className = "";
        switch (childAsset.state) {
          case AssetState.Sample:
            className = "video-timeline-sample";
            break;
          case AssetState.Store:
            className = "video-timeline-store";
            break;
          case AssetState.Freeze:
            className = "video-timeline-freeze";
            break;
          case AssetState.FreezeStore:
            className = "video-timeline-freeze_store";
            break;
        }
        if (
          visibleState.includes(childAsset.state) &&
          !childAsset.comment &&
          !childAsset.step &&
          childAsset.polylineNumber === 0 &&
          childAsset.polygonNumber === 0
        ) {
          return;
        }
        const childPosition = childAsset.timestamp / videoDuration;
        const style = {
          left: `calc( ${childPosition * 100}% - ${childPosition - 0.5}em)`,
        };
        return (
          <div key={childAsset.timestamp}>
            {childAsset.comment && (
              <div className="comment-flag" style={style} />
            )}
            {childAsset.step &&
              !(
                childAsset.state === AssetState.Tracked ||
                childAsset.state === AssetState.Interpolated
              ) && <div className="step-flag" style={style} />}
            {visibleStatePolyInput &&
              (childAsset.polygonNumber || childAsset.polylineNumber) && (
                <div className="poly-input-flag" style={style} />
              )}
            {visibleState.indexOf(childAsset.state) >= 0 && (
              <div
                onClick={() => seekToTime(childAsset.timestamp)}
                className={className}
                style={style}
              />
            )}
          </div>
        );
      },
      [seekToTime, visibleState, visibleStatePolyInput]
    );

    const renderTimeline = useCallback(
      (childAssets: IAssetWithTimestamp[], videoDuration: number) => (
        <div className={"video-timeline-container"}>
          {childAssets.map((childAsset) =>
            renderChildAssetMarker(childAsset, videoDuration)
          )}
        </div>
      ),
      [renderChildAssetMarker]
    );

    // タイムラインタグ追加
    const addAssetTimelineTags = useCallback(
      (childAssets: IAssetWithTimestamp[], videoDuration: number) => {
        if (!autoPlay) return;
        const assetTimelineTagLines = renderTimeline(
          childAssets,
          videoDuration
        );
        const timelineSelector =
          ".editor-page-content-main-body .video-react-progress-control .video-timeline-root";
        timelineElement.current = document.querySelector(timelineSelector);
        if (!timelineElement.current) {
          const progressControlSelector =
            ".editor-page-content-main-body .video-react-progress-control";
          const progressHolderElement = document.querySelector(
            progressControlSelector
          );
          if (progressHolderElement) {
            timelineElement.current = document.createElement("div");
            timelineElement.current.className = "video-timeline-root";
            progressHolderElement.appendChild(timelineElement.current);
          }
        }
        if (timelineElement.current) {
          const root = ReactDOMClient.createRoot(timelineElement.current);
          root.render(assetTimelineTagLines);
        }
      },
      [autoPlay, renderTimeline]
    );

    // プレイヤー状態変化
    const onVideoStateChange = useCallback(
      (
        state: Readonly<{
          readyState: number;
          paused: boolean;
          seeking: boolean;
          currentTime: number;
          duration: number;
          playbackRate: number;
          currentSrc: string;
        }>,
        prev: Readonly<{
          readyState: number;
          paused: boolean;
          seeking: boolean;
          currentTime: number;
          duration: number;
          playbackRate: number;
          currentSrc: string;
        }>
      ) => {
        const assetObj = asset.parent || asset;
        const assetName = assetObj.name;
        const videoName = path.basename(state.currentSrc);
        if (
          !loaded &&
          state.readyState === 4 &&
          state.readyState !== prev.readyState
        ) {
          setLoaded(true);
          if (onLoaded && videoPlayer.current) onLoaded(videoPlayer.current);
          if (childAssets) addAssetTimelineTags(childAssets, state.duration);
          if (onActivated && videoPlayer.current)
            onActivated(videoPlayer.current);
          const seekTime = asset.lastVisitedTimestamp || 0.0;
          seekToTime(seekTime);
        } else if (
          state.paused &&
          assetName === videoName &&
          (state.currentTime !== prev.currentTime ||
            state.seeking !== prev.seeking)
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
            if (onDeactivated && videoPlayer.current)
              onDeactivated(videoPlayer.current);
          }
        } else if (!state.paused && state.paused !== prev.paused) {
          if (onActivated && videoPlayer.current)
            onActivated(videoPlayer.current);
        }
      },
      [
        asset,
        childAssets,
        loaded,
        onLoaded,
        onChildAssetSelected,
        onActivated,
        onDeactivated,
        addAssetTimelineTags,
        seekToTime,
        isValidKeyFrame,
        getValidTimestamp,
      ]
    );

    // 初回マウント時
    useEffect(() => {
      if (autoPlay && videoPlayer.current) {
        videoPlayer.current.subscribeToStateChange(onVideoStateChange);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, onVideoStateChange]);

    // asset.name変更時
    useEffect(() => {
      setLoaded(false);
    }, [asset.name]);

    // childAssets, visibleState, visibleStatePolyInput変更時
    useEffect(() => {
      addAssetTimelineTags(childAssets, getVideoPlayerState().duration);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childAssets, visibleState.length, visibleStatePolyInput]);

    // プレイヤー状態
    const playerState = videoPlayer.current
      ? getVideoPlayerState()
      : {
          paused: true,
          playbackRate: 1.0,
          seeking: true,
        };

    const paused = playerState.paused;
    const playbackRate = playerState.playbackRate;
    const seeking = playerState.seeking;

    const videoPath = encodeFileURI(
      path.join(appSettings.rootDirectory, projectName, asset.name)
    );
    const frameExtractionRate = appSettings.frameExtractionRate;
    const showDetailTime = paused && appSettings.appMode === AppMode.Internal;

    // 現在時刻表示
    const renderCurrentTimeDisplay = () => {
      const formattedTime = videoPlayer.current
        ? formatTime(getVideoPlayerState().currentTime)
        : null;
      return (
        <div className="video-react-current-time video-react-time-control video-react-control">
          <div className="video-react-current-time-display" aria-live="off">
            <span className="video-react-control-text">Current Time </span>
            {formattedTime}
          </div>
        </div>
      );
    };

    useImperativeHandle(ref, () => ({
      moveNextTaggedFrame,
      movePreviousTaggedFrame,
      moveNextExpectedFrame,
      movePreviousExpectedFrame,
      seekToTime,
    }));

    return (
      <Player
        ref={videoPlayer}
        autoPlay={autoPlay}
        src={videoPath}
        crossOrigin="anonymous"
      >
        <BigPlayButton position="center" />
        {autoPlay && (
          <ControlBar autoHide={false}>
            {!controlsEnabled && seeking && (
              <div className="video-react-control-bar-disabled"></div>
            )}
            <CustomVideoPlayerButton
              accelerators={["ArrowLeft", "B", "b"]}
              tooltip={
                strings.editorPage.videoPlayer.previousExpectedFrame.tooltip
              }
              onClick={movePreviousExpectedFrame}
              icon={"fa-caret-left fa-lg"}
            >
              <i className="fas fa-caret-left fa-lg" />
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["ArrowRight", "M", "m"]}
              tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
              onClick={moveNextExpectedFrame}
              icon={"fa-caret-right fa-lg"}
            >
              <i className="fas fa-caret-right fa-lg" />
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["Shift+ArrowLeft", "Z", "z"]}
              tooltip={
                strings.editorPage.videoPlayer.previous5ExpectedFrame.tooltip
              }
              onClick={() => moveFrame(-5)}
              icon={"fa-backward"}
            >
              5<i className="fas fa-backward" />
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["Shift+ArrowRight", "C", "c"]}
              tooltip={
                strings.editorPage.videoPlayer.next5ExpectedFrame.tooltip
              }
              onClick={() => moveFrame(5)}
              icon={"fa-forward"}
            >
              <i className="fas fa-forward" />5
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["CmdOrCtrl+ArrowLeft", "A", "a"]}
              tooltip={
                strings.editorPage.videoPlayer.previous30ExpectedFrame.tooltip
              }
              onClick={() => moveFrame(-frameExtractionRate)}
              icon={"fa-backward"}
            >
              {frameExtractionRate.toString()}
              <i className="fas fa-backward" />
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["CmdOrCtrl+ArrowRight", "D", "d"]}
              tooltip={
                strings.editorPage.videoPlayer.next30ExpectedFrame.tooltip
              }
              onClick={() => moveFrame(frameExtractionRate)}
              icon={"fa-forward"}
            >
              <i className="fas fa-forward" />
              {frameExtractionRate.toString()}
            </CustomVideoPlayerButton>
            {showDetailTime && <CurrentTimeDisplay order={2.1} />}
            {showDetailTime && (
              <CustomVideoPlayerButton>
                {renderCurrentTimeDisplay()}
              </CustomVideoPlayerButton>
            )}
            <DurationDisplay order={6.1} />
            {!paused && <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} />}
            {paused && (
              <CustomVideoPlayerButton onClick={() => {}}>
                {`${playbackRate.toFixed(2)}x`}
              </CustomVideoPlayerButton>
            )}
            <CustomVideoPlayerButton
              accelerators={["Q", "q"]}
              tooltip={
                strings.editorPage.videoPlayer.previousTaggedFrame.tooltip
              }
              onClick={movePreviousTaggedFrame}
              icon={"fas fa-step-backward"}
            >
              <i className="fas fa-step-backward"></i>
            </CustomVideoPlayerButton>
            <CustomVideoPlayerButton
              accelerators={["E", "e"]}
              tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
              onClick={moveNextTaggedFrame}
              icon={"fa-step-forward"}
            >
              <i className="fas fa-step-forward"></i>
            </CustomVideoPlayerButton>
            {appSettings.appMode === AppMode.Internal && (
              <CustomVideoPlayerButton
                accelerators={["CmdOrCtrl+t"]}
                tooltip={"Seek to Time"}
                onClick={onSeekTimeClick}
                icon={"fa-clock"}
              >
                <i className="fas fa-clock"></i>
              </CustomVideoPlayerButton>
            )}
          </ControlBar>
        )}
      </Player>
    );
  }
);

VideoAsset.displayName = "VideoAsset";
