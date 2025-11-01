from google.adk.agents import LoopAgent
from ..problemAgent.agent import problem_agent

problemsLoopAgent = LoopAgent(

    name = "ProblemGenerationLoop",
    description = """You are Problems Generation Loop agent that delegates the task to the Problem agen
    one by one for each problem described by the module Agent.
    
    """,
    sub_agents = [problem_agent],
    max_iterations = 5
)