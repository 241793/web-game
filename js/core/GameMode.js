// 游戏模式基类 - 所有游戏模式的抽象接口
// 注意：子类导入在 GameModeFactory.js 中汇总，避免此处形成循环依赖
// （GameMode.js ← ConquestMode.js → GameMode.js 的 TDZ 错误）
import { CONFIG } from '../config.js?v=20260801.2';

// 游戏模式基类
export class GameMode {
    constructor(game, modeConfig) {
        this.game = game;
        this.cfg = modeConfig;
        this.teamTickets = [modeConfig.startingTickets, modeConfig.startingTickets];
        this.matchTimer = modeConfig.matchDuration;
        this.winner = null;
    }

    // 比赛开始时调用
    onMatchStart() {
        this.teamTickets = [this.cfg.startingTickets, this.cfg.startingTickets];
        this.matchTimer = this.cfg.matchDuration;
        this.winner = null;
    }

    // 玩家/Bot 死亡时调用
    onPlayerDeath(dead, killer) {
        // 只扣死亡方票数；击杀得分由 Game 统一结算（避免与 _onPlayerKill 双重加分）
        if (this.cfg.deathTicketCost > 0 && dead) {
            const team = dead.team !== undefined ? dead.team : 0;
            this.teamTickets[team] = Math.max(0, this.teamTickets[team] - this.cfg.deathTicketCost);
        }
    }

    // 据点占领完成时调用
    onCapturePoint(cp, team) {
        if (this.cfg.capturePointPoints > 0) {
            // Game 类使用 friendlyScore/enemyScore 而非 teamScores 数组
            if (team === 0) {
                this.game.friendlyScore = (this.game.friendlyScore || 0) + this.cfg.capturePointBonus;
            } else {
                this.game.enemyScore = (this.game.enemyScore || 0) + this.cfg.capturePointBonus;
            }
        }
    }

    // 战略目标被摧毁时调用
    onStrategicObjectiveDestroyed(obj, team) {
        if (!this.cfg.supportsStrategicObjectives) return;
        if (obj && obj.ticketDamage > 0) {
            const enemyTeam = team === 0 ? 1 : 0;
            this.teamTickets[enemyTeam] = Math.max(0, this.teamTickets[enemyTeam] - obj.ticketDamage);
        }
    }

    // 每帧更新
    update(dt) {
        if (this.winner) return;
        this.matchTimer -= dt;
        if (this.matchTimer <= 0) {
            this.matchTimer = 0;
            this._decideWinnerByTickets();
        }
    }

    // 检查游戏是否结束
    checkGameOver() {
        if (this.winner) return this.winner;
        if (this.teamTickets[0] <= 0) { this.winner = 'enemy'; return 'enemy'; }
        if (this.teamTickets[1] <= 0) { this.winner = 'friendly'; return 'friendly'; }
        if (this.matchTimer <= 0) return this.winner;
        if (this.cfg.teamScoreLimit < 9999) {
            // Game 类使用 friendlyScore/enemyScore 而非 teamScores 数组
            if ((this.game.friendlyScore || 0) >= this.cfg.teamScoreLimit) { this.winner = 'friendly'; return 'friendly'; }
            if ((this.game.enemyScore || 0) >= this.cfg.teamScoreLimit) { this.winner = 'enemy'; return 'enemy'; }
        }
        return null;
    }

    // 按票数决定胜负
    _decideWinnerByTickets() {
        if (this.teamTickets[0] > this.teamTickets[1]) this.winner = 'friendly';
        else if (this.teamTickets[1] > this.teamTickets[0]) this.winner = 'enemy';
        else this.winner = 'draw';
    }

    // 获取部署点
    getDeployPoint(team) {
        return null;
    }

    // 获取UI显示数据
    getUIData() {
        return {
            name: this.cfg.name,
            tickets: this.teamTickets,
            timeRemaining: Math.max(0, this.matchTimer),
            winner: this.winner,
        };
    }
}
