// utils/wow.ts

function isIn<T>(needle: T, haystack: T[] | string): boolean {
  if (Array.isArray(haystack)) {
    return haystack.indexOf(needle) >= 0;
  }
  if (typeof haystack === "string" && typeof needle === "string") {
    return haystack.indexOf(needle) >= 0;
  }
  return false;
}

function extend<T extends Record<string, any>, U extends Record<string, any>>(
  custom: T,
  defaults: U
): T & U {
  const result: any = { ...defaults, ...custom };
  for (const key in defaults) {
    if (result[key] == null) {
      result[key] = defaults[key];
    }
  }
  return result;
}

function isMobile(agent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    agent
  );
}

function createEvent(
  event: string,
  bubble: boolean = false,
  cancel: boolean = false,
  detail: any = null
): CustomEvent<any> {
  let customEvent: CustomEvent<any>;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (typeof (document as any).createEvent === "function") {
      customEvent = document.createEvent("CustomEvent");
      customEvent.initCustomEvent(event, bubble, cancel, detail);
    } else {
      customEvent = new CustomEvent(event, {
        bubbles: bubble,
        cancelable: cancel,
        detail,
      });
    }
  } else {
    customEvent = {
      type: event,
      detail,
    } as any;
  }

  return customEvent;
}

function emitEvent(elem: Element, event: CustomEvent<any>): void {
  const anyElem = elem as any;
  if (typeof anyElem.dispatchEvent === "function") {
    anyElem.dispatchEvent(event);
  } else if (typeof anyElem[(event as any).type] === "function") {
    anyElem[(event as any).type]();
  } else if (typeof anyElem[`on${(event as any).type}`] === "function") {
    anyElem[`on${(event as any).type}`]();
  }
}

function addEvent(
  elem: Element | Document | Window,
  event: string,
  fn: EventListener
): void {
  const anyElem = elem as any;
  if (typeof anyElem.addEventListener === "function") {
    anyElem.addEventListener(event, fn, false);
  } else if (typeof anyElem.attachEvent === "function") {
    anyElem.attachEvent(`on${event}`, fn);
  } else {
    anyElem[`on${event}`] = fn;
  }
}

function removeEvent(
  elem: Element | Document | Window,
  event: string,
  fn: EventListener
): void {
  const anyElem = elem as any;
  if (typeof anyElem.removeEventListener === "function") {
    anyElem.removeEventListener(event, fn, false);
  } else if (typeof anyElem.detachEvent === "function") {
    anyElem.detachEvent(`on${event}`, fn);
  } else {
    delete anyElem[`on${event}`];
  }
}

function getInnerHeight(): number {
  if (typeof window !== "undefined" && "innerHeight" in window) {
    return window.innerHeight;
  }
  if (typeof document !== "undefined") {
    return document.documentElement.clientHeight;
  }
  return 0;
}

// WeakMap shim
const WeakMapShim =
  (typeof window !== "undefined" && (window as any).WeakMap) ||
  (typeof window !== "undefined" && (window as any).MozWeakMap) ||
  class WeakMapShim<K extends object, V> {
    private keys: K[] = [];
    private values: V[] = [];
    get(key: K): V | undefined {
      for (let i = 0; i < this.keys.length; i++) {
        if (this.keys[i] === key) return this.values[i];
      }
      return undefined;
    }
    set(key: K, value: V): this {
      for (let i = 0; i < this.keys.length; i++) {
        if (this.keys[i] === key) {
          this.values[i] = value;
          return this;
        }
      }
      this.keys.push(key);
      this.values.push(value);
      return this;
    }
  };

// MutationObserver shim
const MutationObserverShim: {
  new (cb: (records: MutationRecord[]) => void): MutationObserver;
  notSupported?: boolean;
} =
  (typeof window !== "undefined" && (window as any).MutationObserver) ||
  (typeof window !== "undefined" && (window as any).WebkitMutationObserver) ||
  (typeof window !== "undefined" && (window as any).MozMutationObserver) ||
  class DummyMutationObserver {
    static notSupported = true;
    constructor() {
      if (typeof console !== "undefined") {
        console.warn("MutationObserver is not supported by your browser.");
        console.warn(
          "WOW.js cannot detect dom mutations, please call .sync() after loading new content."
        );
      }
    }
    observe() {}
    disconnect() {}
    takeRecords(): MutationRecord[] {
      return [];
    }
  };

// getComputedStyle shim
const getComputedStyleShim =
  (typeof window !== "undefined" && (window as any).getComputedStyle) ||
  function getComputedStyleFallback(el: Element): CSSStyleDeclaration {
    const getComputedStyleRX = /(\-([a-z]){1})/g;
    return {
      getPropertyValue(prop: string): string | null {
        let p = prop;
        if (p === "float") {
          p = "styleFloat";
        }
        if (getComputedStyleRX.test(p)) {
          p = p.replace(
            getComputedStyleRX,
            (_: string, __: string, c: string) => c.toUpperCase()
          );
        }
        const currentStyle = (el as any).currentStyle;
        return (currentStyle != null ? currentStyle[p] : undefined) || null;
      },
    } as CSSStyleDeclaration;
  };

