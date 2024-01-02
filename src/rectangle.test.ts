import { checkOverlapping } from './rectangle';
import { expect, describe, it } from 'vitest';

describe('checkOverlapping', () => {
  it('two rectangles in the same position and size overlap', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 0, y: 0, width: 100, height: 100 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles in the same position overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 20 };
    const b = { x: 0, y: 0, width: 20, height: 10 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the left side', () => {
    const a = { x: 0, y: 0, width: 10, height: 20 };
    const b = { x: 5, y: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the right side', () => {
    const a = { x: 5, y: 0, width: 10, height: 20 };
    const b = { x: 0, y: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the top side', () => {
    const a = { x: 0, y: 0, width: 10, height: 20 };
    const b = { x: 0, y: 5, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the bottom side', () => {
    const a = { x: 0, y: 5, width: 10, height: 20 };
    const b = { x: 0, y: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  describe('two rectangles that do not overlap', () => {
    it('when a is to the x of b', () => {
      const a = { x: 0, y: 0, width: 10, height: 20 };
      const b = { x: 11, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is to the right of b', () => {
      const a = { x: 11, y: 0, width: 10, height: 20 };
      const b = { x: 0, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is above b', () => {
      const a = { x: 0, y: 0, width: 10, height: 20 };
      const b = { x: 0, y: 21, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is below b', () => {
      const a = { x: 0, y: 21, width: 10, height: 20 };
      const b = { x: 0, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the left side', () => {
      const a = { x: 0, y: 0, width: 10, height: 20 };
      const b = { x: 10, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the right side', () => {
      const a = { x: 10, y: 0, width: 10, height: 20 };
      const b = { x: 0, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the top side', () => {
      const a = { x: 0, y: 0, width: 10, height: 20 };
      const b = { x: 0, y: 20, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the bottom side', () => {
      const a = { x: 0, y: 20, width: 10, height: 20 };
      const b = { x: 0, y: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when they are really far apart', () => {
      const a = { x: 0, y: 0, width: 10, height: 20 };
      const b = { x: 100, y: 100, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });
  });

  it('two rectangles with negataive x and y values that overlap', () => {
    const a = { x: -10, y: -10, width: 10, height: 20 };
    const b = { x: -10, y: -10, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap accross the origin', () => {
    const a = { x: 1, y: 1, width: 10, height: 20 };
    const b = { x: -1, y: -1, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('a rectangle inside another overlaps', () => {
    const a = { x: 0, y: 0, width: 10, height: 20 };
    const b = { x: 1, y: 1, width: 8, height: 18 };
    expect(checkOverlapping(a, b)).toBe(true);
  });
});
