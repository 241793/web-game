// 音效管理器 - 使用 Web Audio API 程序化生成所有音效
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.volume = 0.5;
        this.initialized = false;
        this.listenerPosition = { x: 0, y: 0, z: 0 };
        this.listenerForward = { x: 0, y: 0, z: -1 };
        this.listenerUp = { x: 0, y: 1, z: 0 };

        // === 性能优化 ===
        this._noiseBufferCache = {};  // 缓存噪音缓冲区
        this._activeNodes = 0;        // 当前活跃音频节点数
        this._maxNodes = 32;          // 最大并发音频节点数
        this._lastGunshotTime = {};   // 按武器类型节流枪声
        this._battlefieldAmbience = null;
        this._battlefieldAmbienceTimer = null;
        this._battlefieldAmbienceIntensity = 1;
    }

    // 活跃节点计数：进入播声时递增，预估时长后递减，用于限流
    _acquireNode(durationEstimate) {
        if (this._activeNodes >= this._maxNodes) return false;
        this._activeNodes++;
        const self = this;
        setTimeout(() => { if (self._activeNodes > 0) self._activeNodes--; }, (durationEstimate + 0.05) * 1000);
        return true;
    }

    _getDistanceProfile(position) {
        if (!position) {
            return {
                distance: 0,
                gain: 1,
                tailGain: 1,
                lowpass: 12000,
                delay: 0,
            };
        }

        const dx = position.x - this.listenerPosition.x;
        const dy = position.y - this.listenerPosition.y;
        const dz = position.z - this.listenerPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const normalized = Math.max(0, Math.min(1, (distance - 8) / 120));

        return {
            distance,
            gain: 1 / (1 + Math.pow(distance / 12, 1.35)),
            tailGain: 0.7 + normalized * 0.9,
            lowpass: 9000 - normalized * 7200,
            delay: Math.min(0.12, 0.02 + distance / 2000),
        };
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API 不可用:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.masterGain) {
            this.masterGain.gain.value = v;
        }
    }

    // 更新3D音频监听器位置
    updateListener(position, forward, up) {
        if (!this.ctx) return;
        this.listenerPosition = position;
        this.listenerForward = forward;
        this.listenerUp = up || { x: 0, y: 1, z: 0 };
        const l = this.ctx.listener;
        if (l.positionX) {
            l.positionX.value = position.x;
            l.positionY.value = position.y;
            l.positionZ.value = position.z;
            if (l.forwardX) {
                l.forwardX.value = forward.x;
                l.forwardY.value = forward.y;
                l.forwardZ.value = forward.z;
                l.upX.value = this.listenerUp.x;
                l.upY.value = this.listenerUp.y;
                l.upZ.value = this.listenerUp.z;
            }
        } else if (l.setPosition) {
            l.setPosition(position.x, position.y, position.z);
            if (l.setOrientation) {
                l.setOrientation(forward.x, forward.y, forward.z,
                    this.listenerUp.x, this.listenerUp.y, this.listenerUp.z);
            }
        }
    }

    // 创建3D空间化节点
    _createSpatialPanner(position) {
        if (!this.ctx) return null;
        const panner = this.ctx.createPanner();
        // 性能优化：使用equalpower替代HRTF（HRTF每节点消耗~10倍CPU）
        panner.panningModel = 'equalpower';
        panner.distanceModel = 'inverse';
        panner.refDistance = 6;
        panner.maxDistance = 260;
        panner.rolloffFactor = 1.15;
        if (panner.positionX) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;
        } else if (panner.setPosition) {
            panner.setPosition(position.x, position.y, position.z);
        }
        return panner;
    }

    // ============ 枪声 ============
    playGunshot(weaponType, position, isPlayer = false) {
        if (!this.ctx) return;

        // 性能优化：限制并发音频节点数
        if (!this._acquireNode(0.35)) return;
        const distanceProfile = this._getDistanceProfile(position);

        // 性能优化：远距离AI枪声节流（非玩家枪声按距离+时间过滤）
        if (!isPlayer && position) {
            const dist = distanceProfile.distance;
            // 超过60米的枪声直接跳过
            if (dist > 190) return;
            // 30-60米内的枪声按距离概率衰减
            if (dist > 90 && Math.random() < (dist - 90) / 150) return;
            // 同类型武器节流：50ms内同类型枪声只播放一次
            const now = this.ctx.currentTime;
            const key = weaponType;
            if (this._lastGunshotTime[key] && now - this._lastGunshotTime[key] < 0.05) return;
            this._lastGunshotTime[key] = now;
        }

        const now = this.ctx.currentTime;

        // 基于武器类型调整参数
        let freq, duration, noiseDuration, volume;
        switch (weaponType) {
            case 'rifle_heavy':
                freq = 108; duration = 0.13; noiseDuration = 0.09; volume = 0.46;
                break;
            case 'rifle_light':
                freq = 132; duration = 0.1; noiseDuration = 0.07; volume = 0.38;
                break;
            case 'sniper':
                freq = 76; duration = 0.28; noiseDuration = 0.18; volume = 0.62;
                break;
            case 'shotgun':
                freq = 58; duration = 0.34; noiseDuration = 0.24; volume = 0.72;
                break;
            case 'smg':
                freq = 210; duration = 0.085; noiseDuration = 0.05; volume = 0.34;
                break;
            case 'pistol':
                freq = 165; duration = 0.09; noiseDuration = 0.055; volume = 0.28;
                break;
            case 'rocket':
                freq = 42; duration = 0.65; noiseDuration = 0.42; volume = 0.52;
                break;
            case 'lmg':
                freq = 96; duration = 0.16; noiseDuration = 0.11; volume = 0.48;
                break;
            case 'dmr':
                freq = 114; duration = 0.15; noiseDuration = 0.095; volume = 0.4;
                break;
            default: // rifle
                freq = 120; duration = 0.12; noiseDuration = 0.08; volume = 0.4;
        }

        // 低频冲击波
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + duration);

        const oscGain = this.ctx.createGain();
        const directGain = isPlayer ? 1 : (0.4 + 0.6 * Math.sqrt(distanceProfile.gain));
        oscGain.gain.setValueAtTime(volume * directGain, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // 高频噪音
        const noiseBuffer = this._createNoiseBuffer(noiseDuration);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 800;

        const noiseGain = this.ctx.createGain();
        const highGain = isPlayer ? 1 : (0.25 + 0.75 * distanceProfile.gain);
        noiseGain.gain.setValueAtTime(volume * 0.6 * highGain, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

        // 连接
        if (isPlayer || !position) {
            osc.connect(oscGain).connect(this.masterGain);
            noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
        } else {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                const distanceFilter = this.ctx.createBiquadFilter();
                distanceFilter.type = 'lowpass';
                distanceFilter.frequency.value = distanceProfile.lowpass;
                osc.connect(oscGain).connect(distanceFilter);
                noise.connect(noiseFilter).connect(noiseGain).connect(distanceFilter);
                distanceFilter.connect(panner).connect(this.masterGain);
            } else {
                osc.connect(oscGain).connect(this.masterGain);
                noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            }
        }

        osc.start(now);
        osc.stop(now + duration);
        noise.start(now);
        noise.stop(now + noiseDuration);

        // 尾音/机械感：给远处听感加一点空间回响
        const tailDelay = (weaponType === 'rocket' ? 0.16 : weaponType === 'shotgun' ? 0.08 : 0.05) + distanceProfile.delay;
        const tailVol = (weaponType === 'rocket' ? 0.16 : weaponType === 'sniper' ? 0.1 : 0.07) * distanceProfile.tailGain;
        if (position || isPlayer) {
            const tailTime = now + tailDelay;
            const tailNoise = this.ctx.createBufferSource();
            tailNoise.buffer = this._createNoiseBuffer(weaponType === 'rocket' ? 0.35 : 0.12);
            const tailFilter = this.ctx.createBiquadFilter();
            tailFilter.type = 'bandpass';
            tailFilter.frequency.value = weaponType === 'sniper' ? 1200 : 900;
            tailFilter.Q.value = 0.9;
            const tailGain = this.ctx.createGain();
            tailGain.gain.setValueAtTime(tailVol, tailTime);
            tailGain.gain.exponentialRampToValueAtTime(0.001, tailTime + (weaponType === 'rocket' ? 0.45 : 0.2));

            if (isPlayer || !position) {
                tailNoise.connect(tailFilter).connect(tailGain).connect(this.masterGain);
            } else {
                const panner = this._createSpatialPanner(position);
                if (panner) {
                    const tailDistanceFilter = this.ctx.createBiquadFilter();
                    tailDistanceFilter.type = 'lowpass';
                    tailDistanceFilter.frequency.value = Math.max(600, distanceProfile.lowpass * 0.7);
                    tailNoise.connect(tailFilter).connect(tailGain).connect(tailDistanceFilter).connect(panner).connect(this.masterGain);
                } else {
                    tailNoise.connect(tailFilter).connect(tailGain).connect(this.masterGain);
                }
            }
            tailNoise.start(tailTime);
            tailNoise.stop(tailTime + (weaponType === 'rocket' ? 0.5 : 0.2));
        }
    }

    // ============ 换弹声 ============
    // totalDuration: 换弹总时长（秒），三声按 30%/60%/90% 分布，与动画同步
    playReload(weaponType, totalDuration = 2.0) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        let dropFreq = 300, insertFreq = 200, rackFreq = 500;
        if (weaponType === 'shotgun') {
            dropFreq = 240; insertFreq = 180; rackFreq = 420;
        } else if (weaponType === 'rifle_light' || weaponType === 'smg') {
            dropFreq = 320; insertFreq = 220; rackFreq = 520;
        } else if (weaponType === 'lmg') {
            dropFreq = 260; insertFreq = 170; rackFreq = 420;
        } else if (weaponType === 'dmr') {
            dropFreq = 280; insertFreq = 190; rackFreq = 470;
        } else if (weaponType === 'pistol') {
            dropFreq = 340; insertFreq = 260; rackFreq = 520;
        } else if (weaponType === 'rocket') {
            dropFreq = 180; insertFreq = 140; rackFreq = 280;
        } else if (weaponType === 'sniper') {
            dropFreq = 260; insertFreq = 190; rackFreq = 450;
        } else if (weaponType === 'rifle_heavy') {
            dropFreq = 280; insertFreq = 180; rackFreq = 460;
        }

        const t1 = now + Math.min(totalDuration * 0.3, 1.2);
        const t2 = now + Math.min(totalDuration * 0.6, 2.4);
        const t3 = now + Math.min(totalDuration * 0.9, totalDuration - 0.12);
        this._playClick(now, dropFreq, 0.05, 0.14);
        this._playClick(t1, insertFreq, 0.05, 0.14);
        this._playClick(t2, rackFreq, 0.08, 0.18);
        // 末声（上膛/拉机柄）放在换弹接近完成时，避免长换弹后段无声
        if (totalDuration > 2.2) {
            this._playClick(t3, rackFreq * 0.9, 0.08, 0.16);
        }
    }

    _playClick(time, freq, duration, volume) {
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain).connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    }

    // ============ 命中标记 ============
    // isKill: 击杀时更响更长的高频确认音；isHeadshot: 爆头时叠加清脆泛音
    playHitMarker(isKill = false, isHeadshot = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isKill ? 1100 : 760, now);
        if (isKill) osc.frequency.exponentialRampToValueAtTime(1500, now + 0.12);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isKill ? 0.22 : 0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.18 : 0.09));
        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + (isKill ? 0.18 : 0.09));
        if (isHeadshot) {
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = 2600;
            const g2 = this.ctx.createGain();
            g2.gain.setValueAtTime(0.08, now);
            g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc2.connect(g2).connect(this.masterGain);
            osc2.start(now);
            osc2.stop(now + 0.1);
        }
    }

    // ============ 爆炸 ============
    playExplosion(position) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const distanceProfile = this._getDistanceProfile(position);

        // 低频轰鸣
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(15, now + 0.8);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.6 * (0.55 + 0.75 * Math.sqrt(distanceProfile.gain)), now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        // 噪音爆炸
        const noiseBuffer = this._createNoiseBuffer(0.6);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5 * (0.35 + 0.65 * distanceProfile.gain), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        if (position) {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                const distanceFilter = this.ctx.createBiquadFilter();
                distanceFilter.type = 'lowpass';
                distanceFilter.frequency.value = Math.max(500, distanceProfile.lowpass * 0.85);
                osc.connect(oscGain).connect(distanceFilter);
                noise.connect(noiseFilter).connect(noiseGain).connect(distanceFilter);
                distanceFilter.connect(panner).connect(this.masterGain);
            } else {
                osc.connect(oscGain).connect(this.masterGain);
                noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            }
        } else {
            osc.connect(oscGain).connect(this.masterGain);
            noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
        }

        osc.start(now);
        osc.stop(now + 0.8);
        noise.start(now);
        noise.stop(now + 0.6);
    }

    // ============ 脚步声 ============
    playFootstep(position, surface = 'dirt') {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 不同地面材质的脚步声特征
        let filterFreq = 600, vol = 0.05, dur = 0.08;
        switch (surface) {
            case 'metal': filterFreq = 1500; vol = 0.08; break;
            case 'road': filterFreq = 950; vol = 0.06; dur = 0.07; break;
            case 'snow': filterFreq = 380; vol = 0.045; dur = 0.1; break;
            case 'grass': filterFreq = 480; vol = 0.04; dur = 0.09; break;
        }

        const noiseBuffer = this._createNoiseBuffer(dur);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        if (position) {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                noise.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
            } else {
                noise.connect(filter).connect(gain).connect(this.masterGain);
            }
        } else {
            noise.connect(filter).connect(gain).connect(this.masterGain);
        }

        noise.start(now);
        noise.stop(now + dur);
    }

    // ============ 载具引擎声 ============
    createEngineSound(engineType = 'wheeled', pitchMultiplier = 1.0) {
        if (!this.ctx) return null;

        // 根据引擎类型设置参数
        let baseFreq, oscType, filterFreq, noiseVol;
        switch (engineType) {
            case 'tracked':
                // 坦克履带声 - 低沉、粗重
                baseFreq = 40;
                oscType = 'sawtooth';
                filterFreq = 250;
                noiseVol = 0.06;
                break;
            case 'rotary':
                // 直升机旋翼声 - 高频、呼啸
                baseFreq = 100;
                oscType = 'square';
                filterFreq = 600;
                noiseVol = 0.03;
                break;
            default:
                // 轮式载具 - 中频
                baseFreq = 70;
                oscType = 'sawtooth';
                filterFreq = 400;
                noiseVol = 0.04;
        }
        baseFreq *= pitchMultiplier;

        // 主振荡器
        const osc = this.ctx.createOscillator();
        osc.type = oscType;
        osc.frequency.value = baseFreq;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        osc.connect(filter).connect(gain).connect(this.masterGain);
        osc.start();

        // 第二振荡器（谐波）
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = baseFreq * 1.5;
        const gain2 = this.ctx.createGain();
        gain2.gain.value = 0;
        osc2.connect(gain2).connect(this.masterGain);
        osc2.start();

        // 履带噪音（持续白噪音）
        let noiseSource = null;
        let noiseGain = null;
        let rotorOsc = null;
        let rotorGain = null;
        let chopOsc = null;
        let chopGain = null;
        if (noiseVol > 0) {
            const noiseBuffer = this._createNoiseBuffer(1.0);
            noiseBuffer.loop = true;
            noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = engineType === 'tracked' ? 200 : 500;
            noiseFilter.Q.value = 2;
            noiseGain = this.ctx.createGain();
            noiseGain.gain.value = 0;
            noiseSource.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSource.start();
        }
        if (engineType === 'rotary') {
            rotorOsc = this.ctx.createOscillator();
            rotorOsc.type = 'sawtooth';
            rotorOsc.frequency.value = baseFreq * 0.42;
            const rotorFilter = this.ctx.createBiquadFilter();
            rotorFilter.type = 'lowpass';
            rotorFilter.frequency.value = 180;
            rotorGain = this.ctx.createGain();
            rotorGain.gain.value = 0;
            rotorOsc.connect(rotorFilter).connect(rotorGain).connect(this.masterGain);
            rotorOsc.start();

            chopOsc = this.ctx.createOscillator();
            chopOsc.type = 'square';
            chopOsc.frequency.value = 18;
            const chopFilter = this.ctx.createBiquadFilter();
            chopFilter.type = 'bandpass';
            chopFilter.frequency.value = 90;
            chopFilter.Q.value = 0.9;
            chopGain = this.ctx.createGain();
            chopGain.gain.value = 0;
            chopOsc.connect(chopFilter).connect(chopGain).connect(this.masterGain);
            chopOsc.start();
        }

        return {
            osc, filter, gain, osc2, gain2, rotorOsc, rotorGain, chopOsc, chopGain,
            // distance: 载具与听者（玩家）的距离，用于衰减+远处闷化，形成层次感
            setSpeed: (speed, load = 0, distance = 0) => {
                const t = this.ctx.currentTime;
                const speedFactor = Math.abs(speed);

                // === 距离衰减（近满声，60m 开始快速衰减，160m 静音）===
                let distAtten = 1;
                if (distance > 8) {
                    distAtten = Math.max(0, 1 - (distance - 8) / 150);
                    distAtten *= distAtten;   // 平方衰减更自然
                }
                // 远处高频闷化（引擎的低频传得远，高频近处才听得清）
                const muffle = Math.max(0.2, 1 - distance / 130);

                // === 怠速/行驶分层：怠速时音量压得很低，起步后才明显 ===
                const idleFactor = Math.min(1, speedFactor / 2.5 + load * 0.8);
                const idleFloor = 0.28;   // 怠速保留的音量比例
                const activity = idleFloor + (1 - idleFloor) * idleFactor;

                // 频率随速度和负载变化
                const freq = engineType === 'rotary'
                    ? baseFreq + speedFactor * 1.6 + load * 34
                    : baseFreq + speedFactor * 4 + load * 20;
                osc.frequency.setTargetAtTime(freq, t, 0.1);
                osc2.frequency.setTargetAtTime(freq * 1.5, t, 0.1);
                // 音量随速度和负载变化 × 距离 × 怠速分层
                const vol = (engineType === 'rotary'
                    ? 0.12 + speedFactor * 0.006 + load * 0.12
                    : 0.08 + speedFactor * 0.015 + load * 0.05) * distAtten * activity;
                gain.gain.setTargetAtTime(vol, t, 0.1);
                // osc2 是高频谐波，受闷化影响
                gain2.gain.setTargetAtTime(vol * 0.4 * muffle, t, 0.1);
                if (noiseGain) {
                    const nVol = (engineType === 'rotary'
                        ? noiseVol * (0.55 + speedFactor * 0.018 + load * 1.6)
                        : noiseVol * (0.3 + speedFactor * 0.03)) * distAtten * muffle * activity;
                    noiseGain.gain.setTargetAtTime(nVol, t, 0.1);
                }
                if (engineType === 'rotary') {
                    const rotorFreq = Math.max(28, baseFreq * 0.36 + speedFactor * 0.45 + load * 18);
                    const chopFreq = Math.max(14, 16 + speedFactor * 0.18 + load * 10);
                    if (rotorOsc) rotorOsc.frequency.setTargetAtTime(rotorFreq, t, 0.12);
                    if (chopOsc) chopOsc.frequency.setTargetAtTime(chopFreq, t, 0.12);
                    // 直升机旋翼低频传播远，衰减稍缓
                    const rotorAtten = distance > 8 ? Math.max(0, 1 - (distance - 8) / 220) : 1;
                    if (rotorGain) rotorGain.gain.setTargetAtTime((0.1 + load * 0.13) * rotorAtten, t, 0.12);
                    if (chopGain) chopGain.gain.setTargetAtTime((0.035 + load * 0.085) * rotorAtten, t, 0.12);
                }
            },
            stop: () => {
                const t = this.ctx.currentTime;
                gain.gain.setTargetAtTime(0, t, 0.2);
                gain2.gain.setTargetAtTime(0, t, 0.2);
                if (noiseGain) noiseGain.gain.setTargetAtTime(0, t, 0.2);
                if (rotorGain) rotorGain.gain.setTargetAtTime(0, t, 0.2);
                if (chopGain) chopGain.gain.setTargetAtTime(0, t, 0.2);
                osc.stop(t + 0.5);
                osc2.stop(t + 0.5);
                if (noiseSource) noiseSource.stop(t + 0.5);
                if (rotorOsc) rotorOsc.stop(t + 0.5);
                if (chopOsc) chopOsc.stop(t + 0.5);
            }
        };
    }

    // ============ 载具碰撞声 ============
    playGlassBreak(position, intensity = 1) {
        if (!this.ctx) return;
        if (!this._acquireNode(0.2)) return;
        const now = this.ctx.currentTime;
        const distanceProfile = this._getDistanceProfile(position);
        const baseVol = Math.min(0.42, 0.18 + intensity * 0.22);

        const connectSpatial = (source, gain, filter = null) => {
            if (position) {
                const panner = this._createSpatialPanner(position);
                if (panner) {
                    if (filter) source.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
                    else source.connect(gain).connect(panner).connect(this.masterGain);
                    return;
                }
            }
            if (filter) source.connect(filter).connect(gain).connect(this.masterGain);
            else source.connect(gain).connect(this.masterGain);
        };

        const crack = this.ctx.createBufferSource();
        crack.buffer = this._createNoiseBuffer(0.16);
        const crackFilter = this.ctx.createBiquadFilter();
        crackFilter.type = 'highpass';
        crackFilter.frequency.setValueAtTime(1800, now);
        crackFilter.frequency.exponentialRampToValueAtTime(5200, now + 0.05);
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(baseVol * (0.35 + 0.65 * distanceProfile.gain), now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        connectSpatial(crack, crackGain, crackFilter);
        crack.start(now);
        crack.stop(now + 0.16);

        const thump = this.ctx.createOscillator();
        thump.type = 'triangle';
        thump.frequency.setValueAtTime(260, now);
        thump.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        const thumpGain = this.ctx.createGain();
        thumpGain.gain.setValueAtTime(baseVol * 0.22, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        connectSpatial(thump, thumpGain);
        thump.start(now);
        thump.stop(now + 0.1);

        for (let i = 0; i < 4; i++) {
            const t = now + 0.04 + i * 0.035 + Math.random() * 0.025;
            const ping = this.ctx.createOscillator();
            ping.type = 'sine';
            ping.frequency.setValueAtTime(1600 + Math.random() * 2600, t);
            ping.frequency.exponentialRampToValueAtTime(650 + Math.random() * 600, t + 0.12);
            const pingGain = this.ctx.createGain();
            pingGain.gain.setValueAtTime(baseVol * 0.08 * distanceProfile.gain, t);
            pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            connectSpatial(ping, pingGain);
            ping.start(t);
            ping.stop(t + 0.14);
        }
    }

    playCollision(position, intensity = 0.5) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const vol = 0.2 + intensity * 0.4;

        // 金属撞击 - 低频
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120 + intensity * 80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(vol, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        // 噪音碎裂声
        const noiseBuffer = this._createNoiseBuffer(0.2);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1500;
        noiseFilter.Q.value = 1;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(vol * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        if (position) {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                osc.connect(oscGain).connect(panner).connect(this.masterGain);
                noise.connect(noiseFilter).connect(noiseGain).connect(panner);
            } else {
                osc.connect(oscGain).connect(this.masterGain);
                noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            }
        } else {
            osc.connect(oscGain).connect(this.masterGain);
            noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
        }

        osc.start(now);
        osc.stop(now + 0.2);
        noise.start(now);
        noise.stop(now + 0.15);
    }

    // ============ 轮胎摩擦声 ============
    playTireSkid(position, intensity = 1) {
        if (!this.ctx) return;
        // 限制频率避免刷屏
        if (this._lastSkidTime && this.ctx.currentTime - this._lastSkidTime < 0.1) return;
        this._lastSkidTime = this.ctx.currentTime;

        const now = this.ctx.currentTime;
        const vol = Math.min(intensity * 0.04, 0.08);

        const noiseBuffer = this._createNoiseBuffer(0.15);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        if (position) {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                noise.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
            } else {
                noise.connect(filter).connect(gain).connect(this.masterGain);
            }
        } else {
            noise.connect(filter).connect(gain).connect(this.masterGain);
        }

        noise.start(now);
        noise.stop(now + 0.12);
    }

    // ============ UI音效 ============
    playUISound(type = 'click') {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        switch (type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.value = 600;
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                break;
            case 'hover':
                osc.type = 'sine';
                osc.frequency.value = 400;
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                break;
            case 'deploy':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                break;
            case 'capture':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.15);
                osc.frequency.setValueAtTime(784, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                break;
            case 'warning':
                osc.type = 'sawtooth';
                osc.frequency.value = 300;
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                break;
        }

        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // ============ 受伤声 ============
    playHurt() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // ============ 心跳声（低血量时循环） ============
    playHeartbeat() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 两声心跳
        for (let i = 0; i < 2; i++) {
            const t = now + i * 0.18;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain).connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    // ============ 子弹掠过呼啸声 ============
    playBulletWhizz(position) {
        if (!this.ctx) return;
        // 性能优化：限制并发
        if (!this._acquireNode(0.15)) return;
        const now = this.ctx.currentTime;

        // 高频噪嗖声
        const noiseBuffer = this._createNoiseBuffer(0.15);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        filter.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        if (position) {
            const panner = this._createSpatialPanner(position);
            if (panner) {
                noise.connect(filter).connect(gain).connect(panner).connect(this.masterGain);
            } else {
                noise.connect(filter).connect(gain).connect(this.masterGain);
            }
        } else {
            noise.connect(filter).connect(gain).connect(this.masterGain);
        }

        noise.start(now);
        noise.stop(now + 0.15);
    }

    // ============ 命中标记音效 ============
    // 已合并到上方 playHitMarker(isKill, isHeadshot)，此处保留空位避免重复定义

    // ============ 爆头确认音（战地经典的清脆"叮"声）============
    playHeadshotDing() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(3600, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(this.masterGain);
        osc2.connect(gain2).connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.22);
        osc2.start(now); osc2.stop(now + 0.1);
    }

    // ============ 低弹药提示（弹匣 <25% 时最后几发的干涩击锤声）============
    playLowAmmoClick() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(0.03);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2800;
        filter.Q.value = 3;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        noise.connect(filter).connect(gain).connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.03);
    }

    // ============ 手雷落点警告（附近有敌方手雷时的急促蜂鸣）============
    playGrenadeWarning() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const t = now + i * 0.09;
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, t);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(gain).connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.06);
        }
    }

    // ============ 击杀确认音效 ============
    playHitConfirm() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // 两声清脆音
        for (let i = 0; i < 2; i++) {
            const t = now + i * 0.08;
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, t);
            osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(gain).connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.12);
        }
    }

    startBattlefieldAmbience(intensity = 1) {
        if (!this.ctx || !this.masterGain) return;
        this._battlefieldAmbienceIntensity = intensity;
        if (this._battlefieldAmbience) {
            this.setBattlefieldAmbienceIntensity(intensity);
            return;
        }

        const wind = this.ctx.createBufferSource();
        wind.buffer = this._createNoiseBuffer(2.0);
        wind.loop = true;
        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 180;
        windFilter.Q.value = 0.7;
        const windGain = this.ctx.createGain();
        windGain.gain.value = 0.03 * intensity;
        wind.connect(windFilter).connect(windGain).connect(this.masterGain);
        wind.start();

        const drone = this.ctx.createOscillator();
        drone.type = 'triangle';
        drone.frequency.value = 38;
        const droneFilter = this.ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 120;
        const droneGain = this.ctx.createGain();
        droneGain.gain.value = 0.012 * intensity;
        drone.connect(droneFilter).connect(droneGain).connect(this.masterGain);
        drone.start();

        this._battlefieldAmbience = { wind, windFilter, windGain, drone, droneFilter, droneGain };
        this._battlefieldAmbienceTimer = setInterval(() => {
            if (!this._battlefieldAmbience || !this.ctx) return;
            const chance = Math.min(0.75, 0.2 + this._battlefieldAmbienceIntensity * 0.18);
            if (Math.random() > chance) return;
            this._playDistantArtillery();
        }, 4200);
    }

    stopBattlefieldAmbience() {
        if (this._battlefieldAmbienceTimer) {
            clearInterval(this._battlefieldAmbienceTimer);
            this._battlefieldAmbienceTimer = null;
        }
        if (!this._battlefieldAmbience) return;
        const t = this.ctx ? this.ctx.currentTime : 0;
        const a = this._battlefieldAmbience;
        if (a.windGain) a.windGain.gain.setTargetAtTime(0, t, 0.15);
        if (a.droneGain) a.droneGain.gain.setTargetAtTime(0, t, 0.15);
        if (a.wind) a.wind.stop(t + 0.3);
        if (a.drone) a.drone.stop(t + 0.3);
        this._battlefieldAmbience = null;
    }

    setBattlefieldAmbienceIntensity(intensity = 1) {
        this._battlefieldAmbienceIntensity = Math.max(0, Math.min(1.5, intensity));
        if (!this._battlefieldAmbience || !this.ctx) return;
        const t = this.ctx.currentTime;
        const a = this._battlefieldAmbience;
        if (a.windGain) a.windGain.gain.setTargetAtTime(0.02 + 0.03 * this._battlefieldAmbienceIntensity, t, 0.2);
        if (a.droneGain) a.droneGain.gain.setTargetAtTime(0.008 + 0.01 * this._battlefieldAmbienceIntensity, t, 0.2);
    }

    _playDistantArtillery() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const boom = this.ctx.createOscillator();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(54, now);
        boom.frequency.exponentialRampToValueAtTime(18, now + 0.6);
        const boomGain = this.ctx.createGain();
        boomGain.gain.setValueAtTime(0.05 * this._battlefieldAmbienceIntensity, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        const crack = this.ctx.createBufferSource();
        crack.buffer = this._createNoiseBuffer(0.35);
        const crackFilter = this.ctx.createBiquadFilter();
        crackFilter.type = 'bandpass';
        crackFilter.frequency.value = 900;
        crackFilter.Q.value = 0.9;
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.025 * this._battlefieldAmbienceIntensity, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        const offsetX = (Math.random() - 0.5) * 240;
        const offsetZ = (Math.random() - 0.5) * 240;
        const pos = {
            x: this.listenerPosition.x + offsetX,
            y: this.listenerPosition.y + 8 + Math.random() * 10,
            z: this.listenerPosition.z + offsetZ,
        };
        const panner = this._createSpatialPanner(pos);
        if (panner) {
            boom.connect(boomGain).connect(panner).connect(this.masterGain);
            crack.connect(crackFilter).connect(crackGain).connect(panner);
        } else {
            boom.connect(boomGain).connect(this.masterGain);
            crack.connect(crackFilter).connect(crackGain).connect(this.masterGain);
        }

        boom.start(now);
        boom.stop(now + 0.7);
        crack.start(now);
        crack.stop(now + 0.25);
    }

    // ============ 工具 ============
    _createNoiseBuffer(duration) {
        // 性能优化：缓存常用时长的噪音缓冲区
        const key = duration.toFixed(3);
        if (this._noiseBufferCache[key]) {
            return this._noiseBufferCache[key];
        }
        const sampleRate = this.ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        // 只缓存短缓冲区（长缓冲区用于循环，不缓存）
        if (duration <= 0.5) {
            this._noiseBufferCache[key] = buffer;
        }
        return buffer;
    }
}
