from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_route import auth_router
from agent.langgraph_student_management import student_management_router
from agent.langgrah_campus_analytics import campus_analytics_router
from agent.langgraph_email_send import send_email_router
from agent.langgraph_pdf_agentic_rag import agentic_rag_router

# from agent.langgraph import llm_agent
# from agent.langgraph_hospital_agentic import agentic_hospital_router

app=FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend origin for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router,prefix='/auth')
app.include_router(student_management_router,prefix='/student')
app.include_router(campus_analytics_router,prefix='/student')
app.include_router(send_email_router,prefix='/student')

# app.include_router(llm_agent,prefix='/agent')
app.include_router(agentic_rag_router,prefix='/agentic-rag')
# app.include_router(agentic_hospital_router,prefix='/agentic-hospital')



