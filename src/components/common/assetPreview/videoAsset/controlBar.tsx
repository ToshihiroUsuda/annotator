import React from "react";
import { strings } from "../../../../common/strings";
import { CustomVideoPlayerButton } from "./customVideoPlayerButton";
import { AppMode } from "../../../../models/applicationState";
import { formatTime } from "../../../../common/utils";

type TControlBarProps = {
  video?: HTMLVideoElement;
  appMode: AppMode;
  frameExtractionRate: number;
  moveFrame: (numFrames: number) => void;
  movePreviousExpectedFrame: () => void;
  moveNextExpectedFrame: () => void;
  movePreviousTaggedFrame: () => void;
  moveNextTaggedFrame: () => void;
  onTimeInputClicked: () => void;
};

const ControlBar: React.FC<TControlBarProps> = (props) => {
  const renderCurrentTimeDisplay = () => {
    const formattedTime = props.video
      ? formatTime(props.video.currentTime)
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

  if (!props.video) return null;

  return (
    <div className="video-control-bar">
      {!props.video.seeking && (
        <div className="video-control-bar-disabled"></div>
      )}
      {/* <CustomVideoPlayerButton
              // accelerators={[]}
              onClick={() => {
                if (videoState.paused) {
                  videoRef.current?.play();
                } else {
                  videoRef.current?.pause();
                }
              }}
              icon={
                videoState.paused
                  ? "fa-caret-left fa-lg"
                  : "fa-caret-right fa-lg"
              }
            >
              <i className="fas fa-caret-left fa-lg" />
            </CustomVideoPlayerButton> */}
      <CustomVideoPlayerButton
        accelerators={["ArrowLeft", "B", "b"]}
        tooltip={strings.editorPage.videoPlayer.previousExpectedFrame.tooltip}
        onClick={props.movePreviousExpectedFrame}
        icon={"fa-caret-left fa-lg"}
      >
        <i className="fas fa-caret-left fa-lg" />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["ArrowRight", "M", "m"]}
        tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
        onClick={props.moveNextExpectedFrame}
        icon={"fa-caret-right fa-lg"}
      >
        <i className="fas fa-caret-right fa-lg" />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["Shift+ArrowLeft", "Z", "z"]}
        tooltip={strings.editorPage.videoPlayer.previous5ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(-5)}
        icon={"fa-backward"}
      >
        5<i className="fas fa-backward" />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["Shift+ArrowRight", "C", "c"]}
        tooltip={strings.editorPage.videoPlayer.next5ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(5)}
        icon={"fa-forward"}
      >
        <i className="fas fa-forward" />5
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["CmdOrCtrl+ArrowLeft", "A", "a"]}
        tooltip={strings.editorPage.videoPlayer.previous30ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(-props.frameExtractionRate)}
        icon={"fa-backward"}
      >
        {props.frameExtractionRate.toString()}
        <i className="fas fa-backward" />
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["CmdOrCtrl+ArrowRight", "D", "d"]}
        tooltip={strings.editorPage.videoPlayer.next30ExpectedFrame.tooltip}
        onClick={() => props.moveFrame(props.frameExtractionRate)}
        icon={"fa-forward"}
      >
        <i className="fas fa-forward" />
        {props.frameExtractionRate.toString()}
      </CustomVideoPlayerButton>
      {/* {showDetailTime && <CurrentTimeDisplay order={2.1} />} */}
      {props.video.paused && props.appMode === AppMode.Internal && (
        <CustomVideoPlayerButton>
          {renderCurrentTimeDisplay()}
        </CustomVideoPlayerButton>
      )}
      {/* <DurationDisplay order={6.1} /> */}
      {/* {!paused && <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} />} */}
      {props.video.paused && (
        <CustomVideoPlayerButton onClick={() => {}}>
          {`${props.video.playbackRate.toFixed(2)}x`}
        </CustomVideoPlayerButton>
      )}
      <CustomVideoPlayerButton
        accelerators={["Q", "q"]}
        tooltip={strings.editorPage.videoPlayer.previousTaggedFrame.tooltip}
        onClick={props.movePreviousTaggedFrame}
        icon={"fas fa-step-backward"}
      >
        <i className="fas fa-step-backward"></i>
      </CustomVideoPlayerButton>
      <CustomVideoPlayerButton
        accelerators={["E", "e"]}
        tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
        onClick={props.moveNextTaggedFrame}
        icon={"fa-step-forward"}
      >
        <i className="fas fa-step-forward"></i>
      </CustomVideoPlayerButton>
      {props.appMode === AppMode.Internal && (
        <CustomVideoPlayerButton
          accelerators={["CmdOrCtrl+t"]}
          tooltip={"Seek to Time"}
          onClick={props.onTimeInputClicked}
          icon={"fa-clock"}
        >
          <i className="fas fa-clock"></i>
        </CustomVideoPlayerButton>
      )}
    </div>
  );
};

export default ControlBar;
