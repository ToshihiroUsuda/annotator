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
    <div className="bg-black relative flex flex-row w-full h-8 justify-evenly items-center px-4 text-xs">
      {props.video.seeking && (
        <div className="bg-black/60 absolute w-full h-full z-[3]"></div>
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
      >
        <FaCaretLeft size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["ArrowRight", "M", "m"]}
        tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
        onClick={props.moveNextExpectedFrame}
      >
        <FaCaretRight size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["Shift+ArrowLeft", "Z", "z"]}
        tooltip={strings.editorPage.videoPlayer.previous5ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(-5)}
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
      >
        <FaBackwardStep size={12} />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["E", "e"]}
        tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
        onClick={props.moveNextTaggedFrame}
      >
        <FaForwardStep size={12} />
      </CustomVideoPlayerButton>
      {props.appMode === AppMode.Internal && (
        <CustomVideoPlayerButton
          accelerators={["CmdOrCtrl+t"]}
          tooltip={"Seek to Time"}
          onClick={props.onTimeInputClicked}
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
        className="mx-2 cursor-pointer flex"
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
    <div className="flex items-center">
      {iconPosition === "before" && (
        <>
          <div className="flex items-center mx-1">{icon}</div>
          <div className="flex items-center">{label}</div>
        </>
      )}
      {iconPosition === "after" && (
        <>
          <div className="flex items-center">{label}</div>
          <div className="flex items-center mx-1">{icon}</div>
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
        className =
          "w-0.5 absolute h-full cursor-pointer opacity-75 z-[2] bg-green-500";
        break;
      case AssetState.Store:
        className =
          "w-0.5 absolute h-full cursor-pointer opacity-75 z-[2] bg-red-500";
        break;
      case AssetState.Freeze:
        className =
          "w-0.5 absolute h-full cursor-pointer opacity-75 z-[2] bg-yellow-500";
        break;
      case AssetState.FreezeStore:
        className =
          "w-0.5 absolute h-full cursor-pointer opacity-75 z-[2] bg-sky-400";
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
        {childAsset.comment && (
          <div
            className="w-0.5 absolute h-1/2 opacity-75 z-[3] bg-orange-500"
            style={style}
          />
        )}
        {childAsset.step &&
          !(
            childAsset.state === AssetState.Tracked ||
            childAsset.state === AssetState.Interpolated
          ) && (
            <div
              className="w-0.5 absolute h-1/2 opacity-75 z-[3] bg-fuchsia-500"
              style={style}
            />
          )}
        {props.visibleStatePolyInput &&
          (childAsset.polygonNumber || childAsset.polylineNumber) && (
            <div
              className="w-0.5 absolute h-[30%] opacity-100 z-[4] bg-orange-600"
              style={style}
            />
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
    <div className="flex-grow flex items-center">
      <div className="flex">
        <div className="mx-1 w-14">{`${formatTime(currentTime)}`}</div>/
        <div className="mx-1 w-14">{`${formatTime(props.videoState.duration)}`}</div>
      </div>
      <div className="flex flex-grow relative mx-2">
        <div className="p-0 flex-grow cursor-pointer">
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
          <div className="absolute left-0 top-0 w-full h-full">
            {props.childAssets.map((childAsset) => {
              console.log(childAsset);
              return renderChildAssetMarker(childAsset);
            })}
          </div>
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
    <div className="">
      <select
        value={playbackRate}
        onChange={handleChangePlaybackRate}
        className="bg-transparent border-none appearance-none cursor-pointer text-white focus:outline-none"
      >
        <option value={0.5}>0.5x</option>
        <option value={1.0}>1.0x</option>
        <option value={2.0}>2.0x</option>
        <option value={5.0}>5.0x</option>
      </select>
    </div>
  );
};
