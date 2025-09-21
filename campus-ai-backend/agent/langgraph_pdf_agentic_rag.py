# from fastapi import APIRouter, UploadFile, File, Query
# from fastapi.responses import JSONResponse
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain.tools.retriever import create_retriever_tool
# from langgraph.graph.message import AnyMessage, add_messages
# from langgraph.prebuilt import ToolNode, tools_condition
# from langgraph.graph import StateGraph, START, END
# from langgraph.checkpoint.memory import MemorySaver
# from typing import Annotated
# from typing_extensions import TypedDict
# from langchain_core.messages import SystemMessage
# from langchain_huggingface import HuggingFaceEndpointEmbeddings

# from langchain_community.vectorstores import InMemoryVectorStore
# from langchain_community.document_loaders import PyPDFLoader

# import tempfile
# import os
# from dotenv import load_dotenv


# from langgraph.checkpoint.mongodb import MongoDBSaver
# from pymongo import MongoClient

# # Load environment variables from .env
# load_dotenv()


# # 🔹 FastAPI app
# agentic_rag_router = APIRouter()

# # 🔹 LLM
# llm = ChatGoogleGenerativeAI(
#     model="gemini-1.5-flash",
#     google_api_key='AIzaSyDF4w758vQBFXdci08Ek-3e6sr54ZcO2QU',
#     temperature=0.3
# )



# # --- Define State ---
# class State(TypedDict):
#     messages: Annotated[list[AnyMessage], add_messages]

# # --- Global Variables ---
# compiled_graph = None
# pdf_filename = None
# pdf_pages = 0

# # --- Build Graph ---
# def build_graph(docs, filename):
#     global pdf_pages
#     pdf_pages = len(docs)
    
#     # Split docs into chunks
#     documents = RecursiveCharacterTextSplitter(
#         chunk_size=1000, 
#         chunk_overlap=200
#     ).split_documents(docs)

#     print(f"📄 Split {len(docs)} pages into {len(documents)} chunks")

#     # 🔹 SOLUTION 1: Use Google Generative AI Embeddings (same API key)
#     embeddings = HuggingFaceEndpointEmbeddings(
#     model="sentence-transformers/all-MiniLM-L6-v2"
# )
#     print('------embedding-----',embeddings)
#     # Vector DB + retriever
#     vector = InMemoryVectorStore.from_documents(documents, embeddings)
#     retriever = vector.as_retriever(search_kwargs={"k": 3})

#     retriever_tool = create_retriever_tool(
#         retriever,
#         "PDF_Knowledge",
#         f"Search and retrieve information from the uploaded PDF document '{filename}'. "
#         f"Use this tool when users ask questions about the PDF content, document details, "
#         f"or anything that might be related to the uploaded file. "
#         f"This tool contains {len(documents)} text chunks from the document."
#     )
    
#     tools = [retriever_tool]
    
#     # Enhanced system prompt for better decision making
#     system_prompt = f"""You are an **Agentic RAG Assistant** with access to a PDF document titled '{filename}' ({pdf_pages} pages).

# **DECISION LOGIC:**
# 🔍 **Use PDF_Knowledge tool for:**
#    - Questions about "the document", "the PDF", "the file", "this document"
#    - Questions asking "what does the document say about..."
#    - Content-specific questions that might be in the PDF
#    - Questions referencing information that could be in the uploaded document
#    - Any question where the user expects document-based information

# 🧠 **Answer directly (no tool) for:**
#    - General knowledge questions unrelated to documents
#    - Questions about current events, general facts, explanations
#    - Personal questions about yourself as an AI
#    - Mathematical calculations
#    - Programming help
#    - Questions clearly outside the document scope

# **IMPORTANT RESPONSE RULES:**
# 1. **If you use PDF_Knowledge tool:** Start response with "Based on the uploaded PDF document:"
# 2. **If answering from general knowledge:** Start response with "From my general knowledge (not from the PDF):"
# 3. **Always be helpful and accurate**
# 4. **If unsure whether to use tool, err on the side of using it for potentially document-related questions**

# **EXAMPLES:**
# ❌ "What is machine learning?" → General knowledge (no tool needed)
# ✅ "What does this document say about machine learning?" → Use PDF_Knowledge
# ✅ "Tell me about the PDF" → Use PDF_Knowledge  
# ✅ "Summarize the document" → Use PDF_Knowledge
# ❌ "What's 2+2?" → General knowledge (no tool needed)
# ✅ "What are the main topics in this document?" → Use PDF_Knowledge
# """

