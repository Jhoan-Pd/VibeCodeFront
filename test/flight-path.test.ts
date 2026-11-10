import { describe, expect, it } from "vitest";
import { bezier, easeInOut, FLIGHT_PATH, frameAt, tangent, wordMasks } from "@/lib/flight-path";

describe("paper plane flight", () => {
  it("the curve starts and ends at its end points", () => {
    expect(bezier(FLIGHT_PATH, 0)).toEqual(FLIGHT_PATH[0]);
    expect(bezier(FLIGHT_PATH, 1)).toEqual(FLIGHT_PATH[3]);
  });

  it("enters on the left, crosses the word and leaves on the right", () => {
    expect(frameAt(0).x).toBeLessThan(0);
    expect(frameAt(1).x).toBeGreaterThan(1);
    const xs = Array.from({ length: 41 }, (_, i) => frameAt(i / 40).x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]);
    // Halfway it is over the word, at the height of the letters.
    const middle = frameAt(0.5);
    expect(middle.x).toBeGreaterThan(0);
    expect(middle.x).toBeLessThan(1);
    expect(middle.y).toBeGreaterThan(0.2);
    expect(middle.y).toBeLessThan(1.2);
  });

  it("points where it flies: down on the way in, up on the way out", () => {
    expect(frameAt(0.05).angle).toBeGreaterThan(0);
    expect(frameAt(0.95).angle).toBeLessThan(0);
    expect(tangent(FLIGHT_PATH, 0.5).x).toBeGreaterThan(0);
  });

  it("fades in and out smoothly", () => {
    expect(frameAt(0).opacity).toBe(0);
    expect(frameAt(0.5).opacity).toBe(1);
    expect(frameAt(1).opacity).toBe(0);
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it("the masks erase the old word behind the plane and reveal the new one", () => {
    const m = wordMasks(0.5);
    expect(m.leaving).toBe("linear-gradient(90deg, transparent 44.0%, #000 60.0%)");
    expect(m.entering).toBe("linear-gradient(90deg, #000 30.0%, transparent 48.0%)");
  });
});
