// HUD管理器 - 管理游戏界面元素
export class HUD {
    constructor() {
        this.elements = {};
        this._cacheElements();
        this.killFeedMessages = [];
        this.damageDirections = [];
        this.notificationTimer = 0;

        // 性能优化：节流计时器
        this._scoreboardTimer = 0;    // 计分板更新间隔
        this._minimapTimer = 0;       // 小地图更新间隔
    }

    _cacheElements() {
        const ids = [
            'crosshair', 'hitMarker', 'damageIndicator',
            'scopeOverlay',
            'healthBar', 'healthText', 'armorText',
            'staminaBar',
            'leanIndicator', 'leanDirection',
            'spawnProtectionIndicator',
            'weaponName', 'weaponMode', 'ammoCurrent', 'ammoReserve', 'weaponSlots',
            'friendlyScore', 'enemyScore', 'gameTimer',
            'friendlyTickets', 'enemyTickets',
            'objectiveText', 'killFeed', 'minimap',
            'vehicleHUD', 'vehicleHealth', 'vehicleName', 'vehicleSeat',
            'vehicleSpeed', 'vehicleAltBox', 'vehicleAltitude',
            'vehicleWeaponBox', 'vehicleCooldown', 'vehicleAmmo',
            'vehicleCrosshair',
            'vehicleStatusRow', 'vehicleDriftStatus',
            'vehicleDamageStatus', 'vehicleCriticalStatus',
            'vehicleTurretIndicator', 'vtiTurretArrow',
            'interactionPrompt', 'interactionText',
            'reloadIndicator', 'deathScreen', 'killerName', 'respawnTimer',
            'fpsCounter', 'scoreboard', 'sbFriendly', 'sbEnemy',
            'notification', 'vehicleControls', 'gameHUD',
            'suppressionOverlay', 'lowHealthVignette', 'damageNumbers',
            'gadgetPanel', 'gadgetIcon', 'gadgetName', 'gadgetCooldownFill',
            'fortificationPanel', 'fortificationTitle', 'fortificationStatus', 'fortificationHint',
            'fortificationOptionSandbag', 'fortificationOptionWire', 'fortificationOptionHedgehog',
            // 新增元素
            'deployScreen', 'deployTimer', 'deployPoints', 'deploySquadList', 'btnDeployNow',
            'compassBar', 'compassStrip', 'worldMarkers', 'killstreakPopup',
            // 倒地状态 UI
            'downedOverlay', 'downedTitle', 'bleedOutBar', 'bleedOutText',
            'skipProgressBar', 'skipHint',
        ];
        for (const id of ids) {
            this.elements[id] = document.getElementById(id);
        }
        this.minimapCtx = this.elements.minimap ? this.elements.minimap.getContext('2d') : null;

        // 初始化罗盘刻度
        this._initCompass();
    }

    show() {
        this.elements.gameHUD.classList.remove('hidden');
    }

    hide() {
        this.elements.gameHUD.classList.add('hidden');
    }

    // 更新准星
    updateCrosshair(playerState, weaponState) {
        const crosshair = this.elements.crosshair;
        crosshair.classList.remove('sprinting', 'aiming');

        if (playerState.isSprinting) {
            crosshair.classList.add('sprinting');
        }
        if (weaponState && weaponState.isAiming) {
            crosshair.classList.add('aiming');
        }

        // 根据移动和射击调整准星大小
        const lines = crosshair.querySelectorAll('.crosshair-line');
        let spread = Math.min(playerState.moveSpeed * 3, 15) + (weaponState && weaponState.isAiming ? -5 : 0);
        if (weaponState && (weaponState.isHoldingBreath || weaponState.isBraced)) spread -= 3;
        spread = Math.max(-1, spread);
        lines.forEach(line => {
            if (line.classList.contains('top')) line.style.top = `${2 + spread}px`;
            if (line.classList.contains('bottom')) line.style.bottom = `${2 + spread}px`;
            if (line.classList.contains('left')) line.style.left = `${2 + spread}px`;
            if (line.classList.contains('right')) line.style.right = `${2 + spread}px`;
        });
    }

    // 显示命中标记
    showHitMarker(isKill = false, isHeadshot = false) {
        const marker = this.elements.hitMarker;
        marker.classList.remove('hidden', 'kill', 'headshot');
        if (isKill) marker.classList.add('kill');
        if (isHeadshot) marker.classList.add('headshot');
        setTimeout(() => marker.classList.add('hidden'), isKill ? 500 : 300);
    }

    // 显示伤害指示器
    showDamageIndicator(direction) {
        const indicator = this.elements.damageIndicator;

        // 移除旧的
        const old = indicator.querySelector('.damage-dir');
        if (old) old.remove();

        const dir = document.createElement('div');
        dir.className = 'damage-dir active';
        dir.style.transform = `rotate(${direction}deg)`;
        indicator.appendChild(dir);

        setTimeout(() => dir.remove(), 500);
    }

    // 更新体力条
    updateStamina(stamina, maxStamina, isExhausted) {
        const bar = this.elements.staminaBar;
        if (!bar) return;
        const pct = (stamina / maxStamina) * 100;
        bar.style.width = `${pct}%`;
        bar.classList.remove('exhausted', 'low');
        if (isExhausted) {
            bar.classList.add('exhausted');
        } else if (pct < 30) {
            bar.classList.add('low');
        }
    }

