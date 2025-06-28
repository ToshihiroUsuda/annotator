import React from "react";
import { FaCodeBranch } from "react-icons/fa";
import { appInfo } from "../../common/appInfo";

export const StatusBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="text-xs text-white flex items-center h-6 flex-row py-1 px-3 bg-blue-500/10">
      <div className="flex-grow">{children}</div>
      <div className="flex">
        <FaCodeBranch />
        <div>{appInfo.version}</div>
      </div>
    </div>
  );
};
