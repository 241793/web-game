import { CONFIG } from '../config.js?v=20260801.2';

// 菜单管理器 - 管理所有菜单界面
export class MenuManager {
    constructor(audio) {
        this.audio = audio;
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            mainMenu: document.getElementById('mainMenu'),
            mapModeSelect: document.getElementById('mapModeSelect'),
            classSelect: document.getElementById('classSelect'),
            settings: document.getElementById('settingsMenu'),
            help: document.getElementById('helpMenu'),
            pause: document.getElementById('pauseMenu'),
            gameOver: document.getElementById('gameOverScreen'),
        };
        this.selectedClass = null;
        this.selectedPrimaryByClass = {};
        // 地图/模式选择状态
        this.selectedMapId = 'default';
        this.selectedModeId = 'conquest';
        this._settingsOrigin = 'menu';
        this.settings = {
            sensitivity: 2.0,
            volume: 0.5,
            showFPS: true,
            fov: 75,
        };
        this._bindEvents();
        this._loadSettings();
        this._syncSettingsUI();
    }

    _bindEvents() {
        // 主菜单
        document.getElementById('btnStart').addEventListener('click', () => {
            this._playSound('click');
            this._renderMapModeSelect();
            this.show('mapModeSelect');
        });

        document.getElementById('btnSettings').addEventListener('click', () => {
            this._playSound('click');
            this._settingsOrigin = 'menu';
            this.show('settings');
        });

        document.getElementById('btnHelp').addEventListener('click', () => {
            this._playSound('click');
            this.show('help');
        });

        // 地图/模式选择
        document.getElementById('btnMapModeBack').addEventListener('click', () => {
            this._playSound('click');
            this.show('mainMenu');
        });

        document.getElementById('btnMapModeNext').addEventListener('click', () => {
            if (this.selectedModeId && this.selectedMapId) {
                this._playSound('click');
                this.show('classSelect');
            }
        });

        // 兵种选择
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedClass = card.dataset.class;
                this._renderWeaponSelect(this.selectedClass);
                document.getElementById('btnDeploy').disabled = false;
                this._playSound('hover');
            });
        });

        document.getElementById('btnDeploy').addEventListener('click', () => {
            if (this.selectedClass) {
                this._playSound('deploy');
                this.hideAll();
                if (this.onDeploy) this.onDeploy(this.selectedClass, this.getSelectedLoadout(), this.selectedMapId, this.selectedModeId);
            }
        });

        document.getElementById('btnBackToMenu').addEventListener('click', () => {
            this._playSound('click');
            this.show('mapModeSelect');
        });

        // 设置
        const sens = document.getElementById('sensitivity');
        const sensVal = document.getElementById('sensitivityValue');
        sens.addEventListener('input', () => {
            this.settings.sensitivity = parseFloat(sens.value);
            sensVal.textContent = parseFloat(sens.value).toFixed(1);
            this._applySettingsLive();
            this._saveSettings();
        });

        const vol = document.getElementById('volume');
        const volVal = document.getElementById('volumeValue');
        vol.addEventListener('input', () => {
            this.settings.volume = parseFloat(vol.value);
            volVal.textContent = `${Math.round(parseFloat(vol.value) * 100)}%`;
            this._applySettingsLive();
            this._saveSettings();
        });

        document.getElementById('showFPS').addEventListener('change', (e) => {
            this.settings.showFPS = e.target.checked;
            this._applySettingsLive();
            this._saveSettings();
        });

        const fov = document.getElementById('fov');
        const fovVal = document.getElementById('fovValue');
        fov.addEventListener('input', () => {
            this.settings.fov = parseInt(fov.value);
            fovVal.textContent = fov.value;
            this._applySettingsLive();
            this._saveSettings();
        });

        document.getElementById('btnSettingsBack').addEventListener('click', () => {
            this._playSound('click');
            if (this._settingsOrigin === 'pause') {
                this.show('pause');
            } else {
                this.show('mainMenu');
            }
        });

        // 帮助
        document.getElementById('btnHelpBack').addEventListener('click', () => {
            this._playSound('click');
            this.show('mainMenu');
        });

        // 暂停菜单
        document.getElementById('btnResume').addEventListener('click', () => {
            this._playSound('click');
            this.hideAll();
            if (this.onResume) this.onResume();
        });

        document.getElementById('btnPauseSettings').addEventListener('click', () => {
            this._playSound('click');
            this._settingsOrigin = 'pause';
            this.show('settings');
        });

        document.getElementById('btnChangeClass').addEventListener('click', () => {
            this._playSound('click');
            this.show('classSelect');
            if (this.onPause) this.onPause();
        });

        document.getElementById('btnQuit').addEventListener('click', () => {
            this._playSound('click');
            if (this.onQuit) this.onQuit();
            this.show('mainMenu');
        });

        // 游戏结束
        document.getElementById('btnGameOverMenu').addEventListener('click', () => {
            this._playSound('click');
            if (this.onQuit) this.onQuit();
            else this.show('mainMenu');
        });
    }

    // 渲染地图/模式选择界面
    _renderMapModeSelect() {
        // === 模式选项 ===
        const modeContainer = document.getElementById('modeOptions');
        const modes = CONFIG.GAME_MODES || {};
        modeContainer.innerHTML = '';
        for (const [modeId, modeCfg] of Object.entries(modes)) {
            const card = document.createElement('div');
            card.className = 'option-card mode-card' + (modeId === this.selectedModeId ? ' selected' : '');
            card.dataset.mode = modeId;
            card.innerHTML = `
                <div class="option-name">${modeCfg.name || modeId}</div>
                <div class="option-desc">${modeCfg.description || ''}</div>
                <div class="option-meta">
                    <span>票数 ${modeCfg.startingTickets || '-'}</span>
                    <span>时长 ${Math.round((modeCfg.matchDuration || 0) / 60)}分钟</span>
                </div>
            `;
            card.addEventListener('click', () => {
                this.selectedModeId = modeId;
                this._playSound('hover');
                this._renderMapModeSelect();
                this._updateMapModeSummary();
            });
            modeContainer.appendChild(card);
        }

        // === 地图选项 ===
        const mapContainer = document.getElementById('mapOptions');
        const maps = CONFIG.MAPS || {};
        const currentMode = modes[this.selectedModeId];
        const enabledMaps = currentMode?.enabledMaps || Object.keys(maps);
        mapContainer.innerHTML = '';
        const toCss = (hex) => `#${(hex ?? 0x888888).toString(16).padStart(6, '0')}`;
        for (const mapId of enabledMaps) {
            const mapCfg = maps[mapId];
            if (!mapCfg) continue;
            const card = document.createElement('div');
            card.className = 'option-card map-card' + (mapId === this.selectedMapId ? ' selected' : '');
            card.dataset.map = mapId;
            const tc = mapCfg.terrain || {};
            const sky = toCss(tc.skyColor);
            const ground = toCss(tc.groundColor);
            const fog = toCss(tc.fogColor);
            card.innerHTML = `
                <div class="map-preview" style="background: linear-gradient(180deg, ${sky} 0%, ${fog} 46%, ${ground} 55%, ${ground} 100%);">
                    <span class="map-preview-sun"></span>
                </div>
                <div class="option-name">${mapCfg.name || mapId}</div>
                <div class="option-desc">${mapCfg.description || ''}</div>
                <div class="option-meta">
                    <span>据点 ${(mapCfg.capturePoints || []).length}</span>
                    <span>载具 ${(mapCfg.vehicleSpawns || []).length}</span>
                    <span>尺寸 ${mapCfg.size || 400}m</span>
                </div>
            `;
            card.addEventListener('click', () => {
                this.selectedMapId = mapId;
                this._playSound('hover');
                this._renderMapModeSelect();
                this._updateMapModeSummary();
            });
            mapContainer.appendChild(card);
        }

        // 如果当前选中的地图不在 enabledMaps 中，自动选第一个
        if (!enabledMaps.includes(this.selectedMapId) && enabledMaps.length > 0) {
            this.selectedMapId = enabledMaps[0];
            this._renderMapModeSelect();
        }

        this._updateMapModeSummary();
    }

    // 更新地图/模式选择摘要
    _updateMapModeSummary() {
        const summary = document.getElementById('mapModeSummary');
        const modeCfg = CONFIG.GAME_MODES?.[this.selectedModeId];
        const mapCfg = CONFIG.MAPS?.[this.selectedMapId];
        const nextBtn = document.getElementById('btnMapModeNext');
        if (modeCfg && mapCfg) {
            summary.classList.remove('hidden');
            document.getElementById('summaryMode').textContent = modeCfg.name || this.selectedModeId;
            document.getElementById('summaryMap').textContent = mapCfg.name || this.selectedMapId;
            document.getElementById('summaryDesc').textContent = modeCfg.description || '';
            nextBtn.disabled = false;
        } else {
            summary.classList.add('hidden');
            nextBtn.disabled = true;
        }
    }

    _renderWeaponSelect(classType) {
        const panel = document.getElementById('weaponSelect');
        const optionsEl = document.getElementById('primaryWeaponOptions');
        const secondaryEl = document.getElementById('secondaryWeaponText');
        if (!panel || !optionsEl || !secondaryEl) return;

        const classConfig = CONFIG.CLASSES[classType];
        if (!classConfig) {
            panel.classList.add('hidden');
            return;
        }

        const options = classConfig.weaponOptions || [classConfig.primary];
        const storedPrimary = this.selectedPrimaryByClass[classType];
        const selected = options.includes(storedPrimary) ? storedPrimary : classConfig.primary;
        this.selectedPrimaryByClass[classType] = selected;

        optionsEl.innerHTML = '';
        for (const weaponId of options) {
            const weapon = CONFIG.WEAPONS[weaponId];
            if (!weapon) continue;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'weapon-option' + (weaponId === selected ? ' selected' : '');
            button.dataset.weapon = weaponId;
            const dmgPct = Math.min(100, (weapon.damage / 100) * 100);
            const rpmPct = Math.min(100, ((weapon.fireRate || 40) / 1200) * 100);
            const rangePct = Math.min(100, ((weapon.range || 100) / 500) * 100);
            button.innerHTML = `
                <span class="weapon-option-name">${weapon.name}</span>
                <span class="weapon-option-stats">${this._formatWeaponStats(weapon)}</span>
                <span class="weapon-stat-bars">
                    <i title="伤害" style="width:${dmgPct}%"></i>
                    <i title="射速" style="width:${rpmPct}%"></i>
                    <i title="射程" style="width:${rangePct}%"></i>
                </span>
            `;
            button.addEventListener('click', () => {
                this.selectedPrimaryByClass[classType] = weaponId;
                this._renderWeaponSelect(classType);
                this._playSound('hover');
            });
            optionsEl.appendChild(button);
        }

        const secondary = CONFIG.WEAPONS[classConfig.secondary];
        secondaryEl.textContent = secondary ? secondary.name : classConfig.secondary;
        panel.classList.remove('hidden');
    }

    _formatWeaponStats(weapon) {
        const fireRate = weapon.fireRate ? `${weapon.fireRate}RPM` : '单发';
        return `伤害 ${weapon.damage} · 弹匣 ${weapon.magSize} · ${fireRate}`;
    }

    getSelectedLoadout(classType = this.selectedClass) {
        const classConfig = CONFIG.CLASSES[classType];
        if (!classConfig) return null;
        return {
            primary: this.selectedPrimaryByClass[classType] || classConfig.primary,
            secondary: classConfig.secondary,
        };
    }

    _playSound(type) {
        if (this.audio) this.audio.playUISound(type);
    }

    show(name) {
        this.hideAll();
        if (this.screens[name]) {
            this.screens[name].classList.remove('hidden');
        }
    }

    hideAll() {
        for (const key in this.screens) {
            this.screens[key].classList.add('hidden');
        }
    }

    updateLoading(progress, text) {
        const bar = document.getElementById('loadingBar');
        const txt = document.getElementById('loadingText');
        if (bar) bar.style.width = `${progress}%`;
        if (txt) txt.textContent = text || `加载中... ${Math.floor(progress)}%`;
    }

    hideLoading() {
        this.screens.loading.classList.add('hidden');
    }

    showGameOver(victory, stats) {
        this.show('gameOver');
        const title = document.getElementById('gameOverTitle');
        title.textContent = victory ? '胜利！' : '失败';
        title.className = victory ? 'victory' : 'defeat';

        const statsEl = document.getElementById('gameOverStats');
        const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(0);
        statsEl.innerHTML = `
            <div class="go-stat-grid">
                <div class="go-stat"><span class="go-num">${stats.kills}</span><span class="go-label">击杀</span></div>
                <div class="go-stat"><span class="go-num">${stats.deaths}</span><span class="go-label">死亡</span></div>
                <div class="go-stat"><span class="go-num">${stats.assists || 0}</span><span class="go-label">助攻</span></div>
                <div class="go-stat"><span class="go-num">${kd}</span><span class="go-label">K/D</span></div>
            </div>
            <div class="go-final-score">最终比分 <strong>${stats.friendlyScore}</strong> : <strong>${stats.enemyScore}</strong></div>
        `;
    }

    getSettings() {
        return this.settings;
    }

    _saveSettings() {
        try {
            localStorage.setItem('bf_settings_v1', JSON.stringify(this.settings));
        } catch (e) {
            // 隐私模式等场景下 localStorage 可能不可用，忽略即可
        }
    }

    _loadSettings() {
        try {
            const raw = localStorage.getItem('bf_settings_v1');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (typeof saved.sensitivity === 'number') this.settings.sensitivity = saved.sensitivity;
            if (typeof saved.volume === 'number') this.settings.volume = saved.volume;
            if (typeof saved.showFPS === 'boolean') this.settings.showFPS = saved.showFPS;
            if (typeof saved.fov === 'number') this.settings.fov = saved.fov;
        } catch (e) {
            // 读取失败时使用默认设置
        }
    }

    _syncSettingsUI() {
        const sens = document.getElementById('sensitivity');
        const sensVal = document.getElementById('sensitivityValue');
        const vol = document.getElementById('volume');
        const volVal = document.getElementById('volumeValue');
        const fps = document.getElementById('showFPS');
        const fov = document.getElementById('fov');
        const fovVal = document.getElementById('fovValue');
        if (sens) sens.value = this.settings.sensitivity;
        if (sensVal) sensVal.textContent = this.settings.sensitivity.toFixed(1);
        if (vol) vol.value = this.settings.volume;
        if (volVal) volVal.textContent = `${Math.round(this.settings.volume * 100)}%`;
        if (fps) fps.checked = this.settings.showFPS;
        if (fov) fov.value = this.settings.fov;
        if (fovVal) fovVal.textContent = String(this.settings.fov);
        this.applySettings(this._gameInput, this._gameAudio, this._gameCamera);
    }

    applySettings(input, audio, camera) {
        if (input) input.setSensitivity(this.settings.sensitivity);
        if (audio) audio.setVolume(this.settings.volume);
        if (camera) camera.fov = this.settings.fov;
        const fpsEl = document.getElementById('fpsCounter');
        if (fpsEl) fpsEl.style.display = this.settings.showFPS ? 'block' : 'none';
    }

    // 保存游戏引用，设置变更时实时生效
    setGameReferences(input, audio, camera) {
        this._gameInput = input;
        this._gameAudio = audio;
        this._gameCamera = camera;
    }

    _applySettingsLive() {
        this.applySettings(this._gameInput, this._gameAudio, this._gameCamera);
        if (this._gameCamera) this._gameCamera.updateProjectionMatrix();
    }
}
