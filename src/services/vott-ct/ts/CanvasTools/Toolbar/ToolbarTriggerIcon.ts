import { IToolbarIcon } from '../Interface/IToolbarIcon'
import { IconCallback, ToolbarIcon } from './ToolbarIcon'

import Snap from 'snapsvg-cjs'
/* import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE; */

export class ToolbarTriggerIcon extends ToolbarIcon {
    public onAction: IconCallback

    private iconBackgrounRect!: Snap.Element
    private iconImage!: Snap.Element
    private iconImageSVG?: Snap.Element

    constructor(paper: Snap.Paper, icon: IToolbarIcon, onAction: IconCallback) {
        super(paper, icon)

        this.onAction = onAction
        this.buildIconUI()
    }

    public activate() {
        if (this.description?.action) {
            this.onAction(this.description.action)
        }
    }

    public move(x: number, y: number) {
        super.move(x, y)
        this.iconBackgrounRect.attr({ x, y })
        if (this.iconImageSVG !== undefined) {
            this.iconImageSVG.attr({ x, y })
        }
    }

    public resize(width: number, height: number) {
        super.resize(width, height)

        this.iconBackgrounRect.attr({
            height: this.height,
            width: this.width,
        })

        if (this.iconImageSVG) {
            this.iconImageSVG.attr({
                height: this.height,
                width: this.width,
            })
        }
    }

    private buildIconUI() {
        this.node = this.paper.g()
        this.node.addClass('iconStyle')
        this.node.addClass('selector')

        this.iconBackgrounRect = this.paper.rect(0, 0, this.width, this.height)
        this.iconBackgrounRect.addClass('iconBGRectStyle')

        this.iconImage = this.paper.g()
        if (this.description?.iconUrl) {
            Snap.load(this.description.iconUrl, (fragment: Snap.Fragment) => {
                this.iconImage.add(fragment as unknown as Snap.Element)
                const svgElement = this.iconImage
                    .children()
                    .find((element) => element.type === 'svg')

                if (svgElement) {
                    this.iconImageSVG = svgElement
                    this.iconImageSVG.attr({
                        height: this.height,
                        width: this.width,
                    })

                    this.move(this.x, this.y)
                }
            })
        }
        this.iconImage.addClass('iconImageStyle')

        if (this.description?.tooltip) {
            const title = Snap.parse(
                `<title>${this.description.tooltip}</title>`
            )
            this.node.add(title as unknown as Snap.Element)
        }

        this.node.add(this.iconBackgrounRect)
        this.node.add(this.iconImage)

        this.node.click(() => {
            this.activate()
        })
    }
}
