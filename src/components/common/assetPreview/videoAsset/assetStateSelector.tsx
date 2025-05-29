import React from "react";
import { AssetState } from "../../../../models/applicationState";
import "./assetStateSeletor.scss";

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
    <div className="asset-state-selector">
      <a className="button sample" onClick={() => onChange(AssetState.Sample)}>
        <i
          className={`${props.selectedStates.includes(AssetState.Sample) ? "fas" : "far"} fa-circle`}
        ></i>
      </a>
      <a className="button store" onClick={() => onChange(AssetState.Store)}>
        <i
          className={`${props.selectedStates.includes(AssetState.Store) ? "fas" : "far"} fa-circle`}
        ></i>
      </a>
      <a className="button freeze" onClick={() => onChange(AssetState.Freeze)}>
        <i
          className={`${props.selectedStates.includes(AssetState.Freeze) ? "fas" : "far"} fa-circle`}
        ></i>
      </a>
      <a
        className="button freeze_store"
        onClick={() => onChange(AssetState.FreezeStore)}
      >
        <i
          className={`${props.selectedStates.includes(AssetState.FreezeStore) ? "fas" : "far"} fa-circle`}
        ></i>
      </a>
      {/* 入力したPolygonの線を表示/非表示するボタン */}
      {props.showPolyInput && (
        <a
          className="button poly-input"
          onClick={() => {
            props.onPolyInputChange?.(!props.isPolyInputEnabled);
          }}
        >
          <i
            className={`${props.isPolyInputEnabled ? "fas" : "far"} fa-circle`}
          ></i>
        </a>
      )}
    </div>
  );
};

export default AssetStateSelector;
