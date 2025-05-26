import { strings } from './common/strings'
import { ToolbarItemType } from './components/pages/editor/toolbar/toolbarItem'
import { ToolbarItemFactory } from './providers/toolbar/toolbarItemFactory'

export enum ToolbarItemName {
    SelectCanvas = 'selectCanvas',
    DrawRectangle = 'drawRectangle',
    DrawPolygon = 'drawPolygon',
    DrawPolyline = 'drawPolyline',
    TrackRegions = 'trackRegions',
    InterpolateRegions = 'interpolateRegions',
    CopyRegions = 'copyRegions',
    CutRegions = 'cutRegions',
    PasteRegions = 'pasteRegions',
    RemoveAllRegions = 'removeAllRegions',
    PreviousAsset = 'navigatePreviousAsset',
    NextAsset = 'navigateNextAsset',
    SaveProject = 'saveProject',
    ImportAsset = 'importAsset',
    ExportAsset = 'exportAsset',
    ExportProject = 'exportProject',
    ActiveLearning = 'activeLearning',
    EnableDoubleCheckMode = 'enableDoubleCheckMode',
    ZoomIn = 'zoomIn',
    ZoomOut = 'zoomOut',
    InputComment = 'inputComment',
    InputStep = 'inputStep',
    LockSample = 'lockSample',
    LockRectangle = 'lockRectangle',
    HideRegionMenu = 'hideRegionMenu',
    ForceShow = 'forceShow',
}

export enum ToolbarItemGroup {
    Canvas = 'canvas',
    Regions = 'regions',
    Navigation = 'navigation',
    Processing = 'processing',
    Project = 'project',
}

export enum ToolbarItemUse {
    Both = 'both',
    Hospital = 'hospital',
    Internal = 'internal',
}
/**
 * Registers items for toolbar
 */
export default function registerToolbar() {
    ToolbarItemFactory.register({
        name: ToolbarItemName.SelectCanvas,
        tooltip: strings.editorPage.toolbar.select,
        icon: 'fa-mouse-pointer',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Selector,
        accelerators: ['V', 'v'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: 'fa-vector-square',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Selector,
        accelerators: ['R', 'r'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolygon,
        tooltip: strings.editorPage.toolbar.drawPolygon,
        icon: 'fa-draw-polygon',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Selector,
        accelerators: ['P', 'p'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolyline,
        tooltip: 'Draw Polyline',
        icon: 'fa-project-diagram',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Selector,
        accelerators: ['L', 'l'],
        toBeLocked: true,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.EnableDoubleCheckMode,
        tooltip: 'Enable double check mode',
        icon: 'fa-user-friends',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Switch,
        accelerators: ['CmdOrCtrl+D', 'CmdOrCtrl+d'],
        toBeLocked: false,
        isSelected: false,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.TrackRegions,
        tooltip: strings.editorPage.toolbar.trackRegions,
        icon: 'far fa-clone',
        group: ToolbarItemGroup.Processing,
        type: ToolbarItemType.Switch,
        accelerators: ['T', 't'],
        toBeLocked: true,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.InterpolateRegions,
        tooltip: strings.editorPage.toolbar.interpolateRegions,
        icon: 'far fa-object-ungroup',
        group: ToolbarItemGroup.Processing,
        type: ToolbarItemType.Trigger,
        accelerators: ['I', 'i'],
        toBeLocked: true,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ZoomIn,
        tooltip: strings.editorPage.toolbar.select,
        icon: 'fa-search-plus',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+ArrowUp'],
        toBeLocked: false,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ZoomOut,
        tooltip: strings.editorPage.toolbar.select,
        icon: 'fa-search-minus',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+ArrowDown'],
        toBeLocked: false,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.RemoveAllRegions,
        tooltip: strings.editorPage.toolbar.removeAllRegions,
        icon: 'fa-ban',
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+Delete', 'CmdOrCtrl+Backspace'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.InputComment,
        tooltip: 'Input Comment',
        icon: 'fa-comment-dots',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+o'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.InputStep,
        tooltip: 'Input Step',
        icon: 'fa-info-circle',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+j'],
        toBeLocked: true,
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        tooltip: strings.editorPage.toolbar.previousAsset,
        icon: 'fas fa-arrow-circle-up',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Trigger,
        accelerators: ['ArrowUp', 'W', 'w'],
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: 'fas fa-arrow-circle-down',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Trigger,
        accelerators: ['ArrowDown', 'S', 's'],
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: 'fa-save',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+S', 'CmdOrCtrl+s'],
        use: ToolbarItemUse.Both,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ImportAsset,
        tooltip: 'Import Asset',
        icon: 'fa-file-import',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+I', 'CmdOrCtrl+i'],
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExportAsset,
        tooltip: 'Export Asset',
        icon: 'fa-file-export',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['CmdOrCtrl+E', 'CmdOrCtrl+e'],
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExportProject,
        tooltip: 'Export Project',
        icon: 'fa-file-csv',
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Trigger,
        accelerators: ['Alt+E', 'Alt+e'],
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.LockSample,
        tooltip: 'Lock Sample',
        icon: 'far fa-lock',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Switch,
        accelerators: ['Alt+L', 'Alt+l'],
        toBeLocked: false,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.LockRectangle,
        tooltip: 'Lock Rectangle',
        icon: 'far fa-user-lock',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Switch,
        accelerators: ['Alt+K', 'Alt+k'],
        toBeLocked: false,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.HideRegionMenu,
        tooltip: 'Hide Region Menu',
        icon: 'far fa-window-close',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Switch,
        accelerators: ['Alt+H', 'Alt+h'],
        toBeLocked: false,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })

    ToolbarItemFactory.register({
        name: ToolbarItemName.ForceShow,
        tooltip: 'Show Region Forcibly',
        icon: 'far fa-eye',
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Switch,
        accelerators: ['Shift+C', 'Shift+c'],
        toBeLocked: false,
        isSelected: false,
        use: ToolbarItemUse.Internal,
    })
}
