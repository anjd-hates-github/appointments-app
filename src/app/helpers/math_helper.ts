export function floorToNearest(amount: number, precision: number) {
  return Math.floor(amount / precision) * precision;
}

export function ceilToNearest(amount: number, precision: number) {
  return Math.ceil(amount / precision) * precision;
}
