export const seatalkSessionStorageKey = "soc5-seatalk-session";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function hasSeatalkSessionHint(
  search: string,
  storage: StorageLike,
): boolean {
  return (
    new URLSearchParams(search).get("seatalk") === "success" ||
    storage.getItem(seatalkSessionStorageKey) === "1"
  );
}

export function rememberSeatalkSession(
  search: string,
  storage: StorageLike,
): boolean {
  if (new URLSearchParams(search).get("seatalk") === "success") {
    storage.setItem(seatalkSessionStorageKey, "1");
    return true;
  }

  return storage.getItem(seatalkSessionStorageKey) === "1";
}

export function clearSeatalkSessionHint(storage: StorageLike): void {
  storage.removeItem(seatalkSessionStorageKey);
}
