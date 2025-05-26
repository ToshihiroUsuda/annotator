import { ZoomData } from '../Core/ZoomManager'

export type ZoomFunction = () => void
export type ZoomUpdateFunction = (zoomData: ZoomData) => void
/**
 * Defines a collection of callbacks passed to the `ZoomManager` constructor.
 */
export interface IZoomCallbacks {
    /**
     * The callback to be called on zooming out.
     */
    onZoomingOut: ZoomFunction

    /**
     * The callback to be called on zooming in.
     */
    onZoomingIn: ZoomFunction
}
