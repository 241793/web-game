import * as THREE from 'three';

// 瞬态灯光池：场景中灯光数量固定不变，避免 Three.js 因灯光增删而重编译全部着色器。
// 所有枪口光/爆炸光通过 flash() 借用池中灯光，到期自动熄灭归还。
export class LightPool {
    constructor(scene, size = 6) {
        this.scene = scene;
        this.lights = [];
        for (let i = 0; i < size; i++) {
            const light = new THREE.PointLight(0xffffff, 0, 10);
            light.castShadow = false;
            scene.add(light);
            this.lights.push({
                light,
                life: 0,
                maxLife: 0,
                peak: 0,
            });
        }
    }

    // 触发一次闪光。duration 秒内从 intensity 衰减到 0。
    flash(position, color = 0xffaa44, intensity = 4, distance = 10, duration = 0.1) {
        // 找空闲灯；没有空闲则抢占剩余寿命最短的
        let slot = null;
        for (const s of this.lights) {
            if (s.life <= 0) { slot = s; break; }
        }
        if (!slot) {
            slot = this.lights[0];
            for (const s of this.lights) {
                if (s.life < slot.life) slot = s;
            }
            // 抢占只允许更亮的事件（爆炸顶掉枪口光，反之不行）
            if (slot.peak > intensity) return null;
        }
        slot.light.position.copy(position);
        slot.light.color.setHex(color);
        slot.light.distance = distance;
        slot.light.intensity = intensity;
        slot.peak = intensity;
        slot.life = duration;
        slot.maxLife = duration;
        return slot.light;
    }

    update(dt) {
        for (const s of this.lights) {
            if (s.life <= 0) continue;
            s.life -= dt;
            if (s.life <= 0) {
                s.light.intensity = 0;
                s.peak = 0;
            } else {
                s.light.intensity = s.peak * (s.life / s.maxLife);
            }
        }
    }

    dispose() {
        for (const s of this.lights) {
            this.scene.remove(s.light);
        }
        this.lights = [];
    }
}
