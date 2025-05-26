import { IRegion, RegionState } from '../models/applicationState'

export class TrackingService {
    public async trackRegions(
        _canvas: HTMLCanvasElement,
        previousRegions: IRegion[],
        currentRegions: IRegion[]
    ): Promise<IRegion[]> {
        // Guard.null(preAssetMetadata);
        // Guard.null(curAssetMetadata);

        let updatedRegions = [...previousRegions]
        if (currentRegions.length > 0) {
            const notDuplicatedRegions = currentRegions.filter(
                (region) =>
                    updatedRegions.findIndex((r) => region.id === r.id) >= 0
            )
            updatedRegions = updatedRegions.concat(notDuplicatedRegions)
        }
        updatedRegions = updatedRegions.map((region) => {
            return {
                ...region,
                state:
                    region.state === RegionState.Inputted
                        ? RegionState.Inputted
                        : RegionState.Tracked,
            }
        })
        return updatedRegions
    }
}