    // 更新侧身指示
    updateLean(leanAmount) {
        const indicator = this.elements.leanIndicator;
        const dir = this.elements.leanDirection;
        if (!indicator || !dir) return;
        if (Math.abs(leanAmount) > 0.05) {
            indicator.classList.remove('hidden');
            if (leanAmount > 0) {
                dir.textContent = '▶ 右侧身';
            } else {
                dir.textContent = '◀ 左侧身';
            }
        } else {
            indicator.classList.add('hidden');
        }
    }

    // 更新重生保护指示
    updateSpawnProtection(active) {
        const el = this.elements.spawnProtectionIndicator;
        if (!el) return;
        el.classList.toggle('hidden', !active);
    }

    // 更新压制视觉效果
    updateSuppression(suppression) {
        const overlay = this.elements.suppressionOverlay;
        if (!overlay) return;
        // 战地风格：压制模糊更克制，避免遮挡视野
        const blur = suppression * 1.5;
        const tint = suppression * 0.15;
        overlay.style.backdropFilter = `blur(${blur}px)`;
        overlay.style.background = `rgba(80, 80, 80, ${tint})`;
    }

    // === 倒地状态 UI ===
    // 显示倒地覆盖层（提示等待救援）
    showDownedOverlay() {
        const el = this.elements.downedOverlay;
        if (!el) return;
        el.classList.remove('hidden');
    }

    // 隐藏倒地覆盖层
    hideDownedOverlay() {
        const el = this.elements.downedOverlay;
        if (!el) return;
        el.classList.add('hidden');
    }

    // 更新长按空格跳过进度（0-1）
    updateSkipProgress(progress) {
        const bar = this.elements.skipProgressBar;
        if (!bar) return;
        bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }

    // 更新倒地流血计时（剩余秒数 / 总时长）
    updateDownedBleedOut(timer, maxTime) {
        const bar = this.elements.bleedOutBar;
        const text = this.elements.bleedOutText;
        const overlay = this.elements.downedOverlay;
        const pct = Math.min(100, Math.max(0, (timer / maxTime) * 100));
        if (bar) bar.style.width = `${pct}%`;
        if (text) text.textContent = `${Math.ceil(timer)}s`;
        // 流血越久画面越暗越红（战地濒死压迫感）
        if (overlay) {
            const danger = 1 - Math.min(1, Math.max(0, timer / maxTime));
            const r = Math.floor(20 + danger * 40);
            const a0 = 0.35 + danger * 0.25;
            const a1 = 0.55 + danger * 0.25;
            const a2 = 0.7 + danger * 0.25;
            overlay.style.background = `radial-gradient(ellipse at center,
                rgba(${r}, 10, 0, ${a0}) 0%,
                rgba(${Math.floor(r * 0.6)}, 5, 0, ${a1}) 70%,
                rgba(0, 0, 0, ${a2}) 100%)`;
        }
    }

    // 受击瞬间全屏红闪（短促，不挡视野）
    flashDamage(intensity = 0.45) {
        let el = this.elements.damageFlash;
        if (!el) {
            el = document.getElementById('damageFlash');
            if (!el) {
                el = document.createElement('div');
                el.id = 'damageFlash';
                const root = document.getElementById('gameUI') || document.body;
                root.appendChild(el);
            }
            this.elements.damageFlash = el;
        }
        const a = Math.min(0.55, Math.max(0.18, intensity));
        el.style.opacity = String(a);
        el.classList.remove('hidden');
        // 重启 CSS 动画
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
        clearTimeout(this._damageFlashTimer);
        this._damageFlashTimer = setTimeout(() => {
            el.style.opacity = '0';
        }, 180);
    }

    // 更新低血量视觉效果
    updateLowHealth(healthPct) {
        const vignette = this.elements.lowHealthVignette;
        if (!vignette) return;
        if (healthPct < 0.3 && healthPct > 0) {
            vignette.classList.add('active');
            // 血量越低暗角越深、脉动越快
            const danger = 1 - healthPct / 0.3;
            vignette.style.opacity = String(0.55 + danger * 0.45);
            vignette.style.animationDuration = `${Math.max(0.5, 1.4 - danger * 0.8)}s`;
        } else {
            vignette.classList.remove('active');
            vignette.style.opacity = '';
            vignette.style.animationDuration = '';
        }
    }

