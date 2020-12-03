const EVENTS = {
  IMAGE_RENDERED: 'cornerstoneimagerendered',
  ELEMENT_DISABLED: 'cornerstoneelementdisabled',
  ELEMENT_ENABLED: 'cornerstoneelementenabled',
};

/**
 * EventTarget - Provides the [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) interface
 *
 * @class
 */
class RenderingEventTarget {
  listeners: {
    cornerstoneelementdisabled: Array<Function>;
    cornerstoneelementenabled: Array<Function>;
  };

  constructor() {
    this.listeners = {
      cornerstoneelementdisabled: [],
      cornerstoneelementenabled: [],
    };
  }

  public addEventListener(type, callback) {
    this.listeners[type].push(callback);
  }

  public removeEventListener(type, callback) {
    const stack = this.listeners[type];
    const stackLength = stack.length;

    for (let i = 0; i < stackLength; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1);

        return;
      }
    }
  }

  dispatchEvent(event) {
    const stack = this.listeners[event.type];
    const stackLength = stack.length;

    for (let i = 0; i < stackLength; i++) {
      stack[i].call(this, event);
    }

    return !event.defaultPrevented;
  }
}
const renderingEventTarget = new RenderingEventTarget();

export default renderingEventTarget;
export { EVENTS };