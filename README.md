# 实验项目Demo：一种上下文压缩机制的Skills框架

目的是为了缓解众多Skills载入后导致上下文过长的问题

原理：

加载Skill后agent会在当前上下文中插入<Skill_Start>标签，

开发者可以在md文档中<Skill_End>插入指令的上方指定

Skill的核心推理流程，并在其下方指定最终浓缩结果的输出逻辑



Agent通过<Skill_Start>和<Skill_End>标签来判定需要省略的区域

从当前llm的对话上下文中将需要省略的区域删除剪枝，

只保留对Skill执行过程的浓缩的结论，实现节省上下文

Skills生成的内容需要配合定制的agent进行清理才能发挥效果



题外话：如果Skill的内部调用另一个Skill，

那么就可以像函数调用一样，层层嵌套，入栈出栈，套娃。

SKILL写法可以参考skills文件夹里面的SKILL.md

而且如果让Skills主动暴露接口，告诉llm需要参考哪些数据的话，模块化原子化程度就更高了。
