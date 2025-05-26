import React from 'react'
import { Circle } from 'rc-progress'
import './progressCircle.scss'

export interface IProgressCircleProps {
    value: number
}

export const ProgressCircle: React.FC<IProgressCircleProps> = (props) => {
    return (
        <div className="background">
            <Circle
                className="progress-circle"
                percent={props.value}
                strokeWidth={10}
                strokeColor={'green'}
                trailWidth={10}
                strokeLinecap="square"
            />
        </div>
    )
}
