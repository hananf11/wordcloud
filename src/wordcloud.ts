import { type Rectangle, checkOverlappingAny, checkOverlapping } from './rectangle';
import throttle from 'lodash-es/throttle';
import prand from 'pure-rand';

interface Word {
  text: string;
  weight: number;
  html?: Record<string, string>;
  color?: string;
  link?: string | { href: string };
  handlers?: Record<string, () => void>;
  afterWordRender?: () => void;
}

interface WordCloudOptions {
  width: number;
  height: number;
  center: { x: number; y: number };
  steps: number;
  delay?: number;
  shape: 'elliptic' | 'rectangular';
  classPattern?: string;
  encodeURI: boolean;
  removeOverflowing: boolean;
  afterCloudRender?: () => void;
  autoResize: boolean;
  colors?: string[] | ((weight: number) => string);
  fontSize?:
    | string[]
    | {
        from: number;
        to: number;
      }
    | ((weight: number, width: number, height: number) => string);
  template?: (word: Word) => string;
  random: () => number;
}

const randomGenerator = prand.xoroshiro128plus(1);
const seededRandom = () => (randomGenerator.unsafeNext() >>> 0) / 0x1_0000_0000;

export default class Wordcloud {
  private readonly element: HTMLElement;
  private word_array: Word[];
  private readonly DEFAULTS = {
    width: 100,
    height: 100,
    center: { x: 0.5, y: 0.5 },
    steps: 10,
    shape: 'elliptic',
    classPattern: 'w{n}',
    encodeURI: true,
    removeOverflowing: true,
    autoResize: false,
    random: seededRandom,
  } satisfies WordCloudOptions;

  private readonly options: WordCloudOptions;
  private readonly colorGenerator: ((weight: number) => string) | undefined;
  private readonly sizeGenerator: ((weight: number, width: number, height: number) => string) | undefined;
  private readonly data: {
    placed_words: Rectangle[];
    timeouts: Array<ReturnType<typeof setTimeout>>;
    // Namespace word ids to avoid collisions between multiple clouds
    namespace: string;
    step: number;
    aspect_ratio: number;
    max_weight: number | null;
    min_weight: number | null;
    sizes: string[];
    colors: string[];
  };
  private readonly windowResizeHandler = throttle(this.resize.bind(this), 100);

  constructor(element: HTMLElement, wordArray: Word[], options: Partial<WordCloudOptions>) {
    this.element = element;

    this.word_array = wordArray;

    this.options = {
      ...this.DEFAULTS,
      ...options,
    };

    // Set/Get dimensions
    const style = window.getComputedStyle(this.element);
    console.log(style.width, style.height);
    if (options?.width) {
      this.element.style.width = this.options.width + 'px';
    } else if (style?.width) {
      this.options.width = parseFloat(style.width.toString());
    } else {
      this.options.width = this.DEFAULTS.width;
    }

    if (options?.height) {
      this.element.style.height = this.options.height + 'px';
    } else if (style.height !== undefined) {
      this.options.height = parseFloat(style.height.toString());
    } else {
      this.options.height = this.DEFAULTS.height;
    }

    // Ensure delay
    if (this.options.delay === undefined) {
      this.options.delay = this.word_array.length > 50 ? 10 : 0;
    }

    // Create colorGenerator function from options
    // Direct function
    if (typeof this.options.colors === 'function') {
      this.colorGenerator = this.options.colors;
    } else if (Array.isArray(this.options.colors) && this.options.colors.length > 0) {
      // Array of sizes
      const colors = this.options.colors;

      for (let j = colors.length; j < this.options.steps; j++) {
        colors[j] = colors[colors.length - 1];
      }

      this.colorGenerator = function (weight) {
        return colors[this.options.steps - weight];
      };
    }

    // Create sizeGenerator function from options
    // Direct function
    if (typeof this.options.fontSize === 'function') {
      this.sizeGenerator = this.options.fontSize;
    } else if (Array.isArray(this.options.fontSize) && this.options.fontSize.length > 0) {
      // Array of sizes
      const sizes = this.options.fontSize;

      for (let j = sizes.length; j < this.options.steps; j++) {
        sizes[j] = sizes[sizes.length - 1];
      }

      this.sizeGenerator = function (weight) {
        return sizes[this.options.steps - weight];
      };
    } else if (
      this.options.fontSize !== undefined &&
      !Array.isArray(this.options.fontSize) &&
      typeof this.options.fontSize === 'object'
    ) {
      const fontSize = this.options.fontSize;
      // Object with 'from' and 'to'
      this.sizeGenerator = function (weight) {
        const max = this.options.width * fontSize.from;
        const min = this.options.width * fontSize.to;
        return Math.round(min + (((max - min) * 1.0) / (this.options.steps - 1)) * (weight - 1)) + 'px';
      };
    }

    this.data = {
      placed_words: [],
      timeouts: [],
      // Namespace word ids to avoid collisions between multiple clouds
      namespace: (this.element.id ?? Math.floor(Math.random() * 1000000).toString(36)) + '_word_',
      step: this.options.shape === 'rectangular' ? 18.0 : 2.0,
      aspect_ratio: this.options.width / this.options.height,
      max_weight: null,
      min_weight: null,
      sizes: [],
      colors: [],
    };

    this.clearTimeouts();

    this.element.classList.add('wordcloud');

    // Container's CSS position cannot be 'static'
    if (window.getComputedStyle(this.element).position === 'static') {
      this.element.style.position = 'relative';
    }

    // Delay execution so that the browser can render the page before the computatively intensive word cloud drawing
    this.createTimeout(this.drawWordCloud.bind(this), 10);

    // Attach window resize event
    if (this.options.autoResize) {
      window.addEventListener('resize', this.windowResizeHandler);
    }
  }

