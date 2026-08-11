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
        this._supportSelectCallback = null;
        for (const button of document.querySelectorAll('.support-option')) {
            button.addEventListener('click', () => this._supportSelectCallback?.(button.dataset.support));
        }
    }

    _cacheElements() {
        const ids = [
            'crosshair', 'hitMarker', 'damageIndicator',
            'scopeOverlay',
            'healthBar', 'healthText', 'armorText',
            'staminaBar',
            'leanIndicator', 'leanDirection',
            'spawnProtectionIndicator',
            'weaponPanel', 'weaponName', 'weaponMode', 'weaponOptic', 'ammoCurrent', 'ammoReserve', 'weaponSlots',
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
            'reloadIndicator', 'reloadProgress', 'reloadTime', 'deathScreen', 'killerName', 'respawnTimer',
            'fpsCounter', 'scoreboard', 'sbFriendly', 'sbEnemy',
            'notification', 'vehicleControls', 'gameHUD',
            'suppressionOverlay', 'lowHealthVignette', 'damageNumbers',
            'gadgetPanel', 'gadgetIcon', 'gadgetName', 'gadgetCooldownFill',
            'specialPanel', 'specialIcon', 'specialName', 'specialCooldownFill',
            'fortificationPanel', 'fortificationTitle', 'fortificationStatus', 'fortificationHint',
            'fortificationOptionSandbag', 'fortificationOptionWire', 'fortificationOptionHedgehog',
            // 新增元素
            'deployScreen', 'deployTimer', 'deployPoints', 'deploySquadList', 'btnDeployNow',
            'mortarMap', 'mortarMapCanvas', 'mortarAmmo', 'mortarTargetLabel',
            'compassBar', 'compassStrip', 'worldMarkers', 'killstreakPopup',
            'killConfirm', 'kcLabel', 'kcKiller', 'kcWeapon', 'kcVictim', 'kcScore', 'kcTags',
            // 倒地状态 UI
            'downedOverlay', 'downedTitle', 'bleedOutBar', 'bleedOutText',
            'skipProgressBar', 'skipHint',
            // 小队
            'squadPanel', 'squadList',
            'objectiveText', 'gameModeLabel',
            'directorPanel', 'directorMissionText', 'directorMissionTime', 'directorMissionProgress',
            'directorRequisition', 'directorSpecialization', 'directorModeStatus',
            'supportPanel', 'supportBalance', 'supportSmokeStatus', 'supportSupplyStatus', 'supportRallyStatus',
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
        const cache = this._weaponHudCache || (this._weaponHudCache = {});
        if (cache.name !== weaponState.name) {
            cache.name = weaponState.name;
            this.elements.weaponName.textContent = weaponState.name;
        }
        if (this.elements.weaponMode) {
            let modeText = weaponState.fireModeLabel || weaponState.fireMode || '';
            if (weaponState.isBraced) modeText += ' 架枪';
            else if (weaponState.isHoldingBreath) modeText += ' 屏息';
            const modeKey = `${modeText}|${!!weaponState.hasFireModeToggle}|${!!weaponState.isBraced}`;
            if (cache.modeKey !== modeKey) {
                cache.modeKey = modeKey;
                this.elements.weaponMode.textContent = modeText;
                this.elements.weaponMode.classList.toggle('hidden', !weaponState.fireModeLabel && !weaponState.fireMode);
                this.elements.weaponMode.classList.toggle('armed', !!weaponState.hasFireModeToggle);
                this.elements.weaponMode.classList.toggle('braced', !!weaponState.isBraced);
            }
        }
        if (cache.ammo !== weaponState.ammoInMag) {
            cache.ammo = weaponState.ammoInMag;
            this.elements.ammoCurrent.textContent = weaponState.ammoInMag;
        }
        if (cache.reserve !== weaponState.reserveAmmo) {
            cache.reserve = weaponState.reserveAmmo;
            this.elements.ammoReserve.textContent = weaponState.reserveAmmo;
        }

        if (cache.reloading !== weaponState.isReloading) {
            cache.reloading = weaponState.isReloading;
            this.elements.reloadIndicator.classList.toggle('hidden', !weaponState.isReloading);
            document.querySelector('.ammo-info')?.classList.toggle('reloading', !!weaponState.isReloading);
        }
        if (weaponState.isReloading) {
            const progress = Math.max(0, Math.min(1, weaponState.reloadProgress || 0));
            const progressKey = Math.round(progress * 1000);
            if (cache.reloadProgress !== progressKey) {
                cache.reloadProgress = progressKey;
                this.elements.reloadProgress.style.transform = `scaleX(${progress})`;
            }
            const remainingText = `${Math.max(0, weaponState.reloadRemaining || 0).toFixed(1)}s`;
            if (cache.reloadRemaining !== remainingText) {
                cache.reloadRemaining = remainingText;
                this.elements.reloadTime.textContent = remainingText;
            }
        } else {
            cache.reloadProgress = -1;
            cache.reloadRemaining = '';
            this.elements.reloadProgress.style.transform = 'scaleX(0)';
        }

        const listKey = `${weaponState.currentIdx}|${weaponState.weaponList.join('|')}`;
        if (cache.listKey !== listKey) {
            cache.listKey = listKey;
            this.elements.weaponSlots.innerHTML = '';
            for (let i = 0; i < weaponState.weaponList.length; i++) {
                const slot = document.createElement('div');
                slot.className = 'weapon-slot' + (i === weaponState.currentIdx ? ' active' : '');
                slot.textContent = `${i + 1} ${weaponState.weaponList[i]}`;
                this.elements.weaponSlots.appendChild(slot);
            }
        }

        if (cache.holdingBreath !== weaponState.isHoldingBreath) {
            cache.holdingBreath = weaponState.isHoldingBreath;
            this.elements.weaponName.classList.toggle('breath-hold', !!weaponState.isHoldingBreath);
        }

        // 瞄具标签（仅在变化时更新 DOM）
        if (this.elements.weaponOptic) {
            const opticKey = `${weaponState.opticName || ''}|${weaponState.opticStyle || ''}`;
            if (cache.opticKey !== opticKey) {
                cache.opticKey = opticKey;
                if (weaponState.opticName && weaponState.opticStyle !== 'iron') {
                    this.elements.weaponOptic.textContent = weaponState.opticName;
                    this.elements.weaponOptic.classList.remove('hidden');
                } else {
                    this.elements.weaponOptic.classList.add('hidden');
                }
            }
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

    // 更新特殊装备栏
    updateSpecial(name, cooldown = 0, maxCooldown = 1) {
        const panel = this.elements.specialPanel;
        if (!panel) return;
        const cache = this._specialHudCache || (this._specialHudCache = {});
        if (!name) {
            if (cache.name !== '') panel.classList.add('hidden');
            cache.name = '';
            return;
        }
        if (cache.name !== name) {
            cache.name = name;
            panel.classList.remove('hidden');
            const icons = { '刺雷': '刺', '反坦克地雷': '雷', '迫击炮': '迫', '沙袋掩体': '垒' };
            if (this.elements.specialIcon) this.elements.specialIcon.textContent = icons[name] || '特';
            if (this.elements.specialName) this.elements.specialName.textContent = name;
        }
        const pct = maxCooldown > 0 ? Math.max(0, Math.min(100, (1 - cooldown / maxCooldown) * 100)) : 100;
        const roundedPct = Math.round(pct);
        if (cache.pct !== roundedPct) {
            cache.pct = roundedPct;
            if (this.elements.specialCooldownFill) this.elements.specialCooldownFill.style.width = `${roundedPct}%`;
        }
        const cooling = cooldown > 0;
        if (cache.cooling !== cooling) {
            cache.cooling = cooling;
            panel.classList.toggle('cooling', cooling);
            panel.classList.toggle('ready', !cooling);
        }
    }

    // 更新兵种技能栏
    updateGadget(gadgetName, gadgetColor, cooldown, maxCooldown) {
        const panel = this.elements.gadgetPanel;
        if (!panel) return;
        const cache = this._gadgetHudCache || (this._gadgetHudCache = {});

        if (!gadgetName) {
            if (cache.name !== '') panel.classList.add('hidden');
            cache.name = '';
            return;
        }
        if (cache.name !== gadgetName) {
            cache.name = gadgetName;
            panel.classList.remove('hidden');
            const icon = gadgetName.includes('弹药') ? '弹' :
                         gadgetName.includes('医疗') ? '医' :
                         gadgetName.includes('维修') ? '修' :
                         gadgetName.includes('传感') ? '侦' : '技';
            this.elements.gadgetIcon.textContent = icon;
            this.elements.gadgetName.textContent = gadgetName;
        }

        const pct = maxCooldown > 0 ? Math.max(0, Math.min(100, (1 - cooldown / maxCooldown) * 100)) : 100;
        const roundedPct = Math.round(pct);
        if (cache.pct !== roundedPct) {
            cache.pct = roundedPct;
            this.elements.gadgetCooldownFill.style.width = `${roundedPct}%`;
        }
        const cooling = cooldown > 0;
        if (cache.cooling !== cooling) {
            cache.cooling = cooling;
            panel.classList.toggle('cooling', cooling);
            panel.classList.toggle('ready', !cooling);
        }
    }

    updateDirector(data) {
        const panel = this.elements.directorPanel;
        if (!panel) return;
        if (!data) {
            this.clearDirector();
            return;
        }

        panel.classList.remove('hidden');
        const missionStateLabels = {
            idle: '等待新任务',
            announced: '任务即将开始',
            success: '任务完成',
            failure: '任务失败',
            cooldown: '任务整备中',
        };
        const missionText = data.missionState === 'active'
            ? data.missionTitle
            : (data.missionState === 'announced' ? data.missionTitle : missionStateLabels[data.missionState] || data.missionTitle);
        const missionTime = data.missionState === 'active' ? `${Math.ceil(data.missionTime)}s` : '';
        const progress = Math.round(Math.max(0, Math.min(1, data.missionProgress || 0)) * 100);
        const requisition = `征用 ${data.requisition}/${data.requisitionMax}`;
        const specialization = `${data.specializationName || '专精'} Lv.${data.specializationLevel} · ${data.specializationXP}/${data.specializationThreshold}`;
        const modeStatus = data.mode?.modeHint || '';
        const cache = this._directorHudCache || (this._directorHudCache = {});

        const values = { missionText, missionTime, requisition, specialization, modeStatus };
        const elements = {
            missionText: this.elements.directorMissionText,
            missionTime: this.elements.directorMissionTime,
            requisition: this.elements.directorRequisition,
            specialization: this.elements.directorSpecialization,
            modeStatus: this.elements.directorModeStatus,
        };
        for (const [key, value] of Object.entries(values)) {
            if (cache[key] === value) continue;
            cache[key] = value;
            if (elements[key]) elements[key].textContent = value;
        }
        if (cache.progress !== progress) {
            cache.progress = progress;
            if (this.elements.directorMissionProgress) this.elements.directorMissionProgress.style.width = `${progress}%`;
        }
    }

    clearDirector() {
        this.elements.directorPanel?.classList.add('hidden');
        this._directorHudCache = {};
        this.hideSupportPanel();
    }

    setSupportSelectCallback(callback) {
        this._supportSelectCallback = typeof callback === 'function' ? callback : null;
    }

    showSupportPanel(data) {
        const panel = this.elements.supportPanel;
        if (!panel || !data) return;
        panel.classList.remove('hidden');
        if (this.elements.supportBalance) this.elements.supportBalance.textContent = `征用 ${data.requisition}/${data.requisitionMax}`;
        const entries = [
            ['smoke', this.elements.supportSmokeStatus],
            ['supply', this.elements.supportSupplyStatus],
            ['rally', this.elements.supportRallyStatus],
        ];
        for (const [type, statusEl] of entries) {
            const cooldown = Math.max(data.supportCooldown || 0, data.supportTypeCooldowns?.[type] || 0);
            const cost = data.supportCosts?.[type] || 0;
            const available = cooldown <= 0 && data.requisition >= cost;
            if (statusEl) statusEl.textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s` : `${cost}`;
            const button = panel.querySelector(`[data-support="${type}"]`);
            button?.classList.toggle('disabled', !available);
        }
    }

    hideSupportPanel() {
        this.elements.supportPanel?.classList.add('hidden');
    }

    isSupportPanelOpen() {
        return !!this.elements.supportPanel && !this.elements.supportPanel.classList.contains('hidden');
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

    // 添加击杀消息（战地风格 kill feed）
    // options: isPlayerKill, isPlayerDeath, isHeadshot, isDown, isSuicide,
    //          killerTeam (0/1), victimTeam (0/1), showConfirm, scoreText
    addKillMessage(killer, victim, weapon, options = {}) {
        // 兼容旧调用：第4/5参是布尔值
        if (typeof options === 'boolean') {
            options = {
                isPlayerKill: options,
                isPlayerDeath: arguments[4] === true,
            };
        }

        const {
            isPlayerKill = false,
            isPlayerDeath = false,
            isHeadshot = false,
            isDown = false,
            isSuicide = false,
            killerTeam = null,
            victimTeam = null,
            showConfirm = false,
            scoreText = '',
        } = options;

        const feed = this.elements.killFeed;
        if (!feed) return;

        const msg = document.createElement('div');
        msg.className = 'kill-msg';
        if (isPlayerKill) msg.classList.add('player-kill');
        if (isPlayerDeath) msg.classList.add('player-death');
        if (isDown) msg.classList.add('is-down');
        if (isHeadshot) msg.classList.add('is-headshot');

        const killerEl = document.createElement('span');
        killerEl.className = 'killer';
        if (killerTeam === 0) killerEl.classList.add('team-friendly');
        else if (killerTeam === 1) killerEl.classList.add('team-enemy');
        if (isPlayerKill) killerEl.classList.add('is-self');
        killerEl.textContent = killer || '???';

        const weaponEl = document.createElement('span');
        weaponEl.className = 'weapon';
        const weaponName = document.createElement('span');
        weaponName.className = 'weapon-name';
        weaponName.textContent = weapon || '武器';
        weaponEl.appendChild(weaponName);
        if (isHeadshot) {
            const hs = document.createElement('span');
            hs.className = 'kill-tag headshot';
            hs.textContent = '爆头';
            hs.title = '爆头';
            weaponEl.appendChild(hs);
        }
        if (isDown) {
            const dn = document.createElement('span');
            dn.className = 'kill-tag down';
            dn.textContent = '击倒';
            weaponEl.appendChild(dn);
        }

        const victimEl = document.createElement('span');
        victimEl.className = 'victim';
        if (victimTeam === 0) victimEl.classList.add('team-friendly');
        else if (victimTeam === 1) victimEl.classList.add('team-enemy');
        if (isPlayerDeath) victimEl.classList.add('is-self');
        victimEl.textContent = victim || '???';

        if (isSuicide) {
            msg.appendChild(victimEl);
            const suicideEl = document.createElement('span');
            suicideEl.className = 'weapon';
            suicideEl.innerHTML = '<span class="weapon-name">自杀</span>';
            msg.appendChild(suicideEl);
        } else {
            msg.appendChild(killerEl);
            msg.appendChild(weaponEl);
            msg.appendChild(victimEl);
        }

        // 新消息插到顶部（最新在上），旧消息向下滚出
        feed.insertBefore(msg, feed.firstChild);

        // 限制条数：超出则淡出最旧的
        const MAX_FEED = 7;
        while (feed.children.length > MAX_FEED) {
            const oldest = feed.lastElementChild;
            if (!oldest) break;
            this._fadeRemoveKillMsg(oldest);
        }

        // 记录并定时淡出
        this.killFeedMessages.push(msg);
        const life = isPlayerKill || isPlayerDeath ? 6500 : 5200;
        clearTimeout(msg._fadeTimer);
        msg._fadeTimer = setTimeout(() => this._fadeRemoveKillMsg(msg), life);

        // 玩家相关击杀/击倒弹出中央确认条
        if (showConfirm || isPlayerKill) {
            this.showKillConfirm({
                killer: killer || '你',
                victim: victim || '敌人',
                weapon: weapon || '武器',
                isHeadshot,
                isDown,
                isPlayerDeath,
                scoreText,
            });
        }
    }

    _fadeRemoveKillMsg(msg) {
        if (!msg || msg._removing) return;
        msg._removing = true;
        clearTimeout(msg._fadeTimer);
        msg.classList.add('removing');
        setTimeout(() => {
            if (msg.parentNode) msg.remove();
            const idx = this.killFeedMessages.indexOf(msg);
            if (idx >= 0) this.killFeedMessages.splice(idx, 1);
        }, 320);
    }

    clearKillFeed() {
        const feed = this.elements.killFeed;
        if (feed) feed.innerHTML = '';
        this.killFeedMessages = [];
    }

    // 战地风格个人击杀确认条：你 · 武器 · 击倒/击杀 · 敌人
    showKillConfirm({
        killer = '你',
        victim = '敌人',
        weapon = '武器',
        isHeadshot = false,
        isDown = false,
        isPlayerDeath = false,
        scoreText = '',
    } = {}) {
        const root = this.elements.killConfirm;
        if (!root) return;

        const label = this.elements.kcLabel;
        const killerEl = this.elements.kcKiller;
        const weaponEl = this.elements.kcWeapon;
        const victimEl = this.elements.kcVictim;
        const scoreEl = this.elements.kcScore;
        const tagsEl = this.elements.kcTags;

        if (isPlayerDeath) {
            if (label) label.textContent = '被击杀';
        } else if (isDown) {
            if (label) label.textContent = '击倒';
        } else {
            if (label) label.textContent = isHeadshot ? '爆头击杀' : '击杀';
        }

        if (killerEl) killerEl.textContent = killer;
        if (weaponEl) weaponEl.textContent = weapon;
        if (victimEl) victimEl.textContent = victim;

        if (tagsEl) {
            tagsEl.innerHTML = '';
            if (isHeadshot) {
                const t = document.createElement('span');
                t.className = 'kc-tag headshot';
                t.textContent = 'HEADSHOT';
                tagsEl.appendChild(t);
            }
            if (isDown) {
                const t = document.createElement('span');
                t.className = 'kc-tag down';
                t.textContent = 'DOWNED';
                tagsEl.appendChild(t);
            }
        }

        if (scoreEl) {
            if (scoreText) {
                scoreEl.textContent = scoreText;
                scoreEl.classList.remove('hidden');
            } else {
                scoreEl.textContent = '';
                scoreEl.classList.add('hidden');
            }
        }

        root.classList.remove('hidden', 'death', 'down', 'headshot');
        if (isPlayerDeath) root.classList.add('death');
        if (isDown) root.classList.add('down');
        if (isHeadshot) root.classList.add('headshot');

        // 重启入场动画
        root.style.animation = 'none';
        void root.offsetWidth;
        root.style.animation = '';

        clearTimeout(this._killConfirmTimer);
        this._killConfirmTimer = setTimeout(() => {
            root.classList.add('hidden');
        }, isPlayerDeath ? 3200 : 2600);
    }

    hideKillConfirm() {
        if (this.elements.killConfirm) {
            this.elements.killConfirm.classList.add('hidden');
        }
        clearTimeout(this._killConfirmTimer);
    }

    // === 迫击炮火力支援地图 ===
    showMortarMap(ammo) {
        const el = this.elements.mortarMap;
        if (!el) return;
        el.classList.remove('hidden');
        this.updateMortarAmmo(ammo);
        this._mortarClickCb = null;
        this._mortarHover = { px: -1, py: -1 };
        // 绑定 canvas 点击选点
        const canvas = this.elements.mortarMapCanvas;
        if (canvas) {
            this._mortarCanvasHandler = (ev) => {
                ev.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const px = ev.clientX - rect.left;
                const py = ev.clientY - rect.top;
                if (this._mortarClickCb) this._mortarClickCb(px, py);
            };
            this._mortarMoveHandler = (ev) => {
                const rect = canvas.getBoundingClientRect();
                this._mortarHover = { px: ev.clientX - rect.left, py: ev.clientY - rect.top };
                // 立即重绘，让落点预览跟手
                if (this._mortarRedrawCb) this._mortarRedrawCb();
            };
            canvas.addEventListener('click', this._mortarCanvasHandler);
            canvas.addEventListener('mousemove', this._mortarMoveHandler);
        }
    }

    hideMortarMap() {
        const el = this.elements.mortarMap;
        if (el) el.classList.add('hidden');
        const canvas = this.elements.mortarMapCanvas;
        if (canvas) {
            if (this._mortarCanvasHandler) {
                canvas.removeEventListener('click', this._mortarCanvasHandler);
                this._mortarCanvasHandler = null;
            }
            if (this._mortarMoveHandler) {
                canvas.removeEventListener('mousemove', this._mortarMoveHandler);
                this._mortarMoveHandler = null;
            }
        }
        this._mortarClickCb = null;
        this._mortarHover = null;
    }

    setMortarClickCallback(cb) {
        this._mortarClickCb = cb;
    }

    setMortarRedrawCallback(cb) {
        this._mortarRedrawCb = cb;
    }

    updateMortarAmmo(ammo) {
        if (this.elements.mortarAmmo) this.elements.mortarAmmo.textContent = `弹药 ${Math.max(0, Math.floor(ammo))}`;
    }

    updateMortarTarget(label) {
        if (this.elements.mortarTargetLabel) this.elements.mortarTargetLabel.textContent = label || '';
    }

    // 绘制迫击炮选点地图：灰底 + 据点 + 已标记敌人 + 玩家位置
    drawMortarMap(playerPos, capturePoints, spottedEnemies, worldSize, mortarPos) {
        const canvas = this.elements.mortarMapCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const half = worldSize / 2;
        const scale = size / worldSize;
        const toCanvas = (x, z) => ({ x: (x + half) * scale, y: (z + half) * scale });

        ctx.clearRect(0, 0, size, size);
        // 背景 + 网格
        ctx.fillStyle = '#0c1410';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(100,150,120,0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const p = (i / 4) * size;
            ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
        }

        // 据点
        for (const cp of capturePoints) {
            if (!cp) continue;
            const c = toCanvas(cp.x, cp.z);
            let color = '#888888';
            if (cp.team === 0) color = '#00aaff';
            else if (cp.team === 1) color = '#ff4444';
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(cp.name, c.x, c.y);
        }

        // 已标记敌人（红点）
        for (const e of spottedEnemies) {
            if (!e) continue;
            const c = toCanvas(e.x, e.z);
            ctx.fillStyle = '#ff4040';
            ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
        }

        // 迫击炮位置（黄点）+ 射程环
        if (mortarPos) {
            const c = toCanvas(mortarPos.x, mortarPos.z);
            const radiusPx = (mortarPos.range || 90) * scale;
            const minPx = (mortarPos.minRange || 8) * scale;

            // 可打击范围：内圈(最小射程) 到 外圈(最大射程) 之间的半透明环
            if (radiusPx > 1) {
                ctx.beginPath();
                ctx.arc(c.x, c.y, radiusPx, 0, Math.PI * 2);
                ctx.arc(c.x, c.y, minPx, 0, Math.PI * 2, true);
                ctx.fillStyle = 'rgba(255, 179, 51, 0.10)';
                ctx.fill();
            }
            // 外圈（最大射程）
            ctx.beginPath(); ctx.arc(c.x, c.y, radiusPx, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 179, 51, 0.65)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            // 内圈（最小射程）
            ctx.beginPath(); ctx.arc(c.x, c.y, minPx, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 90, 70, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 炮点
            ctx.fillStyle = '#ffb333';
            ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffd88a';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.stroke();
        }

        // 玩家位置（箭头）
        if (playerPos) {
            const c = toCanvas(playerPos.x, playerPos.z);
            ctx.fillStyle = '#69ff9d';
            ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText('你', c.x, c.y - 6);
        }

        // 悬停落点预览（绿色=可打击，红色=太近/超射程）
        if (this._mortarHover && mortarPos) {
            const hx = this._mortarHover.px;
            const hy = this._mortarHover.py;
            if (hx >= 0 && hy >= 0 && hx <= size && hy <= size) {
                const wx = hx / scale - half;
                const wz = hy / scale - half;
                const dx = wx - mortarPos.x;
                const dz = wz - mortarPos.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const inRange = dist >= (mortarPos.minRange || 8) && dist <= (mortarPos.range || 90);
                ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.fillStyle = inRange ? 'rgba(105,255,157,0.28)' : 'rgba(255,90,70,0.28)';
                ctx.fill();
                ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.strokeStyle = inRange ? '#69ff9d' : '#ff5a46';
                ctx.lineWidth = 2;
                ctx.stroke();
                const label = inRange
                    ? `落点 (${Math.round(wx)}, ${Math.round(wz)}) · 距离 ${Math.round(dist)}m · 点击开炮`
                    : (dist < (mortarPos.minRange || 8) ? '距离太近（需要 ≥ ' + Math.round(mortarPos.minRange || 8) + 'm）' : '超出射程（≤ ' + Math.round(mortarPos.range || 90) + 'm）');
                this.updateMortarTarget(label);
            }
        }
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

    // 彻底隐藏所有载具相关 UI（下车 / 载具摧毁 / 强制清理）
    hideVehicleUI() {
        this._vehicleUiActive = false;
        if (this.elements.vehicleHUD) this.elements.vehicleHUD.classList.add('hidden');
        if (this.elements.vehicleControls) {
            this.elements.vehicleControls.classList.add('hidden');
            this.elements.vehicleControls.classList.remove('show-hint', 'controls-visible');
            this.elements.vehicleControls.style.animation = '';
            this.elements.vehicleControls.style.opacity = '';
        }
        if (this.elements.vehicleTurretIndicator) {
            this.elements.vehicleTurretIndicator.classList.add('hidden');
        }
        this.showVehicleCrosshair(false);
        // 恢复步兵武器/准星面板
        if (this.elements.weaponPanel) this.elements.weaponPanel.classList.remove('vehicle-hidden');
        if (this.elements.crosshair) this.elements.crosshair.classList.remove('vehicle-hidden');
        document.getElementById('gameHUD')?.classList.remove('in-vehicle');
    }

    // 更新载具HUD
    updateVehicle(vehicleState, seat) {
        if (!vehicleState) {
            this.hideVehicleUI();
            return;
        }

        this._vehicleUiActive = true;
        document.getElementById('gameHUD')?.classList.add('in-vehicle');
        this.elements.vehicleHUD.classList.remove('hidden');

        // 首次进入：短暂显示控制提示，随后淡出
        if (this.elements.vehicleControls) {
            if (this.elements.vehicleControls.classList.contains('hidden')) {
                this.elements.vehicleControls.classList.remove('hidden');
                this.elements.vehicleControls.classList.add('controls-visible');
                this.elements.vehicleControls.style.animation = 'none';
                void this.elements.vehicleControls.offsetWidth;
                this.elements.vehicleControls.style.animation = '';
                this.elements.vehicleControls.style.opacity = '';
            }
        }

        const pct = (vehicleState.health / vehicleState.maxHealth) * 100;
        this.elements.vehicleHealth.style.width = `${pct}%`;
        this.elements.vehicleName.textContent = vehicleState.name;
        const seatLabel = seat === 0 ? '驾驶员' : `乘员 ${seat + 1}`;
        const occ = vehicleState.occupants ?? 0;
        const maxOcc = vehicleState.maxOccupants ?? 0;
        this.elements.vehicleSeat.textContent = maxOcc
            ? `${seatLabel} · ${occ}/${maxOcc}`
            : seatLabel;

        // 血量颜色
        this.elements.vehicleHealth.classList.remove('low', 'critical');
        if (pct < 25) this.elements.vehicleHealth.classList.add('critical');
        else if (pct < 50) this.elements.vehicleHealth.classList.add('low');

        // 速度
        this.elements.vehicleSpeed.textContent = Math.round(Math.abs(vehicleState.speed || 0) * 3.6);

        // 高度（飞行器）
        if (vehicleState.isAircraft) {
            this.elements.vehicleAltBox.classList.remove('hidden');
            this.elements.vehicleAltitude.textContent = Math.round(vehicleState.altitude || 0);
        } else {
            this.elements.vehicleAltBox.classList.add('hidden');
        }

        // 武器冷却 + 弹药
        if (vehicleState.hasWeapon) {
            this.elements.vehicleWeaponBox.classList.remove('hidden');
            const maxCd = vehicleState.maxCannonCooldown || 1;
            const cdPct = vehicleState.cannonCooldown > 0
                ? (1 - vehicleState.cannonCooldown / maxCd) * 100
                : 100;
            this.elements.vehicleCooldown.style.width = `${Math.max(0, Math.min(100, cdPct))}%`;
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
                ammoEl.classList.toggle('low',
                    (vehicleState.maxCannonAmmo > 0 && vehicleState.cannonAmmo <= vehicleState.maxCannonAmmo * 0.2) ||
                    (vehicleState.maxSecondaryAmmo > 0 && vehicleState.secondaryAmmo <= vehicleState.maxSecondaryAmmo * 0.2));
            }
        } else {
            this.elements.vehicleWeaponBox.classList.add('hidden');
        }

        this._updateVehicleStatus(vehicleState);
        this._updateTurretIndicator(vehicleState);

        // 驾驶员隐藏步兵武器面板；乘员保留个人武器信息
        if (this.elements.weaponPanel) {
            this.elements.weaponPanel.classList.toggle('vehicle-hidden', seat === 0);
        }
        if (this.elements.crosshair) {
            this.elements.crosshair.classList.toggle('vehicle-hidden', seat === 0);
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
        if (!this.elements.vehicleCrosshair) return;
        this.elements.vehicleCrosshair.classList.toggle('hidden', !show);
        if (!show) {
            this.elements.vehicleCrosshair.classList.remove('aircraft');
        }
    }

    // 更新载具准星（基于冷却状态变色）
    updateVehicleCrosshair(cooldownReady, mode = 'default') {
        if (!this.elements.vehicleCrosshair) return;
        this.elements.vehicleCrosshair.classList.toggle('aircraft', mode === 'aircraft');
        const dot = this.elements.vehicleCrosshair.querySelector('.vc-dot');
        const ring = this.elements.vehicleCrosshair.querySelector('.vc-ring');
        if (dot) dot.style.background = cooldownReady ? 'rgba(255, 140, 0, 0.9)' : 'rgba(255, 60, 60, 0.6)';
        if (ring) ring.style.borderColor = cooldownReady ? 'rgba(255, 140, 0, 0.4)' : 'rgba(255, 60, 60, 0.3)';
    }

    // 显示互动提示
    // actions: [{key:'F', label:'进入载具'}, ...] 动作列表；或字符串（向后兼容，纯文本）
    showInteraction(actions) {
        const prompt = this.elements.interactionPrompt;
        if (!prompt) return;
        // 兼容旧字符串调用
        if (typeof actions === 'string') {
            this.elements.interactionText.textContent = actions;
            // 字符串模式下清掉动作节点，只保留文本
            const oldActions = prompt.querySelector('.interaction-actions');
            if (oldActions) oldActions.remove();
            prompt.classList.remove('hidden');
            return;
        }
        if (!Array.isArray(actions) || actions.length === 0) {
            this.hideInteraction();
            return;
        }
        // 缓存签名，避免每帧重复改 DOM
        const sig = actions.map(a => `${a.key}:${a.label}`).join('|');
        if (this._interactionSig === sig && !prompt.classList.contains('hidden')) return;
        this._interactionSig = sig;

        // 清掉旧的动作节点和纯文本
        let actionsEl = prompt.querySelector('.interaction-actions');
        if (!actionsEl) {
            actionsEl = document.createElement('span');
            actionsEl.className = 'interaction-actions';
            prompt.appendChild(actionsEl);
        }
        actionsEl.innerHTML = '';
        for (const a of actions) {
            const entry = document.createElement('span');
            entry.className = 'interaction-entry';
            if (a.key) {
                const kbd = document.createElement('kbd');
                kbd.textContent = a.key;
                entry.appendChild(kbd);
            }
            const label = document.createElement('span');
            label.textContent = a.label;
            entry.appendChild(label);
            actionsEl.appendChild(entry);
        }
        // 纯文本节点隐藏
        this.elements.interactionText.textContent = '';
        prompt.classList.remove('hidden');
    }

    hideInteraction() {
        this.elements.interactionPrompt.classList.add('hidden');
        this._interactionSig = null;
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
        // 战地风格：Name | K | D | A | Score，按得分排序
        const buildTeam = (container, players) => {
            if (!container) return;
            container.innerHTML = '';
            const ranked = players.slice().sort((a, b) => {
                const sa = (a.kills || 0) * 100 + (a.assists || 0) * 50;
                const sb = (b.kills || 0) * 100 + (b.assists || 0) * 50;
                return sb - sa;
            });
            for (const p of ranked) {
                const k = p.kills || 0;
                const d = p.deaths || 0;
                const a = p.assists || 0;
                const score = k * 100 + a * 50;
                const row = document.createElement('div');
                row.className = 'sb-player' + (p.isPlayer ? ' is-self' : '');
                row.innerHTML = `
                    <span class="name">${p.name || '未知'}</span>
                    <span class="sb-stat">${k}</span>
                    <span class="sb-stat">${d}</span>
                    <span class="sb-stat">${a}</span>
                    <span class="score">${score}</span>
                `;
                container.appendChild(row);
            }
        };
        buildTeam(this.elements.sbFriendly, friendlyPlayers);
        buildTeam(this.elements.sbEnemy, enemyPlayers);
    }

    // 小队面板：显示同队成员血量/状态
    updateSquad(members = []) {
        const list = this.elements.squadList;
        const panel = this.elements.squadPanel;
        if (!list || !panel) return;
        list.innerHTML = '';
        const shown = members.slice(0, 5);
        if (shown.length === 0) {
            panel.classList.add('hidden');
            return;
        }
        panel.classList.remove('hidden');
        for (const m of shown) {
            const row = document.createElement('div');
            const hp = Math.max(0, Math.min(100, m.health ?? (m.alive ? 100 : 0)));
            row.className = 'squad-member' + (m.isSelf ? ' is-self' : '') + (!m.alive ? ' dead' : (m.downed ? ' downed' : ''));
            row.innerHTML = `
                <span class="sq-class">${(m.classType || 'assault').slice(0, 2).toUpperCase()}</span>
                <span class="sq-name">${m.name || '队友'}</span>
                <span class="sq-hp-bar"><i style="width:${m.alive || m.downed ? hp : 0}%"></i></span>
            `;
            list.appendChild(row);
        }
    }

    // 模式动态目标文案（抢攻 fuse 等）
    setObjectiveText(text) {
        if (this.elements.objectiveText) this.elements.objectiveText.textContent = text;
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

    // 瞄准镜遮罩（按瞄具风格切换：combat 3-4x / sniper 6-8x）
    showScope(style = 'sniper') {
        if (this.elements.scopeOverlay) {
            this.elements.scopeOverlay.classList.remove('hidden');
            this.elements.scopeOverlay.dataset.scopeStyle = style;
        }
        if (this.elements.crosshair) {
            this.elements.crosshair.style.opacity = '0';
        }
    }

    hideScope() {
        if (this.elements.scopeOverlay) {
            this.elements.scopeOverlay.classList.add('hidden');
            delete this.elements.scopeOverlay.dataset.scopeStyle;
        }
        if (this.elements.crosshair) {
            this.elements.crosshair.style.opacity = '';
        }
    }

    // ============ 部署/重生界面 ============
    showDeployScreen(capturePoints, squadMembers, respawnTime, onSelectPoint, onSpectate) {
        this.elements.deployScreen.classList.remove('hidden');
        this.elements.deathScreen.classList.add('hidden');
        this._deployOnSelect = onSelectPoint;
        this._deployOnSpectate = onSpectate || null;
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
            card.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.elements.deployPoints.querySelectorAll('.deploy-point-card').forEach(c => c.classList.remove('selected'));
                this.elements.deploySquadList.querySelectorAll('.deploy-squad-member').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this._selectedDeployPoint = cp;
                this._selectedSquadMember = null;
                // 倒计时未结束时按钮仍灰，但已记录选择；结束后可点
                if (this.elements.btnDeployNow) {
                    this.elements.btnDeployNow.disabled = (this._deployTimer || 0) > 0.05;
                }
            });
            this.elements.deployPoints.appendChild(card);
        }

        // 小队成员列表（点击玩家名称可观战，确认是否复活在其旁）
        this.elements.deploySquadList.innerHTML = '';
        if (squadMembers && squadMembers.length > 0) {
            for (const m of squadMembers) {
                const row = document.createElement('div');
                row.className = 'deploy-squad-member';
                row.style.cursor = 'pointer';
                if (m.alive) {
                    row.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        this.elements.deploySquadList.querySelectorAll('.deploy-squad-member').forEach(c => c.classList.remove('selected'));
                        this.elements.deployPoints.querySelectorAll('.deploy-point-card').forEach(c => c.classList.remove('selected'));
                        row.classList.add('selected');
                        this._selectedDeployPoint = null;
                        this._selectedSquadMember = m;
                        // 观战该成员
                        if (this._deployOnSpectate) this._deployOnSpectate(m);
                        if (this.elements.btnDeployNow) {
                            this.elements.btnDeployNow.disabled = (this._deployTimer || 0) > 0.05;
                        }
                    });
                }
                row.innerHTML = `
                    <div class="dsm-status ${m.alive ? 'alive' : 'dead'}"></div>
                    <span>${m.name}</span>
                    <span class="dsm-action">${m.alive ? (this._spectatingName === m.name ? '观战中…' : '观战') : ''}</span>
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

    setSpectatingName(name) {
        this._spectatingName = name || null;
        // 刷新成员列表观战标记
        const rows = this.elements.deploySquadList?.querySelectorAll('.deploy-squad-member');
        if (rows) {
            for (const row of rows) {
                const action = row.querySelector('.dsm-action');
                const nameEl = row.querySelector('span:nth-child(2)');
                if (action && nameEl) {
                    action.textContent = (this._spectatingName && nameEl.textContent === this._spectatingName)
                        ? '观战中…' : '';
                }
            }
        }
    }

    _updateDeployTimer(time) {
        this._deployTimer = time;
        if (this.elements.deployTimer) {
            this.elements.deployTimer.textContent = Math.ceil(Math.max(0, time));
        }
        // 倒计时结束后，若已选点则开放按钮
        if (this.elements.btnDeployNow) {
            const hasSelection = !!(this._selectedDeployPoint || this._selectedSquadMember);
            this.elements.btnDeployNow.disabled = time > 0.05 && !hasSelection
                ? true
                : (time > 0.05 ? true : !hasSelection);
            // 更直观：时间到了就允许点（没选则自动选）
            if (time <= 0.05) this.elements.btnDeployNow.disabled = false;
        }
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
            const isObjective = ['objective', 'order', 'mission', 'rally'].includes(marker.type);
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
                    if (labelEl.textContent !== marker.text) labelEl.textContent = marker.text;
                    labelEl.style.display = showLabel ? '' : 'none';
                }
                if (iconEl) {
                    if (iconEl.textContent !== marker.label) iconEl.textContent = marker.label;
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
