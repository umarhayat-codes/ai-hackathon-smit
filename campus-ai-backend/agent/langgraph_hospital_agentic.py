from typing import Annotated
from fastapi.responses import JSONResponse
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
import os
import httpx
import re
from fastapi import APIRouter
from langchain.memory import ConversationBufferWindowMemory

# ------------------------
# API Keys
# ------------------------
GOOGLE_KEY = 'AIzaSyADvA9K-_zFnMQa8KKBk8Y5aFguMhTlwcc'  # Google API key
GEOAPIFY_KEY = "b9bf4d053f404de58c1d0b8898ad08ca"  # Geoapify API key

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_KEY
)

agent_router = APIRouter()
agentic_hospital_router = APIRouter()

# ------------------------
# Define State
# ------------------------
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]




from datetime import datetime
from pymongo import MongoClient

client = MongoClient("mongodb+srv://agentic_ai_hackathon:ibicdt@cluster0.5gks7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["ai_hackathon_db"]
threads = db["threads"]
def save_message(thread_id, user_id, role, content):
    message_doc = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }

    threads.update_one(
        {"_id": thread_id},  
        {
            "$push": {"messages": message_doc},
            "$setOnInsert": {
                "user_id": user_id,
                "agent": "hospital"
            }
        },
        upsert=True
    )




# ------------------------
# Tool 1: Medical Suggestions
# ------------------------
@tool
def get_medical_suggestions(user_query: str) -> str:
    """
    Provides general wellness tips, lifestyle advice, diet recommendations, 
    and over-the-counter medicine suggestions for health issues.
    Always includes a disclaimer to consult a doctor.
    
    Args:
        user_query: The user's description of their health issue or symptoms
    """
    print("medical suggestion", user_query)
    
    # Use LLM to generate medical suggestions
    messages = [
        HumanMessage(content=f"""
The user described a health issue: "{user_query}"

Please provide helpful, safe, and general suggestions including:
- Simple lifestyle changes or exercise tips
- Diet and nutrition recommendations
- General over-the-counter options that might help
- Home remedies if applicable

Important guidelines:
- Keep suggestions general and safe
- Don't diagnose specific conditions
- Focus on wellness and prevention
- Always end with a disclaimer to consult a licensed doctor

Format your response clearly with sections for lifestyle, diet, and general remedies.
""")
    ]
    
    response = llm.invoke(messages)
    
    # Add disclaimer if not present
    content = response.content.strip()
    if "consult" not in content.lower() or "doctor" not in content.lower():
        content += "\n\n⚠️ Important: Please consult a licensed doctor before taking any medicine or if symptoms persist."
    
    return content

