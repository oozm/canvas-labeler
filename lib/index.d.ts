/// <reference types="node" />
import Rect from './shape/Rect';
import Polygon from './shape/Polygon';
import Dot from './shape/Dot';
import EventBus from './EventBus';
import Line from './shape/Line';
import Circle from './shape/Circle';
type Point = [number, number];
type AllShape = Rect | Polygon | Dot | Line | Circle;
export default class CanvasLabeler extends EventBus {
    lock: boolean;
    MIN_WIDTH: number;
    MIN_HEIGHT: number;
    MIN_RADIUS: number;
    angleStep: number;
    strokeStyle: string;
    lineWidth: number;
    fillStyle: string;
    activeStrokeStyle: string;
    colors: string[];
    count: number;
    isSame: boolean;
    activeFillStyle: string;
    ctrlStrokeStyle: string;
    ctrlFillStyle: string;
    ctrlRadius: number;
    labelFillStyle: string;
    labelFont: string;
    textFillStyle: string;
    labelMaxLen: number;
    isCursor: boolean;
    cursorLineWidth: number;
    cursorLineDash: number[];
    cursorStrokeStyle: string;
    WIDTH: number;
    HEIGHT: number;
    canvas: HTMLCanvasElement | any;
    ctx: CanvasRenderingContext2D | any;
    dataset: Array<AllShape>;
    offScreen: HTMLCanvasElement;
    offScreenCtx: CanvasRenderingContext2D | any;
    remember: number[][];
    mouse: Point;
    rememberOrigin: number[];
    createType: number;
    ctrlIndex: number;
    cursor: string;
    image: HTMLImageElement;
    IMAGE_ORIGIN_WIDTH: number;
    IMAGE_WIDTH: number;
    IMAGE_ORIGIN_HEIGHT: number;
    IMAGE_HEIGHT: number;
    originX: number;
    originY: number;
    scaleStep: number;
    scrollZoom: boolean;
    timer: NodeJS.Timeout;
    dblTouch: number;
    dblTouchStore: number;
    alpha: boolean;
    focusMode: boolean;
    evt: MouseEvent | TouchEvent | KeyboardEvent;
    scaleTouchStore: number;
    isTouch2: boolean;
    /**
     * @param el Valid CSS selector string, or DOM
     * @param src image src
     */
    constructor(el: HTMLCanvasElement | string, src?: string);
    get activeShape(): any;
    get scale(): number;
    get imageMin(): number;
    get imageOriginMax(): number;
    initCanvas(el: HTMLCanvasElement | string, src?: string): void;
    /**
     * 合成事件
     * @param e
     * @returns
     */
    mergeEvent(e: MouseEvent | TouchEvent | KeyboardEvent): {
        mouseX: number;
        mouseY: number;
        mouseCX: number;
        mouseCY: number;
        isMobile: boolean;
        altKey: boolean;
        button: number;
        buttons: number;
        clientX: number;
        clientY: number;
        ctrlKey: boolean;
        layerX: number;
        layerY: number;
        metaKey: boolean;
        movementX: number;
        movementY: number;
        offsetX: number;
        offsetY: number;
        pageX: number;
        pageY: number;
        relatedTarget: EventTarget | null;
        screenX: number;
        screenY: number;
        shiftKey: boolean;
        x: number;
        y: number;
        getModifierState(keyArg: string): boolean;
        initMouseEvent(typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, viewArg: Window, detailArg: number, screenXArg: number, screenYArg: number, clientXArg: number, clientYArg: number, ctrlKeyArg: boolean, altKeyArg: boolean, shiftKeyArg: boolean, metaKeyArg: boolean, buttonArg: number, relatedTargetArg: EventTarget | null): void;
        detail: number;
        view: Window | null;
        which: number;
        initUIEvent(typeArg: string, bubblesArg?: boolean | undefined, cancelableArg?: boolean | undefined, viewArg?: Window | null | undefined, detailArg?: number | undefined): void;
        bubbles: boolean;
        cancelBubble: boolean;
        cancelable: boolean;
        composed: boolean;
        currentTarget: EventTarget | null;
        defaultPrevented: boolean;
        eventPhase: number;
        isTrusted: boolean;
        returnValue: boolean;
        srcElement: EventTarget | null;
        target: EventTarget | null;
        timeStamp: number;
        type: string;
        composedPath(): EventTarget[];
        initEvent(type: string, bubbles?: boolean | undefined, cancelable?: boolean | undefined): void;
        preventDefault(): void;
        stopImmediatePropagation(): void;
        stopPropagation(): void;
        NONE: 0;
        CAPTURING_PHASE: 1;
        AT_TARGET: 2;
        BUBBLING_PHASE: 3;
    } | {
        mouseX: number;
        mouseY: number;
        mouseCX: number;
        mouseCY: number;
        isMobile: boolean;
        altKey: boolean;
        changedTouches: TouchList;
        ctrlKey: boolean;
        metaKey: boolean;
        shiftKey: boolean;
        targetTouches: TouchList;
        touches: TouchList;
        detail: number;
        view: Window | null;
        which: number;
        initUIEvent(typeArg: string, bubblesArg?: boolean | undefined, cancelableArg?: boolean | undefined, viewArg?: Window | null | undefined, detailArg?: number | undefined): void;
        bubbles: boolean;
        cancelBubble: boolean;
        cancelable: boolean;
        composed: boolean;
        currentTarget: EventTarget | null;
        defaultPrevented: boolean;
        eventPhase: number;
        isTrusted: boolean;
        returnValue: boolean;
        srcElement: EventTarget | null;
        target: EventTarget | null;
        timeStamp: number;
        type: string;
        composedPath(): EventTarget[];
        initEvent(type: string, bubbles?: boolean | undefined, cancelable?: boolean | undefined): void;
        preventDefault(): void;
        stopImmediatePropagation(): void;
        stopPropagation(): void;
        NONE: 0;
        CAPTURING_PHASE: 1;
        AT_TARGET: 2;
        BUBBLING_PHASE: 3;
    } | {
        mouseX: number;
        mouseY: number;
        mouseCX: number;
        mouseCY: number;
        isMobile: boolean;
        altKey: boolean;
        charCode: number;
        code: string;
        ctrlKey: boolean;
        isComposing: boolean;
        key: string;
        keyCode: number;
        location: number;
        metaKey: boolean;
        repeat: boolean;
        shiftKey: boolean;
        getModifierState(keyArg: string): boolean;
        initKeyboardEvent(typeArg: string, bubblesArg?: boolean | undefined, cancelableArg?: boolean | undefined, viewArg?: Window | null | undefined, keyArg?: string | undefined, locationArg?: number | undefined, ctrlKey?: boolean | undefined, altKey?: boolean | undefined, shiftKey?: boolean | undefined, metaKey?: boolean | undefined): void;
        DOM_KEY_LOCATION_STANDARD: 0;
        DOM_KEY_LOCATION_LEFT: 1;
        DOM_KEY_LOCATION_RIGHT: 2;
        DOM_KEY_LOCATION_NUMPAD: 3;
        detail: number;
        view: Window | null;
        which: number;
        initUIEvent(typeArg: string, bubblesArg?: boolean | undefined, cancelableArg?: boolean | undefined, viewArg?: Window | null | undefined, detailArg?: number | undefined): void;
        bubbles: boolean;
        cancelBubble: boolean;
        cancelable: boolean;
        composed: boolean;
        currentTarget: EventTarget | null;
        defaultPrevented: boolean;
        eventPhase: number;
        isTrusted: boolean;
        returnValue: boolean;
        srcElement: EventTarget | null;
        target: EventTarget | null;
        timeStamp: number;
        type: string;
        composedPath(): EventTarget[];
        initEvent(type: string, bubbles?: boolean | undefined, cancelable?: boolean | undefined): void;
        preventDefault(): void;
        stopImmediatePropagation(): void;
        stopPropagation(): void;
        NONE: 0;
        CAPTURING_PHASE: 1;
        AT_TARGET: 2;
        BUBBLING_PHASE: 3;
    };
    handleLoad(): void;
    handleContextmenu(e: MouseEvent): void;
    handleMousewheel(e: WheelEvent): void;
    handleMouseDown(e: MouseEvent | TouchEvent): void;
    handelMouseMove(e: MouseEvent | TouchEvent): void;
    updateRotateRectangleSize(coor: any, draggedPointIndex: number, newX: number, newY: number): any;
    handelMouseUp(e: MouseEvent | TouchEvent): void;
    handelDblclick(e: MouseEvent | TouchEvent | KeyboardEvent): void;
    handelKeydown(e: KeyboardEvent): void;
    rotate(): false | undefined;
    revoke(): void;
    /**
     * 初始化
     */
    initSetting(): void;
    initEvents(): void;
    /**
     * 添加/切换图片
     * @param url 图片链接
     */
    setImage(url: string): void;
    /**
     * 设置数据
     * @param data Array
     */
    setData(data: AllShape[]): void;
    /**
     * 判断是否在标注实例上
     * @param mousePoint 点击位置
     * @returns
     */
    hitOnShape(mousePoint: Point): [number, AllShape];
    /**
     * 判断鼠标是否在背景图内部
     * @param e MouseEvent
     * @returns 布尔值
     */
    isInBackground(e: MouseEvent | TouchEvent | KeyboardEvent): boolean;
    /**
     * 判断是否在矩形内
     * @param point 坐标
     * @param coor 区域坐标
     * @returns 布尔值
     */
    isPointInRect(point: Point, coor: Point[]): boolean;
    /**
     * 判断是否在多边形内
     * @param point 坐标
     * @param coor 区域坐标
     * @returns 布尔值
     */
    isPointInPolygon(point: Point, coor: Point[]): boolean;
    /**
     * 判断是否在圆内
     * @param point 坐标
     * @param center 圆心
     * @param r 半径
     * @param needScale 是否为圆形点击检测
     * @returns 布尔值
     */
    isPointInCircle(point: Point, center: Point, r: number): boolean;
    /**
     * 判断是否在折线内
     * @param point 坐标
     * @param coor 区域坐标
     * @returns 布尔值
     */
    isPointInLine(point: Point, coor: Point[]): boolean;
    /**
     * 绘制矩形
     * @param shape 标注实例
     * @returns
     */
    drawRect(shape: Rect): void;
    /**
     * 绘制旋转矩形
     * @param shape 标注实例
     * @returns
     */
    drawRotateRect(shape: Rect, angle?: number): void;
    /**
     * 绘制多边形
     * @param shape 标注实例
     */
    drawPolygon(shape: Polygon): void;
    /**
     * 绘制点
     * @param shape 标注实例
     */
    drawDot(shape: Dot): void;
    /**
     * 绘制圆
     * @param shape 标注实例
     */
    drawCirle(shape: Circle): void;
    /**
     * 绘制折线
     * @param shape 标注实例
     */
    drawLine(shape: Line): void;
    /**
     * 绘制辅助线，参考线
     * @param shape 标注实例
     */
    drawCursorLine(): void;
    /**
     * 绘制控制点
     * @param point 坐标
     */
    drawCtrl(point: Point): void;
    /**
     * 绘制控制点列表
     * @param shape 标注实例
     */
    drawCtrlList(shape: Rect | Polygon | Line): void;
    /**
     * 绘制label
     * @param point 位置
     * @param label 文本
     */
    drawLabel(point: Point, label?: string, labelFillStyle?: string, labelFont?: string, textFillStyle?: string, count?: number): void;
    /**
     * @description：更新计数及保存count 给color使用
     * @author: zhaojs
     * @date: 2024-04-11 14:55:14
     * @param {newShape} 当前新增的shape
     */
    updateCount(newShape: AllShape): AllShape;
    /**
     * 更新画布
     */
    update(angle?: number): void;
    /**
     * 删除指定矩形
     * @param index number
     */
    deleteByIndex(index: number): void;
    /**
     * 计算缩放步长
     */
    calcStep(flag?: string): void;
    /**
     * 缩放
     * @param type true放大5%，false缩小5%
     * @param center 缩放中心 center|mouse
     * @param pure 不绘制
     */
    setScale(type: boolean, byMouse?: boolean, pure?: boolean): void;
    /**
     * 适配背景图
     */
    fitZoom(): void;
    /**
     * 设置专注模式
     * @param type {boolean}
     */
    setFocusMode(type: boolean): void;
    /**
     * 重新设置画布大小
     */
    resize(): void;
    destroy(): void;
}
export {};
