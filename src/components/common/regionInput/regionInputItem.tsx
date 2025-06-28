import React, { MouseEvent, SyntheticEvent, useState } from "react";
import {
  FaTimes,
  FaFastBackward,
  FaBackward,
  FaForward,
  FaFastForward,
  FaLock,
  FaUnlock,
  FaEye,
  FaEyeSlash,
  FaObjectUngroup,
  FaTag,
  FaClone,
  FaEdit,
  FaDrawPolygon,
  FaProjectDiagram,
} from "react-icons/fa";
import { IRegion, ITag, RegionState } from "../../../models/applicationState";

export interface IRegionClickProps {
  ctrlKey?: boolean;
  altKey?: boolean;
  clickedColor?: boolean;
}

/**
 * Properties for region input item
 */
export interface IRegionInputItemProps {
  tags: ITag[];
  region: IRegion;
  index: number;
  isSelected: boolean;
  appliedToSelectedRegions: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  isHided: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: (region: IRegion) => void;
  onTagChange: (region: IRegion, tag: string) => void;
  onConfidenceChange: (region: IRegion, confidence: number) => void;
  onFirstAssetClick: (region: IRegion) => void;
  onPreviousAssetClick: (region: IRegion) => void;
  onNextAssetClick: (region: IRegion) => void;
  onLastAssetClick: (region: IRegion) => void;
  onHideClick: (region: IRegion) => void;
  onLockClick: (region: IRegion) => void;
  onDeleteClick: (region: IRegion) => void;
  onInterpolateClick: (region: IRegion) => void;
  onIdClick: (region: IRegion) => void;
}

export interface IRegionInputItemState {
  /** Region is currently being edited */
  selectedTag: string;
  selectedConfidence: number;
  isBeingEdited: boolean;
  /** Mode of region editing (text or color) */
}

const unknownTag: ITag = {
  name: "Unknown",
  color: "#808080",
};

const regionStateIcon: { [key in RegionState]: React.ComponentType } = {
  [RegionState.Inputted]: FaTag,
  [RegionState.Tracked]: FaClone,
  [RegionState.Editted]: FaEdit,
  [RegionState.Interpolated]: FaObjectUngroup,
  [RegionState.PolygonInputted]: FaDrawPolygon,
  [RegionState.PolylineInputted]: FaProjectDiagram,
} as const;

