import { checkOverlapping } from './rectangle';
import { expect, describe, it } from 'vitest';

describe('checkOverlapping', () => {
  it('two rectangles in the same position and size overlap', () => {
    const a = { left: 0, top: 0, width: 100, height: 100 };
    const b = { left: 0, top: 0, width: 100, height: 100 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles in the same position overlap', () => {
    const a = { left: 0, top: 0, width: 10, height: 20 };
    const b = { left: 0, top: 0, width: 20, height: 10 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the left side', () => {
    const a = { left: 0, top: 0, width: 10, height: 20 };
    const b = { left: 5, top: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the right side', () => {
    const a = { left: 5, top: 0, width: 10, height: 20 };
    const b = { left: 0, top: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the top side', () => {
    const a = { left: 0, top: 0, width: 10, height: 20 };
    const b = { left: 0, top: 5, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap on the bottom side', () => {
    const a = { left: 0, top: 5, width: 10, height: 20 };
    const b = { left: 0, top: 0, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  describe('two rectangles that do not overlap', () => {
    it('when a is to the left of b', () => {
      const a = { left: 0, top: 0, width: 10, height: 20 };
      const b = { left: 11, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is to the right of b', () => {
      const a = { left: 11, top: 0, width: 10, height: 20 };
      const b = { left: 0, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is above b', () => {
      const a = { left: 0, top: 0, width: 10, height: 20 };
      const b = { left: 0, top: 21, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when a is below b', () => {
      const a = { left: 0, top: 21, width: 10, height: 20 };
      const b = { left: 0, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the left side', () => {
      const a = { left: 0, top: 0, width: 10, height: 20 };
      const b = { left: 10, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the right side', () => {
      const a = { left: 10, top: 0, width: 10, height: 20 };
      const b = { left: 0, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the top side', () => {
      const a = { left: 0, top: 0, width: 10, height: 20 };
      const b = { left: 0, top: 20, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when the rectangles touch on the bottom side', () => {
      const a = { left: 0, top: 20, width: 10, height: 20 };
      const b = { left: 0, top: 0, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });

    it('when they are really far apart', () => {
      const a = { left: 0, top: 0, width: 10, height: 20 };
      const b = { left: 100, top: 100, width: 10, height: 20 };
      expect(checkOverlapping(a, b)).toBe(false);
    });
  });

  it('two rectangles with negataive x and y values that overlap', () => {
    const a = { left: -10, top: -10, width: 10, height: 20 };
    const b = { left: -10, top: -10, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });

  it('two rectangles that overlap accross the origin', () => {
    const a = { left: 1, top: 1, width: 10, height: 20 };
    const b = { left: -1, top: -1, width: 10, height: 20 };
    expect(checkOverlapping(a, b)).toBe(true);
  });
});
