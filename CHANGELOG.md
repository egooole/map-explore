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