const RegionInputItem: React.FC<IRegionInputItemProps> = (props) => {
  const [isBeingEdited, setIsBeingEdited] = useState(false);
  const [selectedTag, setSelectedTag] = useState(
    props.region.tags.length > 0 ? props.region.tags[0] : unknownTag.name
  );
  const [selectedConfidence, setSelectedConfidence] = useState(
    props.region.confidence || 1
  );

  const confidenceLevels = [
    { value: 1, label: "High" },
    { value: 2, label: "Middle" },
    { value: 3, label: "Low" },
  ];

  const onNameClick = (e: MouseEvent) => {
    e.stopPropagation();
    props.onClick(props.region);
  };

  const onTagChange = (e: SyntheticEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLSelectElement;
    setSelectedTag(target.value);
    props.onTagChange(props.region, target.value);
    target.blur();
  };

  const onConfidenceChange = (e: SyntheticEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLSelectElement;
    setSelectedConfidence(parseInt(target.value));
    props.onConfidenceChange(props.region, parseInt(target.value));
    target.blur();
  };

  const getItemClassName = () => {
    const classNames = ["flex flex-row"];
    if (props.isSelected) {
      classNames.push(
        "[&_.region-content.active]:mx-0.5 [&_.region-content.active]:my-0 [&_.region-content.active]:mr-0 [&_.region-content.active]:text-white [&_.region-content.active]:font-semibold [&_.region-content.active]:bg-black/60"
      );
    }
    if (props.isLocked) {
      classNames.push("opacity-25");
    }
    return classNames.join(" ");
  };

  const getRegionInformation = () => {
    let name = unknownTag.name;
    if (props.region.tags.length > 0) {
      const regionTag = props.tags.find(
        (tag) => props.region.tags[0] === tag.name
      );
      if (regionTag) {
        name = regionTag.dispName || regionTag.name;
      }
    }

    return (
      <div className={"flex flex-row min-h-[1.8rem] items-center"}>
        <div title={`${name}-${props.region.id}`} className="flex-grow">
          <div className="flex flex-row">
            <span className="ml-1.5">
              {React.createElement(regionStateIcon[props.region.state])}
            </span>
            <span className="text-[15px] mt-auto px-2">{name}</span>
            <span className="mt-auto mb-auto ml-auto text-[10px] font-normal px-2">
              <div
                onClick={(e) => {
                  if (e.shiftKey && e.ctrlKey) {
                    props.onIdClick(props.region);
                  }
                }}
              >
                {props.region.id}
              </div>
            </span>
            <span
              className={`mt-auto mb-auto mr-1.5 ${props.isFrozen || props.isHided || props.isLocked ? "opacity-25 cursor-default" : ""}`}
              onClick={() => props.onDeleteClick(props.region)}
            >
              <FaTimes />
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getSelector = (tagNames: string[]) => {
    return (
      <div className="overflow-hidden p-0.5 text-center flex flex-row">
        <div className="w-[70%] relative rounded-sm bg-white/32 box-border p-0.5 before:absolute before:top-2.5 before:right-0.5 before:w-0 before:h-0 before:p-0 before:content-[''] before:border-l-[6px] before:border-r-[6px] before:border-t-[6px] before:border-l-transparent before:border-r-transparent before:border-t-gray-600 before:pointer-events-none">
          <select
            className="w-full text-indent-px text-ellipsis border-0 outline-0 bg-transparent bg-none shadow-none appearance-none p-1 px-2.5 px-1 text-gray-600"
            value={selectedTag}
            onClick={onNameClick}
            onChange={onTagChange}
            disabled={props.isLocked}
          >
            {tagNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-[30%] relative rounded-sm bg-white/32 box-border p-0.5 before:absolute before:top-2.5 before:right-0.5 before:w-0 before:h-0 before:p-0 before:content-[''] before:border-l-[6px] before:border-r-[6px] before:border-t-[6px] before:border-l-transparent before:border-r-transparent before:border-t-gray-600 before:pointer-events-none">
          <select
            className="w-full text-indent-px text-ellipsis border-0 outline-0 bg-transparent bg-none shadow-none appearance-none p-1 px-2.5 px-1 text-gray-600"
            value={selectedConfidence}
            onClick={onNameClick}
            onChange={onConfidenceChange}
            disabled={props.isLocked}
          >
            {confidenceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const getToolbar = () => {
    return (
      <div className="flex flex-row">
        <div
          className={`flex w-full ${props.isFirst ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onFirstAssetClick(props.region)}
        >
          <FaFastBackward className="m-auto cursor-pointer text-gray-300 p-px" />
        </div>
        <div
          className={`flex w-full ${props.isFirst ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onPreviousAssetClick(props.region)}
        >
          <FaBackward className="m-auto cursor-pointer text-gray-300 p-px" />
        </div>
        <div
          className={`flex w-full ${props.isLast ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onNextAssetClick(props.region)}
        >
          <FaForward className="m-auto cursor-pointer text-gray-300 p-px" />
        </div>
        <div
          className={`flex w-full ${props.isLast ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onLastAssetClick(props.region)}
        >
          <FaFastForward className="m-auto cursor-pointer text-gray-300 p-px" />
        </div>
        <div
          className={`flex w-full ${props.isFrozen || props.isHided ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onLockClick(props.region)}
        >
          {props.isLocked ? (
            <FaUnlock className="m-auto cursor-pointer text-gray-300 p-px" />
          ) : (
            <FaLock className="m-auto cursor-pointer text-gray-300 p-px" />
          )}
        </div>
        <div
          className={`flex w-full ${props.isFrozen ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onHideClick(props.region)}
        >
          {props.isHided ? (
            <FaEye className="m-auto cursor-pointer text-gray-300 p-px" />
          ) : (
            <FaEyeSlash className="m-auto cursor-pointer text-gray-300 p-px" />
          )}
        </div>
        <div
          className={`flex w-full ${props.isFrozen || props.isHided || props.isLocked ? "opacity-25 cursor-default" : ""}`}
          onClick={() => props.onInterpolateClick(props.region)}
        >
          <FaObjectUngroup className="m-auto cursor-pointer text-gray-300 p-px" />
        </div>
      </div>
    );
  };

  let tagNames = props.tags.map((tag) => tag.name);
  let color: string = unknownTag.color;
  if (props.region.tags.length > 0) {
    const tag = props.tags.find((tag) => tag.name === props.region.tags[0]);
    if (tag) {
      color = tag.color;
    }
  } else {
    tagNames = [...tagNames, unknownTag.name];
  }

  const style = {
    background: color,
  };
  const isDeactive = props.isFrozen || props.isHided || props.isLocked;

  return (
    <div className={"my-0.5"}>
      {props.region && (
        <li className={getItemClassName()} style={style}>
          <div className={`w-3 ${isDeactive ? "bg-black/60" : ""}`} />
          <div
            className={`flex-1 bg-black/60 region-content ${isDeactive ? "deactive cursor-default opacity-25" : "active hover:bg-black/32 cursor-pointer"}`}
            onClick={onNameClick}
          >
            {getRegionInformation()}
            {getSelector(tagNames)}
            {getToolbar()}
          </div>
        </li>
      )}
    </div>
  );
};

export default RegionInputItem;
