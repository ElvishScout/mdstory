---
title: 深空信号
scope:
  crewName: 指挥官
  log: []
  flags: {}
---

<style>
body { background: #0a0a0f; color: #c8d6e5; }
</style>

_公元 2247 年，深空探测舰"回声号"在柯伊伯带外侧执行例行扫描任务。_

_你是指挥官。舰桥的灯光调得很暗，全息星图在空气中缓慢旋转。过去 72 小时一切正常——直到刚才，通讯官报告接收到一段来源不明的信号。_

_信号很弱，但结构完整。不是宇宙背景噪音，不是脉冲星的定期闪烁，而是一段经过编码的信息。计算机已经完成了初步分析。_

_现在你需要做出决定。_

# 回声号

<script>
export default {
  scope() {
    return {
      shipStatus: "正常",
      signalStrength: 72,
      crewMorale: 80,
    };
  },
  onEnter({ scope }) {
    scope.flags.storyStarted = true;
  },
};
</script>

<style>
.danger { color: #e74c3c; }
.info { color: #3498db; font-style: italic; }
</style>

舰桥的全息屏幕上跳动着信号波形。通讯官转过头看着你。

"长官，信号来源可以锁定。但它不是从任何已知的星域发出的——它的红移量对应大约两万光年外的某个点。如果数据正确，这个信号在人类发明农耕之前就已经在路上了。"

你看着波形图。它确实不像自然现象。

{{#nav "bridge"}}进入舰桥{{/nav}}

## 舰桥 {#bridge}

<script>
export default {
  scope({ scope }) {
    return {
      location: "舰桥",
      alertLevel: 0,
    };
  },
  onEnter({ scope }) {
    scope.flags.visitedBridge = true;
    scope.log.push("抵达舰桥");
  },
};
</script>

<style>
.bridge-status { color: #2ecc71; }
</style>

<span class="bridge-status">位置：舰桥 | 舰船状态：{{shipStatus}} | 信号强度：{{signalStrength}}%</span>

舰桥呈半圆形。你的指挥席位于最高处，俯瞰着下方两排操作台。舵手、通讯官、科学官——每个人都在自己的岗位上。

你需要决定下一步行动。信号还在持续接收中。

{{#nav "bridge.signal"}}让科学官分析信号{{/nav}}
{{#nav "engine.activate"}}去引擎室检查动力系统{{/nav}}

### 分析信号 {#signal}

<script>
export default {
  onEnter({ scope }) {
    scope.flags.analyzingSignal = true;
    scope.signalStrength = 85;
  },
  view({ scope }) {
    return {
      signalStrength: scope.signalStrength,
      crewName: scope.crewName,
    };
  },
};
</script>

科学官的手指在全息面板上滑动。信号被分解成频率、振幅、相位三个维度。

"长官，这不是自然信号。"她的声音压得很低。"它包含 2048 个比特的重复序列。如果是自然现象，不会出现这种精确的周期结构。"

她停顿了一下。

"而且序列中有一段……像是某种数学常数。π 的前 128 位。任何文明要发送星际信息，π 是最好的通用语言。"

信号强度上升到 {{signalStrength}}%。波形越来越清晰了。

{{#nav "bridge.signal.decode"}}让科学官深度解码{{/nav}}
{{#nav "engine.activate"}}去引擎室——信号可能在干扰动力系统{{/nav}}

#### 深度解码 {#decode}

<script>
export default {
  scope({ scope }) {
    return {
      decoded: 0,
      message: "",
    };
  },
  onEnter({ scope }) {
    scope.flags.deepDecoding = true;
    scope.decoded = 30;
  },
  view({ scope }) {
    return { decoded: scope.decoded };
  },
};
</script>

<style>
.decode-progress { color: #f39c12; }
</style>

<span class="decode-progress">解码进度：{{decoded}}%</span>

计算机开始全功率运行。信号一层层被剥开——外层是定位信标，中间是数学语言的基础字典，最内层是一段极短的信息。

解码还在进行中。你站在科学官身后，看着数据一行行跳出来。

已经解出的片段让你手心出汗——信息中包含了某种坐标。不是星图坐标，而是更抽象的东西：像是在描述一个位置，但这个位置不在三维空间里。

{{#nav "bridge.signal.decode.raw"}}查看原始数据流{{/nav}}

##### 原始数据 {#raw}

<script>
export default {
  onEnter({ scope }) {
    scope.decoded = 65;
    scope.message = "WE WERE HERE. THE DOOR IS OPEN.";
  },
  view({ scope }) {
    return {
      decoded: scope.decoded,
      message: scope.message,
      crewName: scope.crewName,
    };
  },
};
</script>

<span class="decode-progress">解码进度：{{decoded}}%</span>

数据流在屏幕上展开。经过计算机的翻译，信息变成了可以阅读的文字：

<div class="info">"{{message}}"</div>

两千亿年前的文明。他们曾经打开了某扇"门"，然后消失了。

信息末尾附有一串数值——不是坐标，是某种频率参数。科学官检查之后发现，这个频率恰好对应回声号引擎可以产生的共振频率。

"长官——如果我们把引擎调到这个频率……我们可能会打开同样的'门'。"

{{#nav "engine.activate"}}前往引擎室{{/nav}}

## 引擎室 {#engine}

<script>
export default {
  scope({ scope }) {
    return {
      location: "引擎室",
      engineFrequency: 0,
    };
  },
  onEnter({ scope }) {
    scope.flags.visitedEngine = true;
    scope.log.push("抵达引擎室");
  },
};
</script>

<style>
.engine-warning { color: #e67e22; }
</style>

<span class="engine-warning">位置：引擎室 | 舰船状态：{{shipStatus}} | 士气：{{crewMorale}}</span>

引擎室在舰船底层。巨大的聚变核心发出深蓝色的光芒，周围的冷却管道上凝结着细密的水珠。总工程师从维修通道里钻出来，满脸油污。

"指挥官，引擎可以调到那个频率——但我不保证会发生什么。共振频率和我们的标准运行参数差得太远了。一旦调整，可能有三件事：一，什么事都没有。二，引擎过载，我们得在备用电池上飘两个月。三——"

她犹豫了一下。

"三，我们可能会到达一个从未有人去过的地方。"

{{#nav "engine.activate"}}下令调整引擎频率{{/nav}}

### 引擎共振 {#activate}

<script>
export default {
  onEnter({ scope }) {
    scope.flags.engineActivated = true;
    scope.engineFrequency = 2048;
    scope.shipStatus = "共振中";
  },
  view({ scope }) {
    return {
      engineFrequency: scope.engineFrequency,
      signalStrength: scope.signalStrength,
      decoded: scope.decoded || 0,
      message: scope.message || "(待解码)",
      crewName: scope.crewName,
    };
  },
};
</script>

<style>
.finale { color: #9b59b6; font-size: 1.1em; }
</style>

引擎频率开始攀升。低声的嗡鸣逐渐变成尖锐的共鸣，整个引擎室都在轻微震动。蓝色的核心光芒变成了耀眼的白色。

总工程师盯着仪表盘："频率到达 2048 赫兹——"

光吞没了一切。

——

你睁开眼睛的时候，星图变成了完全陌生的图案。回声号不在太阳系了——甚至不在银河系了。全景窗外是色彩无法用语言描述的星云，恒星以不可能的轨道运行。

通讯面板上还有最后一条收到的信息——来自那个两万光年外的古老文明：

<div class="finale">"WE WERE HERE. NOW YOU ARE TOO."</div>

<span class="info">引擎频率：{{engineFrequency}} Hz | 最后解码：{{decoded}}% | 信息："{{message}}"</span>

{{#nav null}}关闭日志{{/nav}}
