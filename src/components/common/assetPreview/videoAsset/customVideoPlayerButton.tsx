import React from "react";
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
      <button
        type="button"
        title={props.tooltip}
        className="video-react-control video-react-button"
        onClick={props.onClick}
      >
        {props.children}
      </button>
    </>
  );
};