  // Helper function to keep track of timeouts so they can be destroyed
  createTimeout(callback: () => void, time: number): void {
    const timeout = setTimeout(() => {
      this.data.timeouts = this.data.timeouts.filter((t) => t !== timeout);
      callback();
    }, time);
    this.data.timeouts.push(timeout);
  }

  // Destroy all timeouts
  clearTimeouts(): void {
    for (const timeout in this.data.timeouts) {
      clearTimeout(parseInt(timeout));
    }
    this.data.timeouts = [];
  }

  // Initialize the drawing of the whole cloud
  drawWordCloud(): void {
    let i: number;
    let l: number;

    this.element.querySelectorAll('*[id^="' + this.data.namespace + '"]').forEach((node) => {
      node.remove();
    });

    if (this.word_array.length === 0) {
      return;
    }

    // Sort word_array from the word with the highest weight to the one with the lowest
    this.word_array.sort(function (a, b) {
      return b.weight - a.weight;
    });

    // Kepp trace of bounds
    this.data.max_weight = this.word_array[0].weight;
    this.data.min_weight = this.word_array[this.word_array.length - 1].weight;

    // Generate colors
    this.data.colors = [];
    if (this.colorGenerator !== undefined) {
      for (i = 0; i < this.options.steps; i++) {
        this.data.colors.push(this.colorGenerator(i + 1));
      }
    }

    // Generate font sizes
    this.data.sizes = [];
    if (this.sizeGenerator !== undefined) {
      for (i = 0; i < this.options.steps; i++) {
        this.data.sizes.push(this.sizeGenerator(this.options.width, this.options.height, i + 1));
      }
    }

    for (i = 0, l = this.word_array.length; i < l; i++) {
      this.drawOneWord(i, this.word_array[i]);
    }

    if (typeof this.options.afterCloudRender === 'function') {
      this.options.afterCloudRender.call(this.element);
    }
  }

  findRectanglePosition(startSize: Rectangle): Rectangle {
    let stepsInDirection = 0.0;
    let quarterTurns = 0.0;
    const size = { ...startSize, x: -startSize.width / 2, y: -startSize.height / 2 };

    while (checkOverlappingAny(size, this.data.placed_words)) {
      stepsInDirection++;

      const stepsInDirectionDistance = this.data.step * stepsInDirection;

      const movingVertically = (quarterTurns % 4) % 2 === 0;
      const maxAllowedStepsInDirection =
        (1 + Math.floor(quarterTurns / 2.0)) * (movingVertically ? 1 : this.data.aspect_ratio);
      const maxAllowedStepsInDirectionDistance = maxAllowedStepsInDirection * this.data.step;

      if (stepsInDirectionDistance > maxAllowedStepsInDirectionDistance) {
        stepsInDirection = 0.0;
        quarterTurns++;
      }

      switch (quarterTurns % 4) {
        case 1:
          // move right
          size.x += this.data.step * this.data.aspect_ratio + this.options.random() * 2.0;
          break;
        case 2:
          // move up
          size.y -= this.data.step + this.options.random() * 2.0;
          break;
        case 3:
          // move left
          size.x -= this.data.step * this.data.aspect_ratio + this.options.random() * 2.0;
          break;
        case 0:
          // move down
          size.y += this.data.step + this.options.random() * 2.0;
          break;
      }
    }

    return size;
  }

  findEllipticPosition(startSize: Rectangle): Rectangle {
    let angle = this.options.random() * 6.28;
    let radius = 0.0;

    const size = { ...startSize, x: -startSize.width / 2, y: -startSize.height / 2 };

    while (checkOverlappingAny(size, this.data.placed_words)) {
      radius += this.data.step;
      angle += this.data.step;

      size.x = -(size.width / 2.0) + radius * Math.cos(angle) * this.data.aspect_ratio;
      size.y = -(size.height / 2.0) + radius * Math.sin(angle);
    }

    return size;
  }