export interface WOWOptions {
  boxClass?: string;
  animateClass?: string;
  offset?: number;
  mobile?: boolean;
  live?: boolean;
  callback?: ((box: Element) => void) | null;
  scrollContainer?: string | null;
}

export default class WOW {
  private defaults: Required<WOWOptions> = {
    boxClass: "wow",
    animateClass: "animated",
    offset: 0,
    mobile: true,
    live: true,
    callback: null,
    scrollContainer: null,
  };

  private config: Required<WOWOptions>;
  private element!: HTMLElement;
  private boxes: Element[] = [];
  private all: Element[] = [];
  private finished: Element[] = [];
  private scrolled = true;
  private stopped = false;
  private interval: number | ReturnType<typeof setInterval> | null = null;
  private animationNameCache: WeakMap<Element, string>;
  private wowEvent: CustomEvent<any>;
  private vendors: string[] = ["moz", "webkit"];

  constructor(options: WOWOptions = {}) {
    this.start = this.start.bind(this);
    this.resetAnimation = this.resetAnimation.bind(this);
    this.scrollHandler = this.scrollHandler.bind(this);
    this.scrollCallback = this.scrollCallback.bind(this);

    this.config = extend(options, this.defaults);

    const scSelector = this.config.scrollContainer;
    const scElem =
      scSelector && typeof scSelector === "string"
        ? (document.querySelector(scSelector) as HTMLElement | null)
        : null;
    this.config.scrollContainer = scElem ? scSelector : null;

    this.animationNameCache = new (WeakMapShim as any)();
    this.wowEvent = createEvent(this.config.boxClass as string);
  }

  init(): void {
    this.element = document.documentElement as HTMLElement;

    if (isIn(document.readyState, ["interactive", "complete"])) {
      this.start();
    } else {
      addEvent(document, "DOMContentLoaded", this.start as any);
    }

    this.finished = [];
  }

  start(): void {
    this.stopped = false;

    this.boxes = Array.prototype.slice.call(
      this.element.querySelectorAll(`.${this.config.boxClass}`)
    );
    this.all = this.boxes.slice(0);

    if (this.boxes.length) {
      if (this.disabled()) {
        this.resetStyle();
      } else {
        for (let i = 0; i < this.boxes.length; i++) {
          const box = this.boxes[i];
          this.applyStyle(box, true);
        }
      }
    }

    if (!this.disabled()) {
      const scrollTarget =
        (this.config.scrollContainer &&
          document.querySelector(this.config.scrollContainer)) ||
        window;

      addEvent(scrollTarget as any, "scroll", this.scrollHandler as any);
      addEvent(window, "resize", this.scrollHandler as any);

      this.interval = setInterval(this.scrollCallback, 50);
    }

    if (this.config.live) {
      const mut = new MutationObserverShim((records: MutationRecord[]) => {
        for (let j = 0; j < records.length; j++) {
          const record = records[j];
          for (let k = 0; k < record.addedNodes.length; k++) {
            const node = record.addedNodes[k] as Element;
            this.doSync(node);
          }
        }
      });
      (mut as any).observe &&
        mut.observe(document.body, {
          childList: true,
          subtree: true,
        });
    }
  }

  stop(): void {
    this.stopped = true;

    const scrollTarget =
      (this.config.scrollContainer &&
        document.querySelector(this.config.scrollContainer)) ||
      window;

    removeEvent(scrollTarget as any, "scroll", this.scrollHandler as any);
    removeEvent(window, "resize", this.scrollHandler as any);

    if (this.interval != null) {
      clearInterval(this.interval as any);
    }
  }

  sync(): void {
    if ((MutationObserverShim as any).notSupported) {
      this.doSync(this.element);
    }
  }

  doSync(element?: Element): void {
    const root: Element = element ?? this.element;
    if (root.nodeType !== 1) return;

    const iterable = root.querySelectorAll(`.${this.config.boxClass}`);
    for (let i = 0; i < iterable.length; i++) {
      const box = iterable[i];
      if (!isIn(box, this.all)) {
        this.boxes.push(box);
        this.all.push(box);
        if (this.stopped || this.disabled()) {
          this.resetStyle();
        } else {
          this.applyStyle(box, true);
        }
        this.scrolled = true;
      }
    }
  }

  show(box: Element): Element {
    this.applyStyle(box);
    (box as any).className = `${(box as any).className} ${
      this.config.animateClass
    }`;

    if (this.config.callback) {
      this.config.callback(box);
    }

    emitEvent(box, this.wowEvent);

    addEvent(box, "animationend", this.resetAnimation as any);
    addEvent(box, "oanimationend", this.resetAnimation as any);
    addEvent(box, "webkitAnimationEnd", this.resetAnimation as any);
    addEvent(box, "MSAnimationEnd", this.resetAnimation as any);

    return box;
  }

