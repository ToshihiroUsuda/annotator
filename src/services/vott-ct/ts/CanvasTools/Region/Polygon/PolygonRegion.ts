import { Point2D } from '../../Core/Point2D'
import { Rect } from '../../Core/Rect'
import { RegionData } from '../../Core/RegionData'
import { TagsDescriptor } from '../../Core/TagsDescriptor'

import { ITagsUpdateOptions } from '../../Interface/ITagsUpdateOptions'
import {
    ChangeEventType,
    IRegionCallbacks,
} from '../../Interface/IRegionCallbacks'

import { RegionComponent } from '../Component/RegionComponent'
import { Region } from '../Region'
import { AnchorsElement } from './AnchorsElement'
import { DragElement } from './DragElement'
import { TagsElement } from './TagsElement'

import { ISelectorCallbacks } from '../../Interface/ISelectorCallbacks'
import { PolylineSelector } from '../../Selection/Selectors/PolylineSelector'

import Snap from 'snapsvg-cjs'
/**
 * The polygon-type region class.
 */
export class PolygonRegion extends Region {
    /**
     * Reference to the internal AnchorsElement.
     */
    private anchorNode!: AnchorsElement

    /**
     * Reference to the internal DragElement.
     */
    private dragNode!: DragElement

    /**
     * Reference to the internal TagsElement.
     */
    private tagsNode!: TagsElement

    /**
     * Reference to the tooltip element.
     */
    private toolTip!: Snap.Fragment

    /**
     * Bounding rects for the region.
     */
    private paperRects!: { host: Rect; actual: Rect }

    /**
     * 線の修正用のSelector
     */
    private selector!: PolylineSelector

    /**
     * 修正スタート時のindex
     */
    private modifyBeginIndex: number = -1

    /**
     * Creates new `PolygonRegion` object.
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
        tagsUpdateOptions?: ITagsUpdateOptions
    ) {
        super(
            paper,
            paperRect,
            regionData,
            Object.assign({}, callbacks),
            id,
            tagsDescriptor,
            tagsUpdateOptions
        )

        if (paperRect !== null) {
            this.paperRects = {
                actual: new Rect(
                    paperRect.width - regionData.width,
                    paperRect.height - regionData.height
                ),
                host: paperRect,
            }
        }

        const asCallbacks: ISelectorCallbacks = {
            onLocked: undefined,
            onSelectionBegin: this.onSelectionBegin,
            onSelectionEnd: this.onSelectionEnd,
            onUnlocked: undefined,
        }
        this.selector = new PolylineSelector(
            paper.node as unknown as SVGSVGElement,
            paper,
            paperRect ?? new Rect(0, 0),
            asCallbacks
        )
        this.selector.disable()

        this.buildOn(paper)

        const onChange = this.callbacks.onChange
        this.callbacks.onChange = (
            _region: RegionComponent,
            regionData: RegionData,
            ...args
        ) => {
            this.paperRects.actual.resize(
                this.paperRects.host.width - regionData.width,
                this.paperRects.host.height - regionData.height
            )
            onChange(this, regionData, ...args)
        }
    }

    /**
     * Updates region tags.
     * @param tags - The new tags descriptor object.
     * @param options - The tags drawing options.
     */
    public updateTags(tags: TagsDescriptor, options?: ITagsUpdateOptions) {
        super.updateTags(tags, options)
        this.tagsNode.updateTags(tags, options)
        this.node.select('title').node.innerHTML =
            tags !== null ? tags.toString() : ''
    }

    /**
     * Resizes the region to specified `width` and `height`.
     * @param width - The new region width.
     * @param height - The new region height.
     */
    public resize(width: number, height: number) {
        this.paperRects.actual.resize(
            this.paperRects.host.width - width,
            this.paperRects.host.height - height
        )
        super.resize(width, height)
    }

    /**
     * Creates the UI of the region component.
     * @param paper - The `Snap.Paper` element to draw on.
     */
    private buildOn(paper: Snap.Paper) {
        this.node = paper.g()
        this.node.addClass('regionStyle')
        this.node.addClass(this.styleID)

        this.dragNode = new DragElement(
            paper,
            this.paperRects.actual,
            this.regionData,
            this.callbacks
        )
        this.tagsNode = new TagsElement(
            paper,
            this.paperRect,
            this.regionData,
            this.tags,
            this.styleID,
            this.styleSheet,
            this.tagsUpdateOptions
        )
        this.anchorNode = new AnchorsElement(
            paper,
            this.paperRect,
            this.regionData,
            this.callbacks,
            this.selector
        )

        this.toolTip = Snap.parse(
            `<title>${this.tags !== null ? this.tags.toString() : ''}</title>`
        )
        this.node.append(this.toolTip as unknown as Snap.Element)

        this.node.add(this.dragNode.node)
        this.node.add(this.tagsNode.node)
        this.node.add(this.anchorNode.node)

        this.UI.push(this.tagsNode, this.dragNode, this.anchorNode)
    }

