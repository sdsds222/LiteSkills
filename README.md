# 实验项目 LiteSkills：一种上下文压缩机制的Skills框架

**实验项目尚未完善，请谨慎使用。目前只实验过用Openclaw的openAI接口方式连接Gemini2.5pro，其他的模型可能会不兼容**

先看流程效果演示视频：https://www.bilibili.com/video/BV16Nc6zNEk2

一种针对于优化Skills缓解上下文过长臃肿问题的框架协议，将大量冗余多轮工具调用输入输出文本清除裁剪，实现节省token。

Skill开发者需要遵循规范格式，SKILL写法可以参考skills文件夹里面的SKILL.md，只有在SKILL.md中引入**<CLEAN_SKILL:Skill名称ID>**标签，才能够被模型识别为LiteSkill技能，即用于声明当前skill使用LiteSkill上下文回收框架协议

执行上下文回收操作后，从Skill开始执行到结束之间的执行Skill的所有tool返回和assistant推理过程全部被裁剪回收，脚本会将 **<CLEAN_SKILL:Skill名称ID>** 和 **</CLEAN_SKILL:Skill名称ID>** 之间的冗余信息（包括Skill描述信息）清空。

只保留对Skill执行过程的浓缩的结论，实现节省上下文

## 效果对比：

**Openclaw原始上下文：**

```
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Conversation info (untrusted metadata):\n```json\n{\n  \"message_id\": \"1041\",\n  \"sender_id\": \"6214510669\",\n  \"sender\": \"moyu sdsds222\",\n  \"timestamp\": \"Thu 2026-03-12 16:51 GMT+11\"\n}\n```\n\nSender (untrusted metadata):\n```json\n{\n  \"label\": \"moyu sdsds222 (6214510669)\",\n  \"id\": \"6214510669\",\n  \"name\": \"moyu sdsds222\",\n  \"username\": \"sdsds222\"\n}\n```\n\n使用renamer技能，根据桌面这个2txt文档的内容，重命名"
      }
    ]
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "functioncall14386324231190265224",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"path\":\"~/.openclaw\\\\\\\\workspace\\\\\\\\skills\\\\\\\\auto-renamer\\\\\\\\SKILL.md\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "---\r\nname: auto-renamer\r\ndescription: 读取指定的文本文档内容，提炼核心主题，并自动将其重命名为高度概括的新文件名。\r\ntrigger_keywords:\r\n  - 帮我改名\r\n  - 重命名\r\n  - 自动命名\r\n  - 提炼文件名\r\n---\r\n\r\n执行auto-renamer: 读取文件内容并智能重命名\r\n<SKILL_CLEAN: auto-renamer>\r\n\r\n### 🧠 核心任务执行流程：\r\n\r\n**第一步：内容读取与洞察**\r\n调用系统读取工具（如 `Get-Content`、cat 或 read 工具）查看用户指定的文本文档内容。快速分析并提炼出该文档的核心主题和关键信息。\r\n\r\n**第二步：命名推演**\r\n基于提炼的核心内容，构思 3 个候选文件名。\r\n命名原则：简明扼要、直击重点、严禁使用系统不允许的特殊字符（如 `\\ / : * ? \" < > |`）。\r\n\r\n**第三步：工具调用与重命名**\r\n选定最优的文件名后，自主调用系统执行工具（如 `Rename-Item` 等指令）对该文件进行物理重命名。\r\n\r\n**第四步：总结格式**\r\n【任务状态】：(如：已成功重命名 / 重命名失败)\r\n【文件变更】：(原文件路径及名称)  ->  (新文件路径及名称)\r\n【内容摘要】：(用一句话解释为什么提取这个名字，说明文件的核心内容)",
    "tool_call_id": "functioncall14386324231190265224"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "functioncall14435798203701542372",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"path\":\"~/Desktop/2.txt\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "\r\n\r\n“那么，我们的计划是什么？”我问他。我把背包扔在他房间的地板上。这个房间是整栋房子里代表着平凡的小岛，墙上贴着海报、床铺乱七八糟、电视机前摆着游戏机。这是房子里唯一一处不让人感觉属于亡者的地方。\r\n\r\n“吃披萨、打游戏，老样子，”里奥说。他跪下来启动游戏机。他强装镇定地动作着，但我看见了他脖子上的青筋。\r\n\r\n我们吃着披萨，玩着游戏，有一段时间，我不再想着这座房子，也不再想着蜷缩在其他房间里的死寂。那段时间里，只有我们两个人和屏幕里传来的游戏声。\r\n\r\n快到九点钟时，他暂停了游戏。\r\n\r\n“嘿，老兄，”他说。他没有看我，只是不停地摆弄着手柄。“就是……我父母有个奇怪的规矩。”\r\n\r\n“奇怪的规矩？”\r\n\r\n“嗯。”他抬起头，眼神像石头一样凝重。“晚上九点之后，我们必须待在这，待在卧室里，不能离开。不能去做任何事。不能出去上洗手间，不能出去喝水，什么都不行。门要一直关着，直到日出。”\r\n\r\n我盯着他的脸，试图寻找他开玩笑的破绽，但那并不存在。",
    "tool_call_id": "functioncall14435798203701542372"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "functioncall4679969577065724054",
        "type": "function",
        "function": {
          "name": "exec",
          "arguments": "{\"command\":\"Rename-Item -Path ~/Desktop/2.txt -NewName \\\"九点后的禁闭.txt\\\"\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "(no output)",
    "tool_call_id": "functioncall4679969577065724054"
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "</SKILL_CLEAN: auto-renamer>【任务状态】：已成功重命名\n【文件变更】：C:\\Users\\13633\\Desktop\\2.txt -> C:\\Users\\13633\\Desktop\\九点后的禁闭.txt\n【内容摘要】：文件核心围绕“九点后不能离开房间”的诡异规则展开，营造了密室囚禁的悬疑氛围。"
      }
    ]
  }
