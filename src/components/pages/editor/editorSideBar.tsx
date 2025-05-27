import React, { useState, useRef, useEffect } from "react";
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
        <div className="asset-item-image">
          {renderBadges(asset)}
          <AssetPreview
            asset={asset}
            projectName={props.project.name}
            appSettings={props.appSettings}
            showAssetStateSelector={false}
          />
        </div>
        <div className="asset-item-metadata">
          <span className="asset-filename" title={asset.name}>
            {asset.name}
          </span>
          {asset.size && (
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
            className="badge badge-sample"
          >
            <i className="fas fa-edit"></i>
          </span>
        );
      case AssetState.Store:
        return (
          <span title={strings.editorPage.tagged} className="badge badge-store">
            <i className="fas fa-tag"></i>
          </span>
        );
      case AssetState.Freeze:
        return (
          <span
            title={strings.editorPage.tagged}
            className="badge badge-freeze"
          >
            <i className="fas fa-tag"></i>
          </span>
        );
      default:
        if (asset.step) {
          return (
            <span
              title={strings.editorPage.tagged}
              className="badge badge-step"
            >
              <i className="fas fa-info-circle"></i>
            </span>
          );
        } else if (asset.comment) {
          return (
            <span
              title={strings.editorPage.tagged}
              className="badge badge-comment"
            >
              <i className="fas fa-comment-dots"></i>
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
    const cssClasses = ["asset-item"];
    if (selectedAsset) {
      if (selectedAsset.name === asset.name) {
        cssClasses.push("selected");
      } else if (selectedAsset.parent) {
        if (selectedAsset.parent.name === asset.name) {
          cssClasses.push("selected");
        }
      }
    }

    return cssClasses.join(" ");
  };

  return (
    <div className="editor-page-sidebar-nav">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            key={props.sideBarWidth}
            className="asset-list"
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
