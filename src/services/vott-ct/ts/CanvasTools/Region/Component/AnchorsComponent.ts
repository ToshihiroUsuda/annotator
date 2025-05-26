/* eslint-disable @typescript-eslint/no-unused-vars */
import { Point2D } from '../../Core/Point2D'
import { Rect } from '../../Core/Rect'
import { RegionData } from '../../Core/RegionData'

import { IEventDescriptor } from '../../Interface/IEventDescriptor'
import {
    ChangeEventType,
    IRegionCallbacks,
} from '../../Interface/IRegionCallbacks'

import { RegionComponent } from './RegionComponent'

/**
 * An abstract visual component used internall to draw anchor points that allow
 * region points moving and this component resizing.
 */
export abstract class AnchorsComponent extends RegionComponent {
    /**
     * Default radius for anchor poitns. Can be redefined through CSS styles.
     */
    public static DEFAULT_ANCHOR_RADIUS = 3

    /**
     * Defailt radius for the ghost anchor, used activate dragging. Can be redefined through CSS styles.
     */
    public static DEFAULT_GHOST_ANCHOR_RADIUS = 7

    /**
     * The array of anchors.
     */
    protected anchors: Snap.Element[]

    /**
     * The grouping element for anchors.
     */
    protected anchorsNode: Snap.Element

    /**
     * The ghost anchor.
     */
    protected ghostAnchor!: Snap.Element

    /**
     * The index of currently active anchor.
     * 0 - none
     * 1, 2, ... - one of point anchors
     * -1, -2, ... - one of bone anchors
     */
    protected activeAnchorIndex: number = 0

    /**
     * The coordinates of the origin point on dragging.
     */
    protected dragOrigin!: Point2D

    /**
     * Dragging state of the component.
     */
    protected isDragged: boolean = false

    /**
     * Creates a new `AnchorsComponent` object.
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
        this.node = this.paper.g()
        this.node.addClass('anchorsLayer')
        this.anchors = []
        this.anchorsNode = this.paper.g()
        this.node.add(this.anchorsNode)

        this.buildAnchors()
    }

    /**
     * Redraws the visual on the component.
     */
    public redraw() {
        if (
            this.regionData.points !== null &&
            this.regionData.points.length > 0
        ) {
            window.requestAnimationFrame(() => {
                this.regionData.points.forEach((p, index) => {
                    this.anchors[index].attr({
                        cx: p.x,
                        cy: p.y,
                    })
                })
            })
        }
    }

    /**
     * Switches the component to the frozen state.
     */
    public freeze() {
        super.freeze()
    }

    public lock() {
        super.lock()
    }
    /**
     * Creates a collection on anchors.
     */
    protected buildAnchors() {
        this.buildPointAnchors()
        this.buildGhostAnchor()

        this.subscribeToEvents([
            {
                event: 'pointerleave',
                base: this.node.node,
                listener: (
                    e: PointerEvent | MouseEvent | KeyboardEvent | WheelEvent
                ) => {
                    if (e instanceof PointerEvent && !this.isDragged) {
                        window.requestAnimationFrame(() => {
                            this.ghostAnchor.attr({
                                display: 'none',
                            })
                        })
                    }
                },
                bypass: true,
            },
        ])
    }

    /**
     * Creates a collection of anchor points.
     */
    protected buildPointAnchors() {
        this.regionData.points.forEach((point, index) => {
            const anchor = this.createAnchor(this.paper, point.x, point.y)
            this.anchors.push(anchor)
            this.anchorsNode.add(anchor)

            this.subscribeAnchorToEvents(anchor, index + 1)
        })
    }

    /**
     * Creates the ghost anchor.
     */
    protected buildGhostAnchor() {
        this.ghostAnchor = this.createAnchor(
            this.paper,
            0,
            0,
            'ghost',
            AnchorsComponent.DEFAULT_GHOST_ANCHOR_RADIUS
        )
        this.ghostAnchor.attr({
            display: 'none',
        })

        this.node.add(this.ghostAnchor)
        this.subscribeGhostToEvents()
    }

    /**
     * Helper function to subscribe anchor to activation event.
     * @param anchor - The anchor for wire up.
     * @param index - The index of the anchor used to define which one is active.
     */
    protected subscribeAnchorToEvents(anchor: Snap.Element, index: number) {
        this.subscribeToEvents([
            {
                event: 'pointerenter',
                base: anchor.node,
                listener: (e: Event) => {
                    if (e instanceof PointerEvent) {
                        this.activeAnchorIndex = index
                        const anchorPoint = this.getActiveAnchorPoint(e)
                        if (anchorPoint) {
                            window.requestAnimationFrame(() => {
                                this.ghostAnchor.attr({
                                    cx: anchorPoint.x,
                                    cy: anchorPoint.y,
                                    display: 'block',
                                })
                            })
                        }
                    }
                },
                bypass: false,
            },
        ])
    }

