import { Rect } from '../Core/Rect'
import { RegionData } from '../Core/RegionData'

import { IMovable } from '../Interface/IMovable'
import { IRegionCallbacks } from '../Interface/IRegionCallbacks'

import { RegionComponent } from './Component/RegionComponent'
import { Region } from './Region'

import _ from 'lodash'

import Snap from 'snapsvg-cjs'

/**
 * The region menu element.
 */
export class MenuElement extends RegionComponent {
    /**
     * The SVG path for x-button (close).
     */
    public static PathCollection = {
        delete: {
            iconSize: 96,
            path:
                'M 83.4 21.1 L 74.9 12.6 L 48 39.5 L 21.1 12.6 L 12.6 21.1 L 39.5 48 L 12.6 74.9 ' +
                'L 21.1 83.4 L 48 56.5 L 74.9 83.4 L 83.4 74.9 L 56.5 48 Z',
        },
        info: {
            iconSize: 96,
            path:
                'M 34.0 20.0 A 5.0 5.0 0 1 1 60.0 20.0 A 5.0 5.0 0 1 1 34.0 20.0 Z ' +
                'M 26.0 40.0 L 60.0 40.0 L 60.0 80.0 L 75.0 80.0 L 75.0 85.0 L 22.0 85.0 L 22.0 80.0 L 36.0 80.0 L 36.0 45.0 L 26.0 45.0 Z',
        },
    }

    /**
     * Menu group object.
     */
    // public menuGroup: Snap.Paper;
    public menuGroups: { [action: string]: Snap.Paper } = {}

    /**
     * Menu background rect.
     */
    // public menuRect: Snap.Element;

    /**
     * Reference to the grouping object for menu items.
     */
    // public menuItemsGroup: Snap.Element;

    /**
     * Menu items collection.
     */
    public menuItems: Snap.Element[] = []

    /**
     * Default menu item size.
     */
    private menuItemSize: number = 20

    /**
     * Menu x-coordinate.
     */
    private mx: number = 0

    /**
     * Menu y-coordinate.
     */
    private my: number = 0

    /**
     * Default menu width.
     */
    private mw: number = this.menuItemSize + 10

    /**
     * Default menu height.
     */
    private mh: number = this.menuItemSize + 10

    /**
     * Threshold for positioning menu inside/outside
     */
    private dh: number = 20

    /**
     * Threshold for positioning menu left/right
     */
    private dw: number = 5

    /**
     * Reference to the host region element.
     */
    private region: RegionComponent | null = null

    private hidden: boolean = false

    /**
     * Creates the menu component.
     * @param paper - The `Snap.Paper` object to draw on.
     * @param paperRect - The parent bounding box for created component.
     * @param regionData - The `RegionData` object shared across components. Used also for initial setup.
     * @param callbacks - The external callbacks collection.
     */
    constructor(
        paper: Snap.Paper,
        paperRect: Rect,
        regionData: RegionData,
        callbacks: IRegionCallbacks
    ) {
        super(paper, paperRect, regionData, callbacks)
        this.buildUI()
    }

    /**
     * Add a new icon with action to menu.
     * @param action - Item action description.
     * @param icon - Item SVG-path string.
     * @param actor - The callback function.
     */
    public addAction(
        action: keyof typeof MenuElement.PathCollection,
        icon: string,
        actor: (component: RegionComponent, action?: string) => void
    ) {
        const item = this.menuGroups[action].g()
        const itemBack = this.menuGroups[action].rect(
            5,
            5,
            this.menuItemSize,
            this.menuItemSize,
            5,
            5
        )
        itemBack.addClass('menuItemBack')

        const itemIcon = this.menuGroups[action].path(
            MenuElement.PathCollection[action].path
        )
        itemIcon.transform(`scale(0.2) translate(26 26)`)

        itemIcon.addClass('menuIcon')
        itemIcon.addClass('menuIcon-' + icon)

        const itemRect = this.menuGroups[action].rect(
            5,
            5,
            this.menuItemSize,
            this.menuItemSize,
            5,
            5
        )
        itemRect.addClass('menuItem')

        item.add(itemBack)
        item.add(itemIcon)
        item.add(itemRect)

        item.click(() => {
            actor(this.region!, action)
        })
    }

    /**
     * Attach the menu to specified region element.
     * @param region - The host region element.
     */
    public attachTo(region: Region) {
        this.region = region
        this.regionData.initFrom(region.regionData)
        this.rearrangeMenuPosition()

        this.setPosition()
        // window.requestAnimationFrame(() => {
        //     let sy = 0;
        //     _.keys(this.menuGroups).forEach((action) => {
        //         this.menuGroups[action].attr({
        //             x: this.mx,
        //             y: this.my + sy,
        //         });
        //         sy += this.mh;
        //     });
        // });
    }

    /**
     * Move menu according to new region location
     * @remarks This method moves the virtual shadow of the region and then rearranges menu position.
     * @param point - New region location.
     */
    public move(point: IMovable): void

    /**
     * Move menu according to new region coordinates.
     * @remarks This method moves the virtual shadow of the region and then rearranges menu position.
     * @param x - New region x-coordinate.
     * @param y - New region y-coordinate.
     */
    public move(x: number, y: number): void
    public move(arg1: IMovable | number, arg2?: number): void {
        if (typeof arg1 === 'number' && typeof arg2 === 'number') {
            super.move(arg1, arg2)
        } else if (typeof arg1 === 'object') {
            super.move(arg1)
        }

        this.rearrangeMenuPosition()

        this.setPosition()
        // window.requestAnimationFrame(() => {
        //     this.menuGroups[action].attr({
        //         x: this.mx,
        //         y: this.my,
        //     });
        // });
    }

