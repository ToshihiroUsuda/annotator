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

    const className = [`w-12 h-12 bg-transparent border-none text-gray-400 outline-none ${props.name}`]
    if (props.active && !props.isLocked) {
        className.push('bg-white/10 border border-white/15')
    }
    if (props.isLocked) {
        className.push('opacity-25')
    } else {
        className.push('hover:bg-white/10 hover:border hover:border-white/15 active:bg-black/10')
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
                <i className={`fas ${props.icon} text-2xl`} />
            </button>
        </>
    )
}
