import Guard from '../../common/guard'
import {
    IToolbarItemMetadata,
    ToolbarItem,
} from '../../components/pages/editor/toolbar/toolbarItem'

/**
 * Interface for registering toolbar items
 */
export interface IToolbarItemRegistration {
    component: typeof ToolbarItem
    config: IToolbarItemMetadata
}

/**
 * @name - Toolbar Item Factory
 * @description - Creates instance of Toolbar Items based on specified options
 */
export class ToolbarItemFactory {
    /**
     * Register Toolbar Item for use in editor page
     * @param component - React component ToolbarItem
     * @param config - Configuration of ToolbarItem
     */
    public static register(
        config: IToolbarItemMetadata,
        component: typeof ToolbarItem = ToolbarItem
    ) {
        Guard.null(component)
        Guard.null(config)

        ToolbarItemFactory.componentRegistry.push({ component, config })
    }

    /**
     * Get all registered Toolbar Items
     */
    public static getToolbarItems() {
        ToolbarItemFactory.componentRegistry =
            ToolbarItemFactory.componentRegistry.map((registration) => {
                if (registration.config.isSelected) {
                    return {
                        ...registration,
                        config: { ...registration.config, isSelected: false },
                    }
                } else {
                    return registration
                }
            })
        return [...ToolbarItemFactory.componentRegistry]
    }

    /**
     * Clear ToolbarItem Registry
     */
    public static reset(): void {
        ToolbarItemFactory.componentRegistry = []
    }

    private static componentRegistry: IToolbarItemRegistration[] = []
}
