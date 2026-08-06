// 消耗战模式 - 纯粹击杀消耗敌方票数，无据点得分
import { GameMode } from '../GameMode.js?v=20260802.4';

export class AttritionMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
    }

    // 消耗战不根据据点衰减票数
    update(dt) {
        super.update(dt);
        // 仅通过死亡扣票（onPlayerDeath 已处理）
    }

    // 不奖励据点占领分数
    onCapturePoint(cp, team) {
        // 消耗战据点不产出分数，仅作为战术位置
    }

    // 不支持战略目标
    onStrategicObjectiveDestroyed(obj, team) {
        // 消耗战无战略目标
    }
}
