// 游戏全局配置
export const CONFIG = {
    // 渲染
    RENDERER: {
        antialias: true,
        shadowMapEnabled: true,
        shadowMapSize: 1536,
        shadowDistance: 52,      // 阴影相机覆盖半径（跟随玩家）
        toneMappingExposure: 1.45,
        maxFPS: 60,
    },

    // 世界
    WORLD: {
        size: 400,           // 地图尺寸
        fogColor: 0x8899aa,
        fogNear: 55,
        fogFar: 340,
        skyColor: 0x87a8c8,
        groundColor: 0x6b7a5a,
        sunColor: 0xffffff,
        sunIntensity: 2.8,
    },

    // 玩家
    PLAYER: {
        height: 1.7,
        crouchHeight: 1.1,
        proneHeight: 0.65,
        radius: 0.4,
        walkSpeed: 5.0,
        sprintSpeed: 8.5,
        crouchSpeed: 2.5,
        proneSpeed: 1.2,
        jumpForce: 7.0,
        gravity: 25.0,
        maxHealth: 100,
        maxArmor: 100,
        respawnTime: 5,
        // 体力系统
        maxStamina: 100,
        staminaDrainRate: 25,     // 冲刺每秒消耗
        staminaRegenRate: 15,    // 每秒恢复
        staminaRegenDelay: 2.0,  // 消耗后恢复延迟（秒）
        minSprintStamina: 10,    // 低于此值不能冲刺
        // 侧身
        leanAngle: 0.35,         // 最大侧身角度(弧度)
        leanSpeed: 6.0,          // 侧身速度
        // 重生保护
        spawnProtectionTime: 2.0, // 无敌时间(秒)
        // 冲刺到射击过渡
        // 设为 0：冲刺结束后可立即开枪（开枪无限制）
        sprintToFireDelay: 0,
        // 冲刺时 FOV 加宽量（战地风格的速度感）
        sprintFovBoost: 8,
        // 倒地/复活
        bleedOutTime: 30,           // 倒地流血时间(秒)
        downedReviveHealth: 45,     // 被复活后血量
        skipHoldTime: 1.5,          // 长按空格跳过所需时间
        skipBleedOutAccelerate: 3,  // 长按空格时bleedOut加速倍率
    },

    // 武器
    WEAPONS: {
        // === 突击步枪 ===
        M416: {
            name: 'M416',
            type: 'rifle',
            damage: 25,            // BF4: 25最高伤害
            minDamage: 18,         // 远距离最低伤害
            fireRate: 750,         // 高射速
            magSize: 30,
            reserveAmmo: 150,
            reloadTime: 2.1,
            range: 300,
            falloffStart: 50,      // 伤害衰减起点
            falloffEnd: 300,       // 伤害衰减终点
            spread: 0.010,         // 基础精度高
            spreadMove: 0.025,     // 移动扩散
            spreadAds: 0.003,      // 瞄准扩散
            recoil: { x: 0.004, y: 0.010, recovery: 8, pattern: 'linear' },
            recoilVRecover: 9,     // 垂直后坐力恢复速度
            recoilHRecover: 6,     // 水平后坐力恢复速度
            auto: true,
            zoom: 1.3,
            bulletSpeed: 880,
            bulletDrop: 9.8,       // 弹道下坠
            tracerColor: 0xffdd44,
            adsTime: 0.25,         // 瞄准过渡时间
            bulletSpreadRecover: 4,// 扩散恢复速度
            soundType: 'rifle_light',
            fireModes: ['auto', 'semi'],
        },
        AK12: {
            name: 'AK-12',
            type: 'rifle',
            damage: 30,            // BF4: 高伤害
            minDamage: 20,
            fireRate: 650,         // 较低射速但高伤害
            magSize: 30,
            reserveAmmo: 150,
            reloadTime: 2.4,
            range: 320,
            falloffStart: 40,
            falloffEnd: 320,
            spread: 0.012,
            spreadMove: 0.030,
            spreadAds: 0.004,
            recoil: { x: 0.006, y: 0.014, recovery: 7, pattern: 'climb' },
            recoilVRecover: 7,
            recoilHRecover: 5,
            auto: true,
            zoom: 1.3,
            bulletSpeed: 850,
            bulletDrop: 9.8,
            tracerColor: 0xffdd44,
            adsTime: 0.28,
            bulletSpreadRecover: 3.5,
            soundType: 'lmg',
            fireModes: ['auto', 'semi'],
            penetration: 0.10,      // 7.62x39mm 口径，穿透力强于标准5.56mm步枪
            headshotMultiplier: 2.1, // 高伤害步枪爆头加成
        },
        SCAR_H: {
            name: 'SCAR-H',
            type: 'rifle',
            damage: 34,            // BF4: 最高伤害步枪
            minDamage: 22,
            fireRate: 600,
            magSize: 20,           // 弹匣小
            reserveAmmo: 100,
            reloadTime: 2.5,
            range: 350,
            falloffStart: 60,      // 远距离保持高伤害
            falloffEnd: 350,
            spread: 0.008,         // 精度高
            spreadMove: 0.022,
            spreadAds: 0.002,
            recoil: { x: 0.007, y: 0.016, recovery: 6, pattern: 'climb' },
            recoilVRecover: 6,
            recoilHRecover: 4,
            auto: true,
            zoom: 1.4,
            bulletSpeed: 900,
            bulletDrop: 9.8,
            tracerColor: 0xffdd44,
            adsTime: 0.30,
            bulletSpreadRecover: 3,
            soundType: 'dmr',
            fireModes: ['auto', 'semi'],
            penetration: 0.10,      // 7.62mm 口径，穿透力强于标准步枪
            headshotMultiplier: 2.2, // 高伤害步枪爆头加成
        },
        // === 冲锋枪 ===
        MP5: {
            name: 'MP5',
            type: 'smg',
            damage: 16,            // BF4: 近距离高DPS
            minDamage: 10,
            fireRate: 800,         // 高射速
            magSize: 30,
            reserveAmmo: 150,
            reloadTime: 2.0,
            range: 150,
            falloffStart: 20,      // 衰减很快
            falloffEnd: 150,
            spread: 0.018,
            spreadMove: 0.030,
            spreadAds: 0.008,
            recoil: { x: 0.002, y: 0.006, recovery: 10, pattern: 'tight' },
            recoilVRecover: 11,
            recoilHRecover: 8,
            auto: true,
            zoom: 1.2,
            bulletSpeed: 600,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.20,
            bulletSpreadRecover: 5,
            soundType: 'smg',
            fireModes: ['auto', 'semi'],
        },
        UMP45: {
            name: 'UMP-45',
            type: 'smg',
            damage: 22,            // .45口径高伤害
            minDamage: 12,
            fireRate: 600,
            magSize: 25,
            reserveAmmo: 125,
            reloadTime: 2.2,
            range: 160,
            falloffStart: 25,
            falloffEnd: 160,
            spread: 0.016,
            spreadMove: 0.028,
            spreadAds: 0.006,
            recoil: { x: 0.003, y: 0.008, recovery: 9, pattern: 'tight' },
            recoilVRecover: 10,
            recoilHRecover: 7,
            auto: true,
            zoom: 1.2,
            bulletSpeed: 620,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.22,
            bulletSpreadRecover: 4.5,
            soundType: 'smg',
            fireModes: ['auto', 'semi'],
            penetration: 0.06,      // .45 ACP 口径，穿透力强于9mm冲锋枪
            headshotMultiplier: 1.8, // 大口径冲锋枪爆头加成
        },
        // === 霰弹枪 ===
        M870: {
            name: 'M870',
            type: 'shotgun',
            damage: 15,            // 每颗弹丸
            pellets: 8,
            fireRate: 80,
            magSize: 7,
            reserveAmmo: 35,
            reloadTime: 3.5,
            range: 50,
            falloffStart: 15,
            falloffEnd: 50,
            spread: 0.06,          // 散布大
            spreadMove: 0.08,
            spreadAds: 0.04,       // 瞄准收束
            recoil: { x: 0.015, y: 0.038, recovery: 5, pattern: 'kick' },
            recoilVRecover: 5,
            recoilHRecover: 3,
            auto: false,
            zoom: 1.1,
            bulletSpeed: 500,
            bulletDrop: 15,
            tracerColor: 0xffaa00,
            adsTime: 0.15,
            bulletSpreadRecover: 2,
            soundType: 'shotgun',
            pumpAction: true,      // 泵动动画
            penetration: 0.02,      // 霰弹穿透力极弱
            headshotMultiplier: 1.5, // 多弹丸已具高伤害，爆头加成低
            fireModes: ['semi'],
        },
        // === 狙击步枪 ===
        L96: {
            name: 'L96',
            type: 'sniper',
            damage: 95,            // BF4: 一枪爆头
            minDamage: 60,
            fireRate: 45,
            magSize: 5,
            reserveAmmo: 25,
            reloadTime: 3.0,
            range: 500,
            falloffStart: 100,     // 远距离不衰减
            falloffEnd: 500,
            spread: 0.0005,        // 极高精度
            spreadMove: 0.015,     // 移动时几乎打不准
            spreadAds: 0.0002,
            recoil: { x: 0.003, y: 0.038, recovery: 4, pattern: 'sniper' },
            recoilVRecover: 4,
            recoilHRecover: 3,
            auto: false,
            zoom: 8.0,             // 高倍镜
            bulletSpeed: 1200,
            bulletDrop: 6,         // 低弹道下坠
            tracerColor: 0xff4400,
            adsTime: 0.40,
            bulletSpreadRecover: 1,
            soundType: 'sniper',
            holdBreath: true,      // 可屏息
            penetration: 0.20,      // 高口径狙击弹，穿透力极强
            headshotMultiplier: 2.5, // 一枪爆头
            fireModes: ['semi'],
        },
        M40A5: {
            name: 'M40A5',
            type: 'sniper',
            damage: 85,
            minDamage: 55,
            fireRate: 55,          // 栓动略快
            magSize: 10,
            reserveAmmo: 40,
            reloadTime: 2.8,
            range: 480,
            falloffStart: 100,
            falloffEnd: 480,
            spread: 0.001,
            spreadMove: 0.016,
            spreadAds: 0.0003,
            recoil: { x: 0.003, y: 0.033, recovery: 4.5, pattern: 'sniper' },
            recoilVRecover: 4.5,
            recoilHRecover: 3.5,
            auto: false,
            zoom: 6.0,
            bulletSpeed: 1150,
            bulletDrop: 7,
            tracerColor: 0xff4400,
            adsTime: 0.38,
            bulletSpreadRecover: 1.5,
            soundType: 'sniper',
            holdBreath: true,
            penetration: 0.18,      // 栓动狙击枪穿透力强
            headshotMultiplier: 2.4, // 高爆头加成
            fireModes: ['semi'],
        },
        // === 轻机枪 (LMG) ===
        M249: {
            name: 'M249',
            type: 'lmg',
            damage: 26,            // BF4: 中等伤害
            minDamage: 16,
            fireRate: 800,         // 高射速
            magSize: 100,          // 大弹匣
            reserveAmmo: 200,
            reloadTime: 5.5,       // 长换弹时间
            range: 280,
            falloffStart: 40,
            falloffEnd: 280,
            spread: 0.020,         // 基础散布大
            spreadMove: 0.040,     // 移动扩散严重
            spreadAds: 0.008,      // 瞄准改善
            recoil: { x: 0.003, y: 0.008, recovery: 7, pattern: 'linear' },
            recoilVRecover: 8,
            recoilHRecover: 5,
            auto: true,
            zoom: 1.2,
            bulletSpeed: 850,
            bulletDrop: 9.8,
            tracerColor: 0xffdd44,
            adsTime: 0.35,         // 瞄准慢
            bulletSpreadRecover: 2.5,
            soundType: 'rifle_heavy',
            bipodBonus: true,      // 可架设双脚架
            suppressive: true,     // 压制效果增强
            fireModes: ['auto'],
        },
        // === 精准射手步枪 (DMR) ===
        SKS: {
            name: 'SKS',
            type: 'dmr',
            damage: 40,            // BF4: 中高伤害
            minDamage: 25,
            fireRate: 330,         // 半自动
            magSize: 20,
            reserveAmmo: 80,
            reloadTime: 2.6,
            range: 380,
            falloffStart: 60,
            falloffEnd: 380,
            spread: 0.005,         // 精度高
            spreadMove: 0.020,
            spreadAds: 0.001,
            recoil: { x: 0.003, y: 0.012, recovery: 6, pattern: 'climb' },
            recoilVRecover: 6,
            recoilHRecover: 4,
            auto: false,
            zoom: 3.5,
            bulletSpeed: 950,
            bulletDrop: 8,
            tracerColor: 0xffdd44,
            adsTime: 0.22,
            bulletSpreadRecover: 3,
            soundType: 'rifle_heavy',
            fireModes: ['semi'],
            penetration: 0.14,      // 7.62mm 口径，穿透力强
            headshotMultiplier: 2.3, // 精准射手步枪爆头加成
        },
        // === 手枪 ===
        P226: {
            name: 'P226',
            type: 'pistol',
            damage: 22,
            minDamage: 15,
            fireRate: 350,
            magSize: 12,
            reserveAmmo: 48,
            reloadTime: 1.5,
            range: 80,
            falloffStart: 30,
            falloffEnd: 80,
            spread: 0.014,
            spreadMove: 0.025,
            spreadAds: 0.008,
            recoil: { x: 0.002, y: 0.007, recovery: 10, pattern: 'tight' },
            recoilVRecover: 10,
            recoilHRecover: 8,
            auto: false,
            zoom: 1.1,
            bulletSpeed: 500,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.15,
            bulletSpreadRecover: 5,
            soundType: 'pistol',
            fireModes: ['semi'],
        },
        MP443: {
            name: 'MP443',
            type: 'pistol',
            damage: 20,
            minDamage: 13,
            fireRate: 400,         // 俄式手枪射速略快
            magSize: 17,
            reserveAmmo: 68,
            reloadTime: 1.4,
            range: 80,
            falloffStart: 30,
            falloffEnd: 80,
            spread: 0.016,
            spreadMove: 0.028,
            spreadAds: 0.010,
            recoil: { x: 0.002, y: 0.006, recovery: 11, pattern: 'tight' },
            recoilVRecover: 11,
            recoilHRecover: 9,
            auto: false,
            zoom: 1.1,
            bulletSpeed: 510,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.14,
            bulletSpreadRecover: 5.5,
            soundType: 'pistol',
            fireModes: ['semi'],
        },
        // === 火箭筒 ===
        RPG: {
            name: 'RPG-7',
            type: 'rocket',
            damage: 150,
            fireRate: 30,
            magSize: 1,
            reserveAmmo: 3,
            reloadTime: 4.0,
            range: 200,
            spread: 0.003,
            recoil: { x: 0.008, y: 0.028, recovery: 3, pattern: 'kick' },
            recoilVRecover: 3,
            recoilHRecover: 2,
            auto: false,
            zoom: 1.5,
            bulletSpeed: 150,
            tracerColor: 0xff0000,
            explosive: true,
            explosionRadius: 11,
            soundType: 'rocket',
            bulletDrop: 5,
            fireModes: ['semi'],
        },
        SMAW: {
            name: 'SMAW',
            type: 'rocket',
            damage: 180,
            fireRate: 25,
            magSize: 1,
            reserveAmmo: 2,
            reloadTime: 4.5,
            range: 250,
            spread: 0.002,
            recoil: { x: 0.010, y: 0.032, recovery: 3, pattern: 'kick' },
            recoilVRecover: 2.5,
            recoilHRecover: 2,
            auto: false,
            zoom: 1.6,
            bulletSpeed: 180,
            tracerColor: 0xff0000,
            explosive: true,
            explosionRadius: 13,
            soundType: 'rocket',
            bulletDrop: 4,
            fireModes: ['semi'],
        },
        // === 二战武器 ===
        STG44: {
            name: 'StG 44',
            type: 'rifle',
            damage: 28,
            minDamage: 20,
            fireRate: 600,
            magSize: 30,
            reserveAmmo: 120,
            reloadTime: 2.5,
            range: 300,
            falloffStart: 45,
            falloffEnd: 300,
            spread: 0.011,
            spreadMove: 0.028,
            spreadAds: 0.004,
            recoil: { x: 0.005, y: 0.013, recovery: 6.5, pattern: 'climb' },
            recoilVRecover: 6.5,
            recoilHRecover: 5,
            auto: true,
            zoom: 1.3,
            bulletSpeed: 740,
            bulletDrop: 9.8,
            tracerColor: 0xffdd44,
            adsTime: 0.28,
            bulletSpreadRecover: 3.5,
            soundType: 'rifle_heavy',
            fireModes: ['auto', 'semi'],
            penetration: 0.09,
            headshotMultiplier: 2.0,
        },
        Thompson: {
            name: 'Thompson',
            type: 'smg',
            damage: 20,
            minDamage: 12,
            fireRate: 700,
            magSize: 30,
            reserveAmmo: 120,
            reloadTime: 2.3,
            range: 150,
            falloffStart: 22,
            falloffEnd: 150,
            spread: 0.017,
            spreadMove: 0.030,
            spreadAds: 0.007,
            recoil: { x: 0.003, y: 0.008, recovery: 9, pattern: 'tight' },
            recoilVRecover: 9.5,
            recoilHRecover: 7,
            auto: true,
            zoom: 1.2,
            bulletSpeed: 580,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.22,
            bulletSpreadRecover: 4.5,
            soundType: 'smg',
            fireModes: ['auto', 'semi'],
            penetration: 0.06,
            headshotMultiplier: 1.8,
        },
        Kar98k: {
            name: 'Kar98k',
            type: 'sniper',
            damage: 90,
            minDamage: 60,
            fireRate: 40,
            magSize: 5,
            reserveAmmo: 25,
            reloadTime: 3.2,
            range: 500,
            falloffStart: 100,
            falloffEnd: 500,
            spread: 0.0006,
            spreadMove: 0.016,
            spreadAds: 0.0002,
            recoil: { x: 0.004, y: 0.040, recovery: 3.5, pattern: 'sniper' },
            recoilVRecover: 3.5,
            recoilHRecover: 3,
            auto: false,
            zoom: 7.0,
            bulletSpeed: 1100,
            bulletDrop: 6.5,
            tracerColor: 0xff4400,
            adsTime: 0.42,
            bulletSpreadRecover: 1,
            soundType: 'sniper',
            holdBreath: true,
            penetration: 0.19,
            headshotMultiplier: 2.5,
            fireModes: ['semi'],
        },
        MG42: {
            name: 'MG 42',
            type: 'lmg',
            damage: 24,
            minDamage: 15,
            fireRate: 1200,        // 极高射速"希特勒的电锯"
            magSize: 50,
            reserveAmmo: 150,
            reloadTime: 6.0,
            range: 300,
            falloffStart: 45,
            falloffEnd: 300,
            spread: 0.022,
            spreadMove: 0.045,
            spreadAds: 0.009,
            recoil: { x: 0.004, y: 0.010, recovery: 6, pattern: 'linear' },
            recoilVRecover: 7,
            recoilHRecover: 4,
            auto: true,
            zoom: 1.2,
            bulletSpeed: 820,
            bulletDrop: 9.8,
            tracerColor: 0xffdd44,
            adsTime: 0.38,
            bulletSpreadRecover: 2,
            soundType: 'rifle_heavy',
            bipodBonus: true,
            suppressive: true,
            fireModes: ['auto'],
        },
        M1Garand: {
            name: 'M1 Garand',
            type: 'dmr',
            damage: 45,
            minDamage: 28,
            fireRate: 300,
            magSize: 8,              // 经典8发弹夹
            reserveAmmo: 48,
            reloadTime: 2.8,
            range: 400,
            falloffStart: 65,
            falloffEnd: 400,
            spread: 0.005,
            spreadMove: 0.021,
            spreadAds: 0.001,
            recoil: { x: 0.004, y: 0.014, recovery: 5.5, pattern: 'climb' },
            recoilVRecover: 5.5,
            recoilHRecover: 4,
            auto: false,
            zoom: 3.0,
            bulletSpeed: 930,
            bulletDrop: 8,
            tracerColor: 0xffdd44,
            adsTime: 0.24,
            bulletSpreadRecover: 3,
            soundType: 'rifle_heavy',
            fireModes: ['semi'],
            penetration: 0.13,
            headshotMultiplier: 2.3,
        },
        BAR: {
            name: 'BAR M1918',
            type: 'lmg',
            damage: 32,
            minDamage: 22,
            fireRate: 550,           // 较低射速但高伤害
            magSize: 20,
            reserveAmmo: 100,
            reloadTime: 3.2,
            range: 320,
            falloffStart: 50,
            falloffEnd: 320,
            spread: 0.014,
            spreadMove: 0.032,
            spreadAds: 0.005,
            recoil: { x: 0.005, y: 0.012, recovery: 6, pattern: 'climb' },
            recoilVRecover: 6.5,
            recoilHRecover: 4.5,
            auto: true,
            zoom: 1.3,
            bulletSpeed: 860,
            bulletDrop: 9.5,
            tracerColor: 0xffdd44,
            adsTime: 0.30,
            bulletSpreadRecover: 3,
            soundType: 'rifle_heavy',
            bipodBonus: true,
            fireModes: ['auto', 'semi'],
        },
        M1911: {
            name: 'M1911',
            type: 'pistol',
            damage: 28,               // .45 ACP 高伤害
            minDamage: 18,
            fireRate: 300,
            magSize: 7,
            reserveAmmo: 35,
            reloadTime: 1.6,
            range: 80,
            falloffStart: 28,
            falloffEnd: 80,
            spread: 0.013,
            spreadMove: 0.024,
            spreadAds: 0.007,
            recoil: { x: 0.003, y: 0.009, recovery: 9, pattern: 'tight' },
            recoilVRecover: 9,
            recoilHRecover: 7,
            auto: false,
            zoom: 1.1,
            bulletSpeed: 510,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.15,
            bulletSpreadRecover: 5,
            soundType: 'pistol',
            fireModes: ['semi'],
            penetration: 0.05,
            headshotMultiplier: 1.6,
        },
        P08: {
            name: 'Luger P08',
            type: 'pistol',
            damage: 22,
            minDamage: 14,
            fireRate: 380,
            magSize: 8,
            reserveAmmo: 40,
            reloadTime: 1.7,
            range: 75,
            falloffStart: 28,
            falloffEnd: 75,
            spread: 0.015,
            spreadMove: 0.026,
            spreadAds: 0.009,
            recoil: { x: 0.002, y: 0.007, recovery: 10, pattern: 'tight' },
            recoilVRecover: 10,
            recoilHRecover: 8,
            auto: false,
            zoom: 1.1,
            bulletSpeed: 500,
            bulletDrop: 12,
            tracerColor: 0xffdd44,
            adsTime: 0.14,
            bulletSpreadRecover: 5,
            soundType: 'pistol',
            fireModes: ['semi'],
        },
        Panzerschreck: {
            name: 'Panzerschreck',
            type: 'rocket',
            damage: 200,
            fireRate: 22,
            magSize: 1,
            reserveAmmo: 2,
            reloadTime: 4.8,
            range: 260,
            spread: 0.002,
            recoil: { x: 0.012, y: 0.035, recovery: 2.5, pattern: 'kick' },
            recoilVRecover: 2.5,
            recoilHRecover: 2,
            auto: false,
            zoom: 1.7,
            bulletSpeed: 160,
            tracerColor: 0xff0000,
            explosive: true,
            explosionRadius: 14,
            soundType: 'rocket',
            bulletDrop: 4.5,
            fireModes: ['semi'],
        },
    },

    // 兵种
    CLASSES: {
        assault: {
            name: '突击兵',
            primary: 'M416',
            secondary: 'P226',
            gadget: 'ammobag',
            maxHealth: 110,
            maxArmor: 100,
            // 突击兵被动：冲刺体力消耗降低
            staminaDiscount: 0.3,
            // 可选武器
            weaponOptions: ['M416', 'AK12', 'SCAR_H', 'M249', 'STG44'],
        },
        medic: {
            name: '医疗兵',
            primary: 'MP5',
            secondary: 'P226',
            gadget: 'medbag',
            maxHealth: 100,
            maxArmor: 100,
            // 医疗兵被动：血量低于50%时自动回血
            autoRegen: true,
            // 可选武器
            weaponOptions: ['MP5', 'UMP45', 'M416', 'Thompson'],
        },
        engineer: {
            name: '工程兵',
            primary: 'M870',
            secondary: 'RPG',
            gadget: 'repairtool',
            maxHealth: 120,
            maxArmor: 120,
            // 工程兵被动：对载具伤害加成
            vehicleDamageBonus: 0.3,
            // 可选武器
            weaponOptions: ['M870', 'UMP45', 'AK12', 'BAR', 'Panzerschreck'],
        },
        sniper: {
            name: '狙击手',
            primary: 'L96',
            secondary: 'MP443',
            gadget: 'sensor',
            maxHealth: 90,
            maxArmor: 80,
            // 狙击手被动：屏息时间更长
            holdBreathBonus: 2.0,
            // 可选武器
            weaponOptions: ['L96', 'M40A5', 'SKS', 'Kar98k', 'M1Garand'],
        },
    },

    // 兵种技能/装备
    GADGETS: {
        ammobag: {
            name: '弹药包',
            cooldown: 15,
            duration: 10,
            radius: 5,
            type: 'deployable',
            effect: 'ammo',
        },
        medbag: {
            name: '医疗包',
            cooldown: 20,
            duration: 10,
            radius: 5,
            type: 'deployable',
            effect: 'heal',
        },
        repairtool: {
            name: '维修工具',
            cooldown: 0,
            duration: 0,
            radius: 4,
            type: 'passive',
            effect: 'repair',
        },
        sensor: {
            name: '运动传感器',
            cooldown: 25,
            duration: 12,
            radius: 30,
            type: 'deployable',
            effect: 'spot',
        },
    },

    // AI
    AI: {
        count: 10,             // 每队AI数量（Bot 内置三级距离 LOD，10/队=20总）
        reactionTime: 0.45,
        accuracy: 0.45,
        fov: Math.PI * 0.6,
        sightRange: 75,
        fireRange: 60,
        moveSpeed: 4.2,
        health: 100,
        respawnTime: 3.5,         // 彻底死亡后重生等待（秒）
        // 小队系统
        squadSize: 4,           // 每个小队人数
        squadFollowRange: 15,   // 跟随队长的距离
        // 医疗兵
        medicHealRange: 5,      // 近距离治疗范围
        medicHealAmount: 40,    // 治疗量
        medicHealCooldown: 6,   // 治疗冷却
        medicReviveSeekRange: 45, // 医疗兵主动寻找倒地队友的距离
        // 手雷
        grenadeRange: 30,       // 投掷距离
        grenadeCooldown: 15,    // 投掷冷却
        // 压制
        suppressionRange: 3,    // 子弹在此范围内产生压制
        suppressionAmount: 0.06, // 每发子弹增加的压制值（降低避免过度模糊）
        // 倒地
        botBleedOutTime: 6,     // AI倒地流血时间（秒）；过长会让战场"没人复活"
    },

    // 载具
    VEHICLES: {
        // 乘员伤害保护参数（全局）
        _crewDamageOverflow: 0.15,          // 载具吸收后溢出给乘员的比例
        _explosionCrewDamageIfAlive: 0.25,  // 爆炸对载具内存活乘员的伤害比例
        // 弹药自动恢复参数（战地风格：停火后缓慢补弹）
        _ammoRegenDelay: 5.0,               // 停止射击后多少秒开始恢复弹药
        _ammoRegenRate: 3.0,                // 每秒恢复弹药数（主炮/副武器共用）
        jeep: {
            name: '战术吉普车',
            maxHealth: 300,
            maxSpeed: 10,
            acceleration: 5.5,
            brakeForce: 12,
            turnSpeed: 1.25,
            seats: 3,
            hasWeapon: false,
            // 物理特性
            grip: 0.88,           // 抓地力（越低越容易漂移）
            driftFactor: 0.35,    // 漂移倾向
            mass: 1.0,            // 质量（影响碰撞）
            enginePitch: 1.2,     // 引擎音调倍率
            engineType: 'wheeled',// 引擎类型
            explosionRadius: 10,
            explosionDamage: 140,
            // 装甲（值=伤害倍率，越低越硬）
            armor: { front: 0.55, side: 0.75, rear: 0.9, top: 0.85 },
        },
        armedjeep: {
            name: '武装吉普',
            modelType: 'jeep',        // 复用吉普车体 + 车顶机枪塔
            maxHealth: 320,
            maxSpeed: 9.5,
            acceleration: 5.2,
            brakeForce: 12,
            turnSpeed: 1.2,
            seats: 3,
            hasWeapon: true,
            cannonDamage: 20,         // 车载重机枪
            cannonRange: 180,
            cannonCooldown: 0.09,
            cannonAmmo: 500,
            grip: 0.88,
            driftFactor: 0.32,
            mass: 1.1,
            enginePitch: 1.15,
            engineType: 'wheeled',
            explosionRadius: 10,
            explosionDamage: 150,
            armor: { front: 0.55, side: 0.75, rear: 0.9, top: 0.85 },
        },
        tank: {
            name: '主战坦克',
            maxHealth: 800,
            maxSpeed: 6,
            acceleration: 3,
            brakeForce: 8,
            turnSpeed: 0.55,
            seats: 2,
            hasWeapon: true,
            cannonDamage: 200,
            cannonRange: 300,
            cannonCooldown: 3.0,
            cannonAmmo: 20,           // 主炮弹药存量
            secondaryDamage: 18,
            secondaryRange: 180,
            secondaryCooldown: 0.08,
            secondaryAmmo: 600,       // 副武器（同轴机枪）弹药
            // 物理特性
            grip: 0.98,           // 履带高抓地
            driftFactor: 0.05,
            mass: 3.0,            // 重型
            enginePitch: 0.5,
            engineType: 'tracked',
            explosionRadius: 14,
            explosionDamage: 220,
            // 装甲（坦克最硬，正面几乎免疫小口径）
            armor: { front: 0.12, side: 0.40, rear: 0.65, top: 0.55 },
        },
        apc: {
            name: '装甲运兵车',
            maxHealth: 500,
            maxSpeed: 8,
            acceleration: 4.5,
            brakeForce: 10,
            turnSpeed: 0.8,
            seats: 4,
            hasWeapon: true,
            cannonDamage: 40,
            cannonRange: 200,
            cannonCooldown: 0.2,
            cannonAmmo: 400,          // 机炮弹药（射速快，弹药多）
            // 物理特性
            grip: 0.92,
            driftFactor: 0.2,
            mass: 2.0,
            enginePitch: 0.8,
            engineType: 'wheeled',
            explosionRadius: 12,
            explosionDamage: 180,
            // 装甲
            armor: { front: 0.30, side: 0.55, rear: 0.80, top: 0.70 },
        },
        heli: {
            name: '武装直升机',
            maxHealth: 400,
            maxSpeed: 12,
            acceleration: 3,
            brakeForce: 6,
            turnSpeed: 0.55,
            seats: 2,
            hasWeapon: true,
            cannonDamage: 60,
            cannonRange: 250,
            cannonCooldown: 0.15,
            cannonAmmo: 500,          // 机炮弹药（驾驶员）
            secondaryDamage: 25,      // 门机枪伤害（乘员位）
            secondaryRange: 200,
            secondaryCooldown: 0.08,  // 高射速机枪
            secondaryAmmo: 500,       // 门机枪弹药
            isAircraft: true,
            maxAltitude: 50,
            climbSpeed: 8,
            // 物理特性
            grip: 0.5,
            driftFactor: 0.0,
            mass: 0.8,
            enginePitch: 1.5,
            engineType: 'rotary',
            explosionRadius: 20,
            explosionDamage: 200,
            // 装甲
            armor: { front: 0.55, side: 0.70, rear: 0.85, top: 0.80 },
        },
        plane: {
            name: '攻击机',
            maxHealth: 350,
            maxSpeed: 22,             // 固定翼比直升机快
            acceleration: 4.5,
            brakeForce: 4,
            turnSpeed: 0.7,
            seats: 1,
            hasWeapon: true,
            cannonDamage: 30,         // 机头机枪
            cannonRange: 300,
            cannonCooldown: 0.1,
            cannonAmmo: 600,
            isAircraft: true,
            isPlane: true,            // 固定翼标记：需要前进速度维持升力
            maxAltitude: 70,
            climbSpeed: 9,
            grip: 0.5,
            driftFactor: 0.0,
            mass: 1.2,
            enginePitch: 1.7,
            engineType: 'rotary',
            explosionRadius: 22,
            explosionDamage: 200,
            armor: { front: 0.5, side: 0.7, rear: 0.8, top: 0.75 },
        },
        // === 二战载具 ===
        sherman: {
            name: '谢尔曼坦克',
            modelType: 'tank',        // 复用坦克模型
            maxHealth: 700,
            maxSpeed: 5.5,
            acceleration: 2.8,
            brakeForce: 7,
            turnSpeed: 0.5,
            seats: 2,
            hasWeapon: true,
            cannonDamage: 180,
            cannonRange: 280,
            cannonCooldown: 3.5,
            cannonAmmo: 18,
            secondaryDamage: 16,
            secondaryRange: 170,
            secondaryCooldown: 0.09,
            secondaryAmmo: 550,
            grip: 0.98,
            driftFactor: 0.05,
            mass: 2.8,
            enginePitch: 0.55,
            engineType: 'tracked',
            explosionRadius: 14,
            explosionDamage: 200,
            armor: { front: 0.18, side: 0.45, rear: 0.68, top: 0.58 },
        },
        tiger: {
            name: '虎式坦克',
            modelType: 'tank',        // 复用坦克模型
            maxHealth: 1000,          // 重装甲
            maxSpeed: 4.5,
            acceleration: 2.2,
            brakeForce: 6,
            turnSpeed: 0.42,
            seats: 2,
            hasWeapon: true,
            cannonDamage: 250,        // 88mm 主炮高伤害
            cannonRange: 320,
            cannonCooldown: 4.0,
            cannonAmmo: 15,
            secondaryDamage: 18,
            secondaryRange: 180,
            secondaryCooldown: 0.09,
            secondaryAmmo: 600,
            grip: 0.99,
            driftFactor: 0.03,
            mass: 3.5,               // 极重
            enginePitch: 0.42,
            engineType: 'tracked',
            explosionRadius: 16,
            explosionDamage: 250,
            armor: { front: 0.08, side: 0.32, rear: 0.55, top: 0.48 },  // 极厚装甲
        },
        kubelwagen: {
            name: '桶车',
            modelType: 'jeep',        // 复用吉普模型
            maxHealth: 280,
            maxSpeed: 11,
            acceleration: 5.8,
            brakeForce: 12,
            turnSpeed: 1.3,
            seats: 3,
            hasWeapon: false,
            grip: 0.88,
            driftFactor: 0.35,
            mass: 0.9,
            enginePitch: 1.25,
            engineType: 'wheeled',
            explosionRadius: 10,
            explosionDamage: 130,
            armor: { front: 0.58, side: 0.78, rear: 0.92, top: 0.87 },
        },
    },

    // 游戏
    GAME: {
        teamScoreLimit: 1000,
        matchDuration: 900,     // 15分钟 (秒)
        capturePointTime: 12,    // 占领时间
        capturePointPoints: 1,  // 每秒得分
        capturePointBonus: 10,  // 占领完成奖励
        // 征服模式票数系统
        ticketBleedRate: 0.8,   // 据点优势造成的每秒票数消耗
        startingTickets: 400,   // 初始票数
        deathTicketCost: 1,     // 每次死亡扣除票数
        assistScore: 5,         // 助攻得分
        assistMinDamage: 35,    // 触发助攻所需最低贡献伤害
        assistWindow: 12,       // 最后一次造成伤害后可获得助攻的秒数
        orderInterval: 35,      // 指挥命令刷新间隔
        orderCompleteBonus: 15, // 完成命令奖励
        vehicleRespawnTime: 35, // 载具被毁后重生时间
        aiVehicleStartDelay: 25,
        aiVehicleMaxPerTeam: 2,
        spotDuration: 8,
        spotCooldown: 3,
        spawnSafetyRadius: 20,
        reviveRange: 3.0,
        reviveHealth: 45,
        reviveScore: 30,
        squadReviveScore: 30,
        supplyScore: 2,
        healScore: 2,
        repairScore: 5,
        spotAssistScore: 10,
    },

    // 游戏模式
    GAME_MODES: {
        conquest: {
            id: 'conquest',
            name: '征服',
            description: '占领据点并消耗敌方票数',
            startingTickets: 400,
            ticketBleedRate: 0.8,
            capturePointPoints: 1,
            capturePointBonus: 10,
            deathTicketCost: 1,
            matchDuration: 900,
            teamScoreLimit: 1000,
            supportsStrategicObjectives: true,
            enabledMaps: ['default', 'ardennes', 'normandy', 'iwojima'],
        },
        attrition: {
            id: 'attrition',
            name: '消耗战',
            description: '纯粹击杀消耗敌方票数，无据点得分',
            startingTickets: 250,
            ticketBleedRate: 0,
            capturePointPoints: 0,
            capturePointBonus: 0,
            deathTicketCost: 1,
            matchDuration: 600,
            teamScoreLimit: 9999,
            supportsStrategicObjectives: false,
            enabledMaps: ['default', 'ardennes'],
        },
        breakthrough: {
            id: 'breakthrough',
            name: '突破',
            description: '攻方依次突破扇区防线',
            startingTickets: 150,
            ticketBleedRate: 0,
            capturePointPoints: 0,
            capturePointBonus: 0,
            deathTicketCost: 1,
            matchDuration: 1200,
            teamScoreLimit: 9999,
            supportsStrategicObjectives: true,
            enabledMaps: ['normandy', 'iwojima'],
            sectors: 3,
            capturePerSector: 1,
            capturePointTime: 30,
            attackerTeam: 0,
        },
    },

    // 地图配置
    MAPS: {
        default: {
            id: 'default',
            name: '前线突击',
            description: '开放的战场据点争夺',
            size: 400,
            terrain: {
                seed: 1337,
                frequency: 0.018,
                baseHeight: 0,
                hillHeight: 9,
                mountainHeight: 14,
                groundColor: 0x6b7a5a,
                fogColor: 0x8899aa,
                skyColor: 0x87a8c8,
                cloudCover: 0.42,
                sunColor: 0xfff3e0,
                sunElevation: 0.72,
                sunAzimuth: 0.62,
                sunIntensity: 2.8,
                toneMappingExposure: 1.45,
                ambientIntensity: 0.64,
                hemisphereIntensity: 1.05,
                hemisphereGroundColor: 0x686653,
                fillIntensity: 0.38,
                horizonBrightness: 0.16,
                grassDensity: 2000,
                grassColor: 0x5e7a3a,
            },
            environment: {
                theme: 'frontline',
                captureDetailDensity: 1.0,
                distantPropCount: 48,
            },
            capturePoints: [
                { id: 'A', name: 'A', x: -70, z: -100, label: '仓库', radius: 12 },
                { id: 'B', name: 'B', x: 0, z: 0, label: '十字路口', radius: 14 },
                { id: 'C', name: 'C', x: 70, z: 100, label: '农场', radius: 12 },
                { id: 'D', name: 'D', x: -80, z: 80, label: '高地', radius: 10 },
                { id: 'E', name: 'E', x: 80, z: -80, label: '工厂', radius: 12 },
            ],
            strategicObjectives: [
                { id: 'friendly_fuel', type: 'fuel', x: -76, z: -122, health: 220, ticketDamage: 25, scoreValue: 25 },
                { id: 'enemy_fuel', type: 'fuel', x: 76, z: 122, health: 220, ticketDamage: 25, scoreValue: 25 },
            ],
            vehicleSpawns: [
                { type: 'jeep', x: -80, z: -130, team: 0, yaw: 0.5 },
                { type: 'tank', x: -85, z: -125, team: 0, yaw: 0.3 },
                { type: 'armedjeep', x: -75, z: -135, team: 0, yaw: 0.5 },
                { type: 'plane', x: -95, z: -140, team: 0, yaw: 0.5 },
                { type: 'jeep', x: 80, z: 130, team: 1, yaw: -0.5 },
                { type: 'tank', x: 85, z: 125, team: 1, yaw: -0.3 },
                { type: 'armedjeep', x: 75, z: 135, team: 1, yaw: -0.5 },
                { type: 'plane', x: 95, z: 140, team: 1, yaw: -0.5 + Math.PI },
            ],
            spawnAreas: {
                0: { center: { x: -85, z: -130 }, radius: 12 },
                1: { center: { x: 85, z: 130 }, radius: 12 },
            },
            obstacles: { buildings: 18, walls: 24, sandbags: 30, crates: 40, trees: 60 },
        },
        ardennes: {
            id: 'ardennes',
            name: '阿登森林',
            description: '雪地林区的近距离战斗',
            size: 400,
            terrain: {
                seed: 4242,
                frequency: 0.022,
                baseHeight: 2,
                hillHeight: 11,
                mountainHeight: 18,
                groundColor: 0xdde5ee,
                fogColor: 0xaabbcc,
                skyColor: 0xb8c8d8,
                cloudCover: 0.78,
                sunColor: 0xdde8f8,
                sunIntensity: 2.25,
                sunElevation: 0.45,
                sunAzimuth: 0.42,
                toneMappingExposure: 1.34,
                ambientIntensity: 0.68,
                hemisphereIntensity: 1.08,
                hemisphereGroundColor: 0xaeb8b5,
                fillIntensity: 0.34,
                horizonBrightness: 0.2,
                fogNear: 42,
                fogFar: 250,
                grassDensity: 450,
                grassColor: 0x8a8f78,
            },
            environment: {
                theme: 'forest',
                captureDetailDensity: 0.9,
                distantPropCount: 62,
            },
            capturePoints: [
                { id: 'A', name: 'A', x: -60, z: -80, label: '林间小屋', radius: 12 },
                { id: 'B', name: 'B', x: 0, z: -20, label: '桥头', radius: 14 },
                { id: 'C', name: 'C', x: 60, z: 80, label: '山脊', radius: 10 },
            ],
            strategicObjectives: [
                { id: 'friendly_fuel', type: 'fuel', x: -66, z: -102, health: 220, ticketDamage: 25, scoreValue: 25 },
                { id: 'enemy_fuel', type: 'fuel', x: 66, z: 102, health: 220, ticketDamage: 25, scoreValue: 25 },
            ],
            vehicleSpawns: [
                { type: 'jeep', x: -70, z: -110, team: 0, yaw: 0.5 },
                { type: 'apc', x: -75, z: -105, team: 0, yaw: 0.3 },
                { type: 'jeep', x: 70, z: 110, team: 1, yaw: -0.5 },
                { type: 'apc', x: 75, z: 105, team: 1, yaw: -0.3 },
            ],
            spawnAreas: {
                0: { center: { x: -75, z: -110 }, radius: 12 },
                1: { center: { x: 75, z: 110 }, radius: 12 },
            },
            obstacles: { buildings: 12, walls: 18, sandbags: 25, crates: 30, trees: 100 },
        },
        normandy: {
            id: 'normandy',
            name: '诺曼底海滩',
            description: '登陆作战与海岸突破',
            size: 400,
            terrain: {
                seed: 7777,
                frequency: 0.015,
                baseHeight: 0,
                hillHeight: 8,
                mountainHeight: 12,
                groundColor: 0x8a8068,
                fogColor: 0x99aabb,
                skyColor: 0x7a98b8,
                cloudCover: 0.58,
                sunColor: 0xffeacc,
                sunIntensity: 2.7,
                sunElevation: 0.55,
                sunAzimuth: 0.78,
                toneMappingExposure: 1.48,
                ambientIntensity: 0.66,
                hemisphereIntensity: 1.08,
                hemisphereGroundColor: 0x777569,
                fillIntensity: 0.4,
                horizonBrightness: 0.18,
                grassDensity: 420,
                grassColor: 0x7d8455,
            },
            environment: {
                theme: 'beach',
                captureDetailDensity: 1.15,
                distantPropCount: 44,
            },
            water: { level: 0.55, color: 0x35586b, deepColor: 0x1a3547 },
            capturePoints: [
                { id: 'A', name: 'A', x: 0, z: 120, label: '滩头', radius: 16 },
                { id: 'B', name: 'B', x: 0, z: 60, label: '海堤', radius: 14 },
                { id: 'C', name: 'C', x: 0, z: 0, label: '小镇', radius: 14 },
                { id: 'D', name: 'D', x: 0, z: -60, label: '高地碉堡', radius: 12 },
            ],
            strategicObjectives: [
                { id: 'friendly_fuel', type: 'fuel', x: -10, z: 140, health: 220, ticketDamage: 25, scoreValue: 25 },
                { id: 'enemy_fuel', type: 'fuel', x: 10, z: -80, health: 220, ticketDamage: 25, scoreValue: 25 },
            ],
            vehicleSpawns: [
                { type: 'tank', x: -15, z: 140, team: 0, yaw: 0 },
                { type: 'armedjeep', x: 15, z: 140, team: 0, yaw: 0 },
                { type: 'tank', x: 15, z: -80, team: 1, yaw: Math.PI },
                { type: 'apc', x: -15, z: -80, team: 1, yaw: Math.PI },
            ],
            spawnAreas: {
                0: { center: { x: 0, z: 140 }, radius: 15 },
                1: { center: { x: 0, z: -90 }, radius: 12 },
            },
            // 诺曼底是海滩登陆图，树木再压低，优先灌木/掩体
            obstacles: { buildings: 20, walls: 30, sandbags: 40, crates: 35, trees: 8 },
        },
        iwojima: {
            id: 'iwojima',
            name: '硫磺岛',
            description: '火山岛屿的残酷争夺',
            size: 400,
            terrain: {
                seed: 9999,
                frequency: 0.018,
                baseHeight: 0,
                hillHeight: 12,
                mountainHeight: 22,
                groundColor: 0x5c554b,
                fogColor: 0x6e7f8e,
                skyColor: 0x7fa0b3,
                cloudCover: 0.6,
                sunColor: 0xffd9b0,
                sunIntensity: 2.85,
                sunElevation: 0.5,
                sunAzimuth: 0.7,
                toneMappingExposure: 1.52,
                ambientIntensity: 0.7,
                hemisphereIntensity: 1.12,
                hemisphereGroundColor: 0x514c46,
                fillIntensity: 0.42,
                horizonBrightness: 0.2,
                fogNear: 50,
                fogFar: 300,
                grassDensity: 600,
                grassColor: 0x5a6248,
            },
            environment: {
                theme: 'volcanic',
                captureDetailDensity: 1.1,
                distantPropCount: 52,
            },
            water: { level: 0.45, color: 0x2c4a58, deepColor: 0x14293a },
            capturePoints: [
                { id: 'A', name: 'A', x: 0, z: 130, label: '海滩', radius: 16 },
                { id: 'B', name: 'B', x: -40, z: 50, label: '机场', radius: 14 },
                { id: 'C', name: 'C', x: 40, z: -20, label: '矿井', radius: 12 },
                { id: 'D', name: 'D', x: 0, z: -80, label: '折钵山', radius: 10 },
            ],
            strategicObjectives: [
                { id: 'friendly_fuel', type: 'fuel', x: -10, z: 145, health: 220, ticketDamage: 25, scoreValue: 25 },
                { id: 'enemy_fuel', type: 'fuel', x: 10, z: -95, health: 220, ticketDamage: 25, scoreValue: 25 },
            ],
            vehicleSpawns: [
                { type: 'jeep', x: -15, z: 145, team: 0, yaw: 0 },
                { type: 'tank', x: 15, z: 145, team: 0, yaw: 0 },
                { type: 'jeep', x: 15, z: -95, team: 1, yaw: Math.PI },
                { type: 'tank', x: -15, z: -95, team: 1, yaw: Math.PI },
            ],
            spawnAreas: {
                0: { center: { x: 0, z: 145 }, radius: 15 },
                1: { center: { x: 0, z: -100 }, radius: 12 },
            },
            obstacles: { buildings: 10, walls: 20, sandbags: 35, crates: 25, trees: 30 },
        },
    },

    FORTIFICATIONS: {
        placeDistance: 3.5,
        rotationStep: Math.PI / 12,
        cooldown: 3,
        validationInterval: 0.1,
        boundaryPadding: 5,
        types: {
            sandbag: {
                name: '沙袋墙',
                width: 2.6,
                height: 1.0,
                depth: 0.7,
                health: 300,
                armorMultiplier: 0.75,
                breakType: 'deform',
                maxCount: 5,
                maxGroundDelta: 0.42,
            },
            wire: {
                name: '铁丝网',
                width: 3.2,
                height: 1.1,
                depth: 0.9,
                health: 160,
                armorMultiplier: 0.9,
                breakType: 'shatter',
                maxCount: 3,
                maxGroundDelta: 0.5,
            },
            hedgehog: {
                name: '反坦克桩',
                width: 1.7,
                height: 1.5,
                depth: 1.7,
                health: 500,
                armorMultiplier: 0.35,
                breakType: 'shatter',
                maxCount: 2,
                maxGroundDelta: 0.6,
            },
        },
    },

    // 可破坏实体配置
    DESTRUCTIBLES: {
        building: { health: 220, armorMultiplier: 0.65, breakType: 'collapse' },
        wall: { health: 120, armorMultiplier: 0.8, breakType: 'shatter' },
        sandbag: { health: 200, armorMultiplier: 0.8, breakType: 'deform' },
        crate: { health: 60, armorMultiplier: 1.0, breakType: 'shatter' },
        fence: { health: 40, armorMultiplier: 1.0, breakType: 'shatter' },
    },

    // 队伍
    TEAMS: {
        friendly: { id: 0, name: '我方', color: 0x0088ff, markerColor: 0x00aaff },
        enemy: { id: 1, name: '敌方', color: 0xff3300, markerColor: 0xff4444 },
    },
};

// 兵种武器配置
export const CLASS_LOADOUTS = {
    assault: {
        name: '突击兵',
        weapons: ['M416', 'P226'],
        gadget: { type: 'ammobag', count: 99, name: '弹药包' },
        passive: '冲刺耐力增强',
    },
    medic: {
        name: '医疗兵',
        weapons: ['MP5', 'P226'],
        gadget: { type: 'medbag', count: 99, name: '医疗包' },
        passive: '自动回血',
    },
    engineer: {
        name: '工程兵',
        weapons: ['M870', 'RPG'],
        gadget: { type: 'repairtool', count: 99, name: '维修工具' },
        passive: '反甲专家',
    },
    sniper: {
        name: '狙击手',
        weapons: ['L96', 'MP443'],
        gadget: { type: 'sensor', count: 2, name: '运动传感器' },
        passive: '屏息稳定',
    },
};
