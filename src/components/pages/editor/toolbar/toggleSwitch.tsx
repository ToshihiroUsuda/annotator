import React, { SyntheticEvent } from 'react'
import './toggleSwitch.scss'

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
        <div className="toggle-switch" onClick={onClick}>
            <input
                id="toggle"
                className="toggle-input"
                type="checkbox"
                defaultChecked={props.isLocked}
            />
            <label htmlFor="toggle" className="toggle-label" />
        </div>
    )
}
