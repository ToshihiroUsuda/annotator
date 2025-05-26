import React, { SyntheticEvent } from 'react'
import { IProject } from '../../../../models/applicationState'
import { IProjectActions } from '../../../../atom/actions/project'
import {
    ToolbarItemGroup,
    ToolbarItemName,
    ToolbarItemUse,
} from '../../../../registerToolbar'
import { KeyboardBinding } from '../../../common/keyboardBinding'
import { KeyEventType } from '../../../common/keyboardManager'

export enum ToolbarItemType {
    Trigger = 0,
    Selector = 1,
    Switch = 2,
}

export interface IToolbarItemMetadata {
    name: ToolbarItemName
    icon: string
    tooltip: string
    group: ToolbarItemGroup
    type: ToolbarItemType
    use: ToolbarItemUse
    toBeLocked?: boolean
    isSelected?: boolean
    accelerators?: string[]
}

export interface IToolbarItemProps extends IToolbarItemMetadata {
    actions: IProjectActions
    project: IProject
    active: boolean
    isLocked: boolean
    onClick: (item: IToolbarItemProps) => void
    // onItemClick: () => void | Promise<void>
}

export const ToolbarItem: React.FC<IToolbarItemProps> = (props) => {
    const getTitle = () => {
        return `${props.tooltip}${getShortcut()}`
    }

    const getShortcut = () => {
        return ` (${consolidateKeyCasings(props.accelerators || []).join(', ')})`
    }

    const consolidateKeyCasings = (accelerators: string[]): string[] => {
        const consolidated: string[] = []
        if (accelerators) {
            for (const a of accelerators) {
                if (
                    !consolidated.find(
                        (item) => item.toLowerCase() === a.toLowerCase()
                    )
                ) {
                    consolidated.push(a)
                }
            }
        }
        return consolidated
    }

    const handleClick = (e: SyntheticEvent | KeyboardEvent) => {
        e.stopPropagation()

        // if (props.onItemClick) {
        //     props.onItemClick()
        // }
        if (!props.isLocked) {
            props.onClick(props)
        }
    }

    const className = [`toolbar-btn ${props.name}`]
    if (props.active) {
        className.push('active')
    }
    if (props.isLocked) {
        className.push('locked')
    }

    const accelerators = props.accelerators

    return (
        <>
            {accelerators && (
                <KeyboardBinding
                    displayName={props.tooltip}
                    accelerators={accelerators}
                    handler={(e?: KeyboardEvent) => {
                        if (e) {
                            handleClick(e)
                        }
                    }}
                    icon={props.icon}
                    keyEventType={KeyEventType.KeyDown}
                />
            )}
            <button
                type="button"
                className={className.join(' ')}
                title={getTitle()}
                onClick={handleClick}
            >
                <i className={'fas ' + props.icon} />
            </button>
        </>
    )
}
