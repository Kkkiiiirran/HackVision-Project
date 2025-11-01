from google.adk.agents import SequentialAgent 
from .sub_agents.moduleAgent.agent import module_agent

from .sub_agents.problems_loop_agent.agent import problemsLoopAgent

root_agent = SequentialAgent(
    name = "SetUp_Agent",
    description = "Write a module that specifies all the steps for the problem and iteratively generate proper problems",
    sub_agents=[
        module_agent,
        problemsLoopAgent
    ],

)