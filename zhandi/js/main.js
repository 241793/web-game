import { Game } from './core/Game.js?v=20260801.2';

// 游戏入口
async function main() {
    const game = new Game();
    await game.init();

    // 全局引用（方便调试）
    window.game = game;
}

// 启动
main().catch(err => {
    console.error('游戏启动失败:', err);
    document.getElementById('loadingText').textContent = '加载失败: ' + err.message;
});
