import _ from 'lodash'
import Guard from '../common/guard'
import {
    AssetState,
    AssetType,
    IAssetMetadata,
    IInterpolationSettings,
    InterpolationMethod,
    RegionState,
} from '../models/applicationState'
import { AssetService } from './assetService'

export class InterpolationService {
    constructor(private settings: IInterpolationSettings) {
        Guard.null(settings)
    }

    public async interpolateRegions(
        assetMetadata1: IAssetMetadata,
        assetMetadata2: IAssetMetadata,
        regionId: string
    ): Promise<Record<string, IAssetMetadata>> {
        const t1 = assetMetadata1.asset.timestamp
        const t2 = assetMetadata2.asset.timestamp
        if (!(typeof t1 === 'number' && typeof t2 === 'number')) return {}
        const dt = t2 - t1
        const regions1 = assetMetadata1.regions.filter(
            (region) => region.id === regionId
        )
        const regions2 = assetMetadata2.regions.filter(
            (region) => region.id === regionId
        )
        if (regions1.length > 0 && regions2.length > 0) return {}
        const rootAsset = assetMetadata1.asset.parent
        if (!rootAsset) return {}
        const assetMetadataList: { [index: string]: IAssetMetadata } = {}
        const frameSkipTime: number = 1 / this.settings.frameExtractionRate
        const templateRegions = regions1.map((region) => {
            return { ...region, state: RegionState.Interpolated }
        })
        for (let t = t1 + frameSkipTime; t < t2; t += frameSkipTime) {
            const numberKeyFrames = Math.round(t / frameSkipTime)
            const timestamp = +(numberKeyFrames * frameSkipTime).toFixed(6)
            const childName = `${rootAsset.name}#t=${timestamp}`
            const asset = AssetService.createAssetFromFileName(childName)
            asset.state = AssetState.Interpolated
            asset.type = AssetType.VideoFrame
            asset.parent = rootAsset
            asset.timestamp = timestamp
            asset.size = rootAsset.size
            if (assetMetadata1.asset.step) {
                asset.step = assetMetadata1.asset.step
            }
            assetMetadataList[asset.name] = {
                asset: asset,
                regions: templateRegions,
                version: assetMetadata1.version,
            }
        }

        switch (this.settings.method) {
            case InterpolationMethod.Linear: {
                const dx =
                    regions2[0].boundingBox.left - regions1[0].boundingBox.left
                const dy =
                    regions2[0].boundingBox.top - regions1[0].boundingBox.top
                const dw =
                    regions2[0].boundingBox.width -
                    regions1[0].boundingBox.width
                const dh =
                    regions2[0].boundingBox.height -
                    regions1[0].boundingBox.height
                _.keys(assetMetadataList).forEach((assetName) => {
                    const assetMetadata = assetMetadataList[assetName]
                    const t = assetMetadata.asset.timestamp
                    if (typeof t !== 'number') return
                    const regions = assetMetadata.regions.map((region) => {
                        const boundingBox = {
                            left:
                                region.boundingBox.left + (dx / dt) * (t - t1),
                            top: region.boundingBox.top + (dy / dt) * (t - t1),
                            width:
                                region.boundingBox.width + (dw / dt) * (t - t1),
                            height:
                                region.boundingBox.height +
                                (dh / dt) * (t - t1),
                        }
                        const points = [
                            {
                                x: boundingBox.left,
                                y: boundingBox.top,
                            },
                            {
                                x: boundingBox.left + boundingBox.width,
                                y: boundingBox.top,
                            },
                            {
                                x: boundingBox.left + boundingBox.width,
                                y: boundingBox.top + boundingBox.height,
                            },
                            {
                                x: boundingBox.left,
                                y: boundingBox.top + boundingBox.height,
                            },
                        ]
                        return {
                            ...region,
                            boundingBox: boundingBox,
                            points: points,
                            state: RegionState.Interpolated,
                        }
                    })
                    assetMetadataList[assetName] = {
                        ...assetMetadata,
                        regions: regions,
                    }
                })
                break
            }
            case InterpolationMethod.MeanShift:
            case InterpolationMethod.OSVOS:
                // const imageFrame1 = HtmlFileReader.getAssetImageData(assetMetadata1.asset);
                // const imageFrame2 = HtmlFileReader.getAssetImageData(assetMetadata2.asset);
                break
            default:
                break
        }

        return assetMetadataList
    }
}