# ------------------------
# Tool 2: Doctor Contact (Geoapify)
# ------------------------
@tool
def find_nearby_doctors(user_query: str) -> str:
    """
    Finds nearby doctors using Geoapify API based on the user's location and medical specialty needed.
    Returns doctor names, addresses, phone numbers, and websites.
    
    Args:
        user_query: The user's request for doctor information (should include location and specialty)
    """
    
    print(f"🔍 Searching for doctors with query: {user_query}")
    
    # Map specialties to Geoapify categories
    specialty_map = {
        "skin": "healthcare.doctor.dermatologist",
        "dermatologist": "healthcare.doctor.dermatologist",
        "heart": "healthcare.doctor.cardiologist", 
        "cardiologist": "healthcare.doctor.cardiologist",
        "eye": "healthcare.doctor.ophthalmologist",
        "ophthalmologist": "healthcare.doctor.ophthalmologist",
        "dentist": "healthcare.dentist",
        "dental": "healthcare.dentist",
        "orthopedic": "healthcare.doctor.orthopedic",
        "bone": "healthcare.doctor.orthopedic",
        "psychiatrist": "healthcare.doctor.psychiatrist",
        "mental": "healthcare.doctor.psychiatrist",
        "pediatrician": "healthcare.doctor.pediatrician",
        "child": "healthcare.doctor.pediatrician",
        "gynecologist": "healthcare.doctor.gynecologist",
        "women": "healthcare.doctor.gynecologist",
        "neurologist": "healthcare.doctor.neurologist",
        "brain": "healthcare.doctor.neurologist",
        "urologist": "healthcare.doctor.urologist"
    }
    
    # Default to general doctor
    specialty = "healthcare.doctor"
    specialty_name = "general practitioners"
    
    # Find specialty in query
    query_lower = user_query.lower()
    for word, category in specialty_map.items():
        if word in query_lower:
            specialty = category
            specialty_name = word + "s" if not word.endswith('s') else word
            break
    
    # Extract location (look for "in [city]" pattern)
    location = "lahore"  # default
    location_match = re.search(r'\bin\s+([a-zA-Z\s]+)', user_query, re.IGNORECASE)
    if location_match:
        location = location_match.group(1).strip()
    
    print(f"🏥 Looking for {specialty_name} in {location}")
    
    # Try multiple API approaches for better results
    results = []
    
    # First, get coordinates for the location using Geocoding API
    geocoding_url = "https://api.geoapify.com/v1/geocode/search"
    geocoding_params = {
        "text": location,
        "apiKey": GEOAPIFY_KEY,
        "limit": 1
    }
    
    lat, lon = None, None
    
    try:
        with httpx.Client(timeout=15.0) as client:
            print(f"🌍 Getting coordinates for {location}...")
            geo_response = client.get(geocoding_url, params=geocoding_params)
            
            if geo_response.status_code == 200:
                geo_data = geo_response.json()
                if geo_data.get("features"):
                    coordinates = geo_data["features"][0]["geometry"]["coordinates"]
                    lon, lat = coordinates[0], coordinates[1]
                    print(f"📍 Found coordinates: {lat}, {lon}")
    except Exception as e:
        print(f"🔥 Geocoding exception: {str(e)}")
    
    # Approach 1: Category-based search with coordinates
    if lat and lon:
        url = "https://api.geoapify.com/v2/places"
        params = {
            "categories": specialty,
            "filter": f"circle:{lon},{lat},10000",  # 10km radius
            "limit": 8,
            "apiKey": GEOAPIFY_KEY
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                print(f"🌐 Making API call to Geoapify with coordinates...")
                response = client.get(url, params=params)
                print(f"📊 API Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"📋 Found {len(data.get('features', []))} results")
                    
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        
                        # Extract relevant information
                        name = props.get("name", "Unknown Clinic")
                        address = props.get("formatted", "Address not available")
                        phone = props.get("contact:phone", "Phone not available")
                        website = props.get("website") or props.get("contact:website", "Website not available")
                        
                        results.append({
                            "name": name,
                            "address": address, 
                            "phone": phone,
                            "website": website
                        })
                else:
                    print(f"❌ API Error: {response.status_code} - {response.text}")
        
        except Exception as e:
            print(f"🔥 API Exception: {str(e)}")
    
    # If no results, try a broader healthcare search
    if not results and lat and lon:
        print("🔄 Trying broader healthcare search...")
        params = {
            "categories": "healthcare",
            "filter": f"circle:{lon},{lat},15000",  # 15km radius
            "limit": 8,
            "apiKey": GEOAPIFY_KEY
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    print(f"📋 Healthcare search found {len(data.get('features', []))} results")
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        name = props.get("name", "Unknown Clinic")
                        address = props.get("formatted", "Address not available")
                        phone = props.get("contact:phone", "Phone not available")
                        website = props.get("website") or props.get("contact:website", "Website not available")
                        
                        # Filter for medical facilities
                        if any(word in name.lower() for word in ['hospital', 'clinic', 'medical', 'doctor', 'health']):
                            results.append({
                                "name": name,
                                "address": address, 
                                "phone": phone,
                                "website": website
                            })
        except Exception as e:
            print(f"🔥 Broader search exception: {str(e)}")
    
    # Final fallback: text search
    if not results:
        print("🔄 Trying text-based search as final fallback...")
        params = {
            "text": f"{specialty_name} {location} pakistan",
            "limit": 5,
            "apiKey": GEOAPIFY_KEY
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    print(f"📋 Text search found {len(data.get('features', []))} results")
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        name = props.get("name", "Unknown Clinic")
                        address = props.get("formatted", "Address not available")
                        phone = props.get("contact:phone", "Phone not available")
                        website = props.get("website") or props.get("contact:website", "Website not available")
                        
                        results.append({
                            "name": name,
                            "address": address, 
                            "phone": phone,
                            "website": website
                        })
        except Exception as e:
            print(f"🔥 Text search exception: {str(e)}")
    
    # Format response
    if results:
        response_text = f"🏥 Here are {specialty_name} in {location.title()}:\n\n"
        for i, doc in enumerate(results, 1):
            response_text += f"{i}. **{doc['name']}**\n"
            response_text += f"   📍 Address: {doc['address']}\n"
            response_text += f"   📞 Phone: {doc['phone']}\n"
            response_text += f"   🌐 Website: {doc['website']}\n\n"
        
        response_text += "💡 Tip: Call ahead to confirm availability and book an appointment."
        return response_text
    else:
        # Provide helpful fallback information
        return f"""🔍 I couldn't find specific {specialty_name} listings in {location.title()} right now, but here are some helpful suggestions:

**Alternative Ways to Find Doctors:**
• Search Google Maps for "{specialty_name} {location}"
• Check local hospital directories
• Contact major hospitals in {location} for referrals
• Use online platforms like Marham.pk or oladoc.com

**Major Hospitals in Pakistan:**
• Shaukat Khanum Memorial Cancer Hospital
• Aga Khan University Hospital  
• Services Hospital
• Mayo Hospital
• Combined Military Hospital (CMH)

💡 You can also ask your local pharmacy for doctor recommendations in your area."""

# ------------------------
# Assistant Node
# ------------------------
def assistant_node(state: AgentState):
    """Main assistant node that uses tools to provide medical advice or find doctors"""
    
    # Add system message to guide the LLM to use tools appropriately
    system_message = SystemMessage(content="""
You are a medical assistant chatbot. You have access to two tools:

1. get_medical_suggestions: Use this when users ask for medical advice, health suggestions, symptoms help, treatment advice, or general health guidance.

2. find_nearby_doctors: Use this when users ask to find doctors, hospitals, clinics, or medical professionals in a specific location.

IMPORTANT: You MUST use the appropriate tool for each request. Do not provide answers without using tools.

Examples of when to use get_medical_suggestions:
- "I have a headache, what should I do?"
- "I need medical advice because I am sick"
- "What can I take for a cold?"
- "I have stomach pain, any suggestions?"

Examples of when to use find_nearby_doctors:
- "Find doctors in Lahore"
- "I need a cardiologist in Karachi"
- "Show me hospitals near me"
- "Where can I find a dentist in Islamabad?"

Always use the tools to provide accurate and helpful responses.
""")
    
    # Create the messages with system message
    messages_with_system = [system_message] + state["messages"]
    
    # Create tools list and bind to LLM
    tools = [get_medical_suggestions, find_nearby_doctors]
    llm_with_tools = llm.bind_tools(tools)
    
    # Invoke LLM with tools
    response = llm_with_tools.invoke(messages_with_system)
    print("---llm_with_tools----", response)
    
    return {"messages": [response]}

# ------------------------
# Build Graph
# ------------------------
def build_graph():
    # Create tools
    tools = [get_medical_suggestions, find_nearby_doctors]
    
    # Build the graph
    builder = StateGraph(AgentState)
    builder.add_node("assistant", assistant_node)
    builder.add_node("tools", ToolNode(tools))
    
    # Add edges
    builder.add_edge(START, "assistant")
    builder.add_conditional_edges("assistant", tools_condition)
    builder.add_edge("tools", "assistant")
    


    return builder.compile()

# ------------------------
# Main Function
# ------------------------
memory = ConversationBufferWindowMemory(k=3, return_messages=True)

# ------------------------
# Main Endpoint
# ------------------------
@agentic_hospital_router.post("/chat/{user_id}/{thread_id}/{query}")
async def main(user_id: str, thread_id: str, query: str):
    print("----query----", query)
    print("----user_id----", user_id)
    print("----thread_id----", thread_id)

    graph = build_graph()

    try:
        # Save user query in MongoDB
        save_message(thread_id, user_id, "user", query)

        # Add to memory
        memory.chat_memory.add_user_message(query)

        # Invoke graph
        result = graph.invoke({"messages": memory.chat_memory.messages})
        final_message = result["messages"][-1]

        # Save assistant reply in MongoDB
        save_message(thread_id, user_id, "assistant", final_message.content)

        # Update memory
        memory.chat_memory.add_ai_message(final_message.content)

        return JSONResponse({
            "query": query,
            "answer": final_message.content
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return JSONResponse(
            {"query": query, "error": f"An error occurred: {str(e)}"},
            status_code=500
        )