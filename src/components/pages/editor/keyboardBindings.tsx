import React from "react";
import { toast } from "react-toastify";

import {
  AppMode,
  IAssetMetadata,
  IRegion,
} from "../../../models/applicationState";
import { strings } from "../../../common/strings";
import { KeyboardBinding } from "../../common/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager";

type TKeyboardBindingsProps = {
  appMode: AppMode;
  selectedAsset?: IAssetMetadata;
  copyRegions: () => void;
  pasteRegions: () => void;
  copyAllPolygons: () => Promise<number>;
  copyAllRectangles: () => Promise<number>;
  convertPolygonToRect: () => void;
  saveAllAssetMetadata: () => void;
  onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
  onRegionHideClick: (region: IRegion) => void;
  undoAsset: () => Promise<void>;
  redoAsset: () => Promise<void>;
  prevStep: string;
  setPrevStep: (step: string) => void;
};

const KeyboardBindings: React.FC<TKeyboardBindingsProps> = ({
  appMode,
  selectedAsset,
  copyRegions,
  pasteRegions,
  copyAllPolygons,
  copyAllRectangles,
  convertPolygonToRect,
  saveAllAssetMetadata,
  onAssetMetadataChanged,
  onRegionHideClick,
  undoAsset,
  redoAsset,
  prevStep,
  setPrevStep,
}) => {
  return (
    <>
      {appMode === AppMode.Internal && (
        <>
          <KeyboardBinding
            displayName={strings.editorPage.toolbar.copy}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["CmdOrCtrl+c"]}
            handler={copyRegions}
          />
          <KeyboardBinding
            displayName={strings.editorPage.toolbar.paste}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["CmdOrCtrl+v"]}
            handler={async () => {
              if (prevStep && selectedAsset) {
                await onAssetMetadataChanged({
                  ...selectedAsset,
                  asset: {
                    ...selectedAsset.asset,
                    step: prevStep,
                  },
                });
                setPrevStep("");
              }
              pasteRegions();
            }}
          />
          <KeyboardBinding
            displayName={"Copy All Rectangles"}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["Alt+r"]}
            handler={async () => {
              if (selectedAsset) {
                setPrevStep(selectedAsset?.asset.step || "");
                const numRegions = await copyAllRectangles();
                if (numRegions) {
                  toast.success(`Copy ${numRegions.toString()} Rectangles`);
                }
              }
            }}
          />
          <KeyboardBinding
            displayName={"Copy All Polygons"}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["Alt+p"]}
            handler={async () => {
              setPrevStep(selectedAsset?.asset.step || "");
              const numRegions = await copyAllPolygons();
              if (numRegions) {
                toast.success(`Copy ${numRegions.toString()} Polygones`);
              }
            }}
          />
          <KeyboardBinding
            displayName={"Convert Polygon to Rectangle"}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["Alt+t"]}
            handler={() => convertPolygonToRect()}
          />
          <KeyboardBinding
            displayName={"Save All Asset Metadata"}
            keyEventType={KeyEventType.KeyDown}
            accelerators={["Alt+s"]}
            handler={() => saveAllAssetMetadata()}
          />
          {[...Array(10).keys()].map((n) => {
            return (
              <KeyboardBinding
                key={n}
                displayName={`Set comment to ${n}`}
                keyEventType={KeyEventType.KeyDown}
                accelerators={[`${n}`]}
                handler={() => {
                  if (selectedAsset) {
                    const assetMetadata: IAssetMetadata = {
                      ...selectedAsset,
                      asset: {
                        ...selectedAsset?.asset,
                        comment: n.toString(),
                      },
                    };
                    onAssetMetadataChanged(assetMetadata);
                  }
                }}
              />
            );
          })}
          {[...Array(10).keys()].map((n) => {
            return (
              <KeyboardBinding
                key={`ctrl${n}`}
                displayName={`Add ${n} to comment`}
                keyEventType={KeyEventType.KeyDown}
                accelerators={[`CmdOrCtrl+${n}`]}
                handler={() => {
                  if (selectedAsset) {
                    const comment = selectedAsset.asset.comment || "";
                    const assetMetadata = {
                      ...selectedAsset,
                      asset: {
                        ...selectedAsset?.asset,
                        comment: comment + n.toString(),
                      },
                    };
                    onAssetMetadataChanged(assetMetadata);
                  }
                }}
              />
            );
          })}
          {[...Array(10).keys()].map((index) => {
            return (
              <KeyboardBinding
                key={`alt${index}`}
                displayName={"Change Nth region's visible state"}
                keyEventType={KeyEventType.KeyDown}
                accelerators={[`Alt+${index}`]}
                handler={() => {
                  const regions = selectedAsset?.regions;
                  if (regions && index - 1 < regions.length) {
                    onRegionHideClick(regions[index - 1]);
                  }
                }}
              />
            );
          })}
        </>
      )}
      {appMode === AppMode.Examination &&
        [...Array(10).keys()].map((n) => {
          return (
            <KeyboardBinding
              key={n}
              displayName={n.toString()}
              keyEventType={KeyEventType.KeyDown}
              accelerators={[`${n}`]}
              handler={() => {
                if (selectedAsset) {
                  const assetMetadata = {
                    ...selectedAsset,
                    asset: {
                      ...selectedAsset.asset,
                      comment: n.toString(),
                    },
                  };
                  onAssetMetadataChanged(assetMetadata);
                }
              }}
            />
          );
        })}
      <KeyboardBinding
        displayName={"Undo"}
        keyEventType={KeyEventType.KeyDown}
        accelerators={["CmdOrCtrl+z"]}
        handler={async () => await undoAsset()}
      />
      <KeyboardBinding
        displayName={"Redo"}
        keyEventType={KeyEventType.KeyDown}
        accelerators={["CmdOrCtrl+y"]}
        handler={async () => await redoAsset()}
      />
    </>
  );
};

export default KeyboardBindings;
