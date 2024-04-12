import Shape from './Shape';
/**
 * @description：矩形及可旋转矩形
 * @author: zhaojs
 * @date: 2024-04-11 15:00:13
 * @param {type}   1: 矩形  8: 可旋转矩形
 */
export default class Rect extends Shape {
    type: number;
    constructor(item: any, index: number, curType?: number);
    get ctrlsData(): any[][];
}
