/* ===== 物品/合成桥接（兼容旧引用） =====
 * 实际数据在 data.js 的 window.DATA 中；此处仅暴露 window.ITEMS 给 ui.js 引用
 */
(function(){
  const D=window.DATA;
  window.ITEMS={RECIPES:D.RECIPES, NAMES:D.NAMES};
})();
