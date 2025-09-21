import os
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pprint import pprint
from typing import Annotated
from typing_extensions import TypedDict

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel

from langchain_core.messages import AnyMessage, HumanMessage
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI

# ------------------ Load ENV ------------------
load_dotenv()
GMAIL_USER = 'uh44171@gmail.com'
GMAIL_PASS = 'evrcxloyrqmofjai'
GOOGLE_API_KEY = 'AIzaSyBeJbfUXOTlrM-fR4LV2qOFs4as69QkJXk'

# ------------------ LLM ------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY
)

# ------------------ Tool ------------------
def send_gmail_tool(receiver: str, subject: str, body: str) -> dict:
    """
    Send an email via Gmail SMTP.
    """
    if not GMAIL_USER or not GMAIL_PASS:
        return {"status": "error", "details": "Missing GMAIL_USER or GMAIL_PASS"}

    try:
        # Build message
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = receiver
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Connect & login
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)

        # Send
        server.sendmail(GMAIL_USER, receiver, msg.as_string())
        server.quit()

        return {
            "status": "success",
            "message": f"Email sent successfully to {receiver}",
            "subject": subject
        }

    except Exception as e:
        return {"status": "error", "details": str(e)}

# ------------------ Bind LLM with Tool ------------------
llm_with_tools = llm.bind_tools([send_gmail_tool])

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def tool_calling_llm(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# ------------------ Build Graph ------------------
builder = StateGraph(MessagesState)
builder.add_node("tool_calling_llm", tool_calling_llm)
builder.add_node("tools", ToolNode([send_gmail_tool]))
builder.add_edge(START, "tool_calling_llm")
builder.add_conditional_edges("tool_calling_llm", tools_condition)
builder.add_edge("tools", END)
graph = builder.compile()

# ------------------ FastAPI ------------------
send_email_router = APIRouter()

class EmailRequest(BaseModel):
    receiver: str
    subject: str
    body: str

@send_email_router.post("/send-email/{receiver}/{subject}/{body}")
def send_email(receiver:str,subject:str,body:str):
    """Endpoint to send email using LangGraph Gmail Agent"""
    user_prompt = (
        f"Send an email to {receiver} with subject {subject} and body {body}"
    )

    messages = graph.invoke({"messages": [HumanMessage(content=user_prompt)]})

    response = []
    for m in messages['messages']:
        try:
            response.append(m.content)
        except:
            response.append(str(m))

    return {"conversation": response}