```

**使用进行垃圾回收操作优化后的上下文：**

```
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Conversation info (untrusted metadata):\n```json\n{\n  \"message_id\": \"1041\",\n  \"sender_id\": \"6214510669\",\n  \"sender\": \"moyu sdsds222\",\n  \"timestamp\": \"Thu 2026-03-12 16:51 GMT+11\"\n}\n```\n\nSender (untrusted metadata):\n```json\n{\n  \"label\": \"moyu sdsds222 (6214510669)\",\n  \"id\": \"6214510669\",\n  \"name\": \"moyu sdsds222\",\n  \"username\": \"sdsds222\"\n}\n```\n\n使用renamer技能，根据桌面这个2txt文档的内容，重命名"
      }
    ]
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "functioncall14386324231190265224",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"path\":\"~/.openclaw\\\\\\\\workspace\\\\\\\\skills\\\\\\\\auto-renamer\\\\\\\\SKILL.md\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "---\r\nname: auto-renamer\r\ndescription: 读取指定的文本文档内容，提炼核心主题，并自动将其重命名为高度概括的新文件名。\r\ntrigger_keywords:\r\n  - 帮我改名\r\n  - 重命名\r\n  - 自动命名\r\n  - 提炼文件名\r\n---\r\n\r\n执行auto-renamer: 读取文件内容并智能重命名\n[Skill Context Compacted: auto-renamer]",
    "tool_call_id": "functioncall14386324231190265224"
  },
  {
    "role": "assistant",
    "content": "[Execution Process Compacted]",
    "tool_calls": [
      {
        "id": "functioncall14435798203701542372",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"path\":\"~/Desktop/2.txt\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "[Execution Process Compacted]",
    "tool_call_id": "functioncall14435798203701542372"
  },
  {
    "role": "assistant",
    "content": "[Execution Process Compacted]",
    "tool_calls": [
      {
        "id": "functioncall4679969577065724054",
        "type": "function",
        "function": {
          "name": "exec",
          "arguments": "{\"command\":\"Rename-Item -Path ~/Desktop/2.txt -NewName \\\"九点后的禁闭.txt\\\"\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "content": "[Execution Process Compacted]",
    "tool_call_id": "functioncall4679969577065724054"
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "【任务状态】：已成功重命名\n【文件变更】：C:\\Users\\13633\\Desktop\\2.txt -> C:\\Users\\13633\\Desktop\\九点后的禁闭.txt\n【内容摘要】：文件核心围绕“九点后不能离开房间”的诡异规则展开，营造了密室囚禁的悬疑氛围。"
      }
    ]
  }

```

## LiteSkill编写规范示例：

```

---
name: {SKILL_ID}
description: {SKILL_DESCRIPTION}
trigger_keywords:
  - {KEYWORD_1}
  - {KEYWORD_2}
---
# 填写永久保留的信息，开始标签上方的信息不会被清理。

<SKILL_CLEAN: {SKILL_ID}>

# 技能执行流程
# 最终总结

```

## 可兼容搭配Openclaw运行

注入Openclaw的原理：

使用nodejs编写中间代理脚本，openclaw的请求会流经代理，

代理进行回收协议规则提示词的注入以及上下文的裁剪。

# 其他设想：

如果Skill的内部调用另一个Skill，

那么就可以像函数调用一样，层层嵌套，入栈出栈，套娃。

如果让Skills主动暴露接口，告诉llm需要参考哪些数据的话，模块化原子化程度就更高了。
