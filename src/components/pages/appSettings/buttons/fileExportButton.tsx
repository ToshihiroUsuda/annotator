import React from "react";
import { LocalFileSystem } from "../../../../providers/storage/localFileSystem";

interface IFileExportButtonProps {
  onExport: (folderPath: string) => void;
}

export const FileExportButton: React.FC<IFileExportButtonProps> = (props) => {
  const handleClick = async () => {
    const folderPath = await LocalFileSystem.selectDirectory();
    if (folderPath) {
      if (props.onExport) {
        props.onExport(folderPath);
      }
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-export"
        onClick={handleClick}
      >
        Export
      </button>
    </div>
  );
};
