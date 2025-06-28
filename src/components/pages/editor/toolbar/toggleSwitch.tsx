import React, { SyntheticEvent } from 'react'

export interface IToggleSwitchProps {
    labels: string[]
    isLocked: boolean
    onClick: () => void
}

export const ToggleSwitch: React.FC<IToggleSwitchProps> = (props) => {
    const onClick = (e: SyntheticEvent | KeyboardEvent) => {
        e.stopPropagation()
        props.onClick()
    }
    return (
        <div className="relative w-10 h-5 m-auto" onClick={onClick}>
            <input
                id="toggle"
                className="peer absolute left-0 top-0 w-full h-full z-10 opacity-0"
                type="checkbox"
                defaultChecked={props.isLocked}
            />
            <label htmlFor="toggle" className="w-10 h-5 bg-gray-400 relative inline-block rounded-full transition-all duration-100 after:content-[''] after:absolute after:w-5 after:h-5 after:rounded-full after:left-0 after:top-0 after:z-[2] after:bg-white after:shadow-[0_0_5px_rgba(0,0,0,0.2)] after:transition-all after:duration-100 peer-checked:bg-green-500 peer-checked:after:left-5" />
        </div>
    )
}
