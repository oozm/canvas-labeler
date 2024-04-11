import Shape from './Shape'

/**
 * @description：矩形及可旋转矩形
 * @author: zhaojs
 * @date: 2024-04-11 15:00:13
 * @param {type}   1: 矩形  8: 可旋转矩形
 */
export default class Rect extends Shape {
  public type = 1
  constructor(item: any, index: number, curType = 1) {
    super(item, index)
    this.type = curType
  }

  get ctrlsData() {
    if (this.type === 1) {
      const [[x0, y0], [x1, y1]] = this.coor
      return [
        [x0, y0],
        [x0 + (x1 - x0) / 2, y0],
        [x1, y0],
        [x1, y0 + (y1 - y0) / 2],
        [x1, y1],
        [x0 + (x1 - x0) / 2, y1],
        [x0, y1],
        [x0, y0 + (y1 - y0) / 2],
      ]
    }
    // 可旋转矩形
    if (this.type === 8) {
      const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = this.coor
      return [
        [x0, y0],
        [(x0 + x1) / 2, (y0 + y1) / 2],
        [x1, y1],
        [(x1 + x2) / 2, (y1 + y2) / 2],
        [x2, y2],
        [(x2 + x3) / 2, (y2 + y3) / 2],
        [x3, y3],
        [(x3 + x0) / 2, (y3 + y0) / 2],
      ]
    }
    return []
  }
}
