from typing import Annotated, TypedDict
from fastapi import APIRouter
from langgraph.graph import START, END, StateGraph, add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import HumanMessage
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from agent.langgraph_email_send import send_gmail_tool
from langchain.memory import ConversationBufferWindowMemory



from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from typing import AsyncGenerator


# Load env vars
load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key='AIzaSyBeJbfUXOTlrM-fR4LV2qOFs4as69QkJXk'  # load from env, safer
)

# FastAPI router
student_management_router = APIRouter()

# State definition (messages list is required for ToolNode!)
class MessageState(TypedDict):
    messages: Annotated[list, add_messages]
    
# MongoDB connection


url=os.getenv('MONGO_DB_URL')
client=MongoClient(url)
db = client["ai_hackathon_db"]
collection = db["student_management"]

# -------------------- TOOLS --------------------

def add_student(name: str, id: str, department: str, email: str) -> dict:
    """
    Add a new student record into MongoDB.
    Return: add Student successfully  
    """
    student = {
        "name": name,
        "id": id,
        "department": department,
        "email": email
    }
    collection.insert_one(student)
    subject = f"Welcome {name}!"
    body = f"Hello {name},\n\nYou have been successfully added to the student management system."
    send_gmail_tool(email, subject, body)
    return {"status": "added", "student": student}


def get_student(id: str) -> dict:
    """Fetch a student record from MongoDB by student ID."""
    student = collection.find_one({"id": id}, {"_id": 0})
    if not student:
        return {"status": "not_found", "message": f"No student found with ID {id}"}
    return {"status": "found", "student": student}


def update_student(id: str, new_name: str, new_email: str, new_department: str) -> dict:
    """Update the name, email, and department of a student record in MongoDB."""
    result = collection.update_one(
        {"id": id},
        {"$set": {"name": new_name, "email": new_email, "department": new_department}}
    )
    if result.matched_count == 0:
        return {"status": "not_found", "message": f"No student found with ID {id}"}
    subject = f"Your profile has been updated, {new_name}"
    body = f"Hello {new_name},\n\nYour student record has been updated successfully.\n\nDetails: {updated_student}"
    send_gmail_tool(new_email, subject, body)
    updated_student = collection.find_one({"id": id}, {"_id": 0})
    return {"status": "updated", "student": updated_student}


def delete_student(id: str) -> dict:
    """Delete a student record from MongoDB by student ID."""
    student = collection.find_one({"id": id})
    if not student:
        return {"status": "not_found", "message": f"No student found with ID {id}"}
    result = collection.delete_one({"id": id})
    if result.deleted_count == 0:
        return {"status": "not_found", "message": f"No student found with ID {id}"}
    subject = f"Goodbye {student['name']}"
    body = f"Hello {student['name']},\n\nYour student record has been deleted from the system."
    send_gmail_tool(student['email'], subject, body)

    return {"status": "deleted", "message": f"Student with ID {id} has been deleted"}


def list_students() -> dict:
    """List all students in MongoDB."""
    students = list(collection.find({}, {"_id": 0}))
    if not students:
        return {"status": "empty", "message": "No students found"}
    return {"status": "success", "students": students}



def get_cafeteria_timings() -> dict:
    """Return cafeteria opening and closing hours."""
    return {
        "status": "success",
        "cafeteria_timings": {
            "monday_friday": "8:00 AM - 8:00 PM",
            "saturday": "9:00 AM - 5:00 PM",
            "sunday": "Closed"
        }
    }


def get_library_hours() -> dict:
    """Return library opening and closing hours."""
    return {
        "status": "success",
        "library_hours": {
            "monday_friday": "9:00 AM - 10:00 PM",
            "saturday": "10:00 AM - 6:00 PM",
            "sunday": "12:00 PM - 5:00 PM"
        }
    }


def get_event_schedule() -> dict:
    """Return the upcoming campus event schedule."""
    return {
        "status": "success",
        "events": [
            {"event": "Tech Talk: AI in Education", "date": "2025-09-25", "time": "3:00 PM"},
            {"event": "Sports Day", "date": "2025-09-30", "time": "10:00 AM"},
            {"event": "Cultural Fest", "date": "2025-10-05", "time": "5:00 PM"},
        ]
    }




# ------------------------------------------------

# Register tools
tools = [add_student, get_student, update_student, delete_student, list_students, get_cafeteria_timings,get_event_schedule,get_library_hours]
llm_with_tools = llm.bind_tools(tools)

# Assistant node
def assistant_node(state: MessageState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

# Build graph
builder = StateGraph(MessageState)
builder.add_node("assistant", assistant_node)
builder.add_node("tools", ToolNode(tools))

# Add edges
builder.add_edge(START, "assistant")
builder.add_conditional_edges("assistant", tools_condition)
builder.add_edge("tools", "assistant")
builder.add_edge("assistant", END)

# Compile graph
graph = builder.compile()


# FastAPI endpoint



# -------------------- MEMORY --------------------
memory = ConversationBufferWindowMemory(k=3, return_messages=True)

# # FastAPI endpoint
@student_management_router.get("/chatbot/{user_id}/{query}")
def get_content(query: str, user_id: str):
    try:
        print("user_id", user_id)

        # Load conversation history from memory
        past_messages = memory.load_memory_variables({}).get("history", [])

        # Add current user query
        input_messages = past_messages + [HumanMessage(content=query)]

        # Call graph with combined messages
        result = graph.invoke({"messages": input_messages})

        # Extract the final AI message
        final_message = result["messages"][-1]

        # Save this turn to memory
        memory.save_context(
            {"input": query},
            {"output": final_message.content}
        )

        return {
            "response": final_message.content,
            "status": "success"
        }

    except Exception as e:
        return {"error": str(e), "status": "error"}




# 
# @student_management_router.get("/chatbot/{user_id}/{query}")
# def get_content(query: str,user_id:str):
    # try:
        # print("user_id",user_id)
        # result = graph.invoke({"messages": [HumanMessage(content=query)]})
        # Extract the final AI message content
        # final_message = result["messages"][-1]
        # return {
            # "response": final_message.content,
            # "status": "success"
        # }
    # except Exception as e:
        # return {"error": str(e), "status": "error"}


