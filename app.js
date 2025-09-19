// small helpers used by admin/user files
export function el(id) { return document.getElementById(id); }
export function fmtOrder(o) {
  const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
  return `${items} — ${o.status} — ${new Date(o.createdAt).toLocaleString()}`;
}
