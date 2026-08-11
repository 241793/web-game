const DEFAULT_CATEGORY_LIMITS = {
    critical: 36,
    impact: 48,
    projectile: 32,
    smoke: 56,
    dust: 44,
    mark: 96,
    debris: 48,
    default: 48,
};

export class TransientFxManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.globalLimit = options.globalLimit || 220;
        this.categoryLimits = { ...DEFAULT_CATEGORY_LIMITS, ...(options.categoryLimits || {}) };
        this.effects = [];
        this._categoryCosts = new Map();
        this._totalCost = 0;
        this._nextId = 1;
        this._disposed = false;
        this._clearing = false;
        this._updating = false;
        this._resources = new Set();
        this._rejected = 0;
        this._evicted = 0;
    }

    add(options = {}) {
        if (this._disposed || this._clearing) {
            options.onReject?.();
            return null;
        }

        const requestedCategory = options.category || 'default';
        const category = Object.prototype.hasOwnProperty.call(this.categoryLimits, requestedCategory)
            ? requestedCategory
            : 'default';
        const effect = {
            id: this._nextId++,
            owner: options.owner || null,
            category,
            priority: options.priority ?? 1,
            cost: Math.max(1, options.cost || 1),
            delay: Math.max(0, options.delay || 0),
            life: Math.max(0, options.life ?? 1),
            maxLife: Math.max(0, options.life ?? 1),
            elapsed: 0,
            object: options.object || null,
            objects: options.objects || null,
            data: options.data || null,
            onActivate: options.onActivate || null,
            update: options.update || null,
            release: options.release || null,
            active: false,
            done: false,
        };

        if (!this._reserve(effect)) {
            this._rejected++;
            options.onReject?.();
            return null;
        }

        this.effects.push(effect);
        if (effect.delay <= 0) this._activate(effect);
        return effect;
    }

    own(resource) {
        if (resource?.dispose) this._resources.add(resource);
        return resource;
    }

    update(dt) {
        if (this._disposed || dt <= 0 || this.effects.length === 0) return;

        this._updating = true;
        const frameCount = this.effects.length;
        for (let i = 0; i < frameCount; i++) {
            const effect = this.effects[i];
            if (effect.done) continue;

            let step = dt;
            if (!effect.active) {
                effect.delay -= dt;
                if (effect.delay > 0) continue;
                step = Math.max(0, -effect.delay);
                this._activate(effect);
                if (effect.done) continue;
            }

            effect.elapsed += step;
            effect.life = Math.max(0, effect.maxLife - effect.elapsed);
            const progress = effect.maxLife > 0
                ? Math.min(1, effect.elapsed / effect.maxLife)
                : 1;

            if (effect.update?.(effect, step, progress) === false || effect.life <= 0) {
                this._finish(effect, 'complete');
            }
        }

        this._updating = false;
        this._compactEffects();
    }

    cancel(effect) {
        if (!effect || effect.done) return;
        this._finish(effect, 'cancel');
        if (!this._updating) this._compactEffects();
    }

    cancelOwner(owner) {
        if (!owner) return;
        for (const effect of this.effects) {
            if (!effect.done && effect.owner === owner) this._finish(effect, 'cancel');
        }
        if (!this._updating) this._compactEffects();
    }

    _compactEffects() {
        let write = 0;
        for (let read = 0; read < this.effects.length; read++) {
            const effect = this.effects[read];
            if (!effect.done) this.effects[write++] = effect;
        }
        this.effects.length = write;
    }

    clear() {
        this._clearing = true;
        for (const effect of this.effects) {
            if (!effect.done) this._finish(effect, 'clear');
        }
        this.effects.length = 0;
        this._clearing = false;
    }

    dispose() {
        if (this._disposed) return;
        this.clear();
        for (const resource of this._resources) resource.dispose();
        this._resources.clear();
        this._disposed = true;
        this.scene = null;
    }

    getStats() {
        const categories = {};
        for (const [category, cost] of this._categoryCosts) categories[category] = cost;
        let active = 0;
        let pending = 0;
        for (const effect of this.effects) {
            if (effect.done) continue;
            if (effect.active) active++;
            else pending++;
        }
        return {
            effects: active + pending,
            active,
            pending,
            cost: this._totalCost,
            limit: this.globalLimit,
            categories,
            rejected: this._rejected,
            evicted: this._evicted,
        };
    }

    _reserve(effect) {
        const categoryLimit = this.categoryLimits[effect.category] || this.categoryLimits.default;
        if (effect.cost > this.globalLimit || effect.cost > categoryLimit) return false;

        let categoryCost = this._categoryCosts.get(effect.category) || 0;
        if (this._totalCost + effect.cost <= this.globalLimit && categoryCost + effect.cost <= categoryLimit) {
            this._totalCost += effect.cost;
            this._categoryCosts.set(effect.category, categoryCost + effect.cost);
            return true;
        }

        const victims = new Set();
        while (categoryCost + effect.cost > categoryLimit) {
            const victim = this._findVictim(effect, victims, effect.category);
            if (!victim) return false;
            victims.add(victim);
            categoryCost -= victim.cost;
        }

        let totalCost = this._totalCost;
        for (const victim of victims) totalCost -= victim.cost;
        while (totalCost + effect.cost > this.globalLimit) {
            const victim = this._findVictim(effect, victims);
            if (!victim) return false;
            victims.add(victim);
            totalCost -= victim.cost;
        }

        for (const victim of victims) {
            this._evicted++;
            this._finish(victim, 'evict');
        }
        this._totalCost += effect.cost;
        this._categoryCosts.set(effect.category, (this._categoryCosts.get(effect.category) || 0) + effect.cost);
        return true;
    }

    _findVictim(incoming, excluded, category = null) {
        let victim = null;
        for (const effect of this.effects) {
            if (effect.done || excluded.has(effect) || effect.priority > incoming.priority) continue;
            if (category && effect.category !== category) continue;
            if (!victim || effect.priority < victim.priority ||
                (effect.priority === victim.priority && effect.id < victim.id)) {
                victim = effect;
            }
        }
        return victim;
    }

    _activate(effect) {
        if (effect.done || effect.active) return;
        effect.active = true;
        this._addObject(effect.object);
        if (effect.objects) {
            for (const object of effect.objects) this._addObject(object);
        }
        effect.onActivate?.(effect);
    }

    _addObject(object) {
        if (object?.isObject3D && !object.parent) this.scene?.add(object);
    }

    _finish(effect, reason) {
        if (effect.done) return;
        effect.done = true;

        this._removeObject(effect.object);
        if (effect.objects) {
            for (const object of effect.objects) this._removeObject(object);
        }

        effect.release?.(effect, reason);
        this._totalCost = Math.max(0, this._totalCost - effect.cost);
        const categoryCost = Math.max(0, (this._categoryCosts.get(effect.category) || 0) - effect.cost);
        if (categoryCost > 0) this._categoryCosts.set(effect.category, categoryCost);
        else this._categoryCosts.delete(effect.category);
    }

    _removeObject(object) {
        if (object?.parent) object.parent.remove(object);
    }
}
