# Map Lab Components AI 通用安装与使用说明

这份组件包可以帮助不同 AI 产品复用 Map Lab 的地图组件样式，包括点、路线、组合路线和区域高亮。

## 先了解一件事

不同 AI 产品对 Skill、Rules、Knowledge 和 Project Files 的支持方式不同，因此目前没有一个适用于所有 AI 的“一键安装目录”。

最通用、最稳定的方法是把它当成一个 **AI 项目上下文包**：

1. 把 `map-lab-components` 文件夹放进要开发的代码项目。
2. 让 AI 先读取其中的 `SKILL.md`。
3. AI 根据任务继续读取 `references/`，并从 `assets/` 复制所需模板和素材。

这种方式不依赖某个 AI 产品的专用功能，只要 AI 能读取项目文件，就可以使用。

## 你会拿到什么

- `map-lab-components/`：组件规范、执行流程、模板与 SVG 素材。
- `dist/map-lab-components.zip`：适合安装到 Codex 的 Skill 压缩包。
- `dist/map-lab-components-universal.zip`：包含本说明和组件包，适合发给使用其他 AI 产品的同事。
- 本文件：给第一次使用的设计师、产品经理和开发同学看的说明。

## 通用方法：适用于大多数 AI 产品

### 第一步：解压

下载并双击 `map-lab-components-universal.zip`，解压后会看到：

```text
README.md
map-lab-components/
  SKILL.md
  references/
  assets/
```

### 第二步：放进项目

把整个 `map-lab-components` 文件夹放进代码项目，例如：

```text
你的项目/
  ai-context/
    map-lab-components/
      SKILL.md
      references/
      assets/
  src/
  package.json
```

`ai-context` 只是推荐名称，也可以使用团队已有的 `docs`、`rules` 或 `knowledge` 目录。

### 第三步：把这段话发给 AI

第一次在该项目中使用时，复制下面这段提示：

```text
请先读取 ai-context/map-lab-components/SKILL.md，并把它作为本次地图组件任务的实现规范。
根据我的任务按需读取该目录下的 references 文件，并优先复用 assets 中的模板和 SVG。
不要修改 Google Maps 的业务数据、API 调用和云端 Map Style；不要自行发明组件样式。
读取完成后，先简短告诉我你准备复用哪个 Map Lab 组件和哪种 Google Maps 技术，再开始实现。
```

然后继续写你的真实需求，例如：

```text
请在现有配送地图中加入 Normal 点，支持 Default、Disable 和 Completed 状态。
```

### 第四步：让 AI 验证

实现后可以继续发送：

```text
请运行项目构建，并在浏览器中检查地图、组件尺寸、hover、selected、锚点和清理逻辑。
```

## 根据 AI 能力选择使用方式

### A. AI 支持原生 Skill

把完整的 `map-lab-components` 文件夹放进该产品规定的 Skills 目录，然后重启或新建对话。

安装后确认 AI 能读取：

```text
map-lab-components/SKILL.md
```

不同产品的 Skills 路径可能不同，请以该产品当前版本的官方说明为准。

### B. AI 支持项目 Rules 或长期项目指令

先按照上面的通用方法把组件包放进项目，再在该 AI 的项目规则中增加一条很短的指针：

```text
处理 Google Maps、地图点、路线或区域组件时，必须先读取
ai-context/map-lab-components/SKILL.md，并遵循其中的组件选择、样式和验证规则。
```

不要把整个 `SKILL.md` 复制进 Rules。保留一个文件指针更容易维护，组件包更新后也不需要同步多份内容。

### C. AI 只能上传文件或创建知识库

1. 先解压压缩包，不要只上传 zip。
2. 上传 `SKILL.md`。
3. 根据任务上传对应的 `references` 文件。
4. 需要生成代码时，再上传对应的 `assets` 文件或整个 assets 文件夹。
5. 在对话开头粘贴“第三步”的固定提示。

如果平台不能读取文件夹层级，可以保持文件名不变，并告诉 AI 哪些文件原本属于 `references` 和 `assets`。

## Codex 专用安装方法

### 用 Finder 安装

1. 下载 `map-lab-components.zip`。
2. 双击压缩包，得到 `map-lab-components` 文件夹。
3. 打开 Finder，按 `Command + Shift + G`。
4. 输入 `~/.codex/skills`，然后按回车。
5. 把整个 `map-lab-components` 文件夹拖进该目录。
6. 完全退出并重新打开 Codex。

安装后请确认文件位置是：

```text
~/.codex/skills/map-lab-components/SKILL.md
```

不要只放入压缩包，也不要多套一层同名文件夹。

### 用终端安装

假设压缩包在“下载”文件夹，依次执行：

```bash
mkdir -p ~/.codex/skills
unzip ~/Downloads/map-lab-components.zip -d ~/.codex/skills
```

然后完全退出并重新打开 Codex。

### 在 Codex 中调用

```text
$map-lab-components 用 Normal 点在现有 Google Map 上展示配送位置。
```

如果输入 `$` 后能在 Skill 列表里看到 **Map Lab Components**，说明安装成功。

## 给设计师的使用方式

设计师不需要先会写代码，可以直接描述：

```text
请按照 map-lab-components/SKILL.md，分析这个页面适合使用哪种 Map Lab 点组件。
只给出组件选择、状态、尺寸和使用限制，暂时不要修改代码。
```

也可以附上 Figma 链接或截图，让 AI 在现有组件中匹配。请明确要求不要自行发明新组件或近似样式。

## 给开发同学的使用方式

请同时告诉 AI：

- 项目技术栈，例如 React + TypeScript + Vite
- 现有地图组件文件路径
- 想使用的 Map Lab 组件名称
- 点位、路线或区域数据从哪里来
- 需要哪些状态和交互
- 当前 Google Maps loader 和 Map ID 在哪里配置

AI 应复用现有地图实例，不应为了一个组件再创建一张地图。

## 使用前需要准备什么

组件包不包含 Google Maps API Key，也不会共享账号密码。项目需要自行准备：

- Google Maps JavaScript API Key
- 已绑定云端地图样式的 Map ID
- Google Maps JavaScript API
- Advanced Marker 使用的 `marker` library

建议把配置写在项目环境变量中，例如：

```text
VITE_GOOGLE_MAPS_API_KEY=你的_API_Key
VITE_GOOGLE_MAPS_MAP_ID=你的_Map_ID
```

不要把真实 API Key 发在群聊、截图、AI 提示词或公开仓库里。

## 更新组件包

收到新版本后：

1. 备份团队自行修改过的文件。
2. 用新的 `map-lab-components` 文件夹替换旧文件夹。
3. 重启 AI 客户端，或新建一个对话。
4. 再次使用固定提示，让 AI 重新读取 `SKILL.md`。

不要只替换 `SKILL.md`。样式、参考文档和 SVG 素材可能也会一起更新。

## 常见问题

**其他 AI 没有 Skill 功能，还能用吗？**

可以。使用“通用方法”，把组件包放进项目并让 AI 读取 `SKILL.md` 即可。

**AI 看不到项目文件怎么办？**

解压后上传 `SKILL.md`、相关 references 和所需 assets。只粘贴一句组件名称通常不足以准确还原。

**地图能显示，但 Advanced Marker 不显示**

检查地图是否配置 Map ID，并确认加载了 `marker` library。

**路线为什么不是 Advanced Marker**

Advanced Marker 适合点。路线主体应使用 Polyline 或 OverlayView，两端 pin 才使用 Advanced Marker。

**组件包会不会带走 API Key**

不会。组件包只包含规范、模板和素材，不包含真实 API Key、Map ID 或账号信息。
