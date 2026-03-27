import os
import json
from llm.client import call_llm

PROJECT_ROOT = "."

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return "written"

def agent(task):
    for step in range(5):
        print(f"\nSTEP {step}\n")

        prompt = f"""
You are an autonomous coding agent working on Antigravity (Solana protocol).

Available actions:
1. read_file(path)
2. write_file(path, content)
3. analyze
4. done

Respond ONLY in JSON:
{{
  "action": "...",
  "path": "...",
  "content": "..."
}}

Task:
{task}
"""

        response = call_llm(prompt)

        print("RAW:", response)

        try:
            data = json.loads(response)
        except:
            print("Failed JSON, retrying...")
            continue

        action = data.get("action")
        path = data.get("path")
        content = data.get("content", "")

        if action == "read_file" and path:
            file_content = read_file(path)
            task = f"File content:\n{file_content}\n\nNext step?"

        elif action == "write_file" and path:
            write_file(path, content)
            print("Updated:", path)
            return

        elif action == "analyze":
            task = content

        elif action == "done":
            print("DONE:", content)
            return

if __name__ == "__main__":
    import sys
    # Ensure current directory is in path for llm module
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.append(current_dir)
        
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        task = "Audit README.md and summarize project goals"
    
    agent(task)