export function formatMoney(amount: string) {
  const m = amount.split(".");
  let final = "";

  if (m[0].length === 1) return m[0];

  if (m[0].substring(0, m[0].length % 3) !== "")
    final += m[0].substring(0, m[0].length % 3) + ",";

  for (let i = m[0].length % 3; i < m[0].length; i += 3) {
    final += m[0].substring(i, i + 3);
    if (i !== m[0].length - 3) final += ",";
  }
  return final;
}
