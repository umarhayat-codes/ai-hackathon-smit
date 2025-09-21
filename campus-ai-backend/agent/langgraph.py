from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from typing import List

# === Your LangGraph code ===
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key="AIzaSyDF4w758vQBFXdci08Ek-3e6sr54ZcO2QU"  # <-- keep in .env for security
)

def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

llm_with_tools = llm.bind_tools([multiply])

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def tool_calling_llm(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# Build the graph
builder = StateGraph(MessagesState)
builder.add_node("tool_calling_llm", tool_calling_llm)
builder.add_node("tools", ToolNode([multiply]))
builder.add_edge(START, "tool_calling_llm")
builder.add_conditional_edges("tool_calling_llm", tools_condition)
builder.add_edge("tools", END)
graph = builder.compile()


# === APIRouter app ===
llm_agent = APIRouter()

class QueryRequest(BaseModel):
    query: str

@llm_agent.post("/chat")
async def query_agent(request: QueryRequest):
    # Pass user query to graph
    messages = graph.invoke({"messages": [HumanMessage(content=request.query)]})
    
    # Extract last assistant response
    answer = ""
    for msg in messages["messages"]:
        if msg.type == "ai":
            answer = msg.content
    
    return {"answer": answer}
