import React from "react";
import { FaDownload, FaUpload } from "react-icons/fa";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import Confirm from "../../common/confirm";

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
  icon: React.ComponentType;
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
      icon: FaDownload,
      description: "",
      show: shownModal === "load",
      onClick: () => {
        setShownModal("none");
        loadClicked();
      },
    },
    send: {
      title: "Send Data",
      icon: FaUpload,
      description: "",
      show: shownModal === "send",
      onClick: () => {
        setShownModal("none");
        sendClicked();
      },
    },
  };

  return (
    <div className="flex h-32">
      <ul className="flex flex-row m-auto flex-wrap">
        {processTypeKeys.map((key) => {
          const isLocked = props.lockedTypes.includes(key);
          let onClick: () => void;
          if (isLocked) {
            onClick = () => {};
          } else {
            onClick = () => {
              setShownModal(key);
            };
          }

          return (
            <li
              key={key}
              onClick={onClick}
              title={toolberButtonProps[key].title}
              className="flex list-none mx-2.5"
            >
              <div
                className={`flex flex-col w-32 h-32${
                  !isLocked ? "hover:cursor-pointer hover:bg-white/10" : ""
                }`}
              >
                <div className="m-auto">
                  <a
                    className={`flex flex-row text-center items-center mx-auto ${
                      isLocked ? "opacity-25" : ""
                    }`}
                  >
                    {React.createElement(toolberButtonProps[key].icon, {
                      className: "text-center",
                      style: { fontSize: "80px" },
                    })}
                  </a>
                </div>
                <div className={`m-auto ${isLocked ? "opacity-25" : ""}`}>
                  {toolberButtonProps[key].title}
                </div>
              </div>
              <Confirm
                show={toolberButtonProps[key].show}
                title={toolberButtonProps[key].title}
                message={toolberButtonProps[key].description}
                confirmButtonColor="danger"
                onConfirm={toolberButtonProps[key].onClick}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TaskControlToolbar;