#     llm_with_tool = llm.bind_tools(tools)

#     # --- Build State Graph ---
#     builder = StateGraph(State)

#     def assistant_node(state):
#         user_query = state["messages"][-1].content
#         if "pdf" in user_query.lower() :
#         # 🔹 Always run retriever
#             retrieved_docs = retriever.invoke(user_query)
#             # print(retri)
#             docs_text = "\n\n".join([doc.page_content for doc in retrieved_docs])

#             # 🔹 Build prompt with context
#             prompt = f"""
#             You are an assistant that answers ONLY from the provided PDF context.

#             Question: {user_query}

#             Context from PDF:
#             {docs_text}

#             Answer clearly using only the context.
#             """

#             result = llm.invoke(prompt)
#             return {"messages": result}
#         messages = state["messages"]
#         if not any(isinstance(msg, SystemMessage) for msg in messages):
#             messages = [SystemMessage(content=system_prompt)] + messages

#         result = llm_with_tool.invoke(messages)
#         return {"messages": [result]}
#     # def assistant_node(state):
#         # messages = state["messages"]
        
#         # Add system message if not present
#         # if not any(isinstance(msg, SystemMessage) for msg in messages):
#         #     messages = [SystemMessage(content=system_prompt)] + messages
        
#         # result = llm_with_tool.invoke(messages)
#         # return {"messages": [result]}

#     def tool_node_func(state):
#         tool_node = ToolNode(tools)
#         return tool_node.invoke(state)

#     builder.add_node("assistant", assistant_node)
#     builder.add_node("tools", tool_node_func)

#     # Flow
#     builder.add_edge(START, "assistant")
#     builder.add_conditional_edges("assistant", tools_condition)
#     builder.add_edge("tools", "assistant")

#     # Memory

#     mongodb_client = MongoClient('mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
#     memory = MongoDBSaver(mongodb_client)
#     return builder.compile(checkpointer=memory)





# # --- API: Upload PDF ---
# @agentic_rag_router.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     global compiled_graph, pdf_filename
    
#     print(f"📤 Uploading file: {file.filename}")
    
#     try:
#         # Validate file type
#         if not file.filename.lower().endswith('.pdf'):
#             return JSONResponse(
#                 {"error": "Only PDF files are supported."}, 
#                 status_code=400
#             )

#         # Validate file size (10MB limit)
#         content = await file.read()
#         if len(content) > 10 * 1024 * 1024:
#             return JSONResponse(
#                 {"error": "File size must be less than 10MB"}, 
#                 status_code=400
#             )

#         # Create temporary file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
#             tmp.write(content)
#             tmp_path = tmp.name

#         # Load PDF
#         loader = PyPDFLoader(tmp_path)
#         docs = loader.load()
        
#         if not docs:
#             return JSONResponse(
#                 {"error": "Could not extract content from PDF. The file might be corrupted or empty."}, 
#                 status_code=400
#             )

#         print(f"📄 Loaded {len(docs)} pages from PDF")

#         # Store filename and build graph
#         pdf_filename = file.filename
#         compiled_graph = build_graph(docs, file.filename)

#         # Clean up temp file
#         os.unlink(tmp_path)

#         print(f"✅ PDF '{file.filename}' processed successfully")

#         return JSONResponse({
#             "filename": file.filename,
#             "pages": len(docs),
#             "message": f"PDF '{file.filename}' uploaded and processed successfully. You can now ask questions about this document."
#         })

#     except Exception as e:
#         print(f"❌ Upload error: {str(e)}")
#         return JSONResponse(
#             {"error": f"Upload failed: {str(e)}"}, 
#             status_code=500
#         )

# # --- API: Chat ---

# @agentic_rag_router.post("/chat")
# async def chat(query: str = Query(..., description="The user's question")):
#     global compiled_graph, pdf_filename
    
#     try:
#         if not query.strip():
#             return JSONResponse(
#                 {"error": "Query cannot be empty"}, 
#                 status_code=400
#             )

