import React from "react";
import { FaUndoAlt } from "react-icons/fa";
import { ICanvasFilterSetting } from "../canvas/canvas";
import RcSlider from "rc-slider";
import "rc-slider/assets/index.css";

export interface ISliderProps {
  value: number;
  min: number;
  max: number;
  name: string;
  visible?: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
}

export const Slider: React.FC<ISliderProps> = (props) => {
  return (
    <div className="w-1/3 border-r border-white/10 pr-2.5 pl-2.5 box-border">
      <div className="slider-value">{`${props.name}: ${props.value}`}</div>
      <div className="flex">
        <RcSlider
          {...props}
          onChange={(value) => {
            if (typeof value === "number") {
              props.onChange(value);
            }
          }}
        />
        <a className="text-xs cursor-pointer m-auto pr-2.5 pl-2.5" onClick={props.onReset}>
          <FaUndoAlt />
        </a>
      </div>
    </div>
  );
};

export interface IEditorSliderProps {
  filterSetting: ICanvasFilterSetting;
  regionOpacity: number;
  onFilterSettingChanged: (setting: ICanvasFilterSetting) => void;
  onRegionOpacityChanged: (opacity: number) => void;
}

export interface IEditorSliderState {
  colorSetting: ICanvasFilterSetting;
  regionOpacity: number;
}

export const EditorSlider: React.FC<IEditorSliderProps> = (props) => {
  const onBrightnessChanged = (value: number) => {
    const colorSetting = {
      ...props.filterSetting,
      brightness: value,
    };
    props.onFilterSettingChanged(colorSetting);
  };

  const onContrastChanged = (value: number) => {
    const colorSetting = {
      ...props.filterSetting,
      contrast: value,
    };
    props.onFilterSettingChanged(colorSetting);
  };

  const onOpacityChanged = (value: number) => {
    props.onRegionOpacityChanged(value);
  };

  return (
    <div className="flex w-full box-border" role="toolbar">
      <Slider
        value={props.filterSetting.brightness}
        max={100}
        min={-100}
        onChange={onBrightnessChanged}
        onReset={() => onBrightnessChanged(0)}
        name="Brightness"
      />
      <Slider
        value={props.filterSetting.contrast}
        max={100}
        min={-100}
        onChange={onContrastChanged}
        onReset={() => onContrastChanged(0)}
        name="Contrast"
      />
      <Slider
        value={props.regionOpacity}
        max={100}
        min={0}
        onChange={onOpacityChanged}
        onReset={() => onOpacityChanged(100)}
        name="Opacity"
      />
    </div>
  );
};
