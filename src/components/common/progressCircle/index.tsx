import React from 'react'
import { Circle } from 'rc-progress'

export interface IProgressCircleProps {
    value: number
}

export const ProgressCircle: React.FC<IProgressCircleProps> = (props) => {
    return (
        <div className="absolute top-0 right-0 left-0 bottom-0 z-[1000] flex flex-col bg-black/50">
            <Circle
                className="flex z-[1001] w-25 h-25 m-auto"
                percent={props.value}
                strokeWidth={10}
                strokeColor={'green'}
                trailWidth={10}
                strokeLinecap="square"
            />
        </div>
    )
}