  findOneWordPosition(size: Rectangle): Rectangle {
    switch (this.options.shape) {
      case 'rectangular':
        return this.findRectanglePosition(size);
      case 'elliptic':
        return this.findEllipticPosition(size);
    }
  }

  // Function to draw a word, by moving it in spiral until it finds a suitable empty place
  drawOneWord(index: number, word: Word): void {
    const wordId = this.data.namespace + index;

    let weight = Math.floor(this.options.steps / 2);

    // Create word attr object
    const attr: Record<string, string> = { ...word.html, id: wordId };

    if (this.data.max_weight === null || this.data.min_weight === null) return;

    // Linearly map the original weight to a discrete scale from 1 to 10
    // Only if weights are different
    if (this.data.max_weight !== this.data.min_weight) {
      weight =
        Math.round(
          ((word.weight - this.data.min_weight) * 1.0 * (this.options.steps - 1)) /
            (this.data.max_weight - this.data.min_weight),
        ) + 1;
    }
    const wordSpan = document.createElement('span');
    for (const attribute in attr) {
      wordSpan.setAttribute(attribute, attr[attribute]);
    }

    wordSpan.classList.add('wordcloud-word');

    // Apply class
    if (this.options.classPattern !== undefined) {
      wordSpan.classList.add(this.options.classPattern.replace('{n}', weight.toString()));
    }

    // Apply color
    if (this.data.colors.length > 0) {
      wordSpan.style.color = this.data.colors[weight - 1];
    }

    // Apply color from word property
    if (word.color !== undefined) {
      wordSpan.style.color = word.color;
    }

    // Apply size
    if (this.data.sizes.length > 0) {
      wordSpan.style.fontSize = this.data.sizes[weight - 1];
    }

    // Render using template function if provided.
    if (this.options.template !== undefined) {
      wordSpan.innerHTML = this.options.template(word);
    } else if (word.link !== undefined) {
      // Append link if word.link attribute was set
      // If link is a string, then use it as the link href
      if (typeof word.link === 'string') {
        word.link = { href: word.link };
      }

      if (this.options.encodeURI) {
        word.link.href = encodeURI(word.link.href).replace(/'/g, '%27');
      }

      const wordLink = document.createElement('a');
      wordLink.href = word.link.href;
      wordLink.textContent = word.text;
      wordSpan.appendChild(wordLink);
    } else {
      wordSpan.textContent = word.text;
    }

    // Bind handlers to words
    if (word.handlers !== undefined) {
      for (const prop in word.handlers) {
        wordSpan.addEventListener(prop, word.handlers[prop]);
      }
    }

    this.element.appendChild(wordSpan);

    const wordSize = this.findOneWordPosition({
      width: wordSpan.offsetWidth,
      height: wordSpan.offsetHeight,
      x: -(wordSpan.offsetWidth / 2),
      y: -(wordSpan.offsetHeight / 2),
    });

    const wordStyle = wordSpan.style;
    wordStyle.position = 'absolute';
    wordStyle.left = this.options.center.x * this.options.width + wordSize.x + 'px';
    wordStyle.top = this.options.center.y * this.options.height + wordSize.y + 'px';
    wordSpan.dataset.left = wordSize.x.toString();
    wordSpan.dataset.top = wordSize.y.toString();
    wordSpan.dataset.overlappingContainer = checkOverlapping(wordSize, {
      x: -this.options.width / 2,
      y: -this.options.height / 2,
      width: this.options.width,
      height: this.options.height,
    }).toString();

    if (
      this.options.removeOverflowing &&
      !checkOverlapping(wordSize, {
        x: -this.options.width / 2,
        y: -this.options.height / 2,
        width: this.options.width,
        height: this.options.height,
      })
    ) {
      wordSpan.remove();
      return;
    }

    // Save position for further usage
    this.data.placed_words.push(wordSize);

    if (typeof word.afterWordRender === 'function') {
      word.afterWordRender.call(wordSpan);
    }
  }

  // Destroy any data and objects added by the plugin
  destroy(): void {
    if (this.options.autoResize) {
      window.removeEventListener('resize', this.windowResizeHandler);
    }

    this.clearTimeouts();
    this.element.classList.remove('wordcloud');
    this.element.querySelectorAll('*[id^="' + this.data.namespace + '"]').forEach((node) => {
      node.remove();
    });
  }

  // Update the list of words
  update(wordArray: Word[]): void {
    this.word_array = wordArray;
    this.data.placed_words = [];

    this.clearTimeouts();
    this.drawWordCloud();
  }

  resize(): void {
    const newSize = {
      width: window.getComputedStyle(this.element).width,
      height: window.getComputedStyle(this.element).height,
    };

    if (newSize.width !== this.options.width.toString() || newSize.height !== this.options.height.toString()) {
      this.options.width = parseInt(newSize.width);
      this.options.height = parseInt(newSize.height);
      this.data.aspect_ratio = this.options.width / this.options.height;

      this.update(this.word_array);
    }
  }
}
