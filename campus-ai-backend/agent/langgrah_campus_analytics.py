# from typing import Annotated, TypedDict
# from fastapi import APIRouter
# from langgraph.graph import START, END, StateGraph, add_messages
# from langgraph.prebuilt import ToolNode, tools_condition
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.messages import HumanMessage
# from pymongo import MongoClient
# import os
# from dotenv import load_dotenv

# # Load env vars
# load_dotenv()


# campus_analytics_router=APIRouter()

# # Initialize LLM
# llm = ChatGoogleGenerativeAI(
#     model="gemini-1.5-flash",
#     google_api_key='AIzaSyD8CaI1O6Rn-L3gUM2tbfI-58wELz6Pj_g'
# )

# # MongoDB connection
# client = MongoClient('mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
# db = client["ai_hackathon_db"]
# collection = db["student_management"]

# # State for graph
# class MessageState(TypedDict):
#     messages: Annotated[list, add_messages]

# # -------------------- ANALYTICAL TOOLS --------------------

# def get_total_students() -> dict:
#     """Return total count of students."""
#     count = collection.count_documents({})
#     print("count",count)
#     return {"status": "success", "total_students": count}


# def get_students_by_department(department: str) -> dict:
#     """Return students filtered by department."""
#     print("department",department)
#     students = list(collection.find({"department": department}, {"_id": 0}))
#     if not students:
#         return {"status": "empty", "message": f"No students found in {department}"}
#     print("get department student",students)
#     return {"status": "success", "students": students}


# def get_recent_onboarded_students(limit: int = 5) -> dict:
#     """Return recently onboarded students (based on insertion order)."""
#     students = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(limit))
#     if not students:
#         return {"status": "empty", "message": "No students found"}
#     print("onboarded_students",students)
#     return {"status": "success", "recent_students": students}

# # -----------------------------------------------------------

# # Register tools
# tools = [get_total_students, get_students_by_department, get_recent_onboarded_students]
# llm_with_tools = llm.bind_tools(tools)

# # Assistant node
# def assistant_node(state: MessageState):
#     response = llm_with_tools.invoke(state["messages"])
#     return {"messages": [response]}

# # Build graph
# builder = StateGraph(MessageState)
# builder.add_node("assistant", assistant_node)
# builder.add_node("tools", ToolNode(tools))

# # Edges
# builder.add_edge(START, "assistant")
# builder.add_conditional_edges("assistant", tools_condition)
# builder.add_edge("tools", "assistant")
# builder.add_edge("assistant", END)

# # Compile graph
# student_agent_graph = builder.compile()

# # Utility function to query agent
# @campus_analytics_router.get("/analytics/{query}")
# def query_student_agent(query: str):
#     try:
#         print("---query--",query)
#         result = student_agent_graph.invoke({"messages": [HumanMessage(content=query)]})
#         # Extract the final AI message content
#         final_message = result["messages"][-1]
#         return {
#             "response": final_message.content,
#             "status": "success"
#         }
#     except Exception as e:
#         return {"error": str(e), "status": "error"}




from typing import List, Dict
from fastapi import APIRouter
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load env vars
load_dotenv()

campus_analytics_router = APIRouter()

# MongoDB connection
client = MongoClient('mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client["ai_hackathon_db"]
collection = db["student_management"]

# -------------------- DIRECT FUNCTIONS --------------------

@campus_analytics_router.get("/analytics/total_students")
def get_total_students() -> dict:
    """Return total count of students."""
    count = collection.count_documents({})
    return {"status": "success", "total_students": count}


@campus_analytics_router.get("/analytics/students_by_department/{department}")
def get_students_by_department(department: str) -> dict:
    """Return students filtered by department."""
    students = list(collection.find({"department": department}, {"_id": 0}))
    return {
        "status": "success" if students else "empty",
        "students": students,
        "count": len(students),
    }


@campus_analytics_router.get("/analytics/recent_students")
def get_recent_onboarded_students(limit: int = 5) -> dict:
    """Return recently onboarded students (latest inserted)."""
    students = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(limit))
    return {
        "status": "success" if students else "empty",
        "recent_students": students,
    }
