import React from "react";
import {
  AppMode,
  IAppSettings,
  IAssetMetadata,
  IRegion,
} from "../../../../models/applicationState";
import { CommentInputModal } from "./commentInputModal";
import { RegionInfoInputModal } from "./regionInfoInputModal";
import { FrameLabelInputModal } from "./frameLabelInputModal";
import { TimeSeekModal } from "./timeSeekModal";
import Confirm from "../../../common/confirm";
import { strings } from "../../../../common/strings";
import { RJSFSchema } from "@rjsf/utils";

const shownModal = [
  "none",
  "commentInput",
  "regionInfoInput",
  "frameLabelInput",
  "timeSeek",
  "removeAllRegionsConfirm",
  "interpolatationConfirm",
  "untaggedRegionConfirm",
  "missedFrameLabelConfirm",
] as const;
export type ShownModal = (typeof shownModal)[number];

type TEditorModalsProps = {
  shownModal: ShownModal;
  selectedAsset?: IAssetMetadata;
  selectedRegion?: IRegion;
  appSettings: IAppSettings;
  appMode: AppMode;
  isFrozen: boolean;
  stepInformationSchema?: RJSFSchema;
  onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => Promise<void>;
  onSaveOrConfirm: Partial<Record<ShownModal, (data?: any) => void>>;
  onClose: () => void;
};

const EditorModals: React.FC<TEditorModalsProps> = (props) => {
  const onRegionIndoModalSave = async (region: IRegion) => {
    if (props.selectedAsset) {
      const assetMetadata = {
        ...props.selectedAsset,
        regions: props.selectedAsset.regions.map((r) => {
          return region.id !== r.id ? r : region;
        }),
      };
      await props.onAssetMetadataChanged(assetMetadata);
    }
    props.onClose();
    props.onSaveOrConfirm.regionInfoInput?.();
  };

  const onCommentModalSave = async (comment: string) => {
    if (props.selectedAsset) {
      const assetMetadata = {
        ...props.selectedAsset,
        asset: {
          ...props.selectedAsset.asset,
          comment: comment,
        },
      };
      await props.onAssetMetadataChanged(assetMetadata);
    }
    props.onClose();
    props.onSaveOrConfirm.commentInput?.();
  };

  const onFrameLabelModalSave = async (step: string) => {
    if (props.selectedAsset) {
      const asset = { ...props.selectedAsset.asset, step: step };
      const assetMetadata = {
        ...props.selectedAsset,
        asset: asset,
      };
      async () => await props.onAssetMetadataChanged(assetMetadata);
    }
    props.onClose();
    props.onSaveOrConfirm.frameLabelInput?.();
  };

  const onTimeSeekModalSave = (timestamp: number) => {
    props.onClose();
    props.onSaveOrConfirm.timeSeek?.(timestamp);
  };

  // const onRemoveAllRegionsConfirmed = async () => {
  //   if (props.selectedAsset) {
  //     const assetMetadata = {
  //       ...props.selectedAsset,
  //       regions: [],
  //     };
  //     await props.onAssetMetadataChanged(assetMetadata);
  //   }
  //   props.onSaveOrConfirm.removeAllRegionsConfirm?.();
  // };

  const onInterpolationConfirmed = () => {
    props.onClose();
    props.onSaveOrConfirm.interpolatationConfirm?.();
  };

  const onUntaggleRegionConfirmed = () => {
    props.onClose();
    props.onSaveOrConfirm.untaggedRegionConfirm?.();
  };

  const onMissedFrameLabelConfirmed = () => {
    props.onClose();
    props.onSaveOrConfirm.missedFrameLabelConfirm?.();
  };
  return (
    <>
      <CommentInputModal
        show={props.shownModal === "commentInput"}
        comment={props.selectedAsset?.asset.comment}
        onSave={onCommentModalSave}
        onCancel={props.onClose}
        isFrozen={props.isFrozen}
      />
      <FrameLabelInputModal
        show={props.shownModal === "frameLabelInput"}
        frameLabel={props.selectedAsset?.asset.step || ""}
        schemaPath={props.appSettings.stepInformationSchema || ""}
        onSave={onFrameLabelModalSave}
        onCancel={props.onClose}
        isFrozen={props.isFrozen}
      />
      <TimeSeekModal
        show={props.shownModal === "timeSeek"}
        timestamp={props.selectedAsset?.asset.timestamp}
        onSave={onTimeSeekModalSave}
        onCancel={props.onClose}
      />
      <RegionInfoInputModal
        show={props.shownModal === "regionInfoInput"}
        region={props.selectedRegion}
        schemaPath={props.appSettings.regionInformationSchema || ""}
        tags={props.appSettings.tags}
        onSave={onRegionIndoModalSave}
        onCancel={props.onClose}
        isFrozen={props.appMode !== AppMode.Internal || props.isFrozen}
      />
      {/* <Confirm
        show={props.shownModal === "removeAllRegionsConfirm"}
        title={strings.editorPage.canvas.removeAllRegions.title}
        message={strings.editorPage.canvas.removeAllRegions.confirmation}
        confirmButtonColor="danger"
        onConfirm={onRemoveAllRegionsConfirmed}
      /> */}
      <Confirm
        show={props.shownModal === "interpolatationConfirm"}
        title={strings.editorPage.canvas.interpolation.title}
        message={strings.editorPage.canvas.interpolation.confirmation}
        confirmButtonColor="danger"
        onConfirm={onInterpolationConfirmed}
        onCancel={props.onClose}
      />
      <Confirm
        show={props.shownModal === "untaggedRegionConfirm"}
        title={strings.editorPage.canvas.untaggedRegion.title}
        message={strings.editorPage.canvas.untaggedRegion.confirmation}
        confirmButtonColor="danger"
        onConfirm={onUntaggleRegionConfirmed}
        onCancel={props.onClose}
      />
      <Confirm
        show={props.shownModal === "missedFrameLabelConfirm"}
        title={strings.editorPage.canvas.missedFrameLabel.title}
        message={strings.editorPage.canvas.missedFrameLabel.confirmation}
        confirmButtonColor="danger"
        onConfirm={onMissedFrameLabelConfirmed}
        onCancel={props.onClose}
      />
    </>
  );
};

export default EditorModals;
