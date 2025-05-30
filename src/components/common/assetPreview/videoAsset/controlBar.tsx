import React, { useState, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaCaretLeft,
  FaCaretRight,
  FaBackward,
  FaForward,
  FaBackwardStep,
  FaForwardStep,
  FaClock,
} from "react-icons/fa6";
import Slider from "rc-slider";
import { strings } from "../../../../common/strings";
import { AppMode, AssetState } from "../../../../models/applicationState";
import { formatTime } from "../../../../common/utils";
import { VideoState } from "./videoAsset";
import { IAssetWithTimestamp } from "./videoAsset";
import "./controlBar.scss";

type TControlBarProps = {
  video?: HTMLVideoElement;
  videoState: VideoState;
  appMode: AppMode;
  visibleStates: AssetState[];
  visibleStaetPolyInput: boolean;
  frameExtractionRate: number;
  moveFrame: (numFrames: number) => void;
  movePreviousExpectedFrame: () => void;
  moveNextExpectedFrame: () => void;
  movePreviousTaggedFrame: () => void;
  moveNextTaggedFrame: () => void;
  onTimeInputClicked: () => void;
  seekToTime: (timestamp: number) => void;
  childAssets: IAssetWithTimestamp[];
};

const ControlBar: React.FC<TControlBarProps> = (props) => {
  if (!props.video) return null;

  return (
    <div className="video-control-bar">
      {props.video.seeking && (
        <div className="video-control-bar-disabled"></div>
      )}
      <CustomVideoPlayerButton
        // accelerators={[]}
        onClick={() => {
          if (props.videoState.paused) {
            props.video?.play();
          } else {
            props.video?.pause();
          }
        }}
      >
        {props.videoState.paused ? <FaPlay size={12} /> : <FaPause size={12} />}
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["ArrowLeft", "B", "b"]}
        tooltip={strings.editorPage.videoPlayer.previousExpectedFrame.tooltip}
        onClick={props.movePreviousExpectedFrame}
        // icon={"fa-caret-left fa-lg"}
      >
        <FaCaretLeft size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["ArrowRight", "M", "m"]}
        tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
        onClick={props.moveNextExpectedFrame}
        // icon={"fa-caret-right fa-lg"}
      >
        <FaCaretRight size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["Shift+ArrowLeft", "Z", "z"]}
        tooltip={strings.editorPage.videoPlayer.previous5ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(-5)}
        // icon={"fa-backward"}
      >
        <IconWithLabel
          icon={<FaBackward size={12} />}
          label="5"
          iconPosition="after"
        />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["Shift+ArrowRight", "C", "c"]}
        tooltip={strings.editorPage.videoPlayer.next5ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(5)}
        icon={"fa-forward"}
      >
        <IconWithLabel
          icon={<FaForward size={12} />}
          label="5"
          iconPosition="before"
        />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["CmdOrCtrl+ArrowLeft", "A", "a"]}
        tooltip={strings.editorPage.videoPlayer.previous30ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(-props.frameExtractionRate)}
        icon={"fa-backward"}
      >
        <IconWithLabel
          icon={<FaBackward size={12} />}
          label={props.frameExtractionRate.toString()}
          iconPosition="after"
        />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["CmdOrCtrl+ArrowRight", "D", "d"]}
        tooltip={strings.editorPage.videoPlayer.next30ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(props.frameExtractionRate)}
        icon={"fa-forward"}
      >
        <IconWithLabel
          icon={<FaForward size={12} />}
          label={props.frameExtractionRate.toString()}
          iconPosition="before"
        />
      </CustomVideoPlayerButton>
      <Seekbar
        video={props.video}
        videoState={props.videoState}
        visibleStates={props.visibleStates}
        visibleStatePolyInput={props.visibleStaetPolyInput}
        seekToTime={props.seekToTime}
        childAssets={props.childAssets}
      />
      <PlaybackRateSelector video={props.video} />
      <CustomVideoPlayerButton
        accelerators={["Q", "q"]}
        tooltip={strings.editorPage.videoPlayer.previousTaggedFrame.tooltip}
        onClick={props.movePreviousTaggedFrame}
        icon={"fas fa-step-backward"}
      >
        <FaBackwardStep size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["E", "e"]}
        tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
        onClick={props.moveNextTaggedFrame}
        icon={"fa-step-forward"}
      >
        <FaForwardStep size={12} />
      </CustomVideoPlayerButton>
      {props.appMode === AppMode.Internal && (
        <CustomVideoPlayerButton
          accelerators={["CmdOrCtrl+t"]}
          tooltip={"Seek to Time"}
          onClick={props.onTimeInputClicked}
          icon={"fa-clock"}
        >
          <FaClock size={12} />
        </CustomVideoPlayerButton>
      )}
    </div>
  );
};

export default ControlBar;

import { KeyboardBinding } from "../../keyboardBinding";
import { KeyEventType } from "../../keyboardManager";

