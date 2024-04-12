import Rect from './shape/Rect';
import Polygon from './shape/Polygon';
import Dot from './shape/Dot';
import EventBus from './EventBus';
import Line from './shape/Line';
import Circle from './shape/Circle';
import Shape from './shape/Shape';

type Point = [number, number];
type AllShape = Rect | Polygon | Dot | Line | Circle;

export default class CanvasLabeler extends EventBus {
  lock: boolean = false; // 只读模式

  MIN_WIDTH = 10;

  MIN_HEIGHT = 10;

  MIN_RADIUS = 5;

  angleStep = 30; // 旋转步长

  strokeStyle = '#0f0';
  lineWidth = 3;

  fillStyle = 'rgba(0, 0, 255,0.1)';

  activeStrokeStyle = '#f00';
  // 高光颜色
  colors = [
    '#f00',
    '#FFFF00',
    '#0000FF',
    '#33ffff',
    '#4B0082',
    '#FFA500',
    '#ff00ff',
    '#008000',
  ];
  //  标注数量统计
  count = 0;
  // 是否同一个商品，数量书否累加
  isSame = false;

  activeFillStyle = 'rgba(255, 0, 0,0.1)';

  ctrlStrokeStyle = '#000';

  ctrlFillStyle = '#fff';

  ctrlRadius = 5;

  labelFillStyle = '#fff';

  labelFont = '16px sans-serif';

  textFillStyle = '#000';

  labelMaxLen = 10;

  isCursor = true; // 光标辅助线
  cursorLineWidth = 1;
  cursorLineDash = [5, 5];
  cursorStrokeStyle = '#f00';

  WIDTH = 0;

  HEIGHT = 0;

  canvas: HTMLCanvasElement | any;

  ctx: CanvasRenderingContext2D | any;

  dataset: Array<AllShape> = [];

  offScreen!: HTMLCanvasElement;

  offScreenCtx!: CanvasRenderingContext2D | any;

  remember!: number[][]; // 记录锚点距离

  mouse!: Point; // 记录鼠标位置

  rememberOrigin: number[] = [0, 0]; // 记录背景图鼠标位移

  createType = 0; // 0 不创建，1 创建矩形，2 创建多边形，3 创建点

  ctrlIndex = -1;

  cursor: string = 'auto';

  image: HTMLImageElement = new Image();

  IMAGE_ORIGIN_WIDTH!: number;

  IMAGE_WIDTH = 0;

  IMAGE_ORIGIN_HEIGHT = 0;

  IMAGE_HEIGHT = 0;

  originX = 0; // 原点x

  originY = 0; // 原点y

  scaleStep = 0; // 缩放步长

  scrollZoom = true; // 滚动缩放

  timer!: NodeJS.Timeout;

  dblTouch = 300; // 最小touch双击时间

  dblTouchStore = 0; // touch双击时间

  alpha = true; // 这个选项可以帮助浏览器进行内部优化

  focusMode = false; // 专注模式

  evt!: MouseEvent | TouchEvent | KeyboardEvent;

  scaleTouchStore = 0;

  isTouch2 = false;
  /**
   * @param el Valid CSS selector string, or DOM
   * @param src image src
   */
  constructor(el: HTMLCanvasElement | string, src?: string) {
    super();
    this.handleLoad = this.handleLoad.bind(this);
    this.handleContextmenu = this.handleContextmenu.bind(this);
    this.handleMousewheel = this.handleMousewheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handelMouseMove = this.handelMouseMove.bind(this);
    this.handelMouseUp = this.handelMouseUp.bind(this);
    this.handelDblclick = this.handelDblclick.bind(this);
    this.handelKeydown = this.handelKeydown.bind(this);
    this.initCanvas = this.initCanvas.bind(this);
    this.resize = this.resize.bind(this);
    this.revoke = this.revoke.bind(this);
    const container = typeof el === 'string' ? document.querySelector(el) : el;
    if (container instanceof HTMLCanvasElement) {
      this.canvas = container as HTMLCanvasElement;
      this.offScreen = document.createElement('canvas');
      this.initSetting();
      this.initEvents();
      src && this.setImage(src);
    } else {
      this.canvas = null as unknown as HTMLCanvasElement;
      console.warn('HTMLCanvasElement is required!');
    }
  }

  get activeShape() {
    return this.dataset.find((x) => x.active) || ({} as any);
  }

  get scale() {
    if (this.IMAGE_ORIGIN_WIDTH && this.IMAGE_WIDTH) {
      return this.IMAGE_WIDTH / this.IMAGE_ORIGIN_WIDTH;
    }
    return 1;
  }

