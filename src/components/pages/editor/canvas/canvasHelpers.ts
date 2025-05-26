import shortid from "shortid";
import Guard from "../../../../common/guard";
import { strings } from "../../../../common/strings";
import {
  AppError,
  ErrorCode,
  IBoundingBox,
  IPoint,
  IRegion,
  ITag,
  RegionType,
  RegionState,
} from "../../../../models/applicationState";
import { Point2D } from "../../../../services/vott-ct/ts/CanvasTools/Core/Point2D";
import {
  RegionData,
  RegionDataType,
} from "../../../../services/vott-ct/ts/CanvasTools/Core/RegionData";
import { Tag } from "../../../../services/vott-ct/ts/CanvasTools/Core/Tag";
import { TagsDescriptor } from "../../../../services/vott-ct/ts/CanvasTools/Core/TagsDescriptor";

export default class CanvasHelpers {
  public static PASTE_MARGIN = 10;

  public static updateRegions(
    regions: IRegion[],
    updates: IRegion[]
  ): IRegion[] {
    if (!regions || !updates || !updates.length) {
      return regions;
    }
    const result: IRegion[] = [];
    for (const region of regions) {
      const update = updates.find((r) => r.id === region.id);
      if (update) {
        result.push(update);
      } else {
        result.push(region);
      }
    }
    return result;
  }

  public static getRegionData(region: IRegion): RegionData {
    return new RegionData(
      region.boundingBox.left,
      region.boundingBox.top,
      region.boundingBox.width,
      region.boundingBox.height,
      region.points.map((point) => new Point2D(point.x, point.y)),
      this.regionTypeToType(region.type)
    );
  }

  public static fromRegionData(
    regionData: RegionData,
    regionType: RegionType,
    regionState: RegionState
  ): IRegion {
    Guard.null(regionData);

    return {
      id: shortid.generate(),
      type: regionType,
      state: regionState,
      boundingBox: {
        left: regionData.x,
        top: regionData.y,
        width: regionData.width,
        height: regionData.height,
      },
      points: regionData.points.map((point) => new Point2D(point.x, point.y)),
      tags: [],
      confidence: 1,
    };
  }

  public static isEmpty(regionData: RegionData): boolean {
    return regionData.area === 0 && regionData.x === 0 && regionData.y === 0;
  }

  public static isInvalid(regionData: RegionData): boolean {
    let isValid = false;
    if (regionData.type === RegionDataType.Polyline) {
      isValid = regionData.points.length < 2;
    } else {
      isValid = regionData.points.length < 3 || regionData.area === 0;
    }
    return isValid;
  }

  public static getTagsDescriptor(
    projectTags: ITag[],
    region: IRegion
  ): TagsDescriptor {
    if (!projectTags || !projectTags.length) {
      return new TagsDescriptor();
    }
    Guard.null(region);

    const tags = region.tags
      .map((tagName) => {
        const projectTag = projectTags.find(
          (projectTag) => projectTag.name === tagName
        );
        let title =
          projectTag?.title || projectTag?.dispName || projectTag?.name;
        if (region.regionInfo) {
          title += ": " + JSON.stringify(region.regionInfo, null, 2);
        }
        return projectTag
          ? new Tag(projectTag.name, projectTag.color, "", "", title)
          : null;
      })
      .filter((tag) => tag !== null);

    return new TagsDescriptor(tags);
  }

  private static regionTypeToType = (regionType: RegionType) => {
    let type;
    switch (regionType) {
      case RegionType.Rectangle:
        type = RegionDataType.Rect;
        break;
      case RegionType.Polygon:
        type = RegionDataType.Polygon;
        break;
      case RegionType.Point:
        type = RegionDataType.Point;
        break;
      case RegionType.Polyline:
        type = RegionDataType.Polyline;
        break;
      default:
        break;
    }
    return type;
  };

  public static duplicateRegionsAndMove = (
    regions: IRegion[],
    others: IRegion[],
    width: number,
    height: number
  ): IRegion[] => {
    const result: IRegion[] = [];
    for (const region of regions) {
      let newRegion: IRegion = region;
      if (others.findIndex((r) => region.id === r.id) >= 0) {
        const shiftCoordinates = CanvasHelpers.getShiftCoordinates(
          region.boundingBox,
          others,
          width,
          height
        );
        newRegion = {
          ...region,
          id: shortid.generate(),
          boundingBox: CanvasHelpers.shiftBoundingBox(
            region.boundingBox,
            shiftCoordinates
          ),
          points: CanvasHelpers.shiftPoints(region.points, shiftCoordinates),
        };
      }

      result.push(newRegion);
    }
    return result;
  };

  public static boundingBoxWithin = (
    boundingBox: IBoundingBox,
    width: number,
    height: number
  ) => {
    return (
      boundingBox.left + boundingBox.width < width &&
      boundingBox.top + boundingBox.height < height
    );
  };

  public static fromBoundingBox = (boundingBox: IBoundingBox): IPoint[] => {
    return [
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
    ];
  };

