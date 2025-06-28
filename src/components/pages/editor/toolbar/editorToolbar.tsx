import _ from 'lodash'
import React, { useState, useEffect } from 'react'
import { IProject, ProjectPhase } from '../../../../models/applicationState'
import { IToolbarItemRegistration } from '../../../../providers/toolbar/toolbarItemFactory'
import { IProjectActions } from '../../../../atom/actions/project'
import { ToolbarItemName, ToolbarItemUse } from '../../../../registerToolbar'
import { ToggleSwitch } from './toggleSwitch'
import { IToolbarItemProps, ToolbarItemType } from './toolbarItem'

export interface IEditorToolbarProps {
    project: IProject
    actions: IProjectActions
    items: IToolbarItemRegistration[]
    isLocked: boolean
    appMode: string
    onToolbarItemSelected: (toolbarItemName: ToolbarItemName) => void
    onToggleClicked: () => void
}

/**
 * @name - Editor Toolbar
 * @description - Collection of buttons that perform actions in toolbar on editor page
 */
export const EditorToolbar: React.FC<IEditorToolbarProps> = (props) => {
    const [selectedItem, setSelectedItem] = useState<ToolbarItemName>(
        ToolbarItemName.SelectCanvas
    )

    useEffect(() => {
        if (props.project.phase !== ProjectPhase.Completed) {
            setSelectedItem(ToolbarItemName.DrawRectangle)
            props.onToolbarItemSelected(ToolbarItemName.DrawRectangle)
        }
    }, [props.project.phase])

    const onToolbarItemSelected = (toolbarItemProps: IToolbarItemProps) => {
        setSelectedItem(toolbarItemProps.name)
        props.onToolbarItemSelected(toolbarItemProps.name)
    }

    const isComponentActive = (
        selected: ToolbarItemName,
        componentRegistration: IToolbarItemRegistration
    ) => {
        let beSelected: boolean = false
        if (componentRegistration.config.type === ToolbarItemType.Selector) {
            if (selected === componentRegistration.config.name) {
                beSelected = true
            }
        } else if (
            componentRegistration.config.type === ToolbarItemType.Switch
        ) {
            if (componentRegistration.config.isSelected) {
                beSelected = true
            }
        }
        return beSelected
    }

    const groups = _(props.items)
        .filter((item) => {
            if (item.config.use === ToolbarItemUse.Both) {
                return true
            } else {
                return props.appMode === item.config.use
            }
        })
        .groupBy('config.group')
        .values()
        .value()

    return (
        <div className="p-1.5" role="toolbar">
            <div className="flex">
                {groups.map((items, idx) => (
                    <div key={idx} className="flex border-r border-white/10 pr-2.5 mr-2" role="group">
                        {items.map((registration) => {
                            const isLocked =
                                !!registration.config.toBeLocked && props.isLocked
                            const toolbarItemProps: IToolbarItemProps = {
                                ...registration.config,
                                actions: props.actions,
                                project: props.project,
                                active: isLocked
                                    ? false
                                    : isComponentActive(selectedItem, registration),
                                isLocked: isLocked,
                                onClick: onToolbarItemSelected,
                            }
                            const ToolbarItem = registration.component

                            return (
                                <ToolbarItem
                                    key={toolbarItemProps.name}
                                    {...toolbarItemProps}
                                />
                            )
                        })}
                    </div>
                ))}
                <div className="relative inline-flex items-center ml-auto mr-1.5">
                    <ToggleSwitch
                        labels={['ON', 'OFF']}
                        isLocked={props.isLocked}
                        onClick={props.onToggleClicked}
                    />
                </div>
            </div>
        </div>
    )
}