  get imageMin() {
    return Math.min(this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
  }

  get imageOriginMax() {
    return Math.max(this.IMAGE_ORIGIN_WIDTH, this.IMAGE_ORIGIN_HEIGHT);
  }
  // 初始化画布
  initCanvas(el: HTMLCanvasElement | string, src?: string) {
    const container = typeof el === 'string' ? document.querySelector(el) : el;
    if (container instanceof HTMLCanvasElement) {
      this.canvas = container as HTMLCanvasElement;
      this.canvas.style.userSelect = 'none';
      this.initSetting();
      this.initEvents();
      src && this.setImage(src);
    } else {
      console.warn('HTMLCanvasElement is required!');
    }
  }

  /**
   * 合成事件
   * @param e
   * @returns
   */
  mergeEvent(e: MouseEvent | TouchEvent | KeyboardEvent) {
    let mouseX = 0;
    let mouseY = 0;
    let mouseCX = 0;
    let mouseCY = 0;
    let isMobile = false;
    if (window.TouchEvent && e instanceof window.TouchEvent) {
      let { clientX, clientY } = e.touches[0];
      let target = e.target as HTMLCanvasElement;
      const { left, top } = target.getBoundingClientRect();
      mouseX = Math.round(clientX - left);
      mouseY = Math.round(clientY - top);
      if (e.touches.length === 2) {
        let { clientX: clientX1 = 0, clientY: clientY1 = 0 } =
          e.touches[1] || {};
        mouseCX = Math.round(
          Math.abs((clientX1 - clientX) / 2 + clientX) - left
        );
        mouseCY = Math.round(
          Math.abs((clientY1 - clientY) / 2 + clientY) - top
        );
      }
      isMobile = true;
    } else if (e instanceof MouseEvent) {
      mouseX = e.offsetX;
      mouseY = e.offsetY;
    } else {
      mouseX = 0;
      mouseY = 0;
    }
    return { ...e, mouseX, mouseY, mouseCX, mouseCY, isMobile };
  }

  handleLoad() {
    this.emit('load', this.image.src);
    this.IMAGE_ORIGIN_WIDTH = this.IMAGE_WIDTH = this.image.width;
    this.IMAGE_ORIGIN_HEIGHT = this.IMAGE_HEIGHT = this.image.height;
    this.fitZoom();
  }
  handleContextmenu(e: MouseEvent) {
    e.preventDefault();
    this.evt = e;
    if (this.lock) return;
  }
  handleMousewheel(e: WheelEvent) {
    e.stopPropagation();
    this.evt = e;
    if (this.lock || !this.scrollZoom) return;
    const { mouseX, mouseY } = this.mergeEvent(e);
    this.mouse = [mouseX, mouseY];
    this.setScale(e.deltaY < 0, true);
  }
  handleMouseDown(e: MouseEvent | TouchEvent) {
    console.log('handleMouseDown', e);
    e.stopPropagation();
    this.evt = e;
    if (this.lock) return;
    const { mouseX, mouseY, mouseCX, mouseCY } = this.mergeEvent(e);
    const isMobile = window.TouchEvent && e instanceof window.TouchEvent;
    const offsetX = Math.round(mouseX / this.scale);
    const offsetY = Math.round(mouseY / this.scale);
    this.mouse =
      isMobile && e.touches.length === 2
        ? [mouseCX, mouseCY]
        : [mouseX, mouseY];
    this.rememberOrigin = [mouseX - this.originX, mouseY - this.originY];
    // this.drawReferenceLine()
    if (
      (!isMobile && e instanceof MouseEvent && e.buttons === 1) ||
      (isMobile && e.touches.length === 1)
    ) {
      // 鼠标左键
      const ctrls = this.activeShape.ctrlsData || [];
      this.ctrlIndex = ctrls.findIndex((coor: Point) =>
        this.isPointInCircle(this.mouse, coor, this.ctrlRadius)
      );
      if (this.ctrlIndex > -1) {
        // 点击到控制点
        const [x0, y0] = ctrls[this.ctrlIndex];
        this.remember = [[offsetX - x0, offsetY - y0]];
      } else if (this.isInBackground(e)) {
        if (this.activeShape.creating) {
          // 创建中
          if ([2, 4].includes(this.activeShape.type)) {
            const [x, y] =
              this.activeShape.coor[this.activeShape.coor.length - 1];
            if (x !== offsetX && y !== offsetY) {
              const nx = Math.round(offsetX - this.originX / this.scale);
              const ny = Math.round(offsetY - this.originY / this.scale);
              this.activeShape.coor.push([nx, ny]);
            }
          }
        } else if (this.createType > 0) {
          // 开始创建
          let newShape = {} as Shape;
          const nx = Math.round(offsetX - this.originX / this.scale);
          const ny = Math.round(offsetY - this.originY / this.scale);
          const curPoint: Point = [nx, ny];
          switch (this.createType) {
            case 1:
              newShape = new Rect(
                { coor: [curPoint, curPoint] },
                this.dataset.length
              );
              newShape.creating = true;
              break;
            //旋转矩形
            case 8:
              newShape = new Rect(
                { coor: [curPoint, curPoint, curPoint, curPoint] },
                this.dataset.length,
                8
              );
              newShape.creating = true;
              break;
            case 2:
              newShape = new Polygon({ coor: [curPoint] }, this.dataset.length);
              newShape.creating = true;
              break;
            case 3:
              newShape = new Dot({ coor: curPoint }, this.dataset.length);
              this.emit('add', newShape);
              break;
            case 4:
              newShape = new Line({ coor: [curPoint] }, this.dataset.length);
              newShape.creating = true;
              break;
            case 5:
              newShape = new Circle({ coor: curPoint }, this.dataset.length);
              newShape.creating = true;
              break;
            default:
              break;
          }
          this.dataset.forEach((sp) => {
            sp.active = false;
          });
          newShape.active = true;
          console.log('newShape===>>>', newShape);
          newShape = this.updateCount(newShape);
          this.dataset.push(newShape);
        } else {
          // 是否点击到形状
          const [hitShapeIndex, hitShape] = this.hitOnShape(this.mouse);
          if (hitShapeIndex > -1) {
            this.dataset.forEach(
              (item, i) => (item.active = i === hitShapeIndex)
            );
            hitShape.dragging = true;
            this.dataset.splice(hitShapeIndex, 1);
            this.dataset.push(hitShape);
            this.remember = [];
            if ([3, 5].includes(hitShape.type)) {
              const [x, y] = hitShape.coor;
              this.remember = [[offsetX - x, offsetY - y]];
            } else {
              hitShape.coor.forEach((pt: any) => {
                this.remember.push([offsetX - pt[0], offsetY - pt[1]]);
              });
            }
            this.emit('select', hitShape);
          } else {
            this.activeShape.active = false;
          }
        }
        this.update();
      }
    }
  }

  handelMouseMove(e: MouseEvent | TouchEvent) {
    e.stopPropagation();
    this.evt = e;
    if (this.lock) return;

    const { mouseX, mouseY, mouseCX, mouseCY } = this.mergeEvent(e);
    const isMobile = window.TouchEvent && e instanceof window.TouchEvent;
    const offsetX = Math.round(mouseX / this.scale);
    const offsetY = Math.round(mouseY / this.scale);
    this.mouse =
      isMobile && e.touches.length === 2
        ? [mouseCX, mouseCY]
        : [mouseX, mouseY];

    if (
      ((!isMobile && (e as MouseEvent).buttons === 1) ||
        (isMobile && e.touches.length === 1)) &&
      this.activeShape.type
    ) {
      if (
        this.ctrlIndex > -1 &&
        (this.isInBackground(e) || this.activeShape.type === 5)
      ) {
        const [[x, y]] = this.remember;
        // resize矩形
        if (this.activeShape.type === 1) {
          const [[x0, y0], [x1, y1]] = this.activeShape.coor;
          let coor: Point[] = [];
          switch (this.ctrlIndex) {
            case 0:
              coor = [
                [offsetX - x, offsetY - y],
                [x1, y1],
              ];
              break;
            case 1:
              coor = [
                [x0, offsetY - y],
                [x1, y1],
              ];
              break;
            case 2:
              coor = [
                [x0, offsetY - y],
                [offsetX - x, y1],
              ];
              break;
            case 3:
              coor = [
                [x0, y0],
                [offsetX - x, y1],
              ];
              break;
            case 4:
              coor = [
                [x0, y0],
                [offsetX - x, offsetY - y],
              ];
              break;
            case 5:
              coor = [
                [x0, y0],
                [x1, offsetY - y],
              ];
              break;
            case 6:
              coor = [
                [offsetX - x, y0],
                [x1, offsetY - y],
              ];
              break;
            case 7:
              coor = [
                [offsetX - x, y0],
                [x1, y1],
              ];
              break;
            default:
              break;
          }
          let [[x0_, y0_], [x1_, y1_]] = coor;
          if (
            x0_ < 0 ||
            x1_ < 0 ||
            y0_ < 0 ||
            y1_ < 0 ||
            x1_ > this.IMAGE_ORIGIN_WIDTH ||
            y1_ > this.IMAGE_ORIGIN_HEIGHT
          ) {
            console.log('超出边界');
            //偶然触发 超出边界处理
            x0_ < 0 && (x0_ = 0);
            x1_ < 0 && (x1_ = 0);
            y0_ < 0 && (y0_ = 0);
            y1_ < 0 && (y1_ = 0);
            if (x1_ > this.IMAGE_ORIGIN_WIDTH) {
              x1_ = this.IMAGE_ORIGIN_WIDTH;
            }
            if (y1_ > this.IMAGE_ORIGIN_HEIGHT) {
              y1_ = this.IMAGE_ORIGIN_HEIGHT;
            }
          }

          if (x1_ - x0_ >= this.MIN_WIDTH && y1_ - y0_ >= this.MIN_HEIGHT) {
            this.activeShape.coor = [
              [x0_, y0_],
              [x1_, y1_],
            ];
          } else {
            this.emit(
              'warn',
              `Width cannot be less than ${this.MIN_WIDTH},Height cannot be less than${this.MIN_HEIGHT}。`
            );
          }
        } else if (this.activeShape.type === 8) {
          this.activeShape.coor = this.updateRotateRectangleSize(
            this.activeShape.ctrlsData || [],
            this.ctrlIndex,
            offsetX - x,
            offsetY - y
          );
        } else if ([2, 4].includes(this.activeShape.type)) {
          const nx = Math.round(offsetX - this.originX / this.scale);
          const ny = Math.round(offsetY - this.originY / this.scale);
          const newPoint = [nx, ny];
          this.activeShape.coor.splice(this.ctrlIndex, 1, newPoint);
        } else if (this.activeShape.type === 5) {
          const nx = Math.round(offsetX - this.originX / this.scale);
          const newRadius = nx - this.activeShape.coor[0];
          if (newRadius >= this.MIN_RADIUS) this.activeShape.radius = newRadius;
        }
      } else if (this.activeShape.dragging) {
        // 拖拽
        let coor: Array<number | Point> = [];
        let noLimit = true;
        const w = this.IMAGE_ORIGIN_WIDTH || this.WIDTH;
        const h = this.IMAGE_ORIGIN_HEIGHT || this.HEIGHT;
        if ([3, 5].includes(this.activeShape.type)) {
          const [t1, t2] = this.remember[0];
          const x = offsetX - t1;
          const y = offsetY - t2;
          if (x < 0 || x > w || y < 0 || y > h) noLimit = false;
          coor = [x, y];
        } else {
          for (let i = 0; i < this.activeShape.coor.length; i++) {
            const tar = this.remember[i];
            const x = offsetX - tar[0];
            const y = offsetY - tar[1];
            if (x < 0 || x > w || y < 0 || y > h) noLimit = false;
            coor.push([x, y]);
          }
        }
        if (noLimit) this.activeShape.coor = coor;
      } else if (this.activeShape.creating && this.isInBackground(e)) {
        const x = Math.round(offsetX - this.originX / this.scale);
        const y = Math.round(offsetY - this.originY / this.scale);
        // 创建矩形
        if ([1, 8].includes(this.activeShape.type)) {
          this.activeShape.coor.splice(1, 1, [x, y]);
          if (this.activeShape.type === 8) {
            const [[x0, y0], [x1, y1]] = this.activeShape.coor;
            // 4组坐标
            this.activeShape.coor = [
              [x0, y0],
              [x1, y0],
              [x1, y1],
              [x0, y1],
            ];
          }
        } else if (this.activeShape.type === 5) {
          const [x0, y0] = this.activeShape.coor;
          const r = Math.sqrt((x0 - x) ** 2 + (y0 - y) ** 2);
          this.activeShape.radius = r;
        }
      }
      this.update();
    } else if (
      [2, 4].includes(this.activeShape.type) &&
      this.activeShape.creating
    ) {
      // 多边形添加点
      this.update();
    } else if (
      (!isMobile &&
        e instanceof MouseEvent &&
        e.buttons === 2 &&
        e.which === 3) ||
      (isMobile && e.touches.length === 1 && !this.isTouch2)
    ) {
      // 拖动背景
      this.originX = Math.round(mouseX - this.rememberOrigin[0]);
      this.originY = Math.round(mouseY - this.rememberOrigin[1]);
      this.update();
    } else if (isMobile && e.touches.length === 2) {
      this.isTouch2 = true;
      const touch0 = e.touches[0];
      const touch1 = e.touches[1];
      const cur = this.scaleTouchStore;
      this.scaleTouchStore = Math.abs(
        (touch1.clientX - touch0.clientX) * (touch1.clientY - touch0.clientY)
      );
      this.setScale(this.scaleTouchStore > cur, true);
    }
    this.update();
  }

  updateRotateRectangleSize(
    coor: any,
    draggedPointIndex: number,
    newX: number,
    newY: number
  ) {
    const center = coor.reduce(
      (acc: number[], val: number[]) => [
        acc[0] + val[0] / coor.length,
        acc[1] + val[1] / coor.length,
      ],
      [0, 0]
    );

    if (draggedPointIndex % 2 === 0) {
      // 角点拖动
      let angle = Math.atan2(newY - center[1], newX - center[0]);
      let originalAngle = Math.atan2(
        coor[draggedPointIndex][1] - center[1],
        coor[draggedPointIndex][0] - center[0]
      );
      let distance = Math.hypot(newX - center[0], newY - center[1]);
      let originalDistance = Math.hypot(
        coor[draggedPointIndex][0] - center[0],
        coor[draggedPointIndex][1] - center[1]
      );

      let scale = distance / originalDistance;
      let dAngle = angle - originalAngle;

      // 更新所有点
      for (let i = 0; i < coor.length; i++) {
        let pointAngle =
          Math.atan2(coor[i][1] - center[1], coor[i][0] - center[0]) + dAngle;
        let pointDistance =
          Math.hypot(coor[i][0] - center[0], coor[i][1] - center[1]) * scale;
        coor[i] = [
          center[0] + Math.cos(pointAngle) * pointDistance,
          center[1] + Math.sin(pointAngle) * pointDistance,
        ];
      }
    } else {
      // 拖动中点
      // 拖动中点，保持相邻边的长度改变
      const cornerIndex1 = (draggedPointIndex - 1 + coor.length) % coor.length;
      const cornerIndex2 = (draggedPointIndex + 1) % coor.length;

      // 计算相邻边的向量
      const vectorX = coor[cornerIndex2][0] - coor[cornerIndex1][0];
      const vectorY = coor[cornerIndex2][1] - coor[cornerIndex1][1];
      const vectorLength = Math.hypot(vectorX, vectorY);

      // 计算当前中点到相邻边的向量
      const toEdgeX = newX - coor[cornerIndex1][0];
      const toEdgeY = newY - coor[cornerIndex1][1];

      // 计算当前中点在相邻边上的投影长度
      const projection = (toEdgeX * vectorX + toEdgeY * vectorY) / vectorLength;

      // 计算相邻边上的新点
      const newEdgeX =
        (vectorX / vectorLength) * projection + coor[cornerIndex1][0];
      const newEdgeY =
        (vectorY / vectorLength) * projection + coor[cornerIndex1][1];

      // 计算中点的偏移
      const dx = newX - newEdgeX;
      const dy = newY - newEdgeY;

      // 更新相邻角点的坐标
      coor[cornerIndex1][0] += dx;
      coor[cornerIndex1][1] += dy;
      coor[cornerIndex2][0] += dx;
      coor[cornerIndex2][1] += dy;

      // 更新中点的坐标
      coor[draggedPointIndex][0] = newX;
      coor[draggedPointIndex][1] = newY;
    }

    return coor.filter((_: any, i: number) => i % 2 === 0);
  }

  handelMouseUp(e: MouseEvent | TouchEvent) {
    // 兼容火狐浏览 TouchEvent
    e.stopPropagation();
    this.evt = e;
    if (this.lock) return;

    if (window.TouchEvent && e instanceof window.TouchEvent) {
      if (e.touches.length === 0) {
        this.isTouch2 = false;
      }
      if (Date.now() - this.dblTouchStore < this.dblTouch) {
        this.handelDblclick(e);
        return;
      }
      this.dblTouchStore = Date.now();
    }
    this.remember = [];
    if (this.activeShape.type) {
      this.activeShape.dragging = false;
      if (this.activeShape.creating) {
        if (this.activeShape.type === 1) {
          const [[x0, y0], [x1, y1]] = this.activeShape.coor;
          if (
            Math.abs(x0 - x1) < this.MIN_WIDTH ||
            Math.abs(y0 - y1) < this.MIN_HEIGHT
          ) {
            this.dataset.pop();
            this.emit(
              'warn',
              `Width cannot be less than ${this.MIN_WIDTH},Height cannot be less than ${this.MIN_HEIGHT}`
            );
          } else {
            const [[x0, y0], [x1, y1]] = this.activeShape.coor;
            this.activeShape.coor = [
              [Math.min(x0, x1), Math.min(y0, y1)],
              [Math.max(x0, x1), Math.max(y0, y1)],
            ];
            this.activeShape.creating = false;
            this.emit('add', this.activeShape);
          }
        } else if (this.activeShape.type === 8) {
          // 4组坐标
          const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] =
            this.activeShape.coor;
          // 判断边界
          if (
            Math.abs(x0 - x2) < this.MIN_WIDTH ||
            Math.abs(y0 - y2) < this.MIN_HEIGHT
          ) {
            this.dataset.pop();
            this.emit(
              'warn',
              `Width cannot be less than ${this.MIN_WIDTH},Height cannot be less than ${this.MIN_HEIGHT}`
            );
          } else {
            // 4组坐标
            this.activeShape.coor = [
              [Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3)],
              [Math.max(x0, x1, x2, x3), Math.min(y0, y1, y2, y3)],
              [Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3)],
              [Math.min(x0, x1, x2, x3), Math.max(y0, y1, y2, y3)],
            ];
            this.activeShape.creating = false;
            this.emit('add', this.activeShape);
          }
        } else if (this.activeShape.type === 5) {
          if (this.activeShape.radius < this.MIN_RADIUS) {
            this.dataset.pop();
            this.emit('warn', `Radius cannot be less than ${this.MIN_WIDTH}`);
          } else {
            this.activeShape.creating = false;
            this.emit('add', this.activeShape);
          }
        }

        this.update();
      }
    }
  }
  handelDblclick(e: MouseEvent | TouchEvent | KeyboardEvent) {
    e.stopPropagation();
    this.evt = e;
    if (this.lock) return;
    if ([2, 4].includes(this.activeShape.type)) {
      if (
        (this.activeShape.type === 2 && this.activeShape.coor.length > 2) ||
        (this.activeShape.type === 4 && this.activeShape.coor.length > 1)
      ) {
        this.emit('add', this.activeShape);
        this.activeShape.creating = false;
        this.update();
      }
    }
  }
  handelKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    this.evt = e;

    if (this.lock || document.activeElement !== document.body) return;
    if (this.activeShape.type) {
      // 图形移动
      if ([1, 2, 4].includes(this.activeShape.type)) {
        if (e.key === 'ArrowUp') {
          this.activeShape.coor = this.activeShape.coor.map(
            ([x, y]: Array<number>) => [x, y - 1]
          );
        } else if (e.key === 'ArrowDown') {
          this.activeShape.coor = this.activeShape.coor.map(
            ([x, y]: Array<number>) => [x, y + 1]
          );
        } else if (e.key === 'ArrowLeft') {
          this.activeShape.coor = this.activeShape.coor.map(
            ([x, y]: Array<number>) => [x - 1, y]
          );
        } else if (e.key === 'ArrowRight') {
          this.activeShape.coor = this.activeShape.coor.map(
            ([x, y]: Array<number>) => [x + 1, y]
          );
        }
      }
      //   圆形，半径大小
      if (this.activeShape.type === 5) {
        if (e.key === 'ArrowUp') {
          this.activeShape.radius -= 1;
        } else if (e.key === 'ArrowDown') {
          this.activeShape.radius += 1;
        }
      }
      //   点，坐标移动
      if (this.activeShape.type === 3) {
        if (e.key === 'ArrowUp') {
          this.activeShape.coor[1] -= 1;
        } else if (e.key === 'ArrowDown') {
          this.activeShape.coor[1] += 1;
        } else if (e.key === 'ArrowLeft') {
          this.activeShape.coor[0] -= 1;
        } else if (e.key === 'ArrowRight') {
          this.activeShape.coor[0] += 1;
        }
      }
      //   多边形，线性，后退一步
      if ([2, 4].includes(this.activeShape.type) && e.key === 'Escape') {
        if (this.activeShape.coor.length > 1 && this.activeShape.creating) {
          this.activeShape.coor.pop();
        } else {
          this.deleteByIndex(this.activeShape.index);
        }
      } else if (
        [1, 8, 3, 5].includes(this.activeShape.type) &&
        e.key === 'Escape'
      ) {
        this.deleteByIndex(this.activeShape.index);
      }
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.deleteByIndex(this.activeShape.index);
    }
    // enter 确认
    if (this.activeShape.type === 2 && e.key === 'Enter') {
      console.log('123123');
      this.handelDblclick(e);
    }
    if (e.code === 'Digit1' && e.shiftKey) {
      this.createType = 1;
    } else if (e.code === 'Digit2' && e.shiftKey) {
      this.createType = 2;
    } else if (e.code === 'Digit3' && e.shiftKey) {
      this.createType = 3;
    } else if (e.code === 'Digit4' && e.shiftKey) {
      this.createType = 4;
    } else if (e.code === 'Digit5' && e.shiftKey) {
      this.createType = 5;
    } else if (e.code === 'Digit8' && e.shiftKey) {
      this.createType = 8;
    } else if (e.code === 'Backquote' && e.shiftKey) {
      // 是否锁定
      // this.lock = !this.lock
      this.createType = 0;
    } else if (e.code === 'KeyZ' && e.ctrlKey) {
      this.rotate();
    }
  }
  rotate() {
    console.log('this.activeShape', this.activeShape);
    if (
      this.lock ||
      document.activeElement !== document.body ||
      this.activeShape.type !== 8 ||
      !this.activeShape.coor
    ) {
      return false;
    }
    this.update(this.angleStep);
  }
  // 撤销
  revoke() {
    if (this.lock || document.activeElement !== document.body) return;
    if (this.activeShape.type) {
      if ([2, 4].includes(this.activeShape.type)) {
        if (this.activeShape.coor.length > 1 && this.activeShape.creating) {
          this.activeShape.coor.pop();
        } else {
          this.deleteByIndex(this.activeShape.index);
        }
      } else if ([1, 8, 3, 5].includes(this.activeShape.type)) {
        this.deleteByIndex(this.activeShape.index);
      }
      this.update();
    }
  }
  /**
   * 初始化
   */
  initSetting() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.userSelect = 'none';
    this.ctx = this.canvas.getContext('2d', { alpha: this.alpha });
    this.WIDTH = this.canvas.clientWidth;
    this.HEIGHT = this.canvas.clientHeight;
    this.canvas.width = this.WIDTH * dpr;
    this.canvas.height = this.HEIGHT * dpr;
    this.canvas.style.width = this.WIDTH + 'px';
    this.canvas.style.height = this.HEIGHT + 'px';
    this.offScreen = document.createElement('canvas');
    this.offScreen.width = this.WIDTH;
    this.offScreen.height = this.HEIGHT;
    this.offScreenCtx =
      this.offScreenCtx ||
      this.offScreen.getContext('2d', { willReadFrequently: true });

    this.ctx!.scale(dpr, dpr);
  }
  initEvents() {
    this.image.addEventListener('load', this.handleLoad);
    this.canvas.addEventListener('touchstart', this.handleMouseDown);
    this.canvas.addEventListener('touchmove', this.handelMouseMove);
    this.canvas.addEventListener('touchend', this.handelMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextmenu);
    this.canvas.addEventListener('wheel', this.handleMousewheel);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handelMouseMove);
    this.canvas.addEventListener('mouseup', this.handelMouseUp);
    this.canvas.addEventListener('dblclick', this.handelDblclick);
    document.body.addEventListener('keydown', this.handelKeydown);
    window.addEventListener('resize', this.resize);
  }
  /**
   * 添加/切换图片
   * @param url 图片链接
   */
  setImage(url: string) {
    this.image.src = url;
  }
  /**
   * 设置数据
   * @param data Array
   */
  setData(data: AllShape[]) {
    setTimeout(() => {
      let initdata: AllShape[] = [];
      data.forEach((item, index) => {
        if (Object.prototype.toString.call(item).indexOf('Object') > -1) {
          let shape: AllShape = {} as AllShape;
          switch (item.type) {
            case 1:
              shape = new Rect(item, index, 1);
              break;

            case 8:
              shape = new Rect(item, index, 8);
              break;
            case 2:
              shape = new Polygon(item, index);
              break;
            case 3:
              shape = new Dot(item, index);
              break;
            case 4:
              shape = new Line(item, index);
              break;
            case 5:
              shape = new Circle(item, index);
              break;
            default:
              console.warn('Invalid shape', item);
              break;
          }
          [1, 8, 2, 3, 4, 5].includes(item.type) && initdata.push(shape);
        } else {
          console.warn('Shape must be an enumerable Object.', item);
        }
      });
      this.dataset = initdata;
      this.update();
    });
  }
  /**
   * 判断是否在标注实例上
   * @param mousePoint 点击位置
   * @returns
   */
  hitOnShape(mousePoint: Point): [number, AllShape] {
    let hitShapeIndex = -1;
    let hitShape: AllShape = {} as AllShape;
    for (let i = this.dataset.length - 1; i > -1; i--) {
      const shape = this.dataset[i];
      if (
        (shape.type === 3 &&
          this.isPointInCircle(
            mousePoint,
            shape.coor as Point,
            this.ctrlRadius
          )) ||
        (shape.type === 5 &&
          this.isPointInCircle(
            mousePoint,
            shape.coor as Point,
            (shape as Circle).radius * this.scale
          )) ||
        (shape.type === 1 &&
          this.isPointInRect(mousePoint, (shape as Rect).coor)) ||
        ((shape.type === 2 || shape.type === 8) &&
          this.isPointInPolygon(mousePoint, (shape as Polygon).coor)) ||
        (shape.type === 4 &&
          this.isPointInLine(mousePoint, (shape as Line).coor))
      ) {
        if (this.focusMode && !shape.active) continue;
        hitShapeIndex = i;
        hitShape = shape;
        break;
      }
    }
    return [hitShapeIndex, hitShape];
  }

  /**
   * 判断鼠标是否在背景图内部
   * @param e MouseEvent
   * @returns 布尔值
   */
  isInBackground(e: MouseEvent | TouchEvent | KeyboardEvent): boolean {
    const { mouseX, mouseY } = this.mergeEvent(e);
    return (
      mouseX >= this.originX &&
      mouseY >= this.originY &&
      mouseX <= this.originX + this.IMAGE_ORIGIN_WIDTH * this.scale &&
      mouseY <= this.originY + this.IMAGE_ORIGIN_HEIGHT * this.scale
    );
  }
  /**
   * 判断是否在矩形内
   * @param point 坐标
   * @param coor 区域坐标
   * @returns 布尔值
   */
  isPointInRect(point: Point, coor: Point[]): boolean {
    const [x, y] = point;
    const [[x0, y0], [x1, y1]] = coor.map((a) => a.map((b) => b * this.scale));
    return (
      x0 + this.originX <= x &&
      x <= x1 + this.originX &&
      y0 + this.originY <= y &&
      y <= y1 + this.originY
    );
  }
  /**
   * 判断是否在多边形内
   * @param point 坐标
   * @param coor 区域坐标
   * @returns 布尔值
   */
  isPointInPolygon(point: Point, coor: Point[]): boolean {
    this.offScreenCtx.save();
    this.offScreenCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    this.offScreenCtx.translate(this.originX, this.originY);
    this.offScreenCtx.beginPath();
    coor.forEach((pt, i) => {
      const [x, y] = pt.map((a) => Math.round(a * this.scale));
      if (i === 0) {
        this.offScreenCtx.moveTo(x, y);
      } else {
        this.offScreenCtx.lineTo(x, y);
      }
    });
    this.offScreenCtx.closePath();
    this.offScreenCtx.fill();
    const areaData = this.offScreenCtx.getImageData(
      0,
      0,
      this.WIDTH,
      this.HEIGHT
    );
    const index = (point[1] - 1) * this.WIDTH * 4 + point[0] * 4;
    this.offScreenCtx.restore();
    return areaData.data[index + 3] !== 0;
  }
  /**
   * 判断是否在圆内
   * @param point 坐标
   * @param center 圆心
   * @param r 半径
   * @param needScale 是否为圆形点击检测
   * @returns 布尔值
   */
  isPointInCircle(point: Point, center: Point, r: number): boolean {
    const [x, y] = point;
    const [x0, y0] = center.map((a) => a * this.scale);
    const distance = Math.sqrt(
      (x0 + this.originX - x) ** 2 + (y0 + this.originY - y) ** 2
    );
    return distance <= r * 2;
  }
  /**
   * 判断是否在折线内
   * @param point 坐标
   * @param coor 区域坐标
   * @returns 布尔值
   */
  isPointInLine(point: Point, coor: Point[]): boolean {
    this.offScreenCtx.save();
    this.offScreenCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    this.offScreenCtx.translate(this.originX, this.originY);
    this.offScreenCtx.lineWidth = 5;
    this.offScreenCtx.beginPath();
    coor.forEach((pt, i) => {
      const [x, y] = pt.map((a) => Math.round(a * this.scale));
      if (i === 0) {
        this.offScreenCtx.moveTo(x, y);
      } else {
        this.offScreenCtx.lineTo(x, y);
      }
    });
    this.offScreenCtx.stroke();
    const areaData = this.offScreenCtx.getImageData(
      0,
      0,
      this.WIDTH,
      this.HEIGHT
    );
    const index = (point[1] - 1) * this.WIDTH * 4 + point[0] * 4;
    this.offScreenCtx.restore();
    return areaData.data[index + 3] !== 0;
  }
  /**
   * 绘制矩形
   * @param shape 标注实例
   * @returns
   */
  drawRect(shape: Rect) {
    if (shape.coor.length !== 2) return;
    const {
      labelFillStyle,
      textFillStyle,
      labelFont,
      strokeStyle,
      fillStyle,
      active,
      creating,
      coor,
      label,
      count,
    } = shape;
    const [[x0, y0], [x1, y1]] = coor.map((a: Point) =>
      a.map((b) => Math.round(b * this.scale))
    );
    this.ctx.save();
    this.ctx.fillStyle = fillStyle || this.fillStyle;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle =
      active || creating
        ? this.activeStrokeStyle
        : strokeStyle || this.strokeStyle;
    const w = x1 - x0;
    const h = y1 - y0;
    this.ctx.strokeRect(x0, y0, w, h);
    if (!creating) this.ctx.fillRect(x0, y0, w, h);
    this.ctx.restore();
    this.drawLabel(
      coor[0],
      label,
      labelFillStyle,
      labelFont,
      textFillStyle,
      count
    );
  }
  /**
   * 绘制旋转矩形
   * @param shape 标注实例
   * @returns
   */
  drawRotateRect(shape: Rect, angle: number = 0) {
    const {
      labelFillStyle,
      textFillStyle,
      labelFont,
      strokeStyle,
      fillStyle,
      active,
      creating,
      coor,
      label,
      count,
    } = shape;
    if (shape.coor.length !== 4) return;
    if (!active) {
      angle = 0;
    }
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = coor.map((a: Point) =>
      a.map((b) => b * this.scale)
    );
    const cx = (x0 + x1 + x2 + x3) / 4;
    const cy = (y0 + y1 + y2 + y3) / 4;
    const dreg = (angle * Math.PI) / 180;
    const cos = Math.cos(dreg);
    const sin = Math.sin(dreg);
    const x0_ = cos * (x0 - cx) - sin * (y0 - cy) + cx;
    const y0_ = sin * (x0 - cx) + cos * (y0 - cy) + cy;
    const x1_ = cos * (x1 - cx) - sin * (y1 - cy) + cx;
    const y1_ = sin * (x1 - cx) + cos * (y1 - cy) + cy;
    const x2_ = cos * (x2 - cx) - sin * (y2 - cy) + cx;
    const y2_ = sin * (x2 - cx) + cos * (y2 - cy) + cy;
    const x3_ = cos * (x3 - cx) - sin * (y3 - cy) + cx;
    const y3_ = sin * (x3 - cx) + cos * (y3 - cy) + cy;
    if (active) {
      this.activeShape.coor = [
        [x0_, y0_],
        [x1_, y1_],
        [x2_, y2_],
        [x3_, y3_],
      ].map((a: number[]) => a.map((b) => b / this.scale));
    }

    this.ctx.save();
    this.ctx.fillStyle = fillStyle || this.fillStyle;
    this.ctx.strokeStyle =
      active || creating
        ? this.activeStrokeStyle
        : strokeStyle || this.strokeStyle;

    this.ctx.lineWidth = this.lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x0_, y0_);
    this.ctx.lineTo(x1_, y1_);
    this.ctx.moveTo(x1_, y1_);
    this.ctx.lineTo(x2_, y2_);
    this.ctx.moveTo(x2_, y2_);
    this.ctx.lineTo(x3_, y3_);
    this.ctx.moveTo(x3_, y3_);
    this.ctx.lineTo(x0_, y0_);
    this.ctx.closePath();
    this.ctx.stroke();
    if (!creating) this.ctx.fill();
    this.ctx.restore();
    this.drawLabel(
      coor[0],
      label,
      labelFillStyle,
      labelFont,
      textFillStyle,
      count
    );
  }

  /**
   * 绘制多边形
   * @param shape 标注实例
   */
  drawPolygon(shape: Polygon) {
    const {
      labelFillStyle,
      textFillStyle,
      labelFont,
      strokeStyle,
      fillStyle,
      active,
      creating,
      coor,
      label,
      count,
    } = shape;
    this.ctx.save();
    this.ctx.fillStyle = fillStyle || this.fillStyle;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle =
      active || creating
        ? this.activeStrokeStyle
        : strokeStyle || this.strokeStyle;
    this.ctx.beginPath();
    coor.forEach((el: Point, i) => {
      const [x, y] = el.map((a) => Math.round(a * this.scale));
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    if (creating) {
      const [x, y] = this.mouse || [];
      this.ctx.lineTo(x - this.originX, y - this.originY);
    } else if (coor.length > 2) {
      this.ctx.closePath();
    }
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
    this.drawLabel(
      coor[0],
      label,
      labelFillStyle,
      labelFont,
      textFillStyle,
      count
    );
  }
  /**
   * 绘制点
   * @param shape 标注实例
   */
  drawDot(shape: Dot) {
    const {
      labelFillStyle,
      textFillStyle,
      labelFont,
      strokeStyle,
      fillStyle,
      active,
      coor,
      label,
    } = shape;
    const [x, y] = coor.map((a) => a * this.scale);
    this.ctx.save();
    this.ctx.fillStyle = fillStyle || this.ctrlFillStyle;
    this.ctx.strokeStyle = active
      ? this.activeStrokeStyle
      : strokeStyle || this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.ctrlRadius, 0, 2 * Math.PI, true);
    this.ctx.fill();
    this.ctx.arc(x, y, this.ctrlRadius, 0, 2 * Math.PI, true);
    this.ctx.stroke();
    this.ctx.restore();
    this.drawLabel(
      coor as Point,
      label,
      labelFillStyle,
      labelFont,
      textFillStyle
    );
  }
  /**
   * 绘制圆
   * @param shape 标注实例
   */
  drawCirle(shape: Circle) {
    const {
      labelFillStyle,
      textFillStyle,
      labelFont,
      strokeStyle,
      fillStyle,
      active,
      coor,
      label,
      creating,
      radius,
      ctrlsData,
    } = shape;
    const [x, y] = coor.map((a) => a * this.scale);
    this.ctx.save();
    this.ctx.fillStyle = fillStyle || this.fillStyle;
    this.ctx.strokeStyle =
      active || creating
        ? this.activeStrokeStyle
        : strokeStyle || this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * this.scale, 0, 2 * Math.PI, true);
    this.ctx.fill();
    this.ctx.arc(x, y, radius * this.scale, 0, 2 * Math.PI, true);
    this.ctx.stroke();
    this.ctx.restore();
    this.drawLabel(
      ctrlsData[0] as Point,
      label,
      labelFillStyle,
      labelFont,
      textFillStyle
    );
  }

  /**
   * 绘制折线
   * @param shape 标注实例
   */
  drawLine(shape: Line) {
    try {
      const {
        labelFillStyle,
        textFillStyle,
        labelFont,
        strokeStyle,
        active,
        creating,
        coor,
        label,
      } = shape;
      this.ctx.save();
      this.ctx.strokeStyle =
        active || creating
          ? this.activeStrokeStyle
          : strokeStyle || this.strokeStyle;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.beginPath();

      coor.forEach((el: Point, i) => {
        const [x, y] = el.map((a) => Math.round(a * this.scale));
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      if (creating) {
        const [x, y] = this.mouse || [];
        this.ctx.lineTo(x - this.originX, y - this.originY);
      }
      this.ctx.stroke();
      this.ctx.restore();
      this.drawLabel(coor[0], label, labelFillStyle, labelFont, textFillStyle);
    } catch (error) {
      console.log('error', error);
    }
  }
  /**
   * 绘制辅助线，参考线
   * @param shape 标注实例
   */
  drawCursorLine() {
    if (this.isInBackground(this.evt)) {
      const { mouseX, mouseY } = this.mergeEvent(this.evt);
      // 获取图片x,y 七点坐标
      this.ctx.restore();
      this.ctx.save();
      this.ctx.setLineDash(this.cursorLineDash);
      this.ctx.lineWidth = this.cursorLineWidth;
      this.ctx.strokeStyle = this.cursorStrokeStyle;
      this.ctx.beginPath();

      this.ctx.moveTo(this.originX, mouseY);
      this.ctx.lineTo(
        this.originX + this.IMAGE_ORIGIN_WIDTH * this.scale,
        mouseY
      );
      this.ctx.moveTo(mouseX, this.originY);
      this.ctx.lineTo(
        mouseX,
        this.originY + this.IMAGE_ORIGIN_HEIGHT * this.scale
      );
      this.ctx.stroke();
      this.ctx.restore();
      this.ctx.save();
    }
  }
  /**
   * 绘制控制点
   * @param point 坐标
   */
  drawCtrl(point: Point) {
    const [x, y] = point.map((a) => a * this.scale);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = this.ctrlFillStyle;
    this.ctx.strokeStyle = this.ctrlStrokeStyle;
    this.ctx.arc(x, y, this.ctrlRadius, 0, 4 * Math.PI, true);
    this.ctx.fill();
    this.ctx.arc(x, y, this.ctrlRadius, 0, 4 * Math.PI, true);
    this.ctx.stroke();
    this.ctx.restore();
  }
  /**
   * 绘制控制点列表
   * @param shape 标注实例
   */
  drawCtrlList(shape: Rect | Polygon | Line) {
    shape.ctrlsData.forEach((point, i) => {
      if (shape.type === 5) {
        if (i === 1) this.drawCtrl(point);
      } else {
        this.drawCtrl(point);
      }
    });
  }
  /**
   * 绘制label
   * @param point 位置
   * @param label 文本
   */
  drawLabel(
    point: Point,
    label = '',
    labelFillStyle = '',
    labelFont = '',
    textFillStyle = '',
    count = 0
  ) {
    if (label.length) {
      this.ctx.font = labelFont || this.labelFont;

      const textH = parseInt(this.ctx.font) + 6;
      const newText =
        label.length < this.labelMaxLen + 1
          ? label
          : `${label.slice(0, this.labelMaxLen)}...`;
      const text = this.ctx.measureText(newText);
      const [x, y] = point.map((a) => a * this.scale);
      const toleft =
        this.IMAGE_ORIGIN_WIDTH - point[0] < (text.width + 4) / this.scale;
      const toTop = this.IMAGE_ORIGIN_HEIGHT - point[1] < textH / this.scale;
      this.ctx.save();
      this.ctx.fillStyle = labelFillStyle || this.labelFillStyle;

      this.ctx.fillRect(
        toleft ? x - text.width - 3 : x + 1,
        toTop ? y - textH + 3 : y + 1,
        text.width + 40,
        textH
      );
      this.ctx.fillStyle = textFillStyle || this.textFillStyle;
      this.ctx.fillText(
        newText,
        toleft ? x - text.width - 2 : x + 2,
        toTop ? y - 3 : y + textH - 4,
        180
      );
      this.ctx.fillStyle = 'red';
      this.ctx.font = '18px Arial';
      this.ctx.fillText(
        count,
        toleft ? x + 20 : x + text.width + 20,
        toTop ? y - 3 : y + textH - 4,
        180
      );
      this.ctx.restore();
    }
  }
  /**
   * @description：更新计数及保存count 给color使用
   * @author: zhaojs
   * @date: 2024-04-11 14:55:14
   * @param {newShape} 当前新增的shape
   */
  updateCount(newShape: AllShape) {
    this.count =
      (this.dataset.length && this.dataset[this.dataset.length - 1].count) || 0;
    if (!this.isSame) {
      this.count++;
    }
    if (newShape && newShape.active) {
      newShape.count = this.count;
    }
    newShape.strokeStyle = this.colors[this.count] || this.strokeStyle;
    return newShape;
  }

  /**
   * 更新画布
   */
  update(angle = 0) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
      this.ctx.translate(this.originX, this.originY);
      if (this.IMAGE_WIDTH && this.IMAGE_HEIGHT) {
        this.ctx.drawImage(
          this.image,
          0,
          0,
          this.IMAGE_WIDTH,
          this.IMAGE_HEIGHT
        );
      }
      let renderList = this.focusMode
        ? this.activeShape.type
          ? [this.activeShape]
          : []
        : this.dataset;
      for (let i = 0; i < renderList.length; i++) {
        const shape = renderList[i];
        if (shape.hide) continue;
        switch (shape.type) {
          case 1:
            this.drawRect(shape as Rect);
            break;
          case 8:
            this.drawRotateRect(shape as Rect, angle);
            break;
          case 2:
            this.drawPolygon(shape as Polygon);
            break;
          case 3:
            this.drawDot(shape as Dot);
            break;
          case 4:
            this.drawLine(shape as Line);
            break;
          case 5:
            this.drawCirle(shape as Circle);
            break;
          default:
            break;
        }
      }
      if (
        [1, 8, 2, 4, 5].includes(this.activeShape.type) &&
        !this.activeShape.hide
      ) {
        this.drawCtrlList(this.activeShape);
      }
      // 开启辅助线
      this.isCursor && this.drawCursorLine();
      this.ctx.restore();
      this.emit('updated', this.dataset);
    }, 0);
  }

  /**
   * 删除指定矩形
   * @param index number
   */
  deleteByIndex(index: number) {
    const num = this.dataset.findIndex((x) => x.index === index);
    if (num > -1) {
      this.emit('delete', this.dataset[num]);
      this.dataset.splice(num, 1);
      this.dataset.forEach((item, i) => {
        item.index = i;
      });
      this.update();
    }
  }

  /**
   * 计算缩放步长
   */
  calcStep(flag = '') {
    if (this.IMAGE_WIDTH < this.WIDTH && this.IMAGE_HEIGHT < this.HEIGHT) {
      if (flag === '' || flag === 'b') {
        this.setScale(true, false, true);
        this.calcStep('b');
      }
    }
    if (this.IMAGE_WIDTH > this.WIDTH || this.IMAGE_HEIGHT > this.HEIGHT) {
      if (flag === '' || flag === 's') {
        this.setScale(false, false, true);
        this.calcStep('s');
      }
    }
  }

  /**
   * 缩放
   * @param type true放大5%，false缩小5%
   * @param center 缩放中心 center|mouse
   * @param pure 不绘制
   */
  setScale(type: boolean, byMouse = false, pure = false) {
    // if (this.lock) return
    const limitSize = Math.min(this.imageMin, 50);
    if (
      (!type && this.imageMin < limitSize) ||
      (type && this.IMAGE_WIDTH >= this.imageOriginMax * 10)
    )
      return;
    if (type) {
      this.scaleStep++;
    } else {
      this.scaleStep--;
    }
    let realToLeft = 0;
    let realToRight = 0;
    const [x, y] = this.mouse || [];
    if (byMouse) {
      realToLeft = (x - this.originX) / this.scale;
      realToRight = (y - this.originY) / this.scale;
    }
    const abs = Math.abs(this.scaleStep);
    const width = this.IMAGE_WIDTH;
    this.IMAGE_WIDTH = Math.round(
      this.IMAGE_ORIGIN_WIDTH * (this.scaleStep >= 0 ? 1.05 : 0.95) ** abs
    );
    this.IMAGE_HEIGHT = Math.round(
      this.IMAGE_ORIGIN_HEIGHT * (this.scaleStep >= 0 ? 1.05 : 0.95) ** abs
    );
    if (byMouse) {
      this.originX = x - realToLeft * this.scale;
      this.originY = y - realToRight * this.scale;
    } else {
      const scale = this.IMAGE_WIDTH / width;
      this.originX = this.WIDTH / 2 - (this.WIDTH / 2 - this.originX) * scale;
      this.originY = this.HEIGHT / 2 - (this.HEIGHT / 2 - this.originY) * scale;
    }
    if (!pure) {
      this.update();
    }
  }

  /**
   * 适配背景图
   */
  fitZoom() {
    this.calcStep();
    if (this.IMAGE_HEIGHT / this.IMAGE_WIDTH >= this.HEIGHT / this.WIDTH) {
      this.IMAGE_WIDTH =
        this.IMAGE_ORIGIN_WIDTH / (this.IMAGE_ORIGIN_HEIGHT / this.HEIGHT);
      this.IMAGE_HEIGHT = this.HEIGHT;
    } else {
      this.IMAGE_WIDTH = this.WIDTH;
      this.IMAGE_HEIGHT =
        this.IMAGE_ORIGIN_HEIGHT / (this.IMAGE_ORIGIN_WIDTH / this.WIDTH);
    }
    this.originX = (this.WIDTH - this.IMAGE_WIDTH) / 2;
    this.originY = (this.HEIGHT - this.IMAGE_HEIGHT) / 2;
    this.update();
  }
  /**
   * 设置专注模式
   * @param type {boolean}
   */
  setFocusMode(type: boolean) {
    this.focusMode = type;
    this.update();
  }

  /**
   * 重新设置画布大小
   */

  resize() {
    this.canvas.width = null;
    this.canvas.height = null;
    this.canvas.style.width = null;
    this.canvas.style.height = null;
    this.handleLoad();
    this.initSetting();
    this.update();
  }

  destroy() {
    if (this.canvas) {
      this.image.removeEventListener('load', this.handleLoad);
      this.canvas.removeEventListener('contextmenu', this.handleContextmenu);
      this.canvas.removeEventListener('wheel', this.handleMousewheel);
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('touchend', this.handleMouseDown);
      this.canvas.removeEventListener('mousemove', this.handelMouseMove);
      this.canvas.removeEventListener('touchmove', this.handelMouseMove);
      this.canvas.removeEventListener('mouseup', this.handelMouseUp);
      this.canvas.removeEventListener('touchend', this.handelMouseUp);
      this.canvas.removeEventListener('dblclick', this.handelDblclick);
      document.body.removeEventListener('keydown', this.handelKeydown);
      window.removeEventListener('resize', this.resize);
      this.canvas.width = this.WIDTH;
      this.canvas.height = this.HEIGHT;
      this.canvas.style.width = '0';
      this.canvas.style.height = '0';
      this.canvas.style.userSelect = 'none';
    }
  }
}
