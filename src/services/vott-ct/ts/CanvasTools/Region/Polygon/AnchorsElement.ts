import { Point2D } from '../../Core/Point2D'
import { Rect } from '../../Core/Rect'
import { RegionData } from '../../Core/RegionData'

import {
    ChangeEventType,
    IRegionCallbacks,
} from '../../Interface/IRegionCallbacks'

import { AnchorsComponent } from '../Component/AnchorsComponent'

import { PolylineSelector } from '../../Selection/Selectors/PolylineSelector'

/**
 * `AnchorsComponent` for the `PolygonRegion` class.
 */
export class AnchorsElement extends AnchorsComponent {
    /**
     * Default threshold distance to define whether ctrl-pointer click is on point or line.
     */
    public static ANCHOR_POINT_LINE_SWITCH_THRESHOLD: number = 5

    /**
     * Default threshold distance to define whether ctrl-pointer click is on point or line.
     */
    public static MODIFY_POINT_SUBMIT_THRESHOLD: number = 10

    /**
     * Internal flag to delete a point on pointer up event.
     */
    private deleteOnPointerUp: boolean = false

    /**
     * Internal flat to add a point on pointer up event.
     */
    private addOnPointerUp: boolean = false

    /**
     * Internal flag to modify a point on pointer up event.
     */
    private modifyOnPointerUp: boolean = false

    /**
     * Current number of anchors.
     */
    private anchorsLength: number

    /**
     * Reference to the polyline object, used to trigger adding/deleting points.
     */
    private anchorsPolyline!: Snap.Element

    /**
     * 線の修正用のSelector
     */
    private selector: PolylineSelector

    /**
     * 修正中かどうかのFlag
     */
    private isModifying: boolean = false

    /**
     * 修正スタート時のindex
     */
    // private modifyBeginIndex: number = -1;

    /**
     * Creates a new `AnchorsElement` object.
     * @param paper - The `Snap.Paper` object to draw on.
     * @param paperRect - The parent bounding box for created component.
     * @param regionData - The `RegionData` object shared across components. Used also for initial setup.
     * @param callbacks - The external callbacks collection.
     */
    constructor(
        paper: Snap.Paper,
        paperRect: Rect,
        regionData: RegionData,
        callbacks: IRegionCallbacks,
        selector: PolylineSelector
    ) {
        super(paper, paperRect, regionData, callbacks)
        this.anchorsLength = regionData.points.length
        this.selector = selector
    }

    /**
     * Redraws the componnent.
     */
    public redraw() {
        if (
            this.regionData.points !== null &&
            this.regionData.points.length > 0
        ) {
            const points = this.regionData.points
            // rebuild anchors
            if (this.anchorsLength !== points.length) {
                window.requestAnimationFrame(() => {
                    this.anchors.forEach((anchor) => {
                        anchor.remove()
                    })
                    this.anchors = []
                    this.buildPointAnchors()
                })

                this.anchorsLength = points.length
            } else {
                window.requestAnimationFrame(() => {
                    this.regionData.points.forEach((p, index) => {
                        this.anchors[index].attr({
                            cx: p.x,
                            cy: p.y,
                        })
                    })
                })
            }

            const pointsData = []
            this.regionData.points.forEach((p) => {
                pointsData.push(p.x, p.y)
            })
            pointsData.push(
                this.regionData.points[0].x,
                this.regionData.points[0].y
            )

            this.anchorsPolyline.attr({
                points: pointsData.toString(),
            })
        }
    }

    /**
     * Creates a collection on anchors.
     */
    protected buildAnchors() {
        this.buildPolylineAnchors()
        super.buildAnchors()
    }

    /**
     * Creates a collection of anchor points.
     */
    protected buildPolylineAnchors() {
        const pointsData = []
        this.regionData.points.forEach((p) => {
            pointsData.push(p.x, p.y)
        })
        pointsData.push(
            this.regionData.points[0].x,
            this.regionData.points[0].y
        )

        this.anchorsPolyline = this.paper.polyline(pointsData)
        this.anchorsPolyline.addClass('anchorLineStyle')
        this.subscribeLineToEvents(this.anchorsPolyline)

        this.anchorsNode.add(this.anchorsPolyline)
    }

