import React, { useState, useRef, useEffect } from "react";
import { FaEdit, FaTag, FaInfoCircle, FaCommentDots } from "react-icons/fa";
import { AutoSizer, List } from "react-virtualized";
import { strings } from "../../../common/strings";
import {
  AssetState,
  IAppSettings,
  IAsset,
  IProject,
} from "../../../models/applicationState";
import { AssetPreview } from "../../common/assetPreview";

/**
 * Properties for Editor Side Bar
 * @member assets - Array of assets to be previewed
 * @member onAssetSelected - Function to call when asset from side bar is selected
 * @member selectedAsset - Asset initially selected
 */
export interface IEditorSideBarProps {
  assets: IAsset[];
  project: IProject;
  appSettings: IAppSettings;
  onAssetSelected: (asset: IAsset) => void;
  onBeforeAssetSelected?: () => boolean;
  selectedAsset?: IAsset;
  sideBarWidth?: number;
}

/**
 * @name - Editor Side Bar
 * @description - Side bar for editor page
 */
export const EditorSideBar: React.FC<IEditorSideBarProps> = (props) => {
  const [scrollToIndex, setScrollToIndex] = useState<number>(
    props.selectedAsset
      ? props.assets.findIndex(
          (asset) => asset.name === props.selectedAsset?.name
        )
      : 0
  );

  const listRef = useRef<List>(null);

  useEffect(() => {
    if (props.selectedAsset) {
      selectAsset(props.selectedAsset);
    }
  }, [props.selectedAsset]);

  const getRowHeight = (width: number) => {
    const height = width / (4 / 3) + 16;
    return height;
  };

  const selectAsset = (selectedAsset: IAsset): void => {
    const newScrollToIndex = props.assets.findIndex(
      (asset) => asset.name === selectedAsset.name
    );

    setScrollToIndex(newScrollToIndex);
    listRef.current?.forceUpdateGrid();
  };

  const onAssetClicked = (asset: IAsset): void => {
    if (props.onBeforeAssetSelected) {
      if (!props.onBeforeAssetSelected()) {
        return;
      }
    }

    selectAsset(asset);
    props.onAssetSelected(asset);
  };

  const rowRenderer = ({
    key,
    index,
    style,
  }: {
    key: string;
    index: number;
    style: React.CSSProperties;
  }) => {
    const asset = props.assets[index];
    const selectedAsset = props.selectedAsset;

    return (
      <div
        key={key}
        style={style}
        className={getAssetCssClassNames(asset, selectedAsset)}
        onClick={() => onAssetClicked(asset)}
      >
        <div className="flex-grow overflow-hidden flex bg-black/30 text-center relative m-auto w-full">
          {renderBadges(asset)}
          <AssetPreview
            asset={asset}
            projectName={props.project.name}
            appSettings={props.appSettings}
            showAssetStateSelector={false}
          />
        </div>
        <div className="flex flex-row text-[70%] whitespace-nowrap">
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap flex-grow"
            title={asset.name}
          >
            {asset.name}
          </span>
          {asset.size.width !== 0 && (
            <span>
              {asset.size.width} x {asset.size.height}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderBadges = (asset: IAsset) => {
    switch (asset.state) {
      case AssetState.Sample:
        return (
          <span
            title={strings.editorPage.tagged}
            className="badge text-white absolute z-20 right-2 top-2 border border-white/15 bg-green-400/90 text-shadow-lg"
          >
            <FaEdit />
          </span>
        );
      case AssetState.Store:
        return (
          <span
            title={strings.editorPage.tagged}
            className="badge text-white absolute z-20 right-2 top-2 border border-white/15 bg-red-400/90 text-shadow-lg"
          >
            <FaTag />
          </span>
        );
      case AssetState.Freeze:
        return (
          <span
            title={strings.editorPage.tagged}
            className="badge text-white absolute z-20 right-2 top-2 border border-white/15 bg-orange-400/90 text-shadow-lg"
          >
            <FaTag />
          </span>
        );
      default:
        if (asset.step) {
          return (
            <span
              title={strings.editorPage.tagged}
              className="badge text-white absolute z-20 right-2 top-2 border border-white/15 bg-purple-400/90 text-shadow-lg"
            >
              <FaInfoCircle />
            </span>
          );
        } else if (asset.comment) {
          return (
            <span
              title={strings.editorPage.tagged}
              className="badge text-white absolute z-20 right-2 top-2 border border-white/15 bg-orange-400/90 text-shadow-lg"
            >
              <FaCommentDots />
            </span>
          );
        } else {
          return null;
        }
    }
  };

  const getAssetCssClassNames = (
    asset: IAsset,
    selectedAsset?: IAsset
  ): string => {
    let cssClasses =
      "flex flex-col p-2 hover:relative hover:bg-white/15 cursor-pointer";
    if (selectedAsset) {
      if (selectedAsset.name === asset.name) {
        cssClasses += " text-white bg-yellow-400/50 font-semibold";
      } else if (selectedAsset.parent) {
        if (selectedAsset.parent.name === asset.name) {
          cssClasses += " text-white bg-yellow-400/50 font-semibold";
        }
      }
    }

    return cssClasses;
  };

  return (
    <div className="flex-grow">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            key={props.sideBarWidth}
            className="select-none focus:outline-none"
            height={height}
            width={width}
            rowCount={props.assets.length}
            rowHeight={() => getRowHeight(width)}
            rowRenderer={rowRenderer}
            overscanRowCount={2}
            scrollToIndex={scrollToIndex}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default EditorSideBar;