    /**
     * Move menu according to new region size.
     * @remarks This method moves the virtual shadow of the region and then rearranges menu position.
     * @param width - New region width.
     * @param height - New region height.
     */
    public resize(width: number, height: number) {
        super.resize(width, height)

        this.rearrangeMenuPosition()
        this.setPosition()
        // window.requestAnimationFrame(() => {
        //     this.menuGroups[action].attr({
        //         x: this.mx,
        //         y: this.my,
        //     });
        // });
    }

    public setHidden(hidden: boolean) {
        this.hidden = hidden
        if (hidden) {
            this.hide()
        } else {
            this.show()
        }
    }

    /**
     * Redraw menu element.
     */
    public redraw() {
        // do nothing
    }

    /**
     * Visually hide menu element.
     */
    public hide() {
        window.requestAnimationFrame(() => {
            _.keys(this.menuGroups).forEach((action) => {
                this.menuGroups[action].attr({
                    visibility: 'hidden',
                })
            })
        })
    }

    /**
     * Visually show menu element.
     */
    public show() {
        window.requestAnimationFrame(() => {
            _.keys(this.menuGroups).forEach((action) => {
                this.menuGroups[action].attr({
                    visibility: this.hidden ? 'hidden' : 'visible',
                })
            })
        })
    }

    /**
     * Show menu element on the specified region.
     * @param region - The host region element.
     */
    public showOnRegion(region: Region) {
        this.attachTo(region)
        this.show()
    }

    /**
     * Creates the menu element UI.
     */
    private buildUI() {
        _.keys(MenuElement.PathCollection).forEach((action) => {
            const menuSVG = this.paper.svg(
                0,
                0,
                this.mw,
                this.mh,
                0,
                0,
                this.mw,
                this.mh
            ) as SVGGraphicsElement
            const paper = Snap(menuSVG).paper
            if (paper) {
                this.menuGroups[action] = paper
                this.menuGroups[action].addClass('menuLayer')

                this.rearrangeMenuPosition()

                // this.menuRect = this.menuGroup.rect(0, 0, this.mw, this.mh, 5, 5);
                const menuRect = this.menuGroups[action].rect(
                    0,
                    0,
                    this.mw,
                    this.mh,
                    5,
                    5
                )
                menuRect.addClass('menuRectStyle')

                const menuItemsGroup = this.menuGroups[action].g()
                menuItemsGroup.addClass('menuItems')

                this.menuItems = new Array<Snap.Element>()

                this.menuGroups[action].add(menuRect)
                this.menuGroups[action].add(menuItemsGroup)

                this.menuGroups[action].mouseover(() => {
                    this.callbacks.onManipulationBegin()
                })

                this.menuGroups[action].mouseout(() => {
                    this.callbacks.onManipulationEnd()
                })
            }
        })
    }

    /**
     * Updates menu position.
     */
    private rearrangeMenuPosition() {
        /* // position menu inside
        if (this.mh <= this.boundRect.height - this.dh) {
            this.my = this.y + this.boundRect.height / 2 - this.mh / 2;
            // position menu on the right side
            if (this.x + this.boundRect.width + this.mw / 2 + this.dw < this.paperRect.width) {
                this.mx = this.x + this.boundRect.width - this.mw / 2;
            } else if (this.x - this.mw / 2 - this.dw > 0) { // position menu on the left side
                this.mx = this.x - this.mw / 2;
            } else { // position menu on the right side INSIDE
                this.mx = this.x + this.boundRect.width - this.mw - this.dw;
            }
        } else { // position menu outside
            if (this.y + this.mh > this.paperRect.height) {
                this.my = this.paperRect.height - this.mh - this.dw;
            } else {
                this.my = this.y;
            }
            // position menu on the right side
            if (this.x + this.boundRect.width + this.mw + 2 * this.dw < this.paperRect.width) {
                this.mx = this.x + this.boundRect.width + this.dw;
            } else if (this.x - this.mw - 2 * this.dw > 0) { // position menu on the left side
                this.mx = this.x - this.mw - this.dw;
            } else { // position menu on the right side INSIDE
                this.mx = this.x + this.boundRect.width - this.mw - this.dw;
            }
        } */

        // position menu outside
        if (this.y + this.mh + this.dw > this.paperRect.height) {
            this.my = this.paperRect.height - this.mh - this.dw
        } else {
            this.my = this.y + this.dw
        }
        // position menu on the right side
        if (
            this.x + this.boundRect.width + this.mw + 2 * this.dw <
            this.paperRect.width
        ) {
            this.mx = this.x + this.boundRect.width + this.dw
        } else if (this.x - this.mw - 2 * this.dw > 0) {
            // position menu on the left side
            this.mx = this.x - this.mw - this.dw
        } else {
            // position menu on the right side INSIDE
            this.mx = this.x + this.boundRect.width - this.mw - this.dw
        }
    }

    private setPosition() {
        window.requestAnimationFrame(() => {
            let sy = 0
            _.keys(this.menuGroups).forEach((action) => {
                this.menuGroups[action].attr({
                    x: this.mx,
                    y: this.my + sy,
                })
                sy += this.mh + 1
            })
        })
    }
}