    /**
     * Subscribe an anchor to events.
     * @param anchor - The anchor to wire up with events.
     */
    protected subscribeLineToEvents(anchor: Snap.Element) {
        this.subscribeToEvents([
            {
                base: anchor.node,
                event: 'pointermove',
                listener: (
                    e: KeyboardEvent | MouseEvent | WheelEvent | PointerEvent
                ) => {
                    if (e instanceof PointerEvent && e.ctrlKey) {
                        this.activeAnchorIndex = -1
                        const anchorPoint = this.getActiveAnchorPoint(e)
                        this.dragOrigin = anchorPoint
                        this.addOnPointerUp = true
                        window.requestAnimationFrame(() => {
                            this.ghostAnchor.attr({
                                cx: anchorPoint.x,
                                cy: anchorPoint.y,
                                display: 'block',
                            })
                        })
                    } else {
                        this.addOnPointerUp = false
                    }
                },
                bypass: false,
            },
        ])
    }

    /**
     * Updated the `regionData` based on the new ghost anchor location. Should be redefined in child classes.
     * @param p - The new ghost anchor location.
     */
    protected updateRegion(p: Point2D) {
        const rd = this.regionData.copy()
        if (
            this.activeAnchorIndex > 0 &&
            this.activeAnchorIndex <= this.regionData.points.length
        ) {
            rd.setPoint(p, this.activeAnchorIndex - 1)
        }

        this.callbacks.onChange(this, rd, ChangeEventType.MOVING)
    }

