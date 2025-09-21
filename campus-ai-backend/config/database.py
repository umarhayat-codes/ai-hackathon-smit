from os import getenv
from pymongo import MongoClient

from dotenv import load_dotenv
load_dotenv()

url=getenv('MONGO_DB_URL')

def db_connection():
    try:
        client=MongoClient(url)
        db=client['ai_hackathon_db']
        collection=db['user']
        return collection
    except Exception as e:
        print("Connection Error: ",e)
        return None