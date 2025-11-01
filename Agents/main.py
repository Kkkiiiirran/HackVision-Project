import os
import asyncio
import json
from dotenv import load_dotenv
from google.genai import types
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from rootAgent.sub_agents.moduleAgent.agent import module_agent
from rootAgent.sub_agents.problemAgent.agent import problem_agent  # 👈 Import your problem agent

import json, re

def safe_json_loads(response_text: str):
    # Remove code block markers
    clean_text = re.sub(r"```(?:json)?", "", response_text).strip("` \n\t")

    # Extract between the first '{' and the last '}'
    start = clean_text.find("{")
    end = clean_text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No valid JSON braces found in response.")
    
    json_candidate = clean_text[start:end]

    # Try to load
    try:
        return json.loads(json_candidate)
    except json.JSONDecodeError as e:
        print("⚠️ JSON decoding failed:", e)
        print("🧩 Trying to auto-repair partial JSON...")
        # Optionally you can truncate trailing commas or unclosed quotes here
        raise

# Load environment variables
load_dotenv()

MODULE_DESCRIPTION = """
We want to create a quiz game in React. Multiple-choice quiz app with score tracking, conditional rendering, and user state.
"""

# -----------------------------------------
# 🚀 Function to run the Problem Agent
# -----------------------------------------
async def run_problem_agent(problem, index):
    print(f"\n🎯 Sending Problem {index+1}: {problem['problem_title']} to Problem Agent...")

    session_service = InMemorySessionService()
    runner = Runner(
        app_name="agents",
        agent=problem_agent,
        session_service=session_service
    )

    user_id = "test_user"
    session_id = f"problem_run_{index}"

    await session_service.create_session(app_name="agents", user_id=user_id, session_id=session_id)

    user_message = types.Content(
        role="user",
        parts=[types.Part(text=json.dumps(problem, indent=2))]
    )

    events = runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message
    )

    async for event in events:
        if event.is_final_response():
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"\n✅ Problem Agent Response for '{problem['problem_title']}':\n")
                print(event.content.parts[0].text)
                break


# -----------------------------------------
# 🚀 Function to run the Module Agent
# -----------------------------------------
async def run_module_agent():
    print("🤖 Running Module Agent...")

    session_service = InMemorySessionService()
    runner = Runner(
        app_name="agents",
        agent=module_agent,
        session_service=session_service
    )

    user_id = "test_user"
    session_id = "module_run_1"

    await session_service.create_session(app_name="agents", user_id=user_id, session_id=session_id)

    user_message = types.Content(
        role="user",
        parts=[types.Part(text=MODULE_DESCRIPTION)]
    )

    events = runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message
    )

    final_response_text = None

    async for event in events:
        if event.is_final_response():
            if event.content and event.content.parts and event.content.parts[0].text:
                final_response_text = event.content.parts[0].text
                break

    if not final_response_text:
        print("\n❌ No final response event detected.")
        return

    print("\n✅ Final Structured Output (JSON):\n")
    print(final_response_text)

    # Parse JSON
    try:
        quiz_module = safe_json_loads(final_response_text)
    except json.JSONDecodeError as e:
        print(f"⚠️ Error parsing JSON: {e}")
        return

    # Save to file
    with open("quiz_module.json", "w") as f:
        
        json.dump(quiz_module, f, indent=4)
    print("\n💾 Module JSON saved to quiz_module.json")

    # Now automatically trigger Problem Agent for each problem
    for i, problem in enumerate(quiz_module["problems"]):
        await run_problem_agent(problem, i)


# -----------------------------------------
# Entry Point
# -----------------------------------------
if __name__ == "__main__":
    asyncio.run(run_module_agent())
