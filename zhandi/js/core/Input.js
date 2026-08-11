// 输入管理系统
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0, y: 0,
            deltaX: 0, deltaY: 0,
            buttons: [false, false, false],
            pressed: [false, false, false],
            wheelDelta: 0,
        };
        this.locked = false;
        this.sensitivity = 2.0;
        this.invertY = false;
        this._ignoreMouseUntil = 0;
        this._maxMouseStep = 0.5;
        this._spuriousDeltaThreshold = 1200;
        this._aimSensitivityScale = 1.0;

        // 移动端检测
        this.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
            ('ontouchstart' in window && window.innerWidth < 1024);
        // 标记 body，供 CSS 针对移动端缩放 HUD（缩小面板、按钮贴边、隐藏常驻占屏 UI）
        if (this.isMobile) {
            document.documentElement.classList.add('is-mobile');
            document.body.classList.add('is-mobile');
        }

        // 触控状态
        this._touchState = {
            joystick: { x: 0, y: 0 },  // -1 到 1
            lookDeltaX: 0,
            lookDeltaY: 0,
            shooting: false,
            aiming: false,
        };
        this._joystickTouchId = null;
        this._lookTouchId = null;
        this._lookLastX = 0;
        this._lookLastY = 0;

        // 按键按下/抬起事件回调
        this.onKeyDown = null;
        this.onKeyUp = null;
        this.onMouseDown = null;
        this.onMouseUp = null;
        this.onWheel = null;

        this._bindEvents();
        if (this.isMobile) {
            this._bindTouchEvents();
        }
    }

    _bindEvents() {
        // 键盘
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keys[e.code] = true;
            if (this.onKeyDown) this.onKeyDown(e.code, e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (this.onKeyUp) this.onKeyUp(e.code, e);
        });

        // 鼠标移动
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            if (this.locked) {
                const now = performance.now();
                if (now < this._ignoreMouseUntil) return;

                const rawX = Number.isFinite(e.movementX) ? e.movementX : 0;
                const rawY = Number.isFinite(e.movementY) ? e.movementY : 0;
                // 浏览器在切换指针锁、Alt-Tab、跨屏或高DPI鼠标恢复时可能给出异常大delta。
                // 这类值会造成视角瞬移，直接丢弃比平滑吸收更稳。
                // 阈值放宽到 _spuriousDeltaThreshold，避免误伤快速甩枪。
                if (Math.abs(rawX) > this._spuriousDeltaThreshold || Math.abs(rawY) > this._spuriousDeltaThreshold) {
                    this.clearMouseDelta();
                    this._ignoreMouseUntil = now + 16;
                    return;
                }

                // 应用 ADS 灵敏度缩放（瞄准时更慢更稳）+ Y 轴反转
                const effSens = this.sensitivity * this._aimSensitivityScale;
                const dx = rawX * effSens * 0.002;
                const dy = rawY * effSens * 0.002 * (this.invertY ? -1 : 1);
                // 逐事件夹紧到 _maxMouseStep，避免单次超大事件导致视角飞出；
                // 累积值不再二次夹紧，保证连续小幅事件能完整传递（修复"一卡一卡"）。
                this.mouse.deltaX += Math.max(-this._maxMouseStep, Math.min(this._maxMouseStep, dx));
                this.mouse.deltaY += Math.max(-this._maxMouseStep, Math.min(this._maxMouseStep, dy));
            }
        });

        // 鼠标按键
        document.addEventListener('mousedown', (e) => {
            if (e.button < 3) {
                if (!this.mouse.buttons[e.button]) {
                    this.mouse.pressed[e.button] = true;
                }
                this.mouse.buttons[e.button] = true;
            }
            if (this.onMouseDown) this.onMouseDown(e.button, e);
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button < 3) this.mouse.buttons[e.button] = false;
            if (this.onMouseUp) this.onMouseUp(e.button, e);
        });

        // 滚轮
        document.addEventListener('wheel', (e) => {
            this.mouse.wheelDelta = e.deltaY;
            if (this.onWheel) this.onWheel(e.deltaY, e);
        });

        // 指针锁定
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement !== null;
            this.clearMouseDelta();
            if (!this.locked) this.clearMouseButtons();
            this._ignoreMouseUntil = performance.now() + 80;
        });

        window.addEventListener('blur', () => {
            this.clearMouseDelta();
            this.clearMouseButtons();
            this._ignoreMouseUntil = performance.now() + 120;
        });

        document.addEventListener('visibilitychange', () => {
            this.clearMouseDelta();
            if (document.hidden) this.clearMouseButtons();
            this._ignoreMouseUntil = performance.now() + 120;
        });

        // 阻止右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    requestLock(element) {
        this.clearMouseDelta();
        this._ignoreMouseUntil = performance.now() + 80;
        if (element.requestPointerLock) {
            element.requestPointerLock();
        }
    }

    exitLock() {
        this.clearMouseDelta();
        this._ignoreMouseUntil = performance.now() + 80;
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    // 获取并清空鼠标增量
    getMouseDelta() {
        // 旧实现把累积值二次夹紧到 _maxMouseStep，导致快速甩枪时多出的位移被直接丢弃，
        // 表现为视角"吞帧/卡顿"。改为只做安全上限（防 NaN/Infinity），不再二次限幅。
        const delta = {
            x: Number.isFinite(this.mouse.deltaX) ? this.mouse.deltaX : 0,
            y: Number.isFinite(this.mouse.deltaY) ? this.mouse.deltaY : 0,
        };
        this.clearMouseDelta();
        return delta;
    }

    clearMouseDelta() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }

    clearMouseButtons() {
        this.mouse.buttons.fill(false);
        this.mouse.pressed.fill(false);
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }

    isMouseDown(button) {
        return this.mouse.buttons[button] || false;
    }

    consumeMousePressed(button) {
        const pressed = this.mouse.pressed[button] || false;
        this.mouse.pressed[button] = false;
        return pressed;
    }

    getWheelDelta() {
        const d = this.mouse.wheelDelta;
        this.mouse.wheelDelta = 0;
        return d;
    }

    setSensitivity(value) {
        this.sensitivity = Math.max(0.2, Math.min(6, Number(value) || 2.0));
    }

    setInvertY(value) {
        this.invertY = !!value;
    }

    // 设置 ADS 瞄准灵敏度缩放（1.0 = 不变，0.5 = 瞄准时鼠标减半）
    // 战地系列标准手感：开镜时鼠标灵敏度自动降低，便于远距离精瞄。
    setAimSensitivityScale(scale) {
        this._aimSensitivityScale = Math.max(0.1, Math.min(1.0, Number(scale) || 1.0));
    }

    // 合并键盘和触控状态
    isKeyDown(code) {
        if (this.keys[code]) return true;
        const ts = this._touchState;
        if (code === 'KeyW' && ts.joystick.y < -0.3) return true;
        if (code === 'KeyS' && ts.joystick.y > 0.3) return true;
        if (code === 'KeyA' && ts.joystick.x < -0.3) return true;
        if (code === 'KeyD' && ts.joystick.x > 0.3) return true;
        if (code === 'Space' && ts._jump) return true;
        if (code === 'KeyC' && ts._crouch) return true;
        if (code === 'ShiftLeft' && ts._sprint) return true;
        if (code === 'KeyZ' && ts._prone) return true;
        if (code === 'KeyQ' && ts._leanLeft) return true;
        if (code === 'KeyE' && ts._leanRight) return true;
        return false;
    }

    // 合并鼠标和触控射击
    isMouseDown(button) {
        if (this.mouse.buttons[button]) return true;
        if (button === 0 && this._touchState.shooting) return true;
        if (button === 2 && this._touchState.aiming) return true;
        return false;
    }

    // 绑定触控事件
    _bindTouchEvents() {
        const controls = document.getElementById('mobileControls');
        if (!controls) return;

        // === 虚拟摇杆 ===
        const joystickArea = document.getElementById('joystickArea');
        const joystickThumb = document.getElementById('joystickThumb');
        const joystickBase = document.getElementById('joystickBase');
        if (joystickArea && joystickThumb) {
            const baseRect = () => joystickBase.getBoundingClientRect();
            const maxDist = 42; // 摇杆最大偏移像素

            joystickArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                this._joystickTouchId = touch.identifier;
                this._updateJoystick(touch, joystickThumb, baseRect(), maxDist);
            }, { passive: false });

            joystickArea.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    if (touch.identifier === this._joystickTouchId) {
                        this._updateJoystick(touch, joystickThumb, baseRect(), maxDist);
                    }
                }
            }, { passive: false });

            const joystickEnd = (e) => {
                for (const touch of e.changedTouches) {
                    if (touch.identifier === this._joystickTouchId) {
                        this._joystickTouchId = null;
                        this._touchState.joystick.x = 0;
                        this._touchState.joystick.y = 0;
                        joystickThumb.style.transform = 'translate(0px, 0px)';
                    }
                }
            };
            joystickArea.addEventListener('touchend', joystickEnd);
            joystickArea.addEventListener('touchcancel', joystickEnd);
        }

        // === 右侧滑动（视角控制）===
        // 在 document 层监听：gameHUD 是 pointer-events:none，触摸不会派发到它，导致无法滑动视角。
        // 用坐标命中检测排除按钮/摇杆/UI 面板，其余触摸视为视角滑动（iOS elementFromPoint 不可靠）。
        const controlsEl = document.getElementById('mobileControls');
        const isInRect = (x, y, rect) =>
            !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        const buttonRects = () => {
            const rects = [];
            if (controlsEl) {
                controlsEl.querySelectorAll('.mobile-btn, #joystickArea').forEach((el) => {
                    rects.push(el.getBoundingClientRect());
                });
            }
            return rects;
        };
        const isUI = (x, y) => {
            // 按钮/摇杆区域
            for (const r of buttonRects()) {
                if (isInRect(x, y, r)) return true;
            }
            // 全屏 UI 面板（部署/观战/得分板/迫击炮地图等）
            const panelIds = ['scorePanel', 'healthPanel', 'weaponPanel', 'minimap', 'killFeed', 'squadPanel',
                'killConfirm', 'interactionPrompt', 'vehicleHUD', 'mortarMap', 'deployScreen',
                'scoreboard', 'downedOverlay', 'notification', 'vehicleTurretIndicator'];
            for (const id of panelIds) {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden')) {
                    const r = el.getBoundingClientRect();
                    if (isInRect(x, y, r)) return true;
                }
            }
            return false;
        };
        const rightZone = (x) => x > window.innerWidth * 0.35;

        document.addEventListener('touchstart', (e) => {
            if (this._joystickTouchId !== null) return;
            for (const touch of e.changedTouches) {
                if (!rightZone(touch.clientX) || this._lookTouchId !== null) continue;
                if (isUI(touch.clientX, touch.clientY)) continue;
                this._lookTouchId = touch.identifier;
                this._lookLastX = touch.clientX;
                this._lookLastY = touch.clientY;
                // 锁定该手势，防止 iOS 把它当滚动/缩放
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });

        // 注意：iOS Safari 在页面不可滚动时不会持续派发 touchmove，必须 passive:false + preventDefault
        document.addEventListener('touchmove', (e) => {
            if (this._lookTouchId === null) return;
            let handled = false;
            for (const touch of e.changedTouches) {
                if (touch.identifier !== this._lookTouchId) continue;
                const dx = touch.clientX - this._lookLastX;
                const dy = touch.clientY - this._lookLastY;
                this._lookLastX = touch.clientX;
                this._lookLastY = touch.clientY;
                const effSens = this.sensitivity * this._aimSensitivityScale;
                this._touchState.lookDeltaX += Math.max(-this._maxMouseStep, Math.min(this._maxMouseStep, dx * effSens * 0.003));
                this._touchState.lookDeltaY += Math.max(-this._maxMouseStep, Math.min(this._maxMouseStep, dy * effSens * 0.003));
                handled = true;
            }
            // 阻止页面滚动/手势，确保后续 touchmove 持续派发
            if (handled) e.preventDefault();
        }, { passive: false });

        const lookEnd = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this._lookTouchId) {
                    this._lookTouchId = null;
                }
            }
        };
        document.addEventListener('touchend', lookEnd);
        document.addEventListener('touchcancel', lookEnd);

        // === 动作按钮 ===
        this._bindMobileButton('mbtnShoot', () => { this._touchState.shooting = true; }, () => { this._touchState.shooting = false; });
        this._bindMobileButton('mbtnADS', () => { this._touchState.aiming = !this._touchState.aiming; }, null, true);
        this._bindMobileButton('mbtnReload', () => { if (this.onKeyDown) this.onKeyDown('KeyR', {}); }, null);
        this._bindMobileButton('mbtnGrenade', () => { if (this.onKeyDown) this.onKeyDown('KeyG', {}); }, null);
        this._bindMobileButton('mbtnInteract', () => { if (this.onKeyDown) this.onKeyDown('KeyF', {}); }, null);
        this._bindMobileButton('mbtnJump', () => { this._touchState._jump = true; }, () => { this._touchState._jump = false; });
        this._bindMobileButton('mbtnCrouch', () => { this._touchState._crouch = true; }, () => { this._touchState._crouch = false; });
        this._bindMobileButton('mbtnSprint', () => { this._touchState._sprint = true; }, () => { this._touchState._sprint = false; });
        this._bindMobileButton('mbtnProne', () => { this._touchState._prone = true; }, () => { this._touchState._prone = false; });
        this._bindMobileButton('mbtnLeanL', () => { this._touchState._leanLeft = true; }, () => { this._touchState._leanLeft = false; });
        this._bindMobileButton('mbtnLeanR', () => { this._touchState._leanRight = true; }, () => { this._touchState._leanRight = false; });
        this._bindMobileButton('mbtnGadget', () => { if (this.onKeyDown) this.onKeyDown('Digit3', {}); }, null);
        this._bindMobileButton('mbtnSpecial', () => { if (this.onKeyDown) this.onKeyDown('Digit5', {}); }, null);
        this._bindMobileButton('mbtnWeapon1', () => { if (this.onKeyDown) this.onKeyDown('Digit1', {}); this._updateWeaponBtnActive(1); }, null);
        this._bindMobileButton('mbtnWeapon2', () => { if (this.onKeyDown) this.onKeyDown('Digit2', {}); this._updateWeaponBtnActive(2); }, null);
        this._bindMobileButton('mbtnSupport', () => { if (this.onKeyDown) this.onKeyDown('KeyB', {}); }, null);
        this._bindMobileButton('mbtnScoreboard', () => { if (this.onKeyDown) this.onKeyDown('Tab', { preventDefault: () => {} }); }, () => { if (this.onKeyUp) this.onKeyUp('Tab', {}); });
        this._bindMobileButton('mbtnPause', () => { if (this.onKeyDown) this.onKeyDown('Escape', {}); }, null);
        this._bindMobileButton('mbtnVehicleView', () => { if (this.onKeyDown) this.onKeyDown('KeyV', {}); }, null);
        this._bindMobileButton('mbtnVehicleSeat', () => { if (this.onKeyDown) this.onKeyDown('KeyC', {}); }, null);
    }

    _updateJoystick(touch, thumb, baseRect, maxDist) {
        const cx = baseRect.left + baseRect.width / 2;
        const cy = baseRect.top + baseRect.height / 2;
        let dx = touch.clientX - cx;
        let dy = touch.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        const normX = dx / maxDist;
        const normY = dy / maxDist;
        const dead = 0.2;
        this._touchState.joystick.x = Math.abs(normX) > dead ? normX : 0;
        this._touchState.joystick.y = Math.abs(normY) > dead ? normY : 0;
    }

    _bindMobileButton(id, onStart, onEnd, isToggle = false) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const handleStart = (e) => {
            e.preventDefault();
            btn.classList.add('pressed');
            if (isToggle) btn.classList.toggle('active');
            if (onStart) onStart();
        };
        const handleEnd = (e) => {
            e.preventDefault();
            btn.classList.remove('pressed');
            if (!isToggle && onEnd) onEnd();
        };
        btn.addEventListener('touchstart', handleStart, { passive: false });
        btn.addEventListener('touchend', handleEnd, { passive: false });
        btn.addEventListener('touchcancel', handleEnd, { passive: false });
    }

    _updateWeaponBtnActive(num) {
        const btn1 = document.getElementById('mbtnWeapon1');
        const btn2 = document.getElementById('mbtnWeapon2');
        if (btn1) btn1.classList.toggle('active', num === 1);
        if (btn2) btn2.classList.toggle('active', num === 2);
    }

    // 合并触控视角增量到鼠标增量（每帧调用）
    flushTouchLookDelta() {
        const ts = this._touchState;
        this.mouse.deltaX += ts.lookDeltaX;
        this.mouse.deltaY += ts.lookDeltaY;
        ts.lookDeltaX = 0;
        ts.lookDeltaY = 0;
    }

    // 移动端显示/隐藏触控 UI
    showMobileControls(show) {
        const el = document.getElementById('mobileControls');
        if (!el) return;
        if (show && this.isMobile) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }
}
