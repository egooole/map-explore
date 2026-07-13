## [0.8.3] - 2026-07-13
**改动类型**：新增
**涉及区域**：ComponentCard、MapCanvas、componentSpecs.json、i18n、map.css、types.ts
**变更描述**：将 Figma 中“定位/有信息”点组件接入组件手册的 Informated location，使用本地 SVG 还原默认、Disable、已完成、强化四个基础状态；有有效 mapId 时可走 Google Maps Advanced Marker，否则自动退回稳定的 OverlayView。
**影响面**：影响 Component Manual 的 Informated location 组件预览、样式说明、FakeMod 信息与代码示例；Normal 点组件仍使用现有轻量 overlay；无破坏性变更。
**关联需求**：接入 Figma Informated location 组件设计

## [0.8.2] - 2026-07-13
**改动类型**：新增
**涉及区域**：ComponentCard、MapCanvas、componentSpecs.json、i18n、map.css
**变更描述**：将 Figma 中“定位/无信息”点组件接入组件手册的「实体地图 / 点」第一个组件，地图内以疏密分布展示默认、弱化、已完成、强化四个基础状态，并将 hover&selected 作为默认、已完成、强化的交互态。
**影响面**：影响 Component Manual 的第一个点组件预览、交互与说明；保持地图作为唯一组件预览区域，代码仍默认折叠；无破坏性变更。
**关联需求**：接入 Figma 点组件设计

