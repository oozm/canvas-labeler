import Shape from './Shape';
export default class Rect extends Shape {
    type: number;
    constructor(item: any, index: number, curType?: number);
    get ctrlsData(): any[][];
}
