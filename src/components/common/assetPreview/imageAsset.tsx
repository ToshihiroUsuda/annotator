import React, { useRef } from "react";
import path from "path-browserify";
import { encodeFileURI } from "../../../common/utils";
import { IAssetProps } from ".";

export const ImageAsset: React.FC<IAssetProps> = (props) => {
  const image = useRef<HTMLImageElement>(null);
  const onLoad = () => {
    if (props.onLoaded && image.current) {
      props.onLoaded(image.current);
    }
    if (props.onActivated && image.current) {
      props.onActivated(image.current);
    }
    if (props.onDeactivated && image.current) {
      props.onDeactivated(image.current);
    }
  };

  const filePath = encodeFileURI(
    path.join(
      props.appSettings.rootDirectory,
      props.projectName,
      props.asset.name
    )
  );
  return (
    <img
      ref={image}
      src={filePath}
      onLoad={onLoad}
      onError={props.onError}
      crossOrigin="anonymous"
    />
  );
};