#         print(f"💬 Processing query: {query}")
#         print('----compiled_graph----',compiled_graph)
#         # Check if PDF is loaded for document-related questions
#         if compiled_graph is None:
#             # Check if question seems to be asking about a document
#             doc_keywords = ['document', 'pdf', 'file', 'paper', 'text', 'content', 'page']
#             if any(keyword in query.lower() for keyword in doc_keywords):
#                 return JSONResponse(
#                     {"error": "No PDF uploaded yet. Please upload a PDF first to ask document-related questions."}, 
#                     status_code=400
#                 )
#             else:
#                 # Answer general questions even without PDF

#                 # mongodb_client = MongoClient('mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
#                 # memory = MongoDBSaver(mongodb_client)
#                 # return builder.compile(checkpointer=memory)


#                 general_response = llm.invoke([("user", f"From your general knowledge (not from any PDF): {query}")])
#                 return JSONResponse({
#                     "query": query,
#                     "answer": f"From my general knowledge (not from the PDF): {general_response.content}",
#                     "pdf_filename": None,
#                     "used_pdf": False
#                 })

#         # Use the compiled graph for questions (it will decide whether to use PDF tool or not)
        
#         config = {"configurable": {"thread_id": "1"}}
#         result = compiled_graph.invoke({"messages": [("user", query)]}, config=config)
#         print('-----result----',result)
#         answer = result["messages"][-1].content
#         used_pdf = "Based on the uploaded PDF document:" in answer
#         print(f"🤖 Response generated (used PDF: {used_pdf})")

#         return JSONResponse({
#             "query": query,
#             "answer": answer,
#             "pdf_filename": pdf_filename,
#             "used_pdf": used_pdf
#         })

#     except Exception as e:
#         print(f"❌ Chat error: {str(e)}")
#         return JSONResponse(
#             {"error": f"Chat failed: {str(e)}"}, 
#             status_code=500
#         )

# # --- API: Get Status ---
# @agentic_rag_router.get("/status")
# async def get_status():
#     """Get current system status"""
#     return JSONResponse({
#         "pdf_uploaded": compiled_graph is not None,
#         "pdf_filename": pdf_filename if pdf_filename else None,
#         "pdf_pages": pdf_pages if compiled_graph else 0,
#         "message": f"PDF '{pdf_filename}' loaded and ready for questions" if compiled_graph else "No PDF uploaded"
#     })

# # --- API: Reset ---
# @agentic_rag_router.post("/reset")
# async def reset_system():
#     """Reset the system - clear uploaded PDF and memory"""
#     global compiled_graph, pdf_filename, pdf_pages
    
#     compiled_graph = None
#     pdf_filename = None
#     pdf_pages = 0
    
#     return JSONResponse({
#         "message": "System reset successfully. Upload a new PDF to continue."
#     })

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.tools.retriever import create_retriever_tool
from langgraph.graph.message import AnyMessage, add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import Annotated
from typing_extensions import TypedDict

from langchain_community.vectorstores import InMemoryVectorStore
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEndpointEmbeddings
import tempfile
import os
from dotenv import load_dotenv
from langchain.memory import ConversationBufferWindowMemory

from datetime import datetime
from pymongo import MongoClient

load_dotenv()

# 🔹 FastAPI router
agentic_rag_router = APIRouter()

# 🔹 LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key='AIzaSyBeJbfUXOTlrM-fR4LV2qOFs4as69QkJXk'
)

# --- Define State ---
class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


# --- MongoDB Setup ---
client = MongoClient(
    "mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/"
    "?retryWrites=true&w=majority&appName=Cluster0"
)
db = client["ai_hackathon_db"]
threads = db["threads"]
from datetime import datetime