    /**
     * 修正時に書いたPolyLineをどこに差し込むかを決める関数
     */
    private insertPolylineToPolygon(
        polyline: Array<Point2D>,
        polygon: Array<Point2D>,
        index1: number,
        index2: number,
        forward: boolean
    ) {
        const lengthPolygon = polygon.length

        let beginIndex: number
        let endIndex: number
        let newPoints: Point2D[]
        if (forward) {
            beginIndex = index2
            endIndex = index1 < index2 ? index1 + lengthPolygon : index1
            newPoints = polyline.map((p) => p.copy()).slice(1, -1)
        } else {
            beginIndex = index1
            endIndex = index1 < index2 ? index2 : index2 + lengthPolygon
            newPoints = polyline
                .map((p) => p.copy())
                .slice(1, -1)
                .reverse()
        }
        const concatenatedPoints = polygon.concat(polygon) // 巡回配列的なものを作る
        for (let index = beginIndex; index <= endIndex; index++) {
            newPoints.push(concatenatedPoints[index])
        }

        return newPoints
    }

    /**
     * polygonの面積を計算する関数, https://imagingsolution.net/math/calc_n_point_area/
     */
    private calculatePolygonArea(points: Array<Point2D>) {
        const pointsArea = points.map((p) => p.copy())
        pointsArea.push(points[0])

        let sumOuterProd = 0
        for (let i = 0; i < pointsArea.length - 1; i++) {
            const pt1 = pointsArea[i]
            const pt2 = pointsArea[i + 1]
            sumOuterProd += pt1.x * pt2.y - pt2.x * pt1.y
        }

        return 0.5 * Math.abs(sumOuterProd)
    }

    /**
     *  修正の点選択が始まった時のコールバック
     */
    private onSelectionBegin = () => {
        this.modifyBeginIndex = this.anchorNode.getActiveAnchorIndex() - 1
        const rd = this.regionData.copy()
        if (
            this.modifyBeginIndex >= 0 &&
            this.modifyBeginIndex < rd.points.length
        ) {
            const point = rd.points[this.modifyBeginIndex]
            this.selector.addPointPublic(point.x, point.y)
            this.lock()
        }
    }

    /**
     *  修正の点選択が終わった時のコールバック
     */
    private onSelectionEnd = () => {
        this.unlock()
        const rd = this.regionData.copy()
        // 選択が終わったときに一番近くのポリゴンにマージする。
        if (
            this.modifyBeginIndex >= 0 &&
            this.modifyBeginIndex < rd.points.length
        ) {
            const selectedPoints: Point2D[] = this.selector.getPointsPublic()
            const lastPoint = selectedPoints[selectedPoints.length - 1]
            let dist: number = Number.MAX_VALUE
            let index: number = -1
            rd.points.forEach((point, i) => {
                const d = lastPoint.squareDistanceToPoint(point)
                if (d < dist) {
                    dist = d
                    index = i
                }
            })
            const th = AnchorsElement.MODIFY_POINT_SUBMIT_THRESHOLD
            if (dist <= th * th) {
                const newPointsForward = this.insertPolylineToPolygon(
                    selectedPoints,
                    rd.points,
                    this.modifyBeginIndex,
                    index,
                    true
                )
                const newPointsBackward = this.insertPolylineToPolygon(
                    selectedPoints,
                    rd.points,
                    this.modifyBeginIndex,
                    index,
                    false
                )

                // 2パターンの多角形が考えられるので、面積が大きい方を採用
                const areaForward = this.calculatePolygonArea(newPointsForward)
                const areaBackward =
                    this.calculatePolygonArea(newPointsBackward)
                if (areaForward > areaBackward) {
                    rd.setPoints(newPointsForward)
                } else {
                    rd.setPoints(newPointsBackward)
                }
                this.callbacks.onChange(this, rd, ChangeEventType.MODIFIED)
            }
        }

        this.selector.disable()
        this.anchorNode.disableModifying()
        this.modifyBeginIndex = -1
    }
}
