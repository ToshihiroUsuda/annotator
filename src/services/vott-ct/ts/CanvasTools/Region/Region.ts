import { Rect } from '../Core/Rect'
import { RegionData } from '../Core/RegionData'
import { TagsDescriptor } from '../Core/TagsDescriptor'
import { Point2D } from '../Core/Point2D'

import { IMovable } from '../Interface/IMovable'
import { ITagsUpdateOptions } from '../Interface/ITagsUpdateOptions'
import { IRegionCallbacks } from '../Interface/IRegionCallbacks'

import { RegionComponent } from './Component/RegionComponent'

/* import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE; */

export abstract class Region extends RegionComponent {
    /**
     * Reference to the tags descriptor object.
     */
    public tags: TagsDescriptor

    /**
     * External region ID. E.g., used in the `RegionsManager`.
     */
    public ID: string

    /**
     * Internal region ID. Used to simplify debugging and for styling.
     */
    public regionID: string

    /**
     * Building blocks of the region component.
     */
    protected UI: RegionComponent[]

    /**
     * Internal id to insert/track stylesheets.
     */
    protected styleID: string

    /**
     * The reference to the CSSStyleSheet object.
     */
    protected styleSheet: CSSStyleSheet

    /**
     * Configuration to draw/redraw tags.
     */
    protected tagsUpdateOptions: ITagsUpdateOptions

    /**
     * Creates new `Region` object.
     * @param paper - The `Snap.Paper` object to draw on.
     * @param paperRect - The parent bounding box for created component.
     * @param regionData - The `RegionData` object shared across components. Used also for initial setup.
     * @param callbacks - The external callbacks collection.
     * @param id - The region `id` used to identify regions in `RegionsManager`.
     * @param tagsDescriptor - The descriptor of region tags.
     * @param tagsUpdateOptions - The drawing options for tags.
     */
    constructor(
        paper: Snap.Paper,
        paperRect: Rect,
        regionData: RegionData,
        callbacks: IRegionCallbacks,
        id: string,
        tagsDescriptor: TagsDescriptor,
        tagsUpdateOptions: ITagsUpdateOptions = { showRegionBackground: true }
    ) {
        super(paper, paperRect, regionData, Object.assign({}, callbacks))

        this.ID = id
        this.tags = tagsDescriptor

        this.regionID = this.s8()
        this.styleID = `region_${this.regionID}_style`
        this.styleSheet = this.insertStyleSheet()
        this.tagsUpdateOptions = tagsUpdateOptions

        this.UI = []

        const onChange = this.callbacks.onChange
        this.callbacks.onChange = (
            _region: RegionComponent,
            regionData: RegionData,
            ...args
        ) => {
            this.regionData.initFrom(regionData)
            this.redraw()
            onChange(this, this.regionData, ...args)
        }
    }

    /**
     * Clear region styles.
     */
    public removeStyles() {
        const styleElement = document.getElementById(this.styleID)
        if (styleElement) {
            styleElement.remove()
        }
    }

    /**
     * Updates region tags.
     * @param tags - The new tags descriptor object.
     * @param options - The tags drawing options.
     */
    public updateTags(
        tags: TagsDescriptor,
        options: ITagsUpdateOptions = { showRegionBackground: true }
    ) {
        this.tags = tags
        this.tagsUpdateOptions = options
    }

    /**
     * Move region to specified location.
     * @param point - New region location.
     */
    public move(point: IMovable): void

    /**
     * Move region to specified coordinates.
     * @param x - New x-coordinate.
     * @param y - New y-coordinate.
     */
    public move(x: number, y: number): void
    public move(arg1: IMovable | number, arg2?: number) {
        if (typeof arg1 === 'number' && typeof arg2 === 'number') {
            super.move(arg1, arg2)
        } else if (typeof arg1 !== 'number') {
            super.move(arg1.x, arg1.y)
        }
        this.redraw()
    }

    /**
     * Resizes the region to specified `width` and `height`.
     * @param width - The new region width.
     * @param height - The new region height.
     */
    public resize(width: number, height: number) {
        super.resize(width, height)
        this.redraw()
    }

    /**
     * Redraws the region component.
     */
    public redraw() {
        this.UI.forEach((element) => {
            element.redraw()
        })
    }

    /**
     * Visually freeze the region.
     */
    public freeze() {
        super.freeze()
        this.node.addClass('old')
        this.UI.forEach((element) => {
            element.freeze()
        })
    }

    /**
     * Visually unfreeze the region.
     */
    public unfreeze() {
        super.unfreeze()
        this.node.removeClass('old')
        this.UI.forEach((element) => {
            element.unfreeze()
        })
    }

    public hide() {
        super.hide()
        this.UI.forEach((element) => {
            element.hide()
        })
    }

    public blind() {
        super.blind()
        this.UI.forEach((element) => {
            element.blind()
        })
    }

    public show() {
        super.show()
        this.UI.forEach((element) => {
            element.show()
        })
    }

    public lock() {
        super.lock()
        this.node.addClass('old')
        this.UI.forEach((element) => {
            element.lock()
        })
    }

    /**
     * Visually unfreeze the region.
     */
    public unlock() {
        super.unlock()
        this.node.removeClass('old')
        this.UI.forEach((element) => {
            element.unlock()
        })
    }

    public containsPoint(point: Point2D): boolean {
        return this.boundRect.containsPoint(point)
    }

    /**
     * Internal helper function to generate random id.
     */
    protected s8() {
        return Math.floor((1 + Math.random()) * 0x100000000)
            .toString(16)
            .substring(1)
    }

    /**
     * Helper function to insert a new stylesheet into the document.
     */
    private insertStyleSheet(): CSSStyleSheet {
        const style = document.createElement('style')
        style.setAttribute('id', this.styleID)
        document.head.appendChild(style)
        return style.sheet as CSSStyleSheet
    }
}
