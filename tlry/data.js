/* ===== 数据中枢：tile / item / recipe / equipment / biome =====
 * 集中所有静态数据，world.js 与 items.js 引用之
 */
(function(){
  // ===== Tile 定义 =====
  // id -> {name, solid, sprite, light, drop(item key or null), hard, station?, emit?}
  const TILES = {
    0:  {name:'air',       solid:false, sprite:null,       light:1.0},
    1:  {name:'grass',     solid:true,  sprite:'grass',    light:0, drop:'dirt', hard:0, biome:'forest'},
    2:  {name:'dirt',      solid:true,  sprite:'dirt',     light:0, drop:'dirt', hard:0},
    3:  {name:'stone',     solid:true,  sprite:'stone',    light:0, drop:'stone', hard:1},
    4:  {name:'wood',      solid:true,  sprite:'wood',     light:0, drop:'wood'},
    5:  {name:'leaves',    solid:true,  sprite:'leaves',  light:.7, drop:'wood', hard:0},
    6:  {name:'sand',      solid:true,  sprite:'sand',    light:0, drop:'sand', hard:0, biome:'desert'},
    7:  {name:'plank',     solid:true,  sprite:'plank',   light:0, drop:'plank'},
    8:  {name:'brick',     solid:true,  sprite:'brick',   light:0, drop:'brick', hard:2},
    9:  {name:'torch',     solid:false, sprite:'torch',   light:1.0, drop:'torch', emit:14},
    10: {name:'door',      solid:false, sprite:'door',    light:.9, drop:'door'},
    11: {name:'workbench',solid:true,  sprite:'workbench',light:0, drop:'workbench', station:'workbench'},
    12: {name:'platform', solid:false, sprite:'platform',light:.9, drop:'platform'},
    13: {name:'glass',     solid:true,  sprite:'glass',   light:.9, drop:'glass'},
    14: {name:'furnace',   solid:true,  sprite:'furnace', light:1.0, drop:'furnace', station:'furnace', emit:10},
    15: {name:'anvil',     solid:true,  sprite:'anvil',   light:0, drop:'anvil', station:'anvil'},
    16: {name:'chest',     solid:true,  sprite:'chest',   light:0, drop:'chest', container:true},
    17: {name:'pot',       solid:false, sprite:'pot',    light:0, drop:null, container:true, hard:0},
    18: {name:'snow',      solid:true,  sprite:'snow',    light:0, drop:'snow', hard:0, biome:'snow'},
    19: {name:'ice',       solid:true,  sprite:'ice',    light:.6, drop:'ice', hard:1, biome:'snow'},
    24: {name:'jungle_grass',solid:true, sprite:'jungle_grass', light:0, drop:'jungle_spore', hard:0, biome:'jungle'},
    25: {name:'mud',       solid:true,  sprite:'mud',     light:0, drop:'mud', hard:0, biome:'jungle'},
    26: {name:'water',     solid:false, sprite:'water',  light:.6, drop:null, liquid:'water'},
    27: {name:'lava',      solid:false, sprite:'lava',   light:1.0, drop:null, liquid:'lava', emit:10},
    30: {name:'life_crystal',solid:true, sprite:'life_crystal', light:.9, drop:'life_crystal', hard:2},
    31: {name:'mana_crystal',solid:true, sprite:'mana_crystal', light:.9, drop:'mana_crystal', hard:2},
    32: {name:'gem_amethyst',solid:true, sprite:'gem_amethyst', light:.8, drop:'gem_amethyst', hard:1},
    33: {name:'gem_topaz', solid:true,  sprite:'gem_topaz',  light:.8, drop:'gem_topaz', hard:1},
    34: {name:'gem_sapphire',solid:true,sprite:'gem_sapphire',light:.8,drop:'gem_sapphire',hard:1},
    35: {name:'gem_emerald',solid:true,  sprite:'gem_emerald',light:.8, drop:'gem_emerald',hard:1},
    36: {name:'gem_ruby',  solid:true,  sprite:'gem_ruby',  light:.8, drop:'gem_ruby', hard:1},
    37: {name:'gem_diamond',solid:true, sprite:'gem_diamond',light:.8, drop:'gem_diamond',hard:1},
    // 矿石（保留旧 id 20-23 兼容）
    20: {name:'copper_ore',solid:true,  sprite:'copper_ore',light:0, drop:'copper_ore', hard:2, tier:1},
    21: {name:'iron_ore',  solid:true,  sprite:'iron_ore',  light:0, drop:'iron_ore',   hard:2, tier:2},
    22: {name:'gold_ore',  solid:true,  sprite:'gold_ore',  light:0, drop:'gold_ore',   hard:3, tier:3},
    23: {name:'coal',      solid:true,  sprite:'coal',      light:0, drop:'coal',       hard:2},
    28: {name:'silver_ore',solid:true,  sprite:'silver_ore',light:0, drop:'silver_ore', hard:2, tier:3},
    29: {name:'demonite_ore',solid:true,sprite:'demonite_ore',light:.5,drop:'demonite_ore',hard:3, tier:4},
    // 木宝箱内含物品
    38: {name:'corruption_grass',solid:true, sprite:'corruption_grass',light:0,drop:'corruption',hard:0,biome:'corruption'},
    39: {name:'ebonstone', solid:true,  sprite:'ebonstone', light:0, drop:'ebonstone', hard:3},
    40: {name:'shadow_orb', solid:true,  sprite:'shadow_orb', light:1.0, drop:null, hard:0, shake:true, emit:12},
    41: {name:'hive', solid:true, sprite:'hive', light:0, drop:'hive', hard:1, biome:'jungle'},
    42: {name:'honey', solid:false, sprite:'honey', light:.5, drop:'honey', liquid:'honey'},
    43: {name:'larva', solid:false, sprite:'larva', light:.8, drop:null, hard:0, emit:6},
    44: {name:'dungeon_brick', solid:true, sprite:'dungeon_brick', light:0, drop:'dungeon_brick', hard:3},
    // 地狱
    45: {name:'ash', solid:true, sprite:'ash', light:0, drop:'ash', hard:0},
    46: {name:'hellstone', solid:true, sprite:'hellstone', light:.6, drop:'hellstone', hard:4, tier:5},
    47: {name:'hellbrick', solid:true, sprite:'hellbrick', light:0, drop:'hellbrick', hard:3},
    // 困难模式矿石
    48: {name:'cobalt_ore', solid:true, sprite:'cobalt_ore', light:0, drop:'cobalt_ore', hard:4, tier:6},
    49: {name:'mythril_ore', solid:true, sprite:'mythril_ore', light:0, drop:'mythril_ore', hard:5, tier:7},
    50: {name:'adamantite_ore', solid:true, sprite:'adamantite_ore', light:0, drop:'adamantite_ore', hard:5, tier:8},
    51: {name:'demon_altar', solid:true, sprite:'demon_altar', light:.7, drop:null, hard:0, altar:true},
    52: {name:'pearlstone', solid:true, sprite:'pearlstone', light:0, drop:'pearlstone', hard:2},
    53: {name:'hallowed_grass', solid:true, sprite:'hallowed_grass', light:0, drop:'dirt', hard:0},
    // 世纪之花 / 神庙
    54: {name:'plantera_bulb', solid:false, sprite:'plantera_bulb', light:.8, drop:null, hard:0, emit:8},
    55: {name:'lihzahrd_brick', solid:true, sprite:'lihzahrd_brick', light:0, drop:'lihzahrd_brick', hard:4},
    56: {name:'temple_altar', solid:true, sprite:'temple_altar', light:.7, drop:null, hard:0},
    57: {name:'chlorophyte_ore', solid:true, sprite:'chlorophyte_ore', light:.4, drop:'chlorophyte_ore', hard:5, tier:9},
    58: {name:'cloud', solid:true, sprite:'cloud_block', light:.9, drop:null, hard:0},
  };
  const TILE_BY_NAME = {}; for(const k in TILES) TILE_BY_NAME[TILES[k].name]=+k;

  // ===== 物品（id 字符串 'i_xxx'）显示名 =====
  const NAMES = {
    i_dirt:'泥土', i_stone:'石头', i_wood:'木材', i_plank:'木板', i_brick:'砖',
    i_torch:'火把', i_glass:'玻璃', i_door:'木门', i_platform:'木板平台',
    i_iron:'铁锭', i_gold:'金锭', i_copper:'铜锭', i_coal:'煤炭', i_mushroom:'蘑菇',
    i_heart:'生命药水', i_star:'魔力药水',
    i_pick_wood:'木镐', i_pick_iron:'铁镐', i_pick_copper:'铜镐', i_pick_gold:'金镐', i_pick_silver:'银镐', i_pick_demonite:'暗影镐',
    i_axe_wood:'木斧', i_axe_iron:'铁斧', i_axe_copper:'铜斧', i_axe_gold:'金斧',
    i_sword_wood:'木剑', i_sword_iron:'铁剑', i_sword_copper:'铜短剑', i_sword_gold:'金剑', i_sword_demonite:'光之驱逐',
    i_bow:'木弓', i_arrow:'木箭',
    i_workbench:'工作台', i_furnace:'熔炉', i_anvil:'铁砧', i_chest:'木宝箱',
    i_sand:'沙子', i_snow:'雪块', i_ice:'冰块', i_glass_bottle:'玻璃瓶',
    i_jungle_spore:'丛林孢子', i_mud:'泥块',
    i_copper_ore:'铜矿', i_iron_ore:'铁矿', i_gold_ore:'金矿', i_silver_ore:'银矿', i_coal_ore:'煤炭', i_demonite_ore:'魔矿',
    i_silver:'银锭',
    i_gem_amethyst:'紫水晶', i_gem_topaz:'黄玉', i_gem_sapphire:'蓝宝石',
    i_gem_emerald:'翡翠', i_gem_ruby:'红宝石', i_gem_diamond:'钻石',
    i_life_crystal:'生命水晶', i_mana_crystal:'魔力水晶', i_fallen_star:'坠落之星',
    i_iron_bar:'铁锭', i_copper_bar:'铜锭', i_silver_bar:'银锭', i_gold_bar:'金锭', i_demonite_bar:'魔锭',
    // 盔甲
    i_helm_wood:'木头盔', i_chest_wood:'木胸甲', i_legs_wood:'木护腿',
    i_helm_copper:'铜头盔', i_chest_copper:'铜胸甲', i_legs_copper:'铜护腿',
    i_helm_iron:'铁头盔', i_chest_iron:'铁胸甲', i_legs_iron:'铁护腿',
    i_helm_silver:'银头盔', i_chest_silver:'银胸甲', i_legs_silver:'银护腿',
    i_helm_gold:'金头盔', i_chest_gold:'金胸甲', i_legs_gold:'金护腿',
    i_helm_shadow:'暗影头盔', i_chest_shadow:'暗影胸甲', i_legs_shadow:'暗影护腿',
    // 饰品
    i_acc_cloud:'云瓶', i_acc_hermes:'赫尔墨斯靴', i_acc_shield:'克苏鲁之盾',
    // 召唤物 / 关键道具
    i_suspicious_eye:'可疑眼球', i_worm_food:'蠕虫诱饵',
    i_boss_summon_eoc:'可疑眼球(召唤)',
    // 金币
    i_copper_coin:'铜币', i_silver_coin:'银币', i_gold_coin:'金币', i_platinum_coin:'铂金币',
    // 药水
    i_ironskin_potion:'铁皮药水', i_regen_potion:'再生药水', i_swiftness_potion:'迅捷药水',
    // 杂物
    i_lens:'晶状体', i_rotten_chunk:'腐肉', i_demonite_scale:'暗影鳞片', i_ebonstone:'黑檀石',
    i_corruption:'腐化之物',
    i_jungle_rose:'丛林玫瑰', i_stinger:'蜂刺', i_vine:'藤蔓',
    i_hive:'蜂巢块', i_honey:'蜂蜜', i_beeswax:'蜂蜡', i_abeemination:'蜜蜂分泌物',
    i_bee_gun:'蜂膝弓', i_sword_bee:'养蜂人', i_helm_bee:'蜜蜂头盔', i_chest_bee:'蜜蜂胸甲', i_legs_bee:'蜜蜂护腿',
    i_dungeon_brick:'地牢砖', i_bone:'骨头', i_dungeon_key:'金钥匙',
    i_boss_summon_qb:'蜜蜂分泌物(召唤)',
    // 地狱 / 困难模式
    i_ash:'灰烬', i_hellstone:'狱石', i_hellstone_bar:'狱石锭', i_hellbrick:'狱岩砖',
    i_pick_molten:'熔岩镐', i_sword_molten:'炽焰巨剑', i_axe_molten:'熔岩斧',
    i_helm_molten:'熔岩头盔', i_chest_molten:'熔岩胸甲', i_legs_molten:'熔岩护腿',
    i_voodoo_doll:'向导巫毒娃娃', i_pwnhammer:'神锤',
    i_cobalt_ore:'钴矿', i_mythril_ore:'秘银矿', i_adamantite_ore:'精金矿',
    i_cobalt_bar:'钴锭', i_mythril_bar:'秘银锭', i_adamantite_bar:'精金锭',
    i_pick_cobalt:'钴镐', i_sword_cobalt:'钴剑',
    i_warrior_emblem:'战士徽章', i_ranger_emblem:'游侠徽章', i_sorcerer_emblem:'巫师徽章',
    i_soul_might:'力量之魂', i_soul_sight:'视域之魂', i_soul_fright:'恐惧之魂',
    i_hallowed_bar:'神圣锭',
    i_mech_worm:'机械蠕虫', i_mech_eye:'机械眼球', i_mech_skull:'机械骷髅头',
    i_pick_mythril:'秘银镐', i_pick_adamantite:'精金镐',
    i_sword_excalibur:'断钢剑', i_helm_hallowed:'神圣头盔', i_chest_hallowed:'神圣胸甲', i_legs_hallowed:'神圣护腿',
    i_pearlstone:'珍珠石',
    // 世纪之花 / 神庙 / 叶绿
    i_temple_key:'神庙钥匙', i_lihzahrd_brick:'蜥蜴砖', i_chlorophyte_ore:'叶绿矿', i_chlorophyte_bar:'叶绿锭',
    i_lihzahrd_battery:'蜥蜴电池', i_plantera_bullet:'世纪之花种子(召唤)',
    i_pick_chlorophyte:'叶绿镐', i_sword_chlorophyte:'叶绿剑',
    i_helm_chlorophyte:'叶绿头盔', i_chest_chlorophyte:'叶绿胸甲', i_legs_chlorophyte:'叶绿护腿',
    i_golem_eye:'石巨人之眼', i_possessed_hatchet:'附魔战斧', i_stynger:'蜂刺发射器',
    // 月球事件 / 月亮领主
    i_solar_fragment:'日耀碎片', i_nebula_fragment:'星云碎片', i_vortex_fragment:'星旋碎片', i_stardust_fragment:'星尘碎片',
    i_luminite:'夜明矿', i_luminite_bar:'夜明锭',
    i_sword_meowmere:'喵刀', i_gun_sdmg:'SDMG 链炮', i_staff_prism:'终极棱镜',
    i_helm_solar:'日耀头盔', i_chest_solar:'日耀胸甲', i_legs_solar:'日耀护腿',
    i_helm_nebula:'星云头盔', i_chest_nebula:'星云胸甲', i_legs_nebula:'星云护腿',
    i_wing_stardust:'星尘之翼', i_ancient_manipulator:'远古操纵机',
    i_celestial_sigil:'天界符咒'
  };
  Object.assign(NAMES,{
    i_bullet:'火枪子弹', i_sword_silver:'银剑',
    i_bow_gold:'金弓', i_bow_molten:'熔火弓', i_rifle_clockwork:'发条步枪', i_repeater_hallowed:'神圣连弩', i_gun_vortex:'星旋枪',
    i_staff_amethyst:'紫晶法杖', i_staff_topaz:'黄玉法杖', i_staff_sapphire:'蓝玉法杖', i_spell_demon_scythe:'恶魔镰刀',
    i_staff_flower_fire:'火焰花', i_spell_crystal_storm:'水晶风暴', i_harp_hallowed:'神圣竖琴', i_staff_chlorophyte:'叶绿法杖', i_staff_nebula:'星云烈焰',
    i_staff_slime:'史莱姆杖', i_staff_hornet:'黄蜂杖', i_staff_imp:'小鬼法杖', i_staff_spider:'蜘蛛杖', i_staff_pirate:'海盗杖',
    i_staff_sphere:'致命球杖', i_staff_stardust_dragon:'星尘龙杖', i_summoner_emblem:'召唤师徽章',
    i_helm_wizard:'巫师帽', i_chest_wizard:'魔法长袍', i_legs_wizard:'魔法护腿',
    i_helm_spider:'蜘蛛面罩', i_chest_spider:'蜘蛛胸甲', i_legs_spider:'蜘蛛护胫',
    i_helm_vortex:'星旋头盔', i_chest_vortex:'星旋胸甲', i_legs_vortex:'星旋护腿',
    i_helm_stardust:'星尘头盔', i_chest_stardust:'星尘板甲', i_legs_stardust:'星尘护腿'
  });

  // 物品类型 / 用途，用于鼠标悬停与行为分支
  // kind: place(可放置成tile)/pick/axe/sword/bow/armor(装备)/acc(饰品)/consumable/potion/summon/material/coin/misc
  // place 对应 tile id（见 TILE_BY_NAME）
  const ITEM = {
    i_dirt:{kind:'place',tile:'dirt'}, i_stone:{kind:'place',tile:'stone'}, i_wood:{kind:'place',tile:'wood'},
    i_plank:{kind:'place',tile:'plank'}, i_brick:{kind:'place',tile:'brick'}, i_torch:{kind:'place',tile:'torch'},
    i_glass:{kind:'place',tile:'glass'}, i_door:{kind:'place',tile:'door'}, i_platform:{kind:'place',tile:'platform'},
    i_sand:{kind:'place',tile:'sand'}, i_snow:{kind:'place',tile:'snow'}, i_ice:{kind:'place',tile:'ice'},
    i_mud:{kind:'place',tile:'mud'}, i_workbench:{kind:'place',tile:'workbench'},
    i_furnace:{kind:'place',tile:'furnace'}, i_anvil:{kind:'place',tile:'anvil'}, i_chest:{kind:'place',tile:'chest'},
    i_jungle_spore:{kind:'material'}, i_iron:{kind:'material',alias:'i_iron_bar'},
    i_copper:{kind:'material',alias:'i_copper_bar'}, i_silver:{kind:'material',alias:'i_silver_bar'},
    i_gold:{kind:'material',alias:'i_gold_bar'}, i_demonite:{kind:'material',alias:'i_demonite_bar'},
    i_iron_bar:{kind:'material'}, i_copper_bar:{kind:'material'}, i_silver_bar:{kind:'material'},
    i_gold_bar:{kind:'material'}, i_demonite_bar:{kind:'material'},
    i_copper_ore:{kind:'material'}, i_iron_ore:{kind:'material'}, i_gold_ore:{kind:'material'},
    i_silver_ore:{kind:'material'}, i_coal_ore:{kind:'material'}, i_demonite_ore:{kind:'material'},
    i_coal:{kind:'material'},
    i_gem_amethyst:{kind:'material'}, i_gem_topaz:{kind:'material'}, i_gem_sapphire:{kind:'material'},
    i_gem_emerald:{kind:'material'}, i_gem_ruby:{kind:'material'}, i_gem_diamond:{kind:'material'},
    i_life_crystal:{kind:'crystal',hp:20,maxHpTo:400}, i_mana_crystal:{kind:'crystal',mp:20,maxMpTo:200},
    i_fallen_star:{kind:'material'},
    i_mushroom:{kind:'consumable',hp:15},

    i_pick_wood:{kind:'pick',power:35}, i_pick_copper:{kind:'pick',power:40}, i_pick_iron:{kind:'pick',power:45},
    i_pick_silver:{kind:'pick',power:50}, i_pick_gold:{kind:'pick',power:60}, i_pick_demonite:{kind:'pick',power:65},
    i_axe_wood:{kind:'axe',power:2}, i_axe_copper:{kind:'axe',power:3}, i_axe_iron:{kind:'axe',power:4},
    i_axe_gold:{kind:'axe',power:5},
    i_sword_wood:{kind:'sword',dmg:6,reach:42}, i_sword_copper:{kind:'sword',dmg:7,reach:42},
    i_sword_iron:{kind:'sword',dmg:10,reach:44}, i_sword_silver:{kind:'sword',dmg:11,reach:44},
    i_sword_gold:{kind:'sword',dmg:13,reach:46}, i_sword_demonite:{kind:'sword',dmg:17,reach:48},

    i_bow:{kind:'bow',dmg:8}, i_arrow:{kind:'ammo'},

    // 盔甲（helmet/chest/legs，三件成套）
    i_helm_wood:{kind:'armor',slot:'head',def:1,set:'wood'}, i_chest_wood:{kind:'armor',slot:'body',def:2,set:'wood'}, i_legs_wood:{kind:'armor',slot:'legs',def:1,set:'wood'},
    i_helm_copper:{kind:'armor',slot:'head',def:2,set:'copper'}, i_chest_copper:{kind:'armor',slot:'body',def:3,set:'copper'}, i_legs_copper:{kind:'armor',slot:'legs',def:2,set:'copper'},
    i_helm_iron:{kind:'armor',slot:'head',def:3,set:'iron'}, i_chest_iron:{kind:'armor',slot:'body',def:4,set:'iron'}, i_legs_iron:{kind:'armor',slot:'legs',def:3,set:'iron'},
    i_helm_silver:{kind:'armor',slot:'head',def:4,set:'silver'}, i_chest_silver:{kind:'armor',slot:'body',def:5,set:'silver'}, i_legs_silver:{kind:'armor',slot:'legs',def:3,set:'silver'},
    i_helm_gold:{kind:'armor',slot:'head',def:5,set:'gold'}, i_chest_gold:{kind:'armor',slot:'body',def:6,set:'gold'}, i_legs_gold:{kind:'armor',slot:'legs',def:4,set:'gold'},
    i_helm_shadow:{kind:'armor',slot:'head',def:6,set:'shadow'}, i_chest_shadow:{kind:'armor',slot:'body',def:7,set:'shadow'}, i_legs_shadow:{kind:'armor',slot:'legs',def:6,set:'shadow'},

    i_acc_cloud:{kind:'acc',effect:'doubleJump'}, i_acc_hermes:{kind:'acc',effect:'runSpeed'},
    i_acc_shield:{kind:'acc',effect:'shield'},

    i_heart:{kind:'potion',hp:100}, i_star:{kind:'potion',mp:100},
    i_ironskin_potion:{kind:'potion',buff:'ironskin',def:8,dur:480}, i_regen_potion:{kind:'potion',buff:'regen',dur:480},
    i_swiftness_potion:{kind:'potion',buff:'swiftness',spd:1.4,dur:480},

    i_boss_summon_eoc:{kind:'summon',boss:'eoc'},
    i_suspicious_eye:{kind:'material'}, i_worm_food:{kind:'material'},

    i_copper_coin:{kind:'coin',val:1}, i_silver_coin:{kind:'coin',val:100}, i_gold_coin:{kind:'coin',val:10000},
    i_platinum_coin:{kind:'coin',val:1000000},

    i_lens:{kind:'material'}, i_rotten_chunk:{kind:'material'}, i_demonite_scale:{kind:'material'},
    i_ebonstone:{kind:'place',tile:'ebonstone'}, i_corruption:{kind:'material'},
    i_jungle_rose:{kind:'material'}, i_stinger:{kind:'material'}, i_vine:{kind:'material'},
    i_glass_bottle:{kind:'material'}, i_fallen_star:{kind:'material'},
    i_hive:{kind:'place',tile:'hive'}, i_honey:{kind:'material'}, i_beeswax:{kind:'material'},
    i_abeemination:{kind:'material'},
    i_bee_gun:{kind:'bow',dmg:14}, i_sword_bee:{kind:'sword',dmg:16,reach:46},
    i_helm_bee:{kind:'armor',slot:'head',def:4,set:'bee'}, i_chest_bee:{kind:'armor',slot:'body',def:5,set:'bee'}, i_legs_bee:{kind:'armor',slot:'legs',def:4,set:'bee'},
    i_dungeon_brick:{kind:'place',tile:'dungeon_brick'}, i_bone:{kind:'material'}, i_dungeon_key:{kind:'material'},
    i_boss_summon_qb:{kind:'summon',boss:'queenbee'},
    i_ash:{kind:'place',tile:'ash'}, i_hellstone:{kind:'material'}, i_hellstone_bar:{kind:'material'},
    i_hellbrick:{kind:'place',tile:'hellbrick'},
    i_pick_molten:{kind:'pick',power:100}, i_sword_molten:{kind:'sword',dmg:36,reach:50}, i_axe_molten:{kind:'axe',power:6},
    i_helm_molten:{kind:'armor',slot:'head',def:8,set:'molten'}, i_chest_molten:{kind:'armor',slot:'body',def:9,set:'molten'}, i_legs_molten:{kind:'armor',slot:'legs',def:8,set:'molten'},
    i_voodoo_doll:{kind:'consumable',special:'voodoo'}, i_pwnhammer:{kind:'misc',hammer:true},
    i_cobalt_ore:{kind:'material'}, i_mythril_ore:{kind:'material'}, i_adamantite_ore:{kind:'material'},
    i_cobalt_bar:{kind:'material'}, i_mythril_bar:{kind:'material'}, i_adamantite_bar:{kind:'material'},
    i_pick_cobalt:{kind:'pick',power:110}, i_sword_cobalt:{kind:'sword',dmg:28,reach:48},
    i_warrior_emblem:{kind:'acc',effect:'meleeDmg'}, i_ranger_emblem:{kind:'acc',effect:'rangedDmg'}, i_sorcerer_emblem:{kind:'acc',effect:'magicDmg'},
    i_soul_might:{kind:'material'}, i_soul_sight:{kind:'material'}, i_soul_fright:{kind:'material'},
    i_hallowed_bar:{kind:'material'},
    i_mech_worm:{kind:'summon',boss:'destroyer'}, i_mech_eye:{kind:'summon',boss:'twins'}, i_mech_skull:{kind:'summon',boss:'prime'},
    i_pick_mythril:{kind:'pick',power:150}, i_pick_adamantite:{kind:'pick',power:180},
    i_sword_excalibur:{kind:'sword',dmg:50,reach:52},
    i_helm_hallowed:{kind:'armor',slot:'head',def:10,set:'hallowed'}, i_chest_hallowed:{kind:'armor',slot:'body',def:15,set:'hallowed'}, i_legs_hallowed:{kind:'armor',slot:'legs',def:11,set:'hallowed'},
    i_pearlstone:{kind:'place',tile:'pearlstone'},
    // 世纪之花 / 神庙
    i_temple_key:{kind:'material'}, i_lihzahrd_brick:{kind:'place',tile:'lihzahrd_brick'},
    i_chlorophyte_ore:{kind:'material'}, i_chlorophyte_bar:{kind:'material'},
    i_lihzahrd_battery:{kind:'consumable',special:'battery'},
    i_plantera_bullet:{kind:'summon',boss:'plantera'},
    i_pick_chlorophyte:{kind:'pick',power:200}, i_sword_chlorophyte:{kind:'sword',dmg:65,reach:54},
    i_helm_chlorophyte:{kind:'armor',slot:'head',def:14,set:'chlorophyte'}, i_chest_chlorophyte:{kind:'armor',slot:'body',def:20,set:'chlorophyte'}, i_legs_chlorophyte:{kind:'armor',slot:'legs',def:16,set:'chlorophyte'},
    i_golem_eye:{kind:'acc',effect:'meleeDmg'}, i_possessed_hatchet:{kind:'sword',dmg:80,reach:56}, i_stynger:{kind:'bow',dmg:40},
    // 月球碎片 / 夜明
    i_solar_fragment:{kind:'material'}, i_nebula_fragment:{kind:'material'},
    i_vortex_fragment:{kind:'material'}, i_stardust_fragment:{kind:'material'},
    i_luminite:{kind:'material'}, i_luminite_bar:{kind:'material'},
    // 终极武器
    i_sword_meowmere:{kind:'sword',dmg:200,reach:58},
    i_gun_sdmg:{kind:'bow',dmg:85,fast:true},
    i_staff_prism:{kind:'bow',dmg:120,fast:true},
    // 终极盔甲
    i_helm_solar:{kind:'armor',slot:'head',def:22,set:'solar'}, i_chest_solar:{kind:'armor',slot:'body',def:32,set:'solar'}, i_legs_solar:{kind:'armor',slot:'legs',def:24,set:'solar'},
    i_helm_nebula:{kind:'armor',slot:'head',def:14,set:'nebula'}, i_chest_nebula:{kind:'armor',slot:'body',def:18,set:'nebula'}, i_legs_nebula:{kind:'armor',slot:'legs',def:15,set:'nebula'},
    i_wing_stardust:{kind:'acc',effect:'flight'},
    i_ancient_manipulator:{kind:'place',tile:'workbench'},
    i_celestial_sigil:{kind:'summon',boss:'moonlord'},

    // 四职业补全：远程
    i_bullet:{kind:'ammo',ammoType:'bullet'},
    i_bow_gold:{kind:'bow',damageClass:'ranged',useStyle:'bow',dmg:14,useTime:25,crit:4,knockback:2.5,ammo:'arrow',projectile:'arrow',velocity:12},
    i_bow_molten:{kind:'bow',damageClass:'ranged',useStyle:'bow',dmg:26,useTime:23,crit:6,knockback:3,ammo:'arrow',projectile:'fireArrow',velocity:13},
    i_rifle_clockwork:{kind:'bow',damageClass:'ranged',useStyle:'gun',dmg:32,useTime:11,crit:8,knockback:2,ammo:'bullet',projectile:'bullet',velocity:16,autoReuse:true,spread:0.035},
    i_repeater_hallowed:{kind:'bow',damageClass:'ranged',useStyle:'bow',dmg:48,useTime:16,crit:8,knockback:3,ammo:'arrow',projectile:'holyArrow',velocity:15,pierce:2,autoReuse:true},
    i_gun_vortex:{kind:'bow',damageClass:'ranged',useStyle:'gun',dmg:72,useTime:7,crit:12,knockback:2.5,ammo:'bullet',projectile:'vortexBullet',velocity:18,autoReuse:true,spread:0.025},

    // 四职业补全：魔法
    i_staff_amethyst:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:12,useTime:28,crit:4,knockback:2,mana:4,projectile:'amethystBolt',velocity:9},
    i_staff_topaz:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:17,useTime:27,crit:4,knockback:2,mana:5,projectile:'topazBolt',velocity:9.5},
    i_staff_sapphire:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:23,useTime:25,crit:5,knockback:2.5,mana:6,projectile:'sapphireBolt',velocity:10,pierce:2},
    i_spell_demon_scythe:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:35,useTime:24,crit:6,knockback:4,mana:10,projectile:'demonScythe',velocity:7,pierce:3},
    i_staff_flower_fire:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:48,useTime:20,crit:6,knockback:4,mana:12,projectile:'fireball',velocity:10,explosion:38},
    i_spell_crystal_storm:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:42,useTime:8,crit:8,knockback:1,mana:4,projectile:'crystal',velocity:13,autoReuse:true,pierce:2,spread:0.12},
    i_harp_hallowed:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:58,useTime:17,crit:8,knockback:2,mana:8,projectile:'note',velocity:11,bounce:2,pierce:2},
    i_staff_chlorophyte:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:72,useTime:14,crit:9,knockback:3,mana:10,projectile:'leafBolt',velocity:12,homing:true,pierce:2},
    i_staff_nebula:{kind:'magic',damageClass:'magic',useStyle:'staff',dmg:110,useTime:10,crit:12,knockback:3,mana:12,projectile:'nebulaFlame',velocity:13,homing:true,autoReuse:true,explosion:28},

    // 四职业补全：召唤
    i_staff_slime:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:8,useTime:30,mana:8,minion:'slimeMinion',slots:1},
    i_staff_hornet:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:16,useTime:30,mana:10,minion:'hornetMinion',slots:1},
    i_staff_imp:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:28,useTime:30,mana:10,minion:'impMinion',slots:1},
    i_staff_spider:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:38,useTime:28,mana:10,minion:'spiderMinion',slots:1},
    i_staff_pirate:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:50,useTime:28,mana:12,minion:'pirateMinion',slots:1},
    i_staff_sphere:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:70,useTime:25,mana:14,minion:'sphereMinion',slots:1},
    i_staff_stardust_dragon:{kind:'minionStaff',damageClass:'summon',useStyle:'summon',dmg:105,useTime:24,mana:16,minion:'stardustDragon',slots:1},

    // 职业装备
    i_summoner_emblem:{kind:'acc',effect:'summonDmg'},
    i_helm_wizard:{kind:'armor',slot:'head',def:3,set:'wizard',bonuses:{magicDamage:0.08,manaCost:-0.05}},
    i_chest_wizard:{kind:'armor',slot:'body',def:4,set:'wizard',bonuses:{magicDamage:0.08}},
    i_legs_wizard:{kind:'armor',slot:'legs',def:3,set:'wizard',bonuses:{magicCrit:5}},
    i_helm_spider:{kind:'armor',slot:'head',def:8,set:'spider',bonuses:{summonDamage:0.08,minions:1}},
    i_chest_spider:{kind:'armor',slot:'body',def:10,set:'spider',bonuses:{summonDamage:0.08}},
    i_legs_spider:{kind:'armor',slot:'legs',def:8,set:'spider',bonuses:{summonDamage:0.08}},
    i_helm_vortex:{kind:'armor',slot:'head',def:18,set:'vortex',bonuses:{rangedDamage:0.12,rangedCrit:6}},
    i_chest_vortex:{kind:'armor',slot:'body',def:28,set:'vortex',bonuses:{rangedDamage:0.12,ammoSave:0.15}},
    i_legs_vortex:{kind:'armor',slot:'legs',def:20,set:'vortex',bonuses:{rangedDamage:0.10,attackSpeed:0.08}},
    i_helm_stardust:{kind:'armor',slot:'head',def:16,set:'stardust',bonuses:{summonDamage:0.12,minions:1}},
    i_chest_stardust:{kind:'armor',slot:'body',def:24,set:'stardust',bonuses:{summonDamage:0.15,minions:1}},
    i_legs_stardust:{kind:'armor',slot:'legs',def:18,set:'stardust',bonuses:{summonDamage:0.12,minions:1}}
  };

  // 兼容旧武器数据并接通职业字段
  for(const key in ITEM){
    const it=ITEM[key];
    if(it.kind==='sword'){
      it.damageClass=it.damageClass||'melee'; it.useStyle=it.useStyle||'swing';
      it.useTime=it.useTime||Math.max(10,26-Math.floor((it.dmg||6)/20)); it.crit=it.crit==null?4:it.crit;
      it.knockback=it.knockback||3; it.reach=it.reach||44;
    } else if(it.kind==='bow'){
      it.damageClass=it.damageClass||'ranged'; it.useStyle=it.useStyle||(key.indexOf('gun')!==-1||key==='i_stynger'?'gun':'bow');
      it.useTime=it.useTime||(it.fast?7:24); it.crit=it.crit==null?4:it.crit; it.knockback=it.knockback||2;
      it.ammo=it.ammo||(it.useStyle==='gun'?'bullet':'arrow'); it.projectile=it.projectile||(it.useStyle==='gun'?'bullet':'arrow'); it.velocity=it.velocity||11;
      if(it.fast) it.autoReuse=true;
    }
  }
  Object.assign(ITEM.i_bee_gun,{damageClass:'ranged',useStyle:'bow',projectile:'beeArrow',ammo:'arrow',velocity:12,useTime:20,homing:true});
  Object.assign(ITEM.i_stynger,{damageClass:'ranged',useStyle:'gun',projectile:'stynger',ammo:'bullet',velocity:13,useTime:16,explosion:42});
  Object.assign(ITEM.i_gun_sdmg,{damageClass:'ranged',useStyle:'gun',projectile:'luminiteBullet',ammo:'bullet',velocity:20,useTime:5,crit:14,spread:0.04,autoReuse:true});
  Object.assign(ITEM.i_staff_prism,{kind:'magic',damageClass:'magic',useStyle:'beam',dmg:120,useTime:3,crit:12,knockback:0,mana:4,projectile:'prismBeam',autoReuse:true});
  Object.assign(ITEM.i_possessed_hatchet,{damageClass:'melee',useStyle:'throw',projectile:'hatchet',velocity:11,useTime:18,homing:true,pierce:3});
  Object.assign(ITEM.i_sword_meowmere,{projectile:'catBlade',velocity:12,useTime:16,bounce:4});

  const SET_BONUSES={
    wood:{def:3,desc:'通用防御 +3'}, copper:{def:3,desc:'通用防御 +3'}, iron:{def:4,desc:'通用防御 +4'}, silver:{def:4,desc:'通用防御 +4'}, gold:{def:5,desc:'通用防御 +5'}, shadow:{def:5,meleeDamage:0.12,attackSpeed:0.08,desc:'近战伤害 +12%，攻速 +8%'},
    bee:{def:2,summonDamage:0.15,minions:1,desc:'召唤伤害 +15%，随从 +1'}, molten:{def:4,meleeDamage:0.18,meleeCrit:6,desc:'近战伤害 +18%，暴击 +6%'},
    hallowed:{def:5,rangedDamage:0.15,rangedCrit:8,ammoSave:0.15,desc:'远程伤害 +15%，弹药节省 +15%'}, chlorophyte:{def:6,magicDamage:0.15,manaCost:-0.12,desc:'魔法伤害 +15%，魔耗 -12%'},
    wizard:{def:2,magicDamage:0.18,magicCrit:8,manaCost:-0.15,desc:'魔法伤害 +18%，魔耗 -15%'}, spider:{def:3,summonDamage:0.20,minions:2,desc:'召唤伤害 +20%，随从 +2'},
    solar:{def:8,meleeDamage:0.25,meleeCrit:12,attackSpeed:0.12,desc:'近战伤害 +25%，暴击 +12%'}, nebula:{def:5,magicDamage:0.25,magicCrit:12,manaCost:-0.20,desc:'魔法伤害 +25%，魔耗 -20%'},
    vortex:{def:6,rangedDamage:0.25,rangedCrit:12,ammoSave:0.25,desc:'远程伤害 +25%，弹药节省 +25%'}, stardust:{def:5,summonDamage:0.25,minions:3,desc:'召唤伤害 +25%，随从 +3'}
  };

  // ===== 合成配方 =====
  // result -> {need:{item:n}, n, station('none'|'workbench'|'furnace'|'anvil')}
  const RECIPES = {
    i_plank:        {need:{i_wood:2},   n:2,  station:'none'},
    i_brick:        {need:{i_stone:2}, n:1,  station:'none'},
    i_torch:        {need:{i_wood:1, i_coal:1}, n:4, station:'none'},
    i_workbench:    {need:{i_wood:10}, n:1,  station:'none'},
    i_platform:     {need:{i_plank:1}, n:2,  station:'none'},
    i_door:         {need:{i_wood:6},  n:1,  station:'none'},
    i_chest:        {need:{i_wood:8, i_iron_bar:2}, n:1, station:'workbench'},
    i_glass:        {need:{i_sand:2},  n:1,  station:'furnace'},
    i_glass_bottle: {need:{i_glass:1}, n:2,  station:'furnace'},
    i_furnace:      {need:{i_stone:25, i_wood:4, i_coal:1}, n:1, station:'workbench'},
    i_anvil:        {need:{i_iron_bar:5}, n:1, station:'workbench'},
    // 锭
    i_copper_bar:   {need:{i_copper_ore:3, i_coal:1}, n:1, station:'furnace'},
    i_iron_bar:     {need:{i_iron_ore:3, i_coal:1},   n:1, station:'furnace'},
    i_silver_bar:   {need:{i_silver_ore:3, i_coal:1}, n:1, station:'furnace'},
    i_gold_bar:     {need:{i_gold_ore:4, i_coal:1},  n:1, station:'furnace'},
    i_demonite_bar: {need:{i_demonite_ore:4},         n:1, station:'furnace'},
    // 工具
    i_pick_wood:    {need:{i_wood:5},  n:1, station:'workbench'},
    i_axe_wood:     {need:{i_wood:5},  n:1, station:'workbench'},
    i_sword_wood:   {need:{i_wood:6},  n:1, station:'workbench'},
    i_pick_copper:  {need:{i_wood:3, i_copper_bar:6}, n:1, station:'anvil'},
    i_axe_copper:   {need:{i_wood:3, i_copper_bar:6}, n:1, station:'anvil'},
    i_sword_copper: {need:{i_wood:2, i_copper_bar:6}, n:1, station:'anvil'},
    i_pick_iron:    {need:{i_wood:3, i_iron_bar:8},   n:1, station:'anvil'},
    i_axe_iron:     {need:{i_wood:3, i_iron_bar:8},   n:1, station:'anvil'},
    i_sword_iron:   {need:{i_wood:2, i_iron_bar:8},   n:1, station:'anvil'},
    i_pick_silver:  {need:{i_wood:3, i_silver_bar:10}, n:1, station:'anvil'},
    i_sword_silver: {need:{i_wood:2, i_silver_bar:10}, n:1, station:'anvil'},
    i_pick_gold:    {need:{i_wood:3, i_gold_bar:12}, n:1, station:'anvil'},
    i_sword_gold:   {need:{i_wood:2, i_gold_bar:12}, n:1, station:'anvil'},
    i_pick_demonite:{need:{i_wood:3, i_demonite_bar:12}, n:1, station:'anvil'},
    i_sword_demonite:{need:{i_wood:2, i_demonite_bar:12}, n:1, station:'anvil'},
    i_bow:          {need:{i_wood:10}, n:1, station:'workbench'},
    i_arrow:        {need:{i_wood:1, i_stone:1}, n:5, station:'workbench'},
    // 盔甲（每件独立配方）
    i_helm_wood:  {need:{i_wood:8},  n:1, station:'workbench'},
    i_chest_wood: {need:{i_wood:12}, n:1, station:'workbench'},
    i_legs_wood:  {need:{i_wood:10}, n:1, station:'workbench'},
    i_helm_copper: {need:{i_copper_bar:10}, n:1, station:'anvil'},
    i_chest_copper:{need:{i_copper_bar:15}, n:1, station:'anvil'},
    i_legs_copper: {need:{i_copper_bar:12}, n:1, station:'anvil'},
    i_helm_iron:   {need:{i_iron_bar:12}, n:1, station:'anvil'},
    i_chest_iron:  {need:{i_iron_bar:18}, n:1, station:'anvil'},
    i_legs_iron:   {need:{i_iron_bar:15}, n:1, station:'anvil'},
    i_helm_silver: {need:{i_silver_bar:14}, n:1, station:'anvil'},
    i_chest_silver:{need:{i_silver_bar:20}, n:1, station:'anvil'},
    i_legs_silver: {need:{i_silver_bar:16}, n:1, station:'anvil'},
    i_helm_gold:   {need:{i_gold_bar:16}, n:1, station:'anvil'},
    i_chest_gold:  {need:{i_gold_bar:24}, n:1, station:'anvil'},
    i_legs_gold:   {need:{i_gold_bar:18}, n:1, station:'anvil'},
    i_helm_shadow:  {need:{i_demonite_bar:12, i_demonite_scale:10}, n:1, station:'anvil'},
    i_chest_shadow:{need:{i_demonite_bar:18, i_demonite_scale:15}, n:1, station:'anvil'},
    i_legs_shadow: {need:{i_demonite_bar:15, i_demonite_scale:12}, n:1, station:'anvil'},
    // 药水
    i_heart:       {need:{i_mushroom:1, i_glass_bottle:1}, n:1, station:'none'},
    i_star:        {need:{i_fallen_star:1, i_glass_bottle:1}, n:1, station:'none'},
    // 召唤物
    i_boss_summon_eoc:{need:{i_lens:6}, n:1, station:'workbench'},
    i_boss_summon_qb:{need:{i_honey:5, i_stinger:1, i_hive:5}, n:1, station:'workbench'},
    // 蜂后装备
    i_bee_gun:{need:{i_stinger:8, i_beeswax:6, i_hive:10}, n:1, station:'anvil'},
    i_sword_bee:{need:{i_stinger:12, i_beeswax:8}, n:1, station:'anvil'},
    i_helm_bee:{need:{i_beeswax:8, i_hive:6}, n:1, station:'anvil'},
    i_chest_bee:{need:{i_beeswax:12, i_hive:10}, n:1, station:'anvil'},
    i_legs_bee:{need:{i_beeswax:10, i_hive:8}, n:1, station:'anvil'},
    // 地狱
    i_hellstone_bar:{need:{i_hellstone:3, i_ash:1}, n:1, station:'furnace'},
    i_hellbrick:{need:{i_hellstone:1, i_stone:1}, n:1, station:'furnace'},
    i_pick_molten:{need:{i_hellstone_bar:20}, n:1, station:'anvil'},
    i_sword_molten:{need:{i_hellstone_bar:20}, n:1, station:'anvil'},
    i_axe_molten:{need:{i_hellstone_bar:15}, n:1, station:'anvil'},
    i_helm_molten:{need:{i_hellstone_bar:10}, n:1, station:'anvil'},
    i_chest_molten:{need:{i_hellstone_bar:20}, n:1, station:'anvil'},
    i_legs_molten:{need:{i_hellstone_bar:15}, n:1, station:'anvil'},
    // 困难模式
    i_cobalt_bar:{need:{i_cobalt_ore:3}, n:1, station:'furnace'},
    i_mythril_bar:{need:{i_mythril_ore:4}, n:1, station:'furnace'},
    i_adamantite_bar:{need:{i_adamantite_ore:4}, n:1, station:'furnace'},
    i_pick_cobalt:{need:{i_cobalt_bar:15}, n:1, station:'anvil'},
    i_sword_cobalt:{need:{i_cobalt_bar:12}, n:1, station:'anvil'},
    i_pick_mythril:{need:{i_mythril_bar:15}, n:1, station:'anvil'},
    i_pick_adamantite:{need:{i_adamantite_bar:18}, n:1, station:'anvil'},
    // 机械召唤
    i_mech_worm:{need:{i_iron_bar:5, i_rotten_chunk:6}, n:1, station:'anvil'},
    i_mech_eye:{need:{i_iron_bar:5, i_lens:3}, n:1, station:'anvil'},
    i_mech_skull:{need:{i_iron_bar:5, i_bone:30}, n:1, station:'anvil'},
    // 神圣锭：三魂 + 精金
    i_hallowed_bar:{need:{i_adamantite_bar:1, i_soul_might:1, i_soul_sight:1, i_soul_fright:1}, n:2, station:'anvil'},
    i_sword_excalibur:{need:{i_hallowed_bar:12}, n:1, station:'anvil'},
    i_helm_hallowed:{need:{i_hallowed_bar:12}, n:1, station:'anvil'},
    i_chest_hallowed:{need:{i_hallowed_bar:24}, n:1, station:'anvil'},
    i_legs_hallowed:{need:{i_hallowed_bar:18}, n:1, station:'anvil'},
    // 叶绿（世纪之花后）
    i_chlorophyte_bar:{need:{i_chlorophyte_ore:6}, n:1, station:'furnace'},
    i_pick_chlorophyte:{need:{i_chlorophyte_bar:18}, n:1, station:'anvil'},
    i_sword_chlorophyte:{need:{i_chlorophyte_bar:15}, n:1, station:'anvil'},
    i_helm_chlorophyte:{need:{i_chlorophyte_bar:18}, n:1, station:'anvil'},
    i_chest_chlorophyte:{need:{i_chlorophyte_bar:30}, n:1, station:'anvil'},
    i_legs_chlorophyte:{need:{i_chlorophyte_bar:24}, n:1, station:'anvil'},
    // 世纪之花召唤物（合成备用）
    i_plantera_bullet:{need:{i_chlorophyte_bar:1, i_stinger:5}, n:1, station:'workbench'},
    // 夜明
    i_luminite_bar:{need:{i_luminite:4}, n:1, station:'furnace'},
    // 终极武器（碎片+夜明）
    i_sword_meowmere:{need:{i_luminite_bar:18, i_solar_fragment:20}, n:1, station:'anvil'},
    i_gun_sdmg:{need:{i_luminite_bar:18, i_vortex_fragment:20}, n:1, station:'anvil'},
    i_staff_prism:{need:{i_luminite_bar:18, i_nebula_fragment:20}, n:1, station:'anvil'},
    i_wing_stardust:{need:{i_stardust_fragment:20, i_luminite_bar:10}, n:1, station:'anvil'},
    // 终极盔甲
    i_helm_solar:{need:{i_luminite_bar:12, i_solar_fragment:14}, n:1, station:'anvil'},
    i_chest_solar:{need:{i_luminite_bar:20, i_solar_fragment:20}, n:1, station:'anvil'},
    i_legs_solar:{need:{i_luminite_bar:15, i_solar_fragment:16}, n:1, station:'anvil'},
    i_helm_nebula:{need:{i_luminite_bar:10, i_nebula_fragment:12}, n:1, station:'anvil'},
    i_chest_nebula:{need:{i_luminite_bar:16, i_nebula_fragment:18}, n:1, station:'anvil'},
    i_legs_nebula:{need:{i_luminite_bar:12, i_nebula_fragment:14}, n:1, station:'anvil'},
    // 远程职业路线
    i_bullet:{need:{i_iron_bar:1},n:25,station:'anvil'},
    i_bow_gold:{need:{i_wood:5,i_gold_bar:8},n:1,station:'anvil'},
    i_bow_molten:{need:{i_hellstone_bar:18},n:1,station:'anvil'},
    i_rifle_clockwork:{need:{i_iron_bar:12,i_soul_sight:8},n:1,station:'anvil'},
    i_repeater_hallowed:{need:{i_hallowed_bar:14},n:1,station:'anvil'},
    i_gun_vortex:{need:{i_vortex_fragment:18,i_luminite_bar:10},n:1,station:'anvil'},
    // 魔法职业路线
    i_staff_amethyst:{need:{i_wood:8,i_gem_amethyst:6},n:1,station:'workbench'},
    i_staff_topaz:{need:{i_copper_bar:8,i_gem_topaz:6},n:1,station:'anvil'},
    i_staff_sapphire:{need:{i_silver_bar:8,i_gem_sapphire:6},n:1,station:'anvil'},
    i_spell_demon_scythe:{need:{i_demonite_bar:10,i_rotten_chunk:8},n:1,station:'anvil'},
    i_staff_flower_fire:{need:{i_hellstone_bar:16,i_fallen_star:6},n:1,station:'anvil'},
    i_spell_crystal_storm:{need:{i_soul_sight:10,i_gem_sapphire:8},n:1,station:'anvil'},
    i_harp_hallowed:{need:{i_hallowed_bar:14,i_fallen_star:8},n:1,station:'anvil'},
    i_staff_chlorophyte:{need:{i_chlorophyte_bar:16,i_gem_emerald:8},n:1,station:'anvil'},
    i_staff_nebula:{need:{i_nebula_fragment:18,i_luminite_bar:10},n:1,station:'anvil'},
    // 召唤职业路线
    i_staff_slime:{need:{i_wood:8,i_mushroom:6},n:1,station:'workbench'},
    i_staff_hornet:{need:{i_beeswax:12,i_stinger:8},n:1,station:'anvil'},
    i_staff_imp:{need:{i_hellstone_bar:16},n:1,station:'anvil'},
    i_staff_spider:{need:{i_rotten_chunk:20,i_soul_fright:8},n:1,station:'anvil'},
    i_staff_pirate:{need:{i_gold_bar:16,i_soul_might:10},n:1,station:'anvil'},
    i_staff_sphere:{need:{i_chlorophyte_bar:16,i_soul_fright:12},n:1,station:'anvil'},
    i_staff_stardust_dragon:{need:{i_stardust_fragment:18,i_luminite_bar:10},n:1,station:'anvil'},
    // 职业护甲
    i_helm_wizard:{need:{i_wood:8,i_fallen_star:4},n:1,station:'workbench'},
    i_chest_wizard:{need:{i_wood:12,i_fallen_star:6},n:1,station:'workbench'},
    i_legs_wizard:{need:{i_wood:10,i_fallen_star:4},n:1,station:'workbench'},
    i_helm_spider:{need:{i_rotten_chunk:16,i_soul_fright:5},n:1,station:'anvil'},
    i_chest_spider:{need:{i_rotten_chunk:24,i_soul_fright:8},n:1,station:'anvil'},
    i_legs_spider:{need:{i_rotten_chunk:20,i_soul_fright:6},n:1,station:'anvil'},
    i_helm_vortex:{need:{i_luminite_bar:12,i_vortex_fragment:14},n:1,station:'anvil'},
    i_chest_vortex:{need:{i_luminite_bar:20,i_vortex_fragment:20},n:1,station:'anvil'},
    i_legs_vortex:{need:{i_luminite_bar:15,i_vortex_fragment:16},n:1,station:'anvil'},
    i_helm_stardust:{need:{i_luminite_bar:12,i_stardust_fragment:14},n:1,station:'anvil'},
    i_chest_stardust:{need:{i_luminite_bar:20,i_stardust_fragment:20},n:1,station:'anvil'},
    i_legs_stardust:{need:{i_luminite_bar:15,i_stardust_fragment:16},n:1,station:'anvil'},
    // 天界符咒（直接召唤月亮领主）
    i_celestial_sigil:{need:{i_solar_fragment:12, i_nebula_fragment:12, i_vortex_fragment:12, i_stardust_fragment:12}, n:1, station:'anvil'},
  };

  // ===== 商店（商人出售） =====
  // item -> price 铜币
  const SHOP = {
    i_torch:  50,
    i_wood:   10,
    i_arrow:  3,
    i_heart:  500,
    i_star:   500,
    i_iron_bar:150,
    i_copper_bar:75,
    i_glass_bottle:20,
    i_mushroom:40
  };

  // ===== 物品放置的 tile 映射（用于 useItem） =====
  const PLACE_TILE = {};
  for(const k in ITEM){ if(ITEM[k].kind==='place' && ITEM[k].tile) PLACE_TILE[k]=TILE_BY_NAME[ITEM[k].tile]; }

  // ===== 掉落表：怪物死亡掉落 =====
  // monster -> [[item, min, max, chance]]
  const DROPS = {
    slime:  [['i_copper_coin',5,15,1], ['i_mushroom',0,1,0.2], ['i_glass_bottle',0,1,0.1]],
    zombie: [['i_copper_coin',10,20,1], ['i_rotten_chunk',0,1,0.4], ['i_lens',0,1,0.05]],
    demon_eye:[['i_copper_coin',10,20,1], ['i_lens',1,1,0.5], ['i_rotten_chunk',0,1,0.3]],
    eoc:    [['i_demonite_ore',10,20,1], ['i_demonite_scale',5,10,1], ['i_gold_coin',1,2,1], ['i_acc_shield',1,1,0.4]],
    eow:    [['i_aegis',0,0,0]], // 占位：世界吞噬者特殊掉落（分段给），见 boss.js
    hornet: [['i_stinger',0,1,0.5], ['i_copper_coin',8,18,1]],
    queenbee:[['i_beeswax',8,16,1], ['i_stinger',5,12,1], ['i_hive',10,20,1], ['i_gold_coin',1,2,1], ['i_bee_gun',1,1,0.25]],
    skeletron:[['i_bone',20,40,1], ['i_gold_coin',2,4,1], ['i_dungeon_key',1,1,1]],
    demon:[['i_copper_coin',15,30,1], ['i_voodoo_doll',0,1,0.08], ['i_hellstone',0,2,0.15]],
    wof:[['i_pwnhammer',1,1,1], ['i_gold_coin',5,10,1], ['i_warrior_emblem',1,1,0.25], ['i_ranger_emblem',1,1,0.25], ['i_sorcerer_emblem',1,1,0.25], ['i_summoner_emblem',1,1,0.25], ['i_hellstone_bar',10,20,1]],
    destroyer:[['i_soul_might',20,40,1], ['i_gold_coin',8,15,1], ['i_hallowed_bar',5,15,0.5]],
    twins:[['i_soul_sight',20,40,1], ['i_gold_coin',8,15,1], ['i_hallowed_bar',5,15,0.5]],
prime:[['i_soul_fright',20,40,1], ['i_gold_coin',8,15,1], ['i_hallowed_bar',5,15,0.5]],
    plantera:[['i_temple_key',1,1,1], ['i_chlorophyte_ore',15,30,1], ['i_gold_coin',10,20,1], ['i_stynger',1,1,0.2]],
    golem:[['i_golem_eye',1,1,0.5], ['i_possessed_hatchet',1,1,0.25], ['i_chlorophyte_bar',15,30,1], ['i_gold_coin',15,30,1]],
    cultist:[['i_gold_coin',15,25,1], ['i_ancient_manipulator',1,1,1]],
    pillar_solar:[['i_solar_fragment',12,60,1]],
    pillar_nebula:[['i_nebula_fragment',12,60,1]],
    pillar_vortex:[['i_vortex_fragment',12,60,1]],
    pillar_stardust:[['i_stardust_fragment',12,60,1]],
    moonlord:[['i_luminite',60,90,1], ['i_gold_coin',30,50,1], ['i_sword_meowmere',1,1,0.11], ['i_gun_sdmg',1,1,0.11], ['i_staff_prism',1,1,0.11]]
  };

  window.DATA={TILES, TILE_BY_NAME, NAMES, ITEM, RECIPES, SHOP, PLACE_TILE, DROPS, SET_BONUSES};
})();