def save_message(user_id, role, content):
    """Save user/assistant message into MongoDB"""
    message_doc = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }
    threads.update_one(
        {"user_id": user_id, "agent": "rag"},
        {
            "$push": {"messages": message_doc},
            "$setOnInsert": {
                "user_id": user_id,
                "agent": "rag",
                "created_at": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )


def save_pdf_metadata(user_id, filename):
    """Save PDF info for the thread"""
    pdf_doc = {
        "filename": filename,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    threads.update_one(
        {"user_id": user_id, "agent": "rag"},
        {
            "$set": {"pdf": pdf_doc},
            "$setOnInsert": {
                "user_id": user_id,
                "agent": "rag",
                "created_at": datetime.utcnow().isoformat(),
                "messages": []
            }
        },
        upsert=True
    )


# --- Build Graph ---
def build_graph(docs):
    # Split docs
    documents = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200
    ).split_documents(docs)

    # Embeddings
    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Vector DB + retriever
    vector = InMemoryVectorStore.from_documents(documents, embeddings)
    retriever = vector.as_retriever()

    retriever_tool = create_retriever_tool(
        retriever,
        "PDF_Knowledge",
        "Answer questions from the uploaded PDF."
    )
    tools = [retriever_tool]
    llm_with_tool = llm.bind_tools(
        tools,
        instructions="""
You are an Agentic RAG Assistant.
Rules:
1. If the question is about the uploaded PDF → MUST call PDF_Knowledge tool first.
2. If unrelated → do NOT call PDF_Knowledge.
3. Be transparent:
   - If answer is from PDF → say: "This answer is based on the uploaded PDF."
   - If from outside → say: "This answer is from my general knowledge, not the PDF."
"""
    )

    # --- State Graph ---
    builder = StateGraph(State)

    def assistant_node(state):
        user_query = state["messages"][-1].content
        if "pdf" in user_query.lower() :
#         # 🔹 Always run retriever
            retrieved_docs = retriever.invoke(user_query)
            # print(retri)
            docs_text = "\n\n".join([doc.page_content for doc in retrieved_docs])

            # 🔹 Build prompt with context
            prompt = f"""
            You are an assistant that answers ONLY from the provided PDF context.

            Question: {user_query}

            Context from PDF:
            {docs_text}

            Answer clearly using only the context.
            """

            result = llm.invoke(prompt)
            return {"messages": [result]}

        # Let LLM + tool decide
        response = llm_with_tool.invoke(state["messages"])
        return {"messages": [response]}

    builder.add_node("assistant", assistant_node)
    builder.add_node("tools", ToolNode(tools))

    builder.add_edge(START, "assistant")
    builder.add_conditional_edges("assistant", tools_condition)
    builder.add_edge("tools", "assistant")
    builder.add_edge("assistant", END)

    # Memory checkpoint
    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


# --- Global compiled graph ---
compiled_graph = None
pdf_filename = None

# Memory (last 3 exchanges)
memory = ConversationBufferWindowMemory(k=3, return_messages=True)


# --- API: Upload PDF ---
@agentic_rag_router.post("/upload/{user_id}")
async def upload_file(user_id: str,  file: UploadFile = File(...)):
    global compiled_graph, pdf_filename
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        loader = PyPDFLoader(tmp_path)
        docs = loader.load()

        compiled_graph = build_graph(docs)
        pdf_filename = file.filename

        # Save PDF metadata in MongoDB
        save_pdf_metadata(user_id, file.filename)

        return JSONResponse({
            "filename": file.filename,
            "message": "PDF uploaded successfully. You can now chat."
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# --- API: Chat with Assistant ---
@agentic_rag_router.post("/chat/{user_id}/{query}")
async def chat(user_id: str, query: str):
    global compiled_graph, pdf_filename
    try:
        # No PDF uploaded yet
        if compiled_graph is None:
            doc_keywords = ['document', 'pdf', 'file', 'paper', 'text', 'content', 'page']
            if any(keyword in query.lower() for keyword in doc_keywords):
                return JSONResponse(
                    {"error": "No PDF uploaded yet. Please upload a PDF first."},
                    status_code=400
                )
            else:
                # Answer from general knowledge
                general_response = llm.invoke([("user", query)])
                return JSONResponse({
                    "query": query,
                    "answer": f"This answer is from my general knowledge, not the PDF: {general_response.content}",
                    "used_pdf": False
                })

        # Save user message in MongoDB
        save_message(user_id, "user", query)

        # ❌ REMOVE THIS (thread_id not defined)
        # print(thread_id, user_id, query)

        # Add to memory
        memory.chat_memory.add_user_message(query)

        # Run graph
        result = compiled_graph.invoke(
            {"messages": memory.chat_memory.messages},
            config={"configurable": {"thread_id": "session"}}  # keep static "session"
        )

        final_message = result["messages"][-1].content

        # Save assistant response
        save_message(user_id, "assistant", final_message)

        # Update memory
        memory.chat_memory.add_ai_message(final_message)

        return JSONResponse({
            "query": query,
            "answer": final_message,
            "pdf_filename": pdf_filename,
            "used_pdf": True
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
