import { describe, expect, it } from "vitest";
import {
  clearSeatalkSessionHint,
  hasSeatalkSessionHint,
  rememberSeatalkSession,
} from "./seatalkSession";

function createStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
}

describe("SeaTalk session hint", () => {
  it("remembers a successful callback for the first app bootstrap", () => {
    const storage = createStorage();

    expect(rememberSeatalkSession("?seatalk=success", storage)).toBe(true);
    expect(storage.getItem()).toBe("1");
  });

  it("allows a SeaTalk session to be recovered after a page refresh", () => {
    const storage = createStorage("1");

    expect(hasSeatalkSessionHint("/dashboard", storage)).toBe(true);
  });

  it("does not probe a SeaTalk session without a callback or marker", () => {
    const storage = createStorage();

    expect(hasSeatalkSessionHint("/", storage)).toBe(false);
  });

  it("clears the marker when the user signs out", () => {
    const storage = createStorage("1");

    clearSeatalkSessionHint(storage);

    expect(storage.getItem()).toBeNull();
  });
});
