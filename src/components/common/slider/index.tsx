import React from 'react'
import RcSlider from 'rc-slider'
import 'rc-slider/assets/index.css'

export interface ISliderProps {
    value: number
    min?: number
    max?: number
    onChange: (value: number | number[]) => void
    disabled?: boolean
}

export const Slider: React.FC<ISliderProps> = (props) => {
    return (
        <div className="slider">
            <span className="slider-value">{props.value}</span>
            <RcSlider {...props} />
        </div>
    )
}
