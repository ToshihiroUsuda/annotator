import React from "react";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import Confirm from "../../common/confirm";
import "./taskControlToolbar.scss";

const processTypeKeys = ["load", "send"] as const;
export type ProcessType = (typeof processTypeKeys)[number];

export interface ITaskControlToolbarProps {
  lockedTypes: string[];
  viimScriptDirectory: string;
  viimSettingsFile: string;
  executeLoad: () => Promise<void>;
  executeSend: (dstDirectory: string) => Promise<void>;
}

interface IToolbarButtonProp {
  title: string;
  icon: string;
  description: string;
  show: boolean;
  onClick: () => void;
}

const TaskControlToolbar: React.FC<ITaskControlToolbarProps> = (props) => {
  const [shownModal, setShownModal] = React.useState<"none" | ProcessType>(
    "none"
  );

  const loadClicked = async () => {
    await props.executeLoad();
  };

  const sendClicked = async () => {
    const folderPath = await LocalFileSystem.selectDirectory();
    if (folderPath) {
      await props.executeSend(folderPath);
    }
  };

  const toolberButtonProps: Record<ProcessType, IToolbarButtonProp> = {
    load: {
      title: "Load New Data",
      icon: "fas fa-download",
      description: "",
      show: shownModal === "load",
      onClick: () => {
        setShownModal("none");
        loadClicked();
      },
    },
    send: {
      title: "Send Data",
      icon: "fas fa-upload",
      description: "",
      show: shownModal === "send",
      onClick: () => {
        setShownModal("none");
        sendClicked();
      },
    },
  };

  return (
    <div className="progress-report-toolbar">
      <ul>
        {processTypeKeys.map((key) => {
          const prop = toolberButtonProps[key];
          const className = ["button-item"];
          let onClick: () => void;
          if (props.lockedTypes.includes(key)) {
            className.push("deactive");
            onClick = () => {};
          } else {
            className.push("active");
            onClick = () => {
              setShownModal(key);
            };
          }

          return (
            <li key={key} onClick={onClick} title={prop.title}>
              <div className={className.join(" ")}>
                <div className="button-icon">
                  <a className={key}>
                    <i className={prop.icon}></i>
                  </a>
                </div>
                <div className="button-title">{prop.title}</div>
              </div>
              <Confirm
                show={prop.show}
                title={prop.title}
                message={prop.description}
                confirmButtonColor="danger"
                onConfirm={prop.onClick}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TaskControlToolbar;
