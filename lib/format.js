export function money(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function compactMoney(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