    /**
     * Helper function to create a new anchor.
     * @param paper - The `Snap.Paper` object to draw on.
     * @param x - The `x`-coordinate of the acnhor.
     * @param y - The `y`-coordinate of the anchor.
     * @param style - Additional css style class to be applied.
     * @param r - The radius of the anchor.
     */
    protected createAnchor(
        paper: Snap.Paper,
        x: number,
        y: number,
        style?: string,
        r: number = AnchorsComponent.DEFAULT_ANCHOR_RADIUS
    ): Snap.Element {
        const a = paper.circle(x, y, r)
        a.addClass('anchorStyle')
        if (style !== undefined && style !== '') {
            a.addClass(style)
        }
        return a
    }

    /**
     * Updated the `regionData` based on the new ghost anchor location. Should be redefined in child classes.
     * @param p - The new ghost anchor location.
     */
    protected abstract updateRegion(p: Point2D): void

    /**
     * Callback for the pointerenter event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerEnter(_e: Event): void {
        // do nothing
    }

    /**
     * Callback for the pointerleave event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerLeave(_e: Event): void {
        if (!this.isDragged) {
            window.requestAnimationFrame(() => {
                this.ghostAnchor.attr({
                    display: 'none',
                })
            })
        }
    }

    /**
     * Callback for the pointerdown event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerDown(e: Event): void {
        if (!(e instanceof PointerEvent)) return
        this.ghostAnchor.node.setPointerCapture(e.pointerId)
        const svg = (e.target as Element).closest('svg')
        if (!svg) return

        const rect = svg.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const offsetY = e.clientY - rect.top
        this.dragOrigin = new Point2D(offsetX, offsetY)

        this.isDragged = true
        if (this.callbacks) {
            this.callbacks?.onManipulationLockRequest?.(this)
            this.callbacks?.onChange?.(
                this,
                this.regionData.copy(),
                ChangeEventType.MOVEBEGIN
            )
        }
    }

    /**
     * Callback for the pointermove event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerMove(e: Event): void {
        if (!(e instanceof PointerEvent)) return
        if (this.isDragged) {
            const svg = (e.target as Element).closest('svg')
            if (!svg) return

            const rect = svg.getBoundingClientRect()
            const offsetX = e.clientX - rect.left
            const offsetY = e.clientY - rect.top

            const dx = offsetX - this.dragOrigin.x
            const dy = offsetY - this.dragOrigin.y

            if (this.activeAnchorIndex !== 0) {
                const anchorPoint = this.getActiveAnchorPoint(e)
                if (anchorPoint) {
                    let p = new Point2D(anchorPoint.x + dx, anchorPoint.y + dy)

                    if (this.paperRect !== null) {
                        p = p.boundToRect(this.paperRect)
                    }
                    window.requestAnimationFrame(() => {
                        this.ghostAnchor.attr({ cx: p.x, cy: p.y })
                    })

                    this.updateRegion(p)
                }
            }

            this.dragOrigin = new Point2D(offsetX, offsetY)
        }
    }

    /**
     * Callback for the pointerup event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerUp(e: Event): void {
        if (!(e instanceof PointerEvent)) return
        this.ghostAnchor.node.releasePointerCapture(e.pointerId)
        if (this.callbacks) {
            this.callbacks?.onManipulationLockRelease?.(this)
            this.callbacks?.onChange?.(
                this,
                this.regionData.copy(),
                ChangeEventType.MOVEEND
            )
        }
        this.activeAnchorIndex = 0
        this.dragOrigin = new Point2D(0, 0)
        this.isDragged = false
        window.requestAnimationFrame(() => {
            this.ghostAnchor.attr({
                display: 'none',
            })
        })
    }

    /**
     * Subscribe event listeners on the ghost anchor
     */
    protected subscribeGhostToEvents() {
        const listeners: IEventDescriptor[] = [
            {
                event: 'pointerenter',
                base: this.ghostAnchor.node,
                listener: this.onGhostPointerEnter,
                bypass: false,
            },
            {
                event: 'pointerleave',
                base: this.ghostAnchor.node,
                listener: this.onGhostPointerLeave,
                bypass: false,
            },
            {
                event: 'pointerdown',
                base: this.ghostAnchor.node,
                listener: this.onGhostPointerDown,
                bypass: false,
            },
            {
                event: 'pointerup',
                base: this.ghostAnchor.node,
                listener: this.onGhostPointerUp,
                bypass: false,
            },
            {
                event: 'pointermove',
                base: this.ghostAnchor.node,
                listener: this.onGhostPointerMove,
                bypass: false,
            },
        ]

        this.subscribeToEvents(listeners)
    }

    /**
     * Returns `Point2D` with coordinates of active anchor
     */
    protected getActiveAnchorPoint(_e?: Event): Point2D | null {
        if (
            this.activeAnchorIndex > 0 &&
            this.regionData.points.length >= this.activeAnchorIndex
        ) {
            return this.regionData.points[this.activeAnchorIndex - 1]
        }
        return null
    }

    protected subscribeToEvents(events: IEventDescriptor[]) {
        events.forEach((event) => {
            const listener = (e: Event) => {
                if (e instanceof PointerEvent) {
                    ;(event.listener as (e: PointerEvent) => void)(e)
                }
            }
            event.base.addEventListener(event.event, listener as EventListener)
        })
    }
}
