// 游戏模式工厂（独立文件，避免与 GameMode 基类形成循环依赖）
// GameMode.js 仅保留基类，子类只在此处汇总注册
import { ConquestMode } from './modes/ConquestMode.js?v=20260802.4';
import { AttritionMode } from './modes/AttritionMode.js?v=20260802.4';
import { BreakthroughMode } from './modes/BreakthroughMode.js?v=20260802.4';
import { TDMMode } from './modes/TDMMode.js?v=20260802.4';
import { RushMode } from './modes/RushMode.js?v=20260802.4';

export class GameModeFactory {
    static create(game, modeConfig) {
        if (!modeConfig) return null;
        switch (modeConfig.id) {
            case 'conquest': return new ConquestMode(game, modeConfig);
            case 'attrition': return new AttritionMode(game, modeConfig);
            case 'breakthrough': return new BreakthroughMode(game, modeConfig);
            case 'tdm': return new TDMMode(game, modeConfig);
            case 'rush': return new RushMode(game, modeConfig);
            default: return new ConquestMode(game, modeConfig);
        }
    }
}
