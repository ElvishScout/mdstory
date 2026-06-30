---
title: 深空信号
globals:
  knowledge: 0
  crewMorale: 80
  inventory: []
  flags: {}
---

# 深空信号

<script>
  export default {
    globals() {
      return {
        knowledge: 0,
        crewMorale: 80,
        inventory: [],
        flags: {},
      };
    },
    onStart({ globals }) {
      globals.flags.storyStarted = true;
    },
  };
</script>

<style>
  .danger { color: #e74c3c; font-weight: bold; }
  .system { color: #3498db; }
  .alien { color: #2ecc71; font-style: italic; }
  .warning { color: #f39c12; }
  .clue { color: #9b59b6; font-style: italic; }
  .log { color: #7f8c8d; font-family: monospace; }
</style>

_公元 2247 年。深空科考舰"曙光号"在执行例行深空扫描任务时，收到了一段来自编号为 K-427 星系的异常信号。这个星系在两百年前就被标记为"无生命迹象"——它的恒星在千万年前已经熄灭，剩下几颗冰冷的行星在黑暗中运行。理论上，那里不应该有任何东西能发出信号。_

_但信号确实存在。它每隔 7 分 13 秒重复一次，频率稳定，显然是人工信号——或者说，智慧生命制造的信号。最令人不安的是：信号循环了三次后，中间出现了一段被加密的嵌套信息。曙光号的量子计算机花了两个小时才解开第一层加密——解开之后，计算机给出的分析报告只有一行字。_

_那一行字是："不要来。"_

_你是曙光号的指挥官。信号还在源源不断地从 K-427 传来——而你的任务是决定曙光号的下一步行动。_

!include("./chapter1.md")
!include("./chapter2.md")
!include("./chapter3.md")
!include("./endings.md")