    /**
     * Callback for the pointerenter event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerEnter(e: PointerEvent) {
        if (e.ctrlKey) {
            if (this.addOnPointerUp && this.activeAnchorIndex < 0) {
                this.ghostAnchor.addClass('add')
            } else if (this.regionData.points.length > 2) {
                this.ghostAnchor.addClass('delete')
                this.deleteOnPointerUp = true
                this.addOnPointerUp = false
                this.modifyOnPointerUp = false
            }
        } else if (e.altKey) {
            // Altキーを押しながら点にマウスオーバーしたら、修正モードにする
            if (this.regionData.points.length > 2) {
                this.ghostAnchor.addClass('add') // デザインはaddと同じ
                this.modifyOnPointerUp = true
                this.deleteOnPointerUp = false
                this.addOnPointerUp = false
            }
        } else {
            this.ghostAnchor.removeClass('delete')
            this.ghostAnchor.removeClass('add')
            this.deleteOnPointerUp = false
            this.modifyOnPointerUp = false
        }

        super.onGhostPointerEnter(e)
    }

    /**
     * Callback for the pointermove event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerMove(e: PointerEvent) {
        if (e.ctrlKey && this.activeAnchorIndex !== 0) {
            const p = this.getActiveAnchorPoint(e)
            let dist: number = Number.MAX_VALUE
            let index: number = -1
            this.regionData.points.forEach((point, i) => {
                const d = p.squareDistanceToPoint(point)
                if (d < dist) {
                    dist = d
                    index = i
                }
            })

            const swapToDelete: boolean =
                dist < AnchorsElement.ANCHOR_POINT_LINE_SWITCH_THRESHOLD

            if (
                this.addOnPointerUp &&
                this.activeAnchorIndex <= 0 &&
                !swapToDelete
            ) {
                this.ghostAnchor.addClass('add')
                this.activeAnchorIndex = -1
            } else if (this.regionData.points.length > 2 || swapToDelete) {
                this.ghostAnchor.removeClass('add')
                this.ghostAnchor.addClass('delete')
                this.activeAnchorIndex = index + 1
                this.deleteOnPointerUp = true
                this.addOnPointerUp = false
                this.modifyOnPointerUp = false
            }
        } else if (e.altKey && this.activeAnchorIndex !== 0) {
            // Altキーで動かしている時は近づいたら
            const p = this.getActiveAnchorPoint(e)
            let dist: number = Number.MAX_VALUE
            let index: number = -1
            this.regionData.points.forEach((point, i) => {
                const d = p.squareDistanceToPoint(point)
                if (d < dist) {
                    dist = d
                    index = i
                }
            })

            const swapToModify: boolean =
                dist < AnchorsElement.ANCHOR_POINT_LINE_SWITCH_THRESHOLD

            if (this.regionData.points.length > 2 || swapToModify) {
                this.ghostAnchor.removeClass('delete')
                this.ghostAnchor.addClass('add')
                this.activeAnchorIndex = index + 1
                this.deleteOnPointerUp = false
                this.addOnPointerUp = false
                this.modifyOnPointerUp = true
            }
        } else {
            this.ghostAnchor.removeClass('delete')
            this.ghostAnchor.removeClass('add')
            this.deleteOnPointerUp = false
            this.addOnPointerUp = false
            this.modifyOnPointerUp = false
        }

        super.onGhostPointerMove(e)
    }

    /**
     * Callback for the pointerup event for the ghost anchor.
     * @param e - PointerEvent object.
     */
    protected onGhostPointerUp(e: PointerEvent) {
        const rd = this.regionData.copy()

        if (this.deleteOnPointerUp) {
            if (
                this.activeAnchorIndex > 0 &&
                this.activeAnchorIndex <= this.regionData.points.length
            ) {
                const points = rd.points
                points.splice(this.activeAnchorIndex - 1, 1)
                rd.setPoints(points)
            }
            this.deleteOnPointerUp = false
            this.addOnPointerUp = false
            this.modifyOnPointerUp = false
            this.ghostAnchor.removeClass('delete')
            this.ghostAnchor.removeClass('add')
            this.callbacks.onChange(this, rd, ChangeEventType.MODIFIED)
        } else if (this.addOnPointerUp) {
            const svg = (e.target as Element).closest('svg')
            if (!svg) return

            const offsetX = e.clientX - svg.getBoundingClientRect().left
            const offsetY = e.clientY - svg.getBoundingClientRect().top
            const point = new Point2D(offsetX, offsetY)
            const points = rd.points

            // Find the nearest segment of polyline
            let index = 0
            let distance = Number.MAX_VALUE

            for (let i = 0; i < points.length; i++) {
                let d: number
                if (i < points.length - 1) {
                    d = this.dragOrigin.squareDistanceToLine(
                        points[i],
                        points[i + 1]
                    )
                } else {
                    d = this.dragOrigin.squareDistanceToLine(
                        points[i],
                        points[0]
                    )
                }

                if (d < distance) {
                    index = i
                    distance = d
                }
            }

            points.splice(index + 1, 0, point)
            rd.setPoints(points)

            this.deleteOnPointerUp = false
            this.addOnPointerUp = false
            this.modifyOnPointerUp = false
            this.ghostAnchor.addClass('delete')
            this.callbacks.onChange(this, rd, ChangeEventType.MODIFIED)
        } else if (this.modifyOnPointerUp) {
            if (!this.isModifying) {
                this.isModifying = true
                this.selector.enable()
                const point = rd.points[this.activeAnchorIndex - 1]
                this.selector.addPointPublic(point.x, point.y)
                // this.modifyBeginIndex = this.activeAnchorIndex - 1;
                // this.lock();
            }
            this.deleteOnPointerUp = false
            this.addOnPointerUp = false
            this.modifyOnPointerUp = false

            this.ghostAnchor.addClass('delete')
            // this.callbacks.onChange(this, rd, ChangeEventType.MOVING);
        }

        super.onGhostPointerUp(e)
    }

    /**
     * Returns `Point2D` with coordinates of active anchor
     */
    protected getActiveAnchorPoint(e: PointerEvent): Point2D {
        if (this.activeAnchorIndex > 0) {
            return this.regionData.points[this.activeAnchorIndex - 1]
        } else if (this.activeAnchorIndex < 0) {
            const svg = (e.target as Element).closest('svg')
            if (!svg) return new Point2D(0, 0)

            const offsetX = e.clientX - svg.getBoundingClientRect().left
            const offsetY = e.clientY - svg.getBoundingClientRect().top
            return new Point2D(offsetX, offsetY)
        } else {
            return new Point2D(0, 0)
        }
    }

    /**
     *  activeAncohrIndexを取得する関数
     */
    public getActiveAnchorIndex() {
        return this.activeAnchorIndex
    }

    /**
     *
     */

    public disableModifying() {
        this.isModifying = false
    }
}