export interface ICustomVideoPlayerButtonProps extends React.PropsWithChildren {
  onClick?: () => void;
  icon?: string;
  accelerators?: string[];
  tooltip?: string;
}

export const CustomVideoPlayerButton: React.FC<
  ICustomVideoPlayerButtonProps
> = (props) => {
  return (
    <>
      {props.accelerators && (
        <KeyboardBinding
          keyEventType={KeyEventType.KeyDown}
          displayName={props.tooltip || ""}
          accelerators={props.accelerators}
          handler={() => {
            props.onClick?.();
          }}
          icon={props.icon}
        />
      )}
      <div
        className="custom-video-player-button"
        title={props.tooltip}
        onClick={props.onClick}
      >
        {props.children}
      </div>
    </>
  );
};

type IconWithLabelProps = {
  icon: React.ReactNode;
  label: string;
  iconPosition?: "before" | "after";
};

const IconWithLabel: React.FC<IconWithLabelProps> = ({
  icon,
  label,
  iconPosition = "before",
}) => {
  return (
    <div className="icon-with-label">
      {iconPosition === "before" && (
        <>
          <div className="icon">{icon}</div>
          <div className="label">{label}</div>
        </>
      )}
      {iconPosition === "after" && (
        <>
          <div className="label">{label}</div>
          <div className="icon">{icon}</div>
        </>
      )}
    </div>
  );
};

type TSeekbarProps = {
  video?: HTMLVideoElement;
  videoState: VideoState;
  visibleStates: AssetState[];
  visibleStatePolyInput: boolean;
  seekToTime: (timestamp: number) => void;
  childAssets: IAssetWithTimestamp[];
};

const Seekbar: React.FC<TSeekbarProps> = (props) => {
  const [currentTime, setCurrentTime] = useState(props.videoState.currentTime);
  useEffect(() => {
    let animationFrameId: number;

    const updateCurrentTime = () => {
      const video = props.video;
      if (video) {
        setCurrentTime(video.currentTime);
      }
      animationFrameId = requestAnimationFrame(updateCurrentTime);
    };

    updateCurrentTime();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const renderChildAssetMarker = (childAsset: IAssetWithTimestamp) => {
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
      props.visibleStates.includes(childAsset.state) &&
      !childAsset.comment &&
      !childAsset.step &&
      childAsset.polylineNumber === 0 &&
      childAsset.polygonNumber === 0
    ) {
      return;
    }
    const childPosition = childAsset.timestamp / props.videoState.duration;
    const style = {
      left: `calc( ${childPosition * 100}% - ${childPosition - 0.5}em)`,
    };
    return (
      <div key={childAsset.timestamp}>
        {childAsset.comment && <div className="comment-flag" style={style} />}
        {childAsset.step &&
          !(
            childAsset.state === AssetState.Tracked ||
            childAsset.state === AssetState.Interpolated
          ) && <div className="step-flag" style={style} />}
        {props.visibleStatePolyInput &&
          (childAsset.polygonNumber || childAsset.polylineNumber) && (
            <div className="poly-input-flag" style={style} />
          )}
        {props.visibleStates.indexOf(childAsset.state) >= 0 && (
          <div
            onClick={() => props.seekToTime(childAsset.timestamp)}
            className={className}
            style={style}
          />
        )}
      </div>
    );
  };
  return (
    <div className="seekbar">
      <div className="time-display">
        <div className="time">{`${formatTime(currentTime)}`}</div>/
        <div className="time">{`${formatTime(props.videoState.duration)}`}</div>
      </div>
      <div className="slider">
        <Slider
          value={currentTime}
          min={0.0}
          max={props.videoState.duration}
          onChange={(value) => {
            if (typeof value === "number") {
              if (props.video) {
                setCurrentTime(value);
                props.video.currentTime = value;
              }
            }
          }}
        />
        <div className="video-timeline-container">
          {props.childAssets.map((childAsset) => {
            console.log(childAsset);
            return renderChildAssetMarker(childAsset);
          })}
        </div>
      </div>
    </div>
  );
};

type PlaybackRate = 0.5 | 1.0 | 2.0 | 5.0;

type TPlaybackRateSelectorProps = {
  video?: HTMLVideoElement;
};

const PlaybackRateSelector: React.FC<TPlaybackRateSelectorProps> = (props) => {
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1.0);

  // プルダウンの選択が変更されたときのハンドラ
  const handleChangePlaybackRate = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    // イベントターゲットのvalueはstringなので、数値に変換し、PlaybackRate型にキャスト
    const newRate = parseFloat(event.target.value) as PlaybackRate;

    if (props.video) {
      props.video.playbackRate = newRate;
      setPlaybackRate(newRate); // 状態を更新
    }
  };

  return (
    <div className="playback-rate-selector">
      <select value={playbackRate} onChange={handleChangePlaybackRate}>
        <option value={0.5}>0.5x</option>
        <option value={1.0}>1.0x</option>
        <option value={2.0}>2.0x</option>
        <option value={5.0}>5.0x</option>
      </select>
    </div>
  );
};
