from google.adk.agents import LlmAgent 
from pydantic import BaseModel, Field
from typing import Optional

class Problem(BaseModel):
    title: str = Field(
        description="Title of the Problem",
        example="Title of the Problem"
    )
    description: str = Field(
        description="Detailed description of the problem",
        example="Detailed description of the problem"
    )
    difficulty: str = Field(
        description="Difficulty level: Easy / Medium / Hard",
        example="Medium"
    )
    topics: str = Field(
        description="Relevant topics such as Web Dev, App Dev, String Manipulation, API development, etc.",
        example="Web Dev, String Manipulation"
    )
    sample_input: Optional[str] = Field(
        default=None,
        description="Include sample input if it's an SQL/DSA problem; otherwise None",
        example="1 2 3 4"
    )
    sample_output: Optional[str] = Field(
        default=None,
        description="Include sample output if it's an SQL/DSA problem; otherwise None",
        example="10"
    )

problem_agent = LlmAgent(
    name = "ProblemGenerator",
    model = "gemini-2.5-flash",
    instruction = """
    You are a coding problem generator.
    Given a detailed description of a Coding Problem.
    You have create a detailed problem, that includes:
    title,
    description,
    difficulty,
    topics,
    sample input,
    sample output

    The problem needs to be descriptive, the learner usually under the age of 15-25 can understand
    reason and learn something from it.

    The response must be valid JSON matching this structure:
    {
        "title": "Title of the Problem"
        "description": "Detailed description of the problem"
        "difficulty": "Easy/ Medium/ Hard",
        "topics": "Web Dev, App Dev, String Manipulation, API development, etc anything that resonated with the problem",
        "sample_input": "If its a SQL/DSA problem then include sample input otherwise None"
        "sample_output": "If its a SQL/DSA problem then include sample input otherwise None"
    }

    If its a problem where input and output is given, make sure the description includes the type of input and type of output.
    Any constraints if needed.

    DO NOT INCLUDE ANY OTHER ADDITIONAL EXPLANATION OUTSIDE OF THE GIVEN FORMAT.
    """,

    description= '''You are a coding promblem generator agent. 
    You would be given a description and objective of the coding problem. Follow the instructions
    and generate all details about the problem."
    ''',
    
    output_schema = Problem,
    output_key = "Problem Details"
)