  private static shiftBoundingBox = (
    boundingBox: IBoundingBox,
    shiftCoordinates: IPoint
  ): IBoundingBox => {
    return {
      ...boundingBox,
      left: boundingBox.left + shiftCoordinates.x,
      top: boundingBox.top + shiftCoordinates.y,
    };
  };

  private static shiftPoints = (points: IPoint[], shiftCoordinates: IPoint) => {
    return points.map((p) => {
      return {
        x: p.x + shiftCoordinates.x,
        y: p.y + shiftCoordinates.y,
      };
    });
  };

  private static existsRegionAt = (
    regions: IRegion[],
    x: number,
    y: number
  ) => {
    for (const region of regions) {
      if (region.boundingBox.left === x && region.boundingBox.top === y) {
        return true;
      }
    }
    return false;
  };

  // private static getShiftCoordinates = (
  //     boundingBox: IBoundingBox,
  //     otherRegions: IRegion[],
  //     width: number,
  //     height: number
  // ): IPoint => {
  //     let x = boundingBox.left
  //     let y = boundingBox.top

  //     let defaultTargetX = 0
  //     const defaultTargetY = 0

  //     if (boundingBox.height > height || boundingBox.width > width) {
  //         throw new AppError(
  //             ErrorCode.PasteRegionTooBig,
  //             strings.errors.pasteRegionTooBigError.message
  //         )
  //     }

  //     if (!CanvasHelpers.boundingBoxWithin(boundingBox, width, height)) {
  //         x = defaultTargetX
  //         y = defaultTargetY
  //     }

  //     let foundRegionAtTarget = false

  //     while (!foundRegionAtTarget) {
  //         if (CanvasHelpers.existsRegionAt(otherRegions, x, y)) {
  //             x += CanvasHelpers.pasteMargin
  //             y += CanvasHelpers.pasteMargin
  //             foundRegionAtTarget = false
  //         } else {
  //             const result = {
  //                 x: x - boundingBox.left,
  //                 y: y - boundingBox.top,
  //             }
  //             const tempBoundingBox = {
  //                 ...boundingBox,
  //                 left: boundingBox.left + result.x,
  //                 top: boundingBox.top + result.y,
  //             }
  //             if (
  //                 CanvasHelpers.boundingBoxWithin(
  //                     tempBoundingBox,
  //                     width,
  //                     height
  //                 )
  //             ) {
  //                 return result
  //             } else {
  //                 x = defaultTargetX
  //                 y = defaultTargetY
  //                 if (
  //                     CanvasHelpers.existsRegionAt(
  //                         otherRegions,
  //                         defaultTargetX,
  //                         defaultTargetY
  //                     )
  //                 ) {
  //                     defaultTargetX += CanvasHelpers.pasteMargin
  //                 }
  //             }
  //         }
  //     }
  // }

  private static getShiftCoordinates = (
    boundingBox: IBoundingBox,
    otherRegions: IRegion[],
    width: number,
    height: number
  ): IPoint => {
    // Check if the bounding box is too large
    if (boundingBox.height > height || boundingBox.width > width) {
      throw new AppError(
        ErrorCode.PasteRegionTooBig,
        strings.errors.pasteRegionTooBigError.message
      );
    }

    // 初期位置をboundingBoxのleft, topとする
    let targetX = boundingBox.left;
    let targetY = boundingBox.top;

    // キャンバス内にboundingBoxがおさまらない場合の初期値
    let defaultX = 0;
    const defaultY = 0;

    // boundingBoxがキャンバス内に収まらない場合、初期位置をdefault値で上書き
    if (!CanvasHelpers.boundingBoxWithin(boundingBox, width, height)) {
      targetX = defaultX;
      targetY = defaultY;
    }

    // 重ならない座標が見つかるまでループ
    while (true) {
      // 指定された座標にregionが存在するか確認
      if (!CanvasHelpers.existsRegionAt(otherRegions, targetX, targetY)) {
        // 存在しない場合、その座標を返す
        const result: IPoint = {
          x: targetX - boundingBox.left,
          y: targetY - boundingBox.top,
        };

        // シフト後のboundingBoxがキャンバス内に収まるか確認
        const shiftedBoundingBox: IBoundingBox = {
          ...boundingBox,
          left: boundingBox.left + result.x,
          top: boundingBox.top + result.y,
        };

        if (
          CanvasHelpers.boundingBoxWithin(shiftedBoundingBox, width, height)
        ) {
          return result; // 収まる場合は結果を返す
        } else {
          // 収まらない場合は、デフォルト座標を試す
          targetX = defaultX;
          targetY = defaultY;
          if (CanvasHelpers.existsRegionAt(otherRegions, defaultX, defaultY)) {
            defaultX += CanvasHelpers.PASTE_MARGIN;
          }
        }
      }

      // 座標をシフト
      targetX += CanvasHelpers.PASTE_MARGIN;
      targetY += CanvasHelpers.PASTE_MARGIN;
    }
  };
}
