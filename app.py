import os
import re
import yaml
import sys
from google import genai
from google.genai import types


MY_API_KEY = "" # 请替换为你的实际 API_KEY
MODEL_ID = "gemini-2.5-pro"
SKILLS_DIR = "skills"

class IntentDrivenSkillAgent:
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)
        self.chat_history = [] 
        self.skills = self._load_all_skills()
        self.recycling_mode = False

    def _load_all_skills(self):
        skills_map = {}
        if not os.path.exists(SKILLS_DIR): 
            os.makedirs(SKILLS_DIR)
            return skills_map
            
        for folder in os.listdir(SKILLS_DIR):
            path = os.path.join(SKILLS_DIR, folder, "SKILL.md")
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # 1. 解析头部 YAML 配置 (提取两个 --- 之间的内容)
                    yaml_match = re.search(r'^---\s*(.*?)\s*---', content, re.S | re.M)
                    
                    if yaml_match:
                        config = yaml.safe_load(yaml_match.group(1)) or {}
                        # 2. 剥离 YAML 头，剩下的所有业务说明与系统断点指令，原汁原味保留
                        instructions = content[yaml_match.end():].strip()
                    else:
                        config = {"name": folder}
                        instructions = content.strip()
                    
                    skill_name = config.get('name', folder)
                    skills_map[skill_name] = {
                        "instructions": instructions,
                        "description": config.get('description', '无描述'),
                        "config": config
                    }
        return skills_map

    def _get_target_skill(self, user_input):
        if not self.skills: return None
        
        skill_list = "\n".join([f"- {name}: {info['description']}" for name, info in self.skills.items()])
        router_prompt = f"""
        你是一个严谨的意图分发器。请根据用户的输入，从可用技能列表中选择一个最合适的技能名称。
        如果用户的输入属于：日常闲聊、名词解释、或者不需要专业工具就能直接回答的问题，请务必回复 'NONE'。
        
        可用技能列表：
        {skill_list}
        
        用户输入："{user_input}"
        
        请仅回复技能名称或 'NONE'，不要包含任何标点符号或其他解释。
        """
        
        try:
            response = self.client.models.generate_content(
                model=MODEL_ID,
                contents=router_prompt,
                config=types.GenerateContentConfig(temperature=0.0) # 决策需要确定性
            )
            target = response.text.strip()
            
            if target == 'NONE': return None
            for name in self.skills:
                if name.lower() in target.lower():
                    return name
            return None
        except Exception as e:
            return None

    def start_console(self):
        print(f"Agent 已启动 | 模型: {MODEL_ID}")
        
        mode_choice = input("\n是否开启回收模式？(y/n): ").strip().lower()
        self.recycling_mode = True if mode_choice == 'y' else False
        print("-" * 50)

        while True:
            user_input = input("\n输入 > ").strip()
            if user_input.lower() in ['exit', 'quit']: break
            if user_input.lower() == 'clear':
                self.chat_history = []
                print("历史已清空"); continue
            if not user_input: continue
            if user_input.lower() in ['debug', 'context', 'context_raw']:
                self._print_debug_context()
                continue

            target_skill_name = self._get_target_skill(user_input)
            
            if target_skill_name:

                self._run_skill_logic(user_input, target_skill_name)
            else:

                self._run_general_logic(user_input)

    def _run_general_logic(self, user_input):

        print("正在响应...")
        contents = self.chat_history + [{"role": "user", "parts": [{"text": user_input}]}]
        
        full_text = ""
        try:
            stream = self.client.models.generate_content_stream(model=MODEL_ID, contents=contents)
            for chunk in stream:
                print(chunk.text, end=""); sys.stdout.flush()
                full_text += chunk.text
        except Exception as e:
            print(f"\nAPI 调用异常: {e}")
            return
            
        self.chat_history.append({"role": "user", "parts": [{"text": user_input}]})
        self.chat_history.append({"role": "model", "parts": [{"text": full_text}]})
        print("\n" + "-" * 30)
    def _print_debug_context(self):

        print("\n" + "="*20 + " CURRENT CONTEXT SNAPSHOT " + "="*20)
        if not self.chat_history:
            print("\033[90m(当前上下文为空)\033[0m")
        else:
            for i, msg in enumerate(self.chat_history):
                role = msg['role']
                text = msg['parts'][0]['text']
                # 给不同角色上色以便区分
                color = "\033[33m" if role == "user" else "\033[36m"
                print(f"[{i}] {color}{role.upper()}\033[0m: {text[:200]}{'...' if len(text)>200 else ''}")
        print("="*66 + "\n")

    def _run_skill_logic(self, user_input, skill_name):
        skill = self.skills[skill_name]
        
        # 初始推演上下文
        current_session_contents = self.chat_history + [
            {"role": "user", "parts": [{"text": user_input}]},
            {"role": "model", "parts": [{"text": "<Skill_Start>\n"}]}
        ]

        print(f"激活 skill [{skill_name}]...")
        sys.stdout.write("\033[32m<Skill_Start>\033[0m\n")
        
        full_response_text = "<Skill_Start>\n"
        

        while True:
            sys.stdout.write("\033[90m") # 保持思考区灰色
            sys.stdout.flush()
            
            turn_text = ""
            print_buffer = ""
            
            try:
                stream = self.client.models.generate_content_stream(
                    model=MODEL_ID,
                    config=types.GenerateContentConfig(system_instruction=skill['instructions']),
                    contents=current_session_contents
                )

                for chunk in stream:
                    txt = chunk.text
                    if not txt: continue 
                    
                    turn_text += txt
                    full_response_text += txt
                    print_buffer += txt
                    
                    # 滑动窗口检测断点
                    if "<Skill_End>" in print_buffer:
                        # 发现断点，强制切回白色/亮色
                        highlighted = print_buffer.replace("<Skill_End>", "\033[0m\n\033[31m<Skill_End>\033[0m\n")
                        sys.stdout.write(highlighted)
                        print_buffer = ""
                    elif len(print_buffer) > 15:
                        sys.stdout.write(print_buffer[:-15])
                        print_buffer = print_buffer[-15:]
                    sys.stdout.flush()
                
                if print_buffer: sys.stdout.write(print_buffer); sys.stdout.flush()

            except Exception as e:
                print(f"\n传输中断: {e}"); break


            if "<Skill_End>" in turn_text:
                break
            

            sys.stdout.write("\033[0m") 
            print(f"\n\n\033[33m[待命] 模型暂未结束，请输入补充信息或工具结果: \033[0m")
            manual_input = input("补充 > ").strip()
            

            current_session_contents.append({"role": "model", "parts": [{"text": turn_text}]})
            current_session_contents.append({"role": "user", "parts": [{"text": manual_input}]})


        sys.stdout.write("\033[0m")
        sys.stdout.flush()

        if "<Skill_End>" in full_response_text:
            if self.recycling_mode:
                survivor = full_response_text.split("<Skill_End>")[-1].strip()
                self.chat_history.append({"role": "user", "parts": [{"text": user_input}]})
                self.chat_history.append({"role": "model", "parts": [{"text": f"【{skill_name}执行结论】：\n{survivor}"}]})
                waste_size = len(full_response_text) - len(survivor)
                print(f"\n\033[90m(上下文回收完成，清理了 {waste_size} 字符的中间过程)\033[0m")
            else:
                self.chat_history.append({"role": "user", "parts": [{"text": user_input}]})
                self.chat_history.append({"role": "model", "parts": [{"text": full_response_text}]})
        print("-" * 30)
        

if __name__ == "__main__":
    IntentDrivenSkillAgent(MY_API_KEY).start_console()