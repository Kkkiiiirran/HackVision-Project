from google.adk.agents import LlmAgent, LoopAgent

from pydantic import BaseModel, Field
from typing import List, Optional

class Problem(BaseModel):
    problem_title: str = Field(..., description="Title of the problem")
    problem_description: str = Field(..., description="Brief description of the problem in 2–4 lines")
    
class Module(BaseModel):
    topics: List[str] = Field(default_factory=list, description="Topics covered in the module")
    problems: List[Problem] = Field(default_factory=list, description="Sequential problems or steps in the module")

module_agent = LlmAgent(
    name = "Module_Structure_Generator",
    model = "gemini-2.5-flash",
    description = """You would be given a description of a module you have 
    "(a module is acollection of step wise problems for a complete project.)"
    You would be given the objective/description of the problem, you have to generate a number of problem descriptions stepwise.
    """,
    instruction = """   
        You would be given a description of a module you have 
    "(a module is acollection of step wise problems for a complete project.)"
    You would be given the objective/description of the problem, you have to generate a number of problem descriptions stepwise.
       For eg:
        🕰️ Module: “Pomodoro Timer”

        Focus: Timers, useEffect, component updates
        Project Outcome: A productivity timer with start/pause/reset and break intervals.
        Final Output: Timer that counts down, switches between work and rest cycles.

        Similar module decription would be given,
        you have to create 6 steps or as specified in the description for problems
        for learner to make the project step by step.

       These descritions will be passed to problemAgent sequentially to generate proper problems.
       So please keep in mind that the description of the each step fro steps starts with:

       In the  previous steps we ...
       Now next step you have to ...

       
       Make sure that each step is descrete. The things that needs to be achived must be mentioned descretly.
       Vague responses now, "enhance your project in this step.." must not be there.
       We need to verify the solutions of these problems, if the learners give very distinct answers it will affect are solution checking mechanism
       
       return output in the json format
    {
        "topics": "topics related to the module"
    [
        {
            "problem_title": "title of the first problem",
            "problem_description": "briefly describe what the first problem is in 2-4 lines"
        },
        {
            "problem_title": "title of the second problem",
            "problem_description": "briefly describe what the second problem is in 2-4 lines"
        },
    }
        ...
    ]

      """,
      output_key = "ProblemsList"

)