    // 显示浮动伤害数字
    showFloatingDamage(screenX, screenY, value, type = 'normal') {
        const container = this.elements.damageNumbers;
        if (!container) return;
        const el = document.createElement('div');
        el.className = `damage-number ${type}`;
        el.textContent = type === 'heal' ? `+${Math.round(value)}` : `-${Math.round(value)}`;
        el.style.left = `${screenX}px`;
        el.style.top = `${screenY}px`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    // 更新票数
    updateTickets(friendlyTickets, enemyTickets) {
        if (this.elements.friendlyTickets) {
            this.elements.friendlyTickets.textContent = Math.max(0, Math.floor(friendlyTickets));
        }
        if (this.elements.enemyTickets) {
            this.elements.enemyTickets.textContent = Math.max(0, Math.floor(enemyTickets));
        }
    }

    // 更新血量
    updateHealth(health, maxHealth, armor, maxArmor) {
        const pct = (health / maxHealth) * 100;
        this.elements.healthBar.style.width = `${pct}%`;
        this.elements.healthText.textContent = Math.ceil(health);

        this.elements.healthBar.classList.remove('low', 'critical');
        if (pct < 25) this.elements.healthBar.classList.add('critical');
        else if (pct < 50) this.elements.healthBar.classList.add('low');

        this.elements.armorText.textContent = `护甲: ${Math.ceil(armor)}`;
    }

    // 更新武器信息
    updateWeapon(weaponState) {
        if (!weaponState) return;
        this.elements.weaponName.textContent = weaponState.name;
        if (this.elements.weaponMode) {
            let modeText = weaponState.fireModeLabel || weaponState.fireMode || '';
            if (weaponState.isBraced) modeText += ' 架枪';
            else if (weaponState.isHoldingBreath) modeText += ' 屏息';
            this.elements.weaponMode.textContent = modeText;
            this.elements.weaponMode.classList.toggle('hidden', !weaponState.fireModeLabel && !weaponState.fireMode);
            this.elements.weaponMode.classList.toggle('armed', !!weaponState.hasFireModeToggle);
            this.elements.weaponMode.classList.toggle('braced', !!weaponState.isBraced);
        }
        this.elements.ammoCurrent.textContent = weaponState.ammoInMag;
        this.elements.ammoReserve.textContent = weaponState.reserveAmmo;

        // 换弹状态
        if (weaponState.isReloading) {
            this.elements.reloadIndicator.classList.remove('hidden');
            document.querySelector('.ammo-info').classList.add('reloading');
        } else {
            this.elements.reloadIndicator.classList.add('hidden');
            document.querySelector('.ammo-info').classList.remove('reloading');
        }

        // 武器栏
        this.elements.weaponSlots.innerHTML = '';
        for (let i = 0; i < weaponState.weaponList.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'weapon-slot' + (i === weaponState.currentIdx ? ' active' : '');
            slot.textContent = `${i + 1} ${weaponState.weaponList[i]}`;
            this.elements.weaponSlots.appendChild(slot);
        }

        if (weaponState.isHoldingBreath) {
            this.elements.weaponName.classList.add('breath-hold');
        } else {
            this.elements.weaponName.classList.remove('breath-hold');
        }
    }

    // 更新工事面板
    updateFortification(state) {
        const panel = this.elements.fortificationPanel;
        if (!panel) return;
        const crosshair = this.elements.crosshair;

        if (!state || !state.visible) {
            panel.classList.add('hidden');
            if (crosshair) crosshair.classList.remove('building', 'valid');
            return;
        }
        panel.classList.remove('hidden');

        const title = this.elements.fortificationTitle;
        const status = this.elements.fortificationStatus;
        const hint = this.elements.fortificationHint;
        const countEl = document.getElementById('fortificationCount');
        const options = [
            { el: this.elements.fortificationOptionSandbag, type: 'sandbag' },
            { el: this.elements.fortificationOptionWire, type: 'wire' },
            { el: this.elements.fortificationOptionHedgehog, type: 'hedgehog' },
        ];

        if (state.active) {
            if (title) title.textContent = `${state.name} · ${state.count}/${state.maxCount}`;
            if (state.cooldown > 0) {
                if (status) status.textContent = `建造冷却 ${state.cooldown.toFixed(1)}s`;
            } else if (!state.valid) {
                if (status) status.textContent = state.reason || '此处无法建造';
            } else {
                if (status) status.textContent = '滚轮旋转 · 左键放置 · 右键取消';
            }
            if (hint) hint.textContent = '右键 / 4 / Esc 取消';
        } else {
            if (title) title.textContent = '建造工事';
            if (status) status.textContent = state.cooldown > 0 ? `冷却 ${state.cooldown.toFixed(1)}s` : '就绪';
            if (hint) hint.textContent = '按 4 进入建造模式';
        }
        if (countEl) countEl.textContent = `${state.count}/${state.maxCount}`;

        for (const opt of options) {
            if (!opt.el) continue;
            opt.el.classList.toggle('selected', opt.type === state.selectedType);
            opt.el.classList.toggle('disabled', state.active && state.count >= state.maxCount);
        }

        if (crosshair) {
            crosshair.classList.toggle('building', !!state.active);
            crosshair.classList.toggle('valid', !!state.active && !!state.valid);
        }
    }

    hideFortification() {
        this.updateFortification(null);
    }

    // 更新兵种技能栏
    updateGadget(gadgetName, gadgetColor, cooldown, maxCooldown) {
        const panel = this.elements.gadgetPanel;
        if (!panel) return;

        if (!gadgetName) {
            panel.classList.add('hidden');
            return;
        }
        panel.classList.remove('hidden');

        // 图标和名称
        const icons = {
            'ammobag': '📦',
            'medbag': '💊',
            'repairtool': '🔧',
            'sensor': '📡',
        };
        const gadgetKey = gadgetName.includes('弹药') ? 'ammobag' :
                         gadgetName.includes('医疗') ? 'medbag' :
                         gadgetName.includes('维修') ? 'repairtool' :
                         gadgetName.includes('传感') ? 'sensor' : 'ammobag';
        this.elements.gadgetIcon.textContent = icons[gadgetKey] || '📦';
        this.elements.gadgetName.textContent = gadgetName;

        // 冷却进度
        const fill = this.elements.gadgetCooldownFill;
        if (cooldown > 0 && maxCooldown > 0) {
            const pct = (1 - cooldown / maxCooldown) * 100;
            fill.style.width = `${pct}%`;
            panel.classList.add('cooling');
            panel.classList.remove('ready');
        } else {
            fill.style.width = '100%';
            panel.classList.remove('cooling');
            panel.classList.add('ready');
        }
    }

    // 更新比分
    updateScore(friendly, enemy, timeLeft) {
        this.elements.friendlyScore.textContent = friendly;
        this.elements.enemyScore.textContent = enemy;
        const mins = Math.floor(timeLeft / 60);
        const secs = Math.floor(timeLeft % 60);
        this.elements.gameTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 更新目标
    updateObjective(text) {
        this.elements.objectiveText.textContent = text;
    }

    // 添加击杀消息
    addKillMessage(killer, victim, weapon, isPlayerKill = false, isPlayerDeath = false) {
        const feed = this.elements.killFeed;
        const msg = document.createElement('div');
        msg.className = 'kill-msg';

        const killerEl = document.createElement('span');
        killerEl.className = 'killer';
        killerEl.textContent = killer;
        if (isPlayerKill) killerEl.style.fontWeight = 'bold';

        const weaponEl = document.createElement('span');
        weaponEl.className = 'weapon';
        weaponEl.textContent = `[${weapon}]`;

        const victimEl = document.createElement('span');
        victimEl.className = 'victim';
        victimEl.textContent = victim;
        if (isPlayerDeath) victimEl.style.fontWeight = 'bold';

        msg.appendChild(killerEl);
        msg.appendChild(weaponEl);
        msg.appendChild(victimEl);
        feed.appendChild(msg);

        setTimeout(() => msg.remove(), 5000);
    }

    // 更新小地图
    updateMinimap(playerPos, playerYaw, entities, capturePoints, worldSize, vehicles = []) {
        const ctx = this.minimapCtx;
        if (!ctx) return;

        const size = 200;
        const scale = size / worldSize;

        // 清空
        ctx.fillStyle = 'rgba(20, 30, 20, 0.8)';
        ctx.fillRect(0, 0, size, size);

        // 网格
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const p = (i / 4) * size;
            ctx.beginPath();
            ctx.moveTo(p, 0); ctx.lineTo(p, size);
            ctx.moveTo(0, p); ctx.lineTo(size, p);
            ctx.stroke();
        }

        // 据点
        for (const cp of capturePoints) {
            const x = (cp.x + worldSize / 2) * scale;
            const y = (cp.z + worldSize / 2) * scale;
            let color = '#888888';
            if (cp.team === 0) color = '#00aaff';
            else if (cp.team === 1) color = '#ff4444';

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cp.name, x, y);
        }

        // 载具图标
        // 战地风格：友方载具始终显示；敌方载具仅在"已标记"(_spotted)时显示
        for (const v of vehicles) {
            if (!v.alive) continue;
            // 敌方载具必须被标记才能在小地图上显示
            const isEnemy = v.team !== 0;
            if (isEnemy && !v._spotted) continue;

            const x = (v.position.x + worldSize / 2) * scale;
            const y = (v.position.z + worldSize / 2) * scale;
            if (x < 0 || x > size || y < 0 || y > size) continue;

            // 标记即将过期时闪烁淡出（_spotTimer < 2 秒）
            let alpha = 1;
            if (isEnemy && Number.isFinite(v._spotTimer) && v._spotTimer < 2) {
                alpha = Math.max(0.25, v._spotTimer / 2);
            }
            ctx.globalAlpha = alpha;

            const color = v.team === 0 ? '#00aaff' : '#ff4444';
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            // 根据载具类型绘制不同图标
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-v.yaw);

            if (v.type === 'tank') {
                // 坦克: 方形+炮管
                ctx.fillRect(-3, -3, 6, 6);
                ctx.fillRect(-0.5, -6, 1, 4);
            } else if (v.type === 'apc') {
                // APC: 菱形
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(4, 0);
                ctx.lineTo(0, 4);
                ctx.lineTo(-4, 0);
                ctx.closePath();
                ctx.fill();
            } else if (v.type === 'heli') {
                // 直升机: 圆+旋翼线
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
                ctx.stroke();
            } else {
                // 吉普: 三角箭头
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(-3, 3);
                ctx.lineTo(3, 3);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        // 实体
        // 战地风格：友方步兵始终显示；敌方步兵仅在"已标记"时显示
        // （之前所有敌人常驻显示相当于全图透视，破坏了战地的标记/侦察玩法）
        for (const e of entities) {
            if (!e.alive) continue;
            // 跳过在载具中的玩家
            if (e.inVehicle) continue;
            const isEnemy = e.team !== 0;
            if (isEnemy && !e._spotted) continue;

            const x = (e.position.x + worldSize / 2) * scale;
            const y = (e.position.z + worldSize / 2) * scale;

            if (x < 0 || x > size || y < 0 || y > size) continue;

            // 标记即将过期时淡出
            let alpha = 1;
            if (isEnemy && Number.isFinite(e._spotTimer) && e._spotTimer < 2) {
                alpha = Math.max(0.25, e._spotTimer / 2);
            }
            ctx.globalAlpha = alpha;

            if (e.team === 0) {
                ctx.fillStyle = '#00aaff';
                ctx.fillRect(x - 2, y - 2, 4, 4);
            } else {
                // 已标记敌人：实心红点 + 朝向刻线 + 闪烁外圈（红点+方位，战地侦察情报）
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                // 朝向刻线：从红点伸出的短线指示敌人面朝方向
                if (typeof e.yaw === 'number') {
                    ctx.strokeStyle = '#ff7766';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - Math.sin(e.yaw) * 6, y - Math.cos(e.yaw) * 6);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 4 + Math.sin(performance.now() * 0.008) * 1.2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // 玩家（中心箭头）
        const px = (playerPos.x + worldSize / 2) * scale;
        const py = (playerPos.z + worldSize / 2) * scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-playerYaw);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, 3);
        ctx.lineTo(3, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 视野扇形
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-playerYaw);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 40, -Math.PI / 4 - Math.PI / 2, Math.PI / 4 - Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // 更新载具HUD
    updateVehicle(vehicleState, seat) {
        if (vehicleState) {
            this.elements.vehicleHUD.classList.remove('hidden');
            // 重新显示控制提示时重置淡出动画
            if (this.elements.vehicleControls.classList.contains('hidden')) {
                this.elements.vehicleControls.classList.remove('hidden');
                this.elements.vehicleControls.style.animation = 'none';
                void this.elements.vehicleControls.offsetWidth; // 触发重排
                this.elements.vehicleControls.style.animation = '';
            }
            const pct = (vehicleState.health / vehicleState.maxHealth) * 100;
            this.elements.vehicleHealth.style.width = `${pct}%`;
            this.elements.vehicleName.textContent = vehicleState.name;
            this.elements.vehicleSeat.textContent = seat === 0 ? '驾驶员' : `乘员 ${seat + 1}`;

            // 血量颜色
            this.elements.vehicleHealth.classList.remove('low', 'critical');
            if (pct < 25) this.elements.vehicleHealth.classList.add('critical');
            else if (pct < 50) this.elements.vehicleHealth.classList.add('low');

            // 速度
            this.elements.vehicleSpeed.textContent = Math.round(Math.abs(vehicleState.speed || 0) * 3.6);

            // 高度（直升机）
            if (vehicleState.isAircraft) {
                this.elements.vehicleAltBox.classList.remove('hidden');
                this.elements.vehicleAltitude.textContent = Math.round(vehicleState.altitude || 0);
            } else {
                this.elements.vehicleAltBox.classList.add('hidden');
            }

            // 武器冷却 + 弹药
            if (vehicleState.hasWeapon) {
                this.elements.vehicleWeaponBox.classList.remove('hidden');
                const cdPct = vehicleState.cannonCooldown > 0
                    ? (1 - vehicleState.cannonCooldown / vehicleState.maxCannonCooldown) * 100
                    : 100;
                this.elements.vehicleCooldown.style.width = `${cdPct}%`;
                // 弹药显示（主炮 + 副武器）
                const ammoEl = this.elements.vehicleAmmo;
                if (ammoEl) {
                    let ammoText = '';
                    if (vehicleState.maxCannonAmmo > 0) {
                        ammoText += `主炮 ${vehicleState.cannonAmmo}/${vehicleState.maxCannonAmmo}`;
                    }
                    if (vehicleState.maxSecondaryAmmo > 0) {
                        if (ammoText) ammoText += ' · ';
                        ammoText += `机枪 ${vehicleState.secondaryAmmo}/${vehicleState.maxSecondaryAmmo}`;
                    }
                    ammoEl.textContent = ammoText;
                    // 弹药不足时高亮警告
                    ammoEl.classList.toggle('low',
                        (vehicleState.maxCannonAmmo > 0 && vehicleState.cannonAmmo <= vehicleState.maxCannonAmmo * 0.2) ||
                        (vehicleState.maxSecondaryAmmo > 0 && vehicleState.secondaryAmmo <= vehicleState.maxSecondaryAmmo * 0.2));
                }
            } else {
                this.elements.vehicleWeaponBox.classList.add('hidden');
            }

            // 载具状态指示
            this._updateVehicleStatus(vehicleState);

            // 炮塔方向指示器
            this._updateTurretIndicator(vehicleState);
        } else {
            this.elements.vehicleHUD.classList.add('hidden');
            this.elements.vehicleControls.classList.add('hidden');
            this.elements.vehicleControls.classList.remove('show-hint');
            this.elements.vehicleTurretIndicator.classList.add('hidden');
        }
    }

    // 更新载具状态指示
    _updateVehicleStatus(state) {
        // 漂移状态
        if (state.isDrifting && !state.isAircraft) {
            this.elements.vehicleDriftStatus.classList.remove('hidden');
        } else {
            this.elements.vehicleDriftStatus.classList.add('hidden');
        }

        // 损伤状态
        const pct = state.healthPct;
        if (pct < 0.25) {
            this.elements.vehicleDamageStatus.classList.add('hidden');
            this.elements.vehicleCriticalStatus.classList.remove('hidden');
        } else if (pct < 0.5) {
            this.elements.vehicleDamageStatus.classList.remove('hidden');
            this.elements.vehicleCriticalStatus.classList.add('hidden');
        } else {
            this.elements.vehicleDamageStatus.classList.add('hidden');
            this.elements.vehicleCriticalStatus.classList.add('hidden');
        }
    }

    // 更新炮塔方向指示器
    _updateTurretIndicator(state) {
        if (state.hasWeapon && state.turretYaw !== undefined) {
            this.elements.vehicleTurretIndicator.classList.remove('hidden');
            // 炮塔相对车体的角度
            const turretDeg = (state.turretYaw * 180 / Math.PI);
            this.elements.vtiTurretArrow.style.transform = `translate(-50%, -100%) rotate(${turretDeg}deg)`;
        } else {
            this.elements.vehicleTurretIndicator.classList.add('hidden');
        }
    }

    // 显示/隐藏载具准星
    showVehicleCrosshair(show) {
        this.elements.vehicleCrosshair.classList.toggle('hidden', !show);
    }

    // 更新载具准星（基于冷却状态变色）
    updateVehicleCrosshair(cooldownReady, mode = 'default') {
        this.elements.vehicleCrosshair.classList.toggle('aircraft', mode === 'aircraft');
        const dot = this.elements.vehicleCrosshair.querySelector('.vc-dot');
        const ring = this.elements.vehicleCrosshair.querySelector('.vc-ring');
        if (dot) dot.style.background = cooldownReady ? 'rgba(255, 140, 0, 0.9)' : 'rgba(255, 60, 60, 0.6)';
        if (ring) ring.style.borderColor = cooldownReady ? 'rgba(255, 140, 0, 0.4)' : 'rgba(255, 60, 60, 0.3)';
    }

    // 显示互动提示
    showInteraction(text) {
        this.elements.interactionText.textContent = text;
        this.elements.interactionPrompt.classList.remove('hidden');
    }

    hideInteraction() {
        this.elements.interactionPrompt.classList.add('hidden');
    }

    // 显示死亡画面
    showDeath(killerName, respawnTime) {
        this.elements.deathScreen.classList.remove('hidden');
        this.elements.killerName.textContent = `被 ${killerName} 击杀`;
        this.elements.respawnTimer.textContent = `${Math.ceil(respawnTime)}秒后重生`;
    }

    updateRespawnTimer(time) {
        this.elements.respawnTimer.textContent = `${Math.ceil(time)}秒后重生`;
    }

    hideDeath() {
        this.elements.deathScreen.classList.add('hidden');
    }

    // FPS
    updateFPS(fps) {
        this.elements.fpsCounter.textContent = `FPS: ${fps}`;
    }

    // 得分板
    toggleScoreboard(show) {
        this.elements.scoreboard.classList.toggle('hidden', !show);
    }

    updateScoreboard(friendlyPlayers, enemyPlayers) {
        // 性能优化：每0.5秒更新一次计分板，而非每帧
        // （此方法在 _updateHUD 中被调用，但由外部节流控制）
        const buildTeam = (container, players) => {
            container.innerHTML = '';
            players.sort((a, b) => b.kills - a.kills);
            for (const p of players) {
                const row = document.createElement('div');
                row.className = 'sb-player';
                row.innerHTML = `
                    <span class="name">${p.name}</span>
                    <span>击杀: ${p.kills} / 死亡: ${p.deaths}</span>
                    <span class="score">${p.kills * 100}</span>
                `;
                container.appendChild(row);
            }
        };
        buildTeam(this.elements.sbFriendly, friendlyPlayers);
        buildTeam(this.elements.sbEnemy, enemyPlayers);
    }

    // 通知
    showNotification(text, duration = 3) {
        this.elements.notification.textContent = text;
        this.elements.notification.style.opacity = '1';
        this.notificationTimer = duration;
    }

    updateNotification(dt) {
        if (this.notificationTimer > 0) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) {
                this.elements.notification.style.opacity = '0';
            } else if (this.notificationTimer < 1) {
                this.elements.notification.style.opacity = this.notificationTimer.toString();
            }
        }
    }

