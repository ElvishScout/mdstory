# MdStory 默认模板

MdStory 内置的默认网页播放器模板，基于 Svelte 5 + TypeScript + Vite + Tailwind CSS 构建。

## 模板选项

通过 `mdstory build` 的 `-O key=value` 传递：

| 选项         | 类型      | 说明                                            |
| ------------ | --------- | ----------------------------------------------- |
| `showHeader` | `boolean` | 是否显示顶部标题栏（含故事标题、保存/加载按钮） |
| `debug`      | `boolean` | 启用调试输出                                    |

```bash
npx mdstory build story.md -O showHeader=true -O debug=true
```

## 额外的 Handlebars helper

默认模板在 MdStory 内置 helper 之外，还提供了：

### `{{embed}}`

嵌入外部资源，渲染为 `<object>` 元素。可用作行内 helper：

```markdown
{{embed "image.png"}}

{{embed "chart.svg" width=400 height=300 label="流程图"}}

{{embed url="https://example.com/file.pdf" mime="application/pdf"}}
```

参数说明：

| 参数               | 说明                                                |
| ------------------ | --------------------------------------------------- |
| 第一个位置参数     | 资源 URL 或 scope 中的 Asset 对象                   |
| `url`              | 资源地址，可覆盖位置参数                            |
| `mime`             | MIME 类型                                           |
| `width` / `height` | 尺寸                                                |
| `label`            | 若提供，则包装在 `<figure>` 中并显示 `<figcaption>` |

## 本地开发

开发模板本身时，使用占位故事启动 Vite：

```bash
cd templates/default
npm install
npm run dev
```

修改 `placeholder.md` 或 `src/` 下的源码，Vite 会热更新。

构建产物（`mdstory build` 实际使用的模板）：

```bash
npm run build
```

产物输出到 `dist/index.html`，CSS/JS 会被内联为单文件。

## 文件结构

```
templates/default/
├── index.html              # HTML 入口，保留 __PARSED_STORY__ 和 __TEMPLATE_OPTIONS__ 占位符
├── placeholder.md          # 本地开发时的占位故事
├── src/
│   ├── main.ts             # 读取 window.PARSED_STORY 并挂载应用
│   ├── App.svelte          # 顶层布局：标题栏、保存/加载
│   ├── components/
│   │   └── StoryPlayer.svelte  # 场景渲染与交互
│   ├── lib/
│   │   ├── adapter.ts      # MdStory 渲染适配器
│   │   └── utils.ts        # HTML 处理工具
│   ├── types.ts            # 本模板扩展的选项类型
│   ├── app.css             # Tailwind CSS 与场景样式
│   └── global.d.ts         # window 全局变量声明
└── vite.config.ts          # 解析 placeholder.md 并打包为单文件
```

关于 MdStory 的故事语法与 CLI 用法，请参阅项目根目录的文档。
