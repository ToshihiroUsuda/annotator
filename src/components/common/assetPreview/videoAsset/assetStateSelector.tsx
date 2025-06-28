import React from "react";
import { FaCircle, FaRegCircle } from "react-icons/fa6";
import { AssetState } from "../../../../models/applicationState";

type AssetStateSelectorProps = {
  show: boolean;
  selectedStates: AssetState[];
  onChange?: (state: AssetState[]) => void;
  showPolyInput: boolean;
  isPolyInputEnabled: boolean;
  onPolyInputChange?: (visible: boolean) => void;
};

const AssetStateSelector: React.FC<AssetStateSelectorProps> = (props) => {
  if (!props.show) return null;

  const onChange = (state: AssetState) => {
    const newStates = [...props.selectedStates];
    const index = newStates.indexOf(state);
    if (index >= 0) {
      newStates.splice(index, 1);
    } else {
      newStates.push(state);
    }
    props.onChange?.(newStates);
  };

  return (
    <div className="flex flex-row p-0.5 absolute bottom-12 right-5 z-[4]">
      <a className="mx-0.5 cursor-pointer" onClick={() => onChange(AssetState.Sample)}>
        {props.selectedStates.includes(AssetState.Sample) ? (
          <FaCircle size={20} color={"green"} />
        ) : (
          <FaRegCircle size={20} color={"green"} />
        )}
        {/* <i
          className={`${props.selectedStates.includes(AssetState.Sample) ? "fas" : "far"} fa-circle`}
        ></i> */}
      </a>
      <a className="mx-0.5 cursor-pointer" onClick={() => onChange(AssetState.Store)}>
        {props.selectedStates.includes(AssetState.Store) ? (
          <FaCircle size={20} color={"red"} />
        ) : (
          <FaRegCircle size={20} color={"red"} />
        )}
      </a>
      <a className="mx-0.5 cursor-pointer" onClick={() => onChange(AssetState.Freeze)}>
        {props.selectedStates.includes(AssetState.Freeze) ? (
          <FaCircle size={20} color={"yellow"} />
        ) : (
          <FaRegCircle size={20} color={"yellow"} />
        )}
      </a>
      <a
        className="mx-0.5 cursor-pointer"
        onClick={() => onChange(AssetState.FreezeStore)}
      >
        {props.selectedStates.includes(AssetState.FreezeStore) ? (
          <FaCircle size={20} color={"deepskyblue"} />
        ) : (
          <FaRegCircle size={20} color={"deepskyblue"} />
        )}
      </a>
      {/* 入力したPolygonの線を表示/非表示するボタン */}
      {props.showPolyInput && (
        <a
          className="mx-0.5 cursor-pointer"
          onClick={() => {
            props.onPolyInputChange?.(!props.isPolyInputEnabled);
          }}
        >
          {props.isPolyInputEnabled ? (
            <FaCircle size={20} color={"tomato"} />
          ) : (
            <FaRegCircle size={20} color={"tomato"} />
          )}
        </a>
      )}
    </div>
  );
};

export default AssetStateSelector;