    // 狙击镜遮罩
    showScope() {
        if (this.elements.scopeOverlay) {
            this.elements.scopeOverlay.classList.remove('hidden');
        }
        if (this.elements.crosshair) {
            this.elements.crosshair.style.opacity = '0';
        }
    }

    hideScope() {
        if (this.elements.scopeOverlay) {
            this.elements.scopeOverlay.classList.add('hidden');
        }
        if (this.elements.crosshair) {
            this.elements.crosshair.style.opacity = '';
        }
    }

    // ============ 部署/重生界面 ============
    showDeployScreen(capturePoints, squadMembers, respawnTime, onSelectPoint) {
        this.elements.deployScreen.classList.remove('hidden');
        this.elements.deathScreen.classList.add('hidden');
        this._deployOnSelect = onSelectPoint;
        this._selectedDeployPoint = null;
        this._deployTimer = respawnTime;

        // 生成据点卡片
        this.elements.deployPoints.innerHTML = '';
        const availablePoints = capturePoints.filter(cp => cp.team === 0);

        for (const cp of availablePoints) {
            const card = document.createElement('div');
            card.className = 'deploy-point-card';
            card.dataset.cpName = cp.name;

            let statusClass = 'friendly';
            let statusText = '己方控制';
            if (cp.captureProgress > 0 && cp.capturingTeam !== 0) {
                statusClass = 'contested';
                statusText = '争夺中!';
            }

            card.innerHTML = `
                <div class="dp-letter">${cp.name}</div>
                <div class="dp-name">${cp.label || ('据点 ' + cp.name)}</div>
                <div class="dp-status ${statusClass}">${statusText}</div>
            `;
            card.addEventListener('click', () => {
                this.elements.deployPoints.querySelectorAll('.deploy-point-card').forEach(c => c.classList.remove('selected'));
                this.elements.deploySquadList.querySelectorAll('.deploy-squad-member').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this._selectedDeployPoint = cp;
                this._selectedSquadMember = null;
                this.elements.btnDeployNow.disabled = false;
            });
            this.elements.deployPoints.appendChild(card);
        }

        // 小队成员列表
        this.elements.deploySquadList.innerHTML = '';
        if (squadMembers && squadMembers.length > 0) {
            for (const m of squadMembers) {
                const row = document.createElement('div');
                row.className = 'deploy-squad-member';
                if (m.alive) {
                    row.style.cursor = 'pointer';
                    row.addEventListener('click', () => {
                        this.elements.deploySquadList.querySelectorAll('.deploy-squad-member').forEach(c => c.classList.remove('selected'));
                        this.elements.deployPoints.querySelectorAll('.deploy-point-card').forEach(c => c.classList.remove('selected'));
                        row.classList.add('selected');
                        this._selectedDeployPoint = null;
                        this._selectedSquadMember = m;
                        this.elements.btnDeployNow.disabled = false;
                    });
                }
                row.innerHTML = `
                    <div class="dsm-status ${m.alive ? 'alive' : 'dead'}"></div>
                    <span>${m.name}</span>
                    <span style="margin-left:auto;color:#888;font-size:11px">${m.alive ? '存活' : '阵亡'}</span>
                `;
                this.elements.deploySquadList.appendChild(row);
            }
        } else {
            this.elements.deploySquadList.innerHTML = '<div style="color:#666;font-size:12px">无小队成员</div>';
        }

        this.elements.btnDeployNow.disabled = true;
        this._selectedSquadMember = null;
        this._updateDeployTimer(respawnTime);
    }

