export default class EventBus {
    _eventTree: Record<string, any>;
    /**
     * 注册事件
     * @param eventName 事件名称
     * @param cb 回调方法
     */
    on(eventName: string, cb: Function): void;
    /**
     * 触发事件
     * @param eventName 事件名称
     * @param payload 传递参数
     */
    emit(eventName: string, ...payload: any): void;
    /**
     * 注销事件
     * @param eventName 事件名称
     * @param cb 传递参数
     */
    off(eventName: string, cb: Function): void;
}
