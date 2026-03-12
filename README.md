# 实验项目 LiteSkill：一种上下文压缩机制的Skills框架

**实验项目尚未完善，请谨慎使用。**
先看流程效果演示视频：https://www.bilibili.com/video/BV16Nc6zNEk2

一种针对于优化Skills缓解上下文过长臃肿问题的框架协议，将大量冗余多轮工具调用输入输出文本清除裁剪，实现节省token。

Skill开发者需要遵循规范格式，SKILL写法可以参考skills文件夹里面的SKILL.md，只有在SKILL.md中引入**<CLEAN_SKILL Skill名称ID>**标签，才能够被模型识别为LiteSkill技能，即用于声明当前skill使用LiteSkill上下文回收框架协议

执行上下文回收操作后，从Skill开始执行到结束之间的执行Skill的所有tool返回和assistant推理过程全部被裁剪回收，脚本会将**<CLEAN_SKILL Skill名称ID>**和**</CLEAN_SKILL Skill名称ID>**之间的冗余信息（包括Skill描述信息）清空。

只保留对Skill执行过程的浓缩的结论，实现节省上下文

## 可兼容搭配Openclaw运行

注入Openclaw的原理：

使用nodejs编写中间代理脚本，openclaw的请求会流经代理，

代理进行回收协议规则提示词的注入以及上下文的裁剪。

# 其他设想：

如果Skill的内部调用另一个Skill，

那么就可以像函数调用一样，层层嵌套，入栈出栈，套娃。

如果让Skills主动暴露接口，告诉llm需要参考哪些数据的话，模块化原子化程度就更高了。