    _updateDeployTimer(time) {
        this.elements.deployTimer.textContent = Math.ceil(time);
    }

    hideDeployScreen() {
        this.elements.deployScreen.classList.add('hidden');
    }

    getSelectedDeployPoint() {
        return this._selectedDeployPoint;
    }

    getSelectedSquadMember() {
        return this._selectedSquadMember || null;
    }

    // ============ 罗盘条 ============
    _initCompass() {
        if (!this.elements.compassStrip) return;
        this.elements.compassStrip.innerHTML = '';
        for (let deg = 0; deg < 360; deg += 15) {
            const tick = document.createElement('div');
            tick.className = 'compass-tick';
            const isMajor = (deg % 90 === 0);
            if (isMajor) tick.classList.add('major');

            let label;
            if (deg === 0) label = 'N';
            else if (deg === 90) label = 'E';
            else if (deg === 180) label = 'S';
            else if (deg === 270) label = 'W';
            else label = deg.toString();

            tick.innerHTML = `<div class="tick-line"></div>${label}`;
            this.elements.compassStrip.appendChild(tick);
        }
        this._compassTickWidth = 30;
        this._compassTotalWidth = (360 / 15) * 30;
    }

    updateCompass(playerYaw) {
        if (!this.elements.compassStrip) return;
        const yawDeg = ((playerYaw * 180 / Math.PI) % 360 + 360) % 360;
        const offset = -(yawDeg / 360) * this._compassTotalWidth;
        const containerWidth = 400;
        this.elements.compassStrip.style.transform = `translateX(${containerWidth / 2 + offset}px)`;
    }

