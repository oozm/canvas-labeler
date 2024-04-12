interface ShapeProp {
    type: number;
    [key: string]: any;
}
export default class Shape {
    label: string;
    coor: Array<any>;
    strokeStyle: string;
    fillStyle: string;
    labelFillStyle: string;
    textFillStyle: string;
    labelFont: string;
    type: number;
    active: boolean;
    creating: boolean;
    dragging: boolean;
    index: number;
    uuid: string;
    id?: number;
    count?: number;
    constructor(item: ShapeProp, index: number);
}
export {};