  // CHANGED: now returns void
  applyStyle(box: Element, hidden?: boolean): void {
    const duration = box.getAttribute("data-wow-duration");
    const delay = box.getAttribute("data-wow-delay");
    const iteration = box.getAttribute("data-wow-iteration");

    this.animate(() => {
      this.customStyle(box, hidden, duration, delay, iteration);
    });
  }

  animate = (() => {
    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      return (callback: () => void) => window.requestAnimationFrame(callback);
    }
    return (callback: () => void) => callback();
  })();

  resetStyle(): void {
    for (let i = 0; i < this.boxes.length; i++) {
      const box = this.boxes[i] as HTMLElement;
      box.style.visibility = "visible";
    }
  }

  resetAnimation = (event: Event): void => {
    if (event.type.toLowerCase().indexOf("animationend") >= 0) {
      const target = (event.target ||
        (event as any).srcElement) as HTMLElement;
      target.className = target.className
        .replace(this.config.animateClass, "")
        .trim();
    }
  };

  // CHANGED: now returns void
  customStyle(
    box: Element,
    hidden?: boolean,
    duration?: string | null,
    delay?: string | null,
    iteration?: string | null
  ): void {
    if (hidden) {
      this.cacheAnimationName(box);
    }

    const style = (box as HTMLElement).style;
    style.visibility = hidden ? "hidden" : "visible";

    if (duration) {
      this.vendorSet(style, { animationDuration: duration });
    }
    if (delay) {
      this.vendorSet(style, { animationDelay: delay });
    }
    if (iteration) {
      this.vendorSet(style, { animationIterationCount: iteration });
    }

    this.vendorSet(style, {
      animationName: hidden ? "none" : this.cachedAnimationName(box),
    });
  }

  vendorSet(
    elem: CSSStyleDeclaration,
    properties: Record<string, string>
  ): void {
    for (const name in properties) {
      const value = properties[name];
      (elem as any)[`${name}`] = value;
      for (let i = 0; i < this.vendors.length; i++) {
        const vendor = this.vendors[i];
        (elem as any)[
          `${vendor}${name.charAt(0).toUpperCase()}${name.slice(1)}`
        ] = value;
      }
    }
  }

  vendorCSS(elem: Element, property: string): string | null {
    const style = getComputedStyleShim(elem);
    let result = style.getPropertyValue(property);

    for (let i = 0; i < this.vendors.length; i++) {
      const vendor = this.vendors[i];
      if (!result || result.trim() === "") {
        result = style.getPropertyValue(`-${vendor}-${property}`);
      }
    }

    return result || null;
  }

  animationName(box: Element): string {
    let aName: string | null = null;
    try {
      aName = this.vendorCSS(box, "animation-name");
    } catch {
      aName = getComputedStyleShim(box).getPropertyValue("animation-name");
    }
    if (!aName || aName === "none") {
      return "";
    }
    return aName;
  }

  cacheAnimationName(box: Element): void {
    this.animationNameCache.set(box, this.animationName(box));
  }

  cachedAnimationName(box: Element): string {
    return this.animationNameCache.get(box) || "";
  }

  scrollHandler(): void {
    this.scrolled = true;
  }

  scrollCallback = (): void => {
    if (this.scrolled) {
      this.scrolled = false;
      const results: Element[] = [];
      for (let i = 0; i < this.boxes.length; i++) {
        const box = this.boxes[i];
        if (box) {
          if (this.isVisible(box)) {
            this.show(box);
          } else {
            results.push(box);
          }
        }
      }
      this.boxes = results;
      if (!this.boxes.length && !this.config.live) {
        this.stop();
      }
    }
  };

  offsetTop(element: Element): number {
    let el = element as HTMLElement;
    while ((el as any).offsetTop === undefined && el.parentNode) {
      el = el.parentNode as HTMLElement;
    }
    let top = (el as any).offsetTop || 0;
    while (el.offsetParent) {
      el = el.offsetParent as HTMLElement;
      top += el.offsetTop || 0;
    }
    return top;
  }

  isVisible(box: Element): boolean {
    const offsetAttr = box.getAttribute("data-wow-offset");
    const offsetNum =
      offsetAttr != null ? parseInt(offsetAttr, 10) : this.config.offset;

    const scElem =
      this.config.scrollContainer &&
      document.querySelector(this.config.scrollContainer);

    const viewTop =
      (scElem && (scElem as any).scrollTop) || window.pageYOffset;

    const viewBottom =
      viewTop +
      Math.min(this.element.clientHeight, getInnerHeight()) -
      offsetNum;

    const top = this.offsetTop(box);
    const bottom = top + (box as HTMLElement).clientHeight;

    return top <= viewBottom && bottom >= viewTop;
  }

  disabled(): boolean {
    return !this.config.mobile && isMobile(navigator.userAgent);
  }
}