    showCompass() {
        if (this.elements.compassBar) this.elements.compassBar.classList.remove('hidden');
    }

    hideCompass() {
        if (this.elements.compassBar) this.elements.compassBar.classList.add('hidden');
    }

    // ============ 3D世界标记 ============
    updateWorldMarkers(markers, camera) {
        if (!this.elements.worldMarkers) return;
        const container = this.elements.worldMarkers;

        for (const marker of markers) {
            if (!marker._el || !marker._el.style) {
                const el = document.createElement('div');
                el.className = 'world-marker';
                el.dataset.markerId = marker.id;
                el.innerHTML = `
                    <div class="wm-icon ${marker.type}">${marker.label}</div>
                    <div class="wm-label">${marker.text}</div>
                    <div class="wm-distance"></div>
                `;
                container.appendChild(el);
                marker._el = el;
                // 缓存子元素引用到 DOM 元素上（而非 marker 对象），
                // 因为 marker 对象每帧重建，只有 _el 会被 Game.js 缓存保留。
                el._distEl = el.querySelector('.wm-distance');
                el._iconEl = el.querySelector('.wm-icon');
                el._labelEl = el.querySelector('.wm-label');
            }
            const el = marker._el;
            const distEl = el._distEl;
            const iconEl = el._iconEl;
            const labelEl = el._labelEl;

            const screenPos = marker.position.clone().project(camera);
            const sx = (screenPos.x + 1) / 2 * window.innerWidth;
            const sy = (-screenPos.y + 1) / 2 * window.innerHeight;

            const onScreen = screenPos.x > -1 && screenPos.x < 1 && screenPos.y > -1 && screenPos.y < 1 && screenPos.z < 1;

            // 战地风格：标记随距离分级显示，避免"全图满屏图标"
            // - 据点(friendly/enemy/neutral): 250m 内显示，远距离淡出消失
            // - 战略目标(objective)/命令(order): 300m 内显示
            // - 已标记敌人(spotted)/补给(supply): 200m 内显示
            const isObjective = marker.type === 'objective' || marker.type === 'order';
            const farHideDist = isObjective ? 300 : 200;
            // 远距离时整体淡出至完全消失（不再保留最低可见度）
            let baseOpacity = 1 - Math.max(0, marker.distance - 50) / farHideDist;
            baseOpacity = Math.max(0, Math.min(1, baseOpacity));

            // 文字标签：距离>100m 时隐藏（只剩图标），减少视觉杂讯
            const showLabel = marker.distance < 100;

            if (onScreen && baseOpacity > 0.02) {
                el.style.display = 'flex';
                el.style.left = sx + 'px';
                el.style.top = (sy - 40) + 'px';
                el.style.opacity = baseOpacity;
                if (distEl) {
                    distEl.textContent = Math.round(marker.distance) + 'm';
                    distEl.style.display = showLabel ? '' : 'none';
                }
                if (labelEl) {
                    labelEl.style.display = showLabel ? '' : 'none';
                }
                if (iconEl) {
                    iconEl.className = `wm-icon ${marker.type}`;
                }
            } else if (!onScreen) {
                // 屏幕外：边缘指示箭头。仅对"重要"标记显示，避免边缘全是图标
                if (isObjective || marker.type === 'order' ||
                    marker.type === 'friendly' || marker.type === 'enemy' || marker.type === 'neutral') {
                    const angle = Math.atan2(sy - window.innerHeight / 2, sx - window.innerWidth / 2);
                    const margin = 60;
                    const halfW = window.innerWidth / 2 - margin;
                    const halfH = window.innerHeight / 2 - margin;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    const scale = Math.min(halfW / Math.max(Math.abs(cos), 0.01), halfH / Math.max(Math.abs(sin), 0.01));
                    const edgeX = window.innerWidth / 2 + cos * scale;
                    const edgeY = window.innerHeight / 2 + sin * scale;

                    el.style.display = 'flex';
                    el.style.left = edgeX + 'px';
                    el.style.top = edgeY + 'px';
                    el.style.opacity = '0.5';
                    if (distEl) distEl.style.display = 'none';
                    if (labelEl) labelEl.style.display = 'none';
                } else {
                    // 非重要标记在屏幕外且远距离时直接隐藏
                    el.style.display = 'none';
                }
            } else {
                // 在屏幕内但太远（baseOpacity 极小）：隐藏
                el.style.display = 'none';
            }
        }

        // 移除不再存在的markers
        const activeIds = new Set(markers.map(m => m.id));
        const toRemove = [];
        container.querySelectorAll('.world-marker').forEach(el => {
            if (!activeIds.has(el.dataset.markerId)) {
                toRemove.push(el);
            }
        });
        toRemove.forEach(el => el.remove());
    }

    clearWorldMarkers() {
        if (this.elements.worldMarkers) {
            this.elements.worldMarkers.innerHTML = '';
        }
    }

    // ============ 连杀提示 ============
    showKillstreak(title, subtitle) {
        if (!this.elements.killstreakPopup) return;
        this.elements.killstreakPopup.classList.remove('hidden');
        this.elements.killstreakPopup.innerHTML = `
            <div class="ks-title">${title}</div>
            <div class="ks-subtitle">${subtitle}</div>
        `;
        this.elements.killstreakPopup.style.animation = 'none';
        this.elements.killstreakPopup.offsetHeight;
        this.elements.killstreakPopup.style.animation = 'killstreakFade 3s ease-out forwards';

        clearTimeout(this._killstreakTimer);
        this._killstreakTimer = setTimeout(() => {
            this.elements.killstreakPopup.classList.add('hidden');
        }, 3000);
    }
}
