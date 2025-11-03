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

MODULE_DESCRIPTION = os.environ.get("MODULE_DESCRIPTION", """
We want to create a quiz game in React. Multiple-choice quiz app with score tracking, conditional rendering, and user state.
""")

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

    # Collect final response text
    final_response_text = None
    async for event in events:
        if event.is_final_response():
            if event.content and event.content.parts and event.content.parts[0].text:
                final_response_text = event.content.parts[0].text
                print(f"\n✅ Problem Agent Response for '{problem['problem_title']}':\n")
                print(final_response_text)
                break

    if not final_response_text:
        print(f"⚠️ No final response from Problem Agent for problem {index+1}")
        return None

    # Try to parse JSON returned by the problem agent and normalize keys to backend schema
    try:
        parsed = safe_json_loads(final_response_text)
        normalized = {
            'problem_title': parsed.get('problem_title') or parsed.get('title') or problem.get('problem_title') or problem.get('title'),
            'problem_description': parsed.get('problem_description') or parsed.get('description') or parsed.get('body') or None,
            'difficulty': parsed.get('difficulty') or problem.get('difficulty') or 'medium',
            'topics': parsed.get('topics') or problem.get('topics') or [],
            'sample_input': parsed.get('sample_input') or None,
            'sample_output': parsed.get('sample_output') or None,
            'image_url': parsed.get('image_url') or None
        }
        return normalized
    except Exception as e:
        print(f"⚠️ Could not parse Problem Agent output JSON: {e}")
        # Fallback: return raw text as description
        return {
            'problem_title': problem.get('problem_title') or problem.get('title') or f"Problem {index+1}",
            'problem_description': final_response_text,
            'difficulty': problem.get('difficulty') or 'medium',
            'topics': problem.get('topics') or []
        }


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

    # Now automatically trigger Problem Agent for each problem and replace outlines with detailed versions
    detailed_problems = []
    for i, problem in enumerate(quiz_module.get('problems', [])):
        detailed = await run_problem_agent(problem, i)
        if detailed:
            detailed_problems.append(detailed)
        else:
            detailed_problems.append({
                'problem_title': problem.get('problem_title') or problem.get('title') or f"Problem {i+1}",
                'problem_description': problem.get('problem_description') or problem.get('description') or '',
                'difficulty': problem.get('difficulty') or 'medium',
                'topics': problem.get('topics') or []
            })

    # Overwrite the quiz_module.json with detailed problems
    quiz_module['problems'] = detailed_problems
    with open('quiz_module.json', 'w') as f:
        json.dump(quiz_module, f, indent=4)
    print("\n💾 Final Module JSON with detailed problems saved to quiz_module.json")


async def generate_module(description: str | None = None):
    """Public helper that runs the module agent with an optional description and
    returns the parsed quiz module object. This is intended to be called from
    an external HTTP wrapper (FastAPI) so other services can call the agents.
    """
    global MODULE_DESCRIPTION
    old_desc = MODULE_DESCRIPTION
    if description:
        MODULE_DESCRIPTION = description
    try:
        await run_module_agent()
        # Read and return JSON
        with open('quiz_module.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    finally:
        MODULE_DESCRIPTION = old_desc


# -----------------------------------------
# Entry Point
# -----------------------------------------
if __name__ == "__main__":
    # preserve previous behaviour of running the module agent as a script
    asyncio.run(run_module_agent())