## [0.8.1] - 2026-07-13
**改动类型**：重构
**涉及区域**：global.css、styles/*
**变更描述**：将大型 global.css 拆分为 shell、sidebar、controls、map、use-case、manual、responsive 等职责文件，并删除确认未使用的历史手册样式残留。
**影响面**：不改变工作台功能和视觉目标；降低后续 UI 调整时的 CSS 定位成本和样式污染风险；无破坏性变更。
**关联需求**：CSS 瘦身与样式结构整理

## [0.8.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：tokens.css、global.css
**变更描述**：基于 TikTok Design System 共享语义统一整个工作台 UI，收敛为 grouped light surface、轻量导航、文档式面板和一致控件状态。
**影响面**：影响 Browse、Use Case、Manual 三个工作台视图的整体视觉语言；布局结构和业务交互不变；无破坏性变更。
**关联需求**：使用 tiktok-design-system 优化整个工作台 UI

## [0.7.4] - 2026-07-13
**改动类型**：修改
**涉及区域**：global.css
**变更描述**：将左侧工作台导航切换为 Light Mode，统一侧边栏、主内容区和组件手册的浅色视觉语言。
**影响面**：影响全局 Sidebar 视觉样式；导航结构和交互逻辑不变；无破坏性变更。
**关联需求**：工作台整体视觉样式统一

## [0.7.3] - 2026-07-13
**改动类型**：修改
**涉及区域**：ManualScene、global.css
**变更描述**：移除组件手册顶部的具体组件导航，组件详情列表改为直接上下浏览；组件详情主容器由线描边改为轻量面式承载。
**影响面**：影响 Component Manual 的导航层级与组件详情视觉层级；进一步减少视觉分层与重复入口；无破坏性变更。
**关联需求**：组件手册视觉分层精简

## [0.7.2] - 2026-07-13
**改动类型**：修改
**涉及区域**：global.css
**变更描述**：将组件手册详情页切换为与工作台一致的 Light Mode，并将右侧详情面板从多层卡片改为文档式分割线布局。
**影响面**：影响 Component Manual 的视觉层级；减少 Card inside Card 的嵌套感，提高信息密度并保持地图预览为视觉重点；无破坏性变更。
**关联需求**：右侧 Detail Panel 视觉层级与工作台设计语言统一

## [0.7.1] - 2026-07-13
**改动类型**：修复
**涉及区域**：MapCanvas、ComponentCard、global.css
**变更描述**：移除组件手册地图上方额外漂浮的独立组件预览，并将点、线、面效果统一改为地图内部渲染。
**影响面**：影响 Component Manual 中的地图预览呈现；避免重复展示组件效果，不影响其他页面的地图浏览与用例展示。
**关联需求**：地图组件展示方式去重与预览区域简化

## [0.7.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：ManualScene、ComponentCard、global.css
**变更描述**：将组件详情内容板优化为高密度左右布局，并支持当前分类下组件以纵向列表连续浏览；代码保持默认折叠并弱化视觉层级。
**影响面**：影响 Component Manual 视图；提升组件规格浏览效率，保留后续批量增加组件与 Figma MCP 接入的扩展结构；无破坏性变更。
**关联需求**：组件详情页内容板信息密度与设计系统文档化布局优化

## [0.6.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：ManualScene、ComponentCard、componentSpecs.json
**变更描述**：将组件手册升级为地图类型、组件分类、具体组件三层信息架构，并拆分内容板、代码折叠和使用场景模块。
**影响面**：影响 Component Manual 视图；当前使用占位组件数据，后续可按 mapTypes/categories/components 结构持续接入 Figma MCP 组件设计；无破坏性变更。
**关联需求**：组件手册模板信息架构与视觉层级优化

## [0.5.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：ManualScene、ComponentCard、componentSpecs.json
**变更描述**：将组件手册改为可扩展的单组件详情页结构，使用大地图预览、组件切换入口和配置驱动的信息面板。
**影响面**：影响 Component Manual 视图；组件信息改为 detailSections/useCases 数据模型，便于后续 Figma MCP 导入更多组件与字段；无破坏性变更。
**关联需求**：组件手册视觉与信息结构调整

## [0.4.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：MapCanvas、mapPresets.ts
**变更描述**：将用户提供的 Google Map 视觉配置翻译为 Maps JavaScript API 可用的浅色地图样式，并应用到实体地图与可视化地图。
**影响面**：影响 Map Browse、Use Case 中所有 Google Maps 底图颜色、道路、水域、POI、交通与文字标签呈现；无破坏性变更。
**关联需求**：配置 Google Map 展示逻辑与颜色

## [0.3.0] - 2026-07-13
**改动类型**：修改
**涉及区域**：MapCanvas、mapPresets.ts、AppShell、README.md
**变更描述**：将所有地图实例从 Leaflet 瓦片底图切换为 Google Maps JavaScript API，并保留实体地图/可视化地图与中英文标签联动。
**影响面**：影响 Map Browse、Use Case 中所有 MapCanvas 渲染；需要配置 VITE_MAP_KEY 才能加载 Google Maps，无破坏性 UI 变更。
**关联需求**：接入 Google Maps

## [0.2.0] - 2026-07-01
**改动类型**：修改
**涉及区域**：AppShell、Sidebar、MainStage、MapCanvas、ParamPanel、PhoneFrame、BusinessCard、ComponentCard
**变更描述**：基于 TikTok Design System 的 grouped surface、语义 token、层级和控件密度原则优化整体视觉质感。
**影响面**：影响 Map Browse、Use Case、Component Manual 三个视图在所有 Map Category 与 Language 组合下的视觉呈现；无破坏性变更。
**关联需求**：使用 tiktok-design-system 优化网站视觉

## [0.1.0] - 2026-07-01
**改动类型**：新增
**涉及区域**：AppShell、Sidebar、MainStage、MapBrowseScene、UseCaseScene、ManualScene、MapCanvas、ParamPanel、PhoneFrame、BusinessCard、ComponentCard、componentSpecs.json
**变更描述**：v0.1.0 项目初始化，完成地图样式工作台单页应用的基础工程、三视图联动、组件手册配置与中英文文案。
**影响面**：首屏默认渲染 Map Browse × Entity Map × 中文；支持三个 View、两类 Map Category、两种 Language 的正交组合，无破坏性变更。
**关联需求**：首次交付
