from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from openai import AsyncOpenAI
import jwt
import bcrypt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI API Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
JWT_SECRET = os.environ.get('JWT_SECRET', 'nutridive-secret-key-2025')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== AUTH MODELS ==============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    allergens: List[str] = []
    created_at: str

class AllergenUpdate(BaseModel):
    allergens: List[str]

class TokenResponse(BaseModel):
    token: str
    user: UserProfile

# ============== PRODUCT MODELS ==============
class ProductSummary(BaseModel):
    name: str
    brand: str
    barcode: str
    quantity: str
    categories: List[str]
    food_type: str = "unknown"

class RelevantIngredient(BaseModel):
    name: str
    estimated_concentration: str
    health_impact: str
    long_term_effects: str

class MinorityIngredient(BaseModel):
    name: str
    reason_for_attention: str
    potential_long_term_risk: str

class NutritionalInsights(BaseModel):
    overall_assessment: str
    who_should_limit_consumption: str
    usage_recommendation: str

class NutriScore(BaseModel):
    score_out_of_5: str
    grade: str
    justification: str

class ConfidenceMeter(BaseModel):
    confidence_percentage: str
    confidence_explanation: str

class AllIngredient(BaseModel):
    name: str
    percentage: Optional[str] = None

class NutritionFact(BaseModel):
    name: str
    value: str
    unit: str
    daily_value: Optional[str] = None

class AllergenWarning(BaseModel):
    allergen: str
    found_in: List[str]
    severity: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    barcode: str
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str

class ScanHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    barcode: str
    product_name: str
    brand: str
    nutriscore: str
    food_type: str
    created_at: str

class CompareRequest(BaseModel):
    barcodes: List[str]

# ============== AUTH HELPERS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        return user
    except:
        return None

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ============== OPEN FOOD FACTS ==============
async def fetch_product_from_openfoodfacts(barcode: str) -> dict:
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(url, timeout=30.0)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Product not found")
        data = response.json()
        if data.get("status") != 1:
            raise HTTPException(status_code=404, detail="Product not found in Open Food Facts database")
        return data.get("product", {})

def detect_food_type(product: dict) -> str:
    """Detect if product is veg, non-veg, or egg-containing"""
    ingredients_text = (product.get("ingredients_text", "") or "").lower()
    categories = (product.get("categories", "") or "").lower()
    labels = (product.get("labels", "") or "").lower()
    
    non_veg_keywords = ["meat", "chicken", "beef", "pork", "fish", "seafood", "mutton", "lamb", 
                        "bacon", "ham", "turkey", "duck", "gelatin", "lard", "anchovies"]
    egg_keywords = ["egg", "eggs", "albumin", "lysozyme", "mayonnaise", "meringue"]
    
    combined = f"{ingredients_text} {categories} {labels}"
    
    for keyword in non_veg_keywords:
        if keyword in combined:
            return "non-veg"
    
    for keyword in egg_keywords:
        if keyword in combined:
            return "egg"
    
    if "vegan" in combined or "vegetarian" in combined:
        return "veg"
    
    return "veg"

def extract_nutrition_facts(nutriments: dict) -> List[dict]:
    """Extract nutrition facts from Open Food Facts data"""
    facts = []
    mapping = {
        "energy-kcal_100g": ("Calories", "kcal"),
        "fat_100g": ("Total Fat", "g"),
        "saturated-fat_100g": ("Saturated Fat", "g"),
        "carbohydrates_100g": ("Carbohydrates", "g"),
        "sugars_100g": ("Sugars", "g"),
        "fiber_100g": ("Fiber", "g"),
        "proteins_100g": ("Protein", "g"),
        "salt_100g": ("Salt", "g"),
        "sodium_100g": ("Sodium", "mg"),
    }
    
    for key, (name, unit) in mapping.items():
        value = nutriments.get(key)
        if value is not None:
            facts.append({"name": name, "value": str(round(value, 2)), "unit": unit, "daily_value": None})
    
    return facts

def check_allergens(ingredients_text: str, user_allergens: List[str]) -> List[dict]:
    """Check for allergens in ingredients"""
    warnings = []
    ingredients_lower = (ingredients_text or "").lower()
    
    allergen_keywords = {
        "nuts": ["nut", "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia"],
        "dairy": ["milk", "cream", "cheese", "butter", "lactose", "whey", "casein", "yogurt"],
        "gluten": ["wheat", "gluten", "barley", "rye", "oat", "semolina", "spelt"],
        "soy": ["soy", "soya", "lecithin"],
        "eggs": ["egg", "albumin", "lysozyme"],
        "shellfish": ["shrimp", "crab", "lobster", "shellfish", "prawn", "crawfish"]
    }
    
    for allergen in user_allergens:
        allergen_lower = allergen.lower()
        if allergen_lower in allergen_keywords:
            for keyword in allergen_keywords[allergen_lower]:
                if keyword in ingredients_lower:
                    warnings.append({
                        "allergen": allergen,
                        "found_in": [keyword],
                        "severity": "high"
                    })
                    break
    
    return warnings

# ============== GPT ANALYSIS ==============
ANALYSIS_SYSTEM_PROMPT = """You are a Food Product Ingredient & Health Impact Analyst AI.

IMPORTANT RULES:
1. ALL output text MUST be in ENGLISH only, regardless of input language
2. Translate any non-English product names, ingredients, or descriptions to English
3. Follow strict JSON output format
4. Do NOT give medical advice or exaggerate risks
5. Use neutral, scientific tone

NutriScore Mapping (CRITICAL):
- Grade A = 5/5 (Excellent nutritional quality)
- Grade B = 4/5 (Good nutritional quality)  
- Grade C = 3/5 (Average nutritional quality)
- Grade D = 2/5 (Poor nutritional quality)
- Grade E = 1/5 (Bad nutritional quality)

Determine the grade based on: sugar content, saturated fat, sodium, calories, fiber, protein, fruits/vegetables content.

Output Format (STRICT JSON):
{
  "product_summary": {
    "name": "Product name in English",
    "brand": "Brand name",
    "barcode": "barcode",
    "quantity": "quantity",
    "categories": ["category1", "category2"],
    "food_type": "veg|non-veg|egg"
  },
  "relevant_ingredients": [
    {
      "name": "Ingredient in English",
      "estimated_concentration": "X%",
      "health_impact": "Impact description in English",
      "long_term_effects": "Effects description in English"
    }
  ],
  "all_ingredients": [
    {"name": "Ingredient 1 in English", "percentage": "X%"},
    {"name": "Ingredient 2 in English", "percentage": null}
  ],
  "minority_ingredients": [
    {
      "name": "Ingredient in English",
      "reason_for_attention": "Reason in English",
      "potential_long_term_risk": "Risk in English"
    }
  ],
  "nutritional_insights": {
    "overall_assessment": "Assessment in English",
    "who_should_limit_consumption": "Groups in English",
    "usage_recommendation": "Recommendation in English"
  },
  "nutriscore": {
    "score_out_of_5": "5|4|3|2|1",
    "grade": "A|B|C|D|E",
    "justification": "Justification in English"
  },
  "confidence_meter": {
    "confidence_percentage": "X%",
    "confidence_explanation": "Explanation in English"
  }
}"""

CHAT_SYSTEM_PROMPT = """You are a conversational food-analysis assistant.
Answer user questions ONLY using the previously analyzed product data.
ALWAYS respond in ENGLISH regardless of the question language.
If information is missing, clearly say so.
Be helpful, accurate, and concise."""

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "name": data.name,
        "password": hash_password(data.password),
        "allergens": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    return TokenResponse(
        token=token,
        user=UserProfile(id=user_id, email=data.email, name=data.name, allergens=[], created_at=user["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserProfile(
            id=user["id"], email=user["email"], name=user["name"],
            allergens=user.get("allergens", []), created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user: dict = Depends(require_auth)):
    return UserProfile(**user)

@api_router.put("/auth/allergens")
async def update_allergens(data: AllergenUpdate, user: dict = Depends(require_auth)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"allergens": data.allergens}})
    return {"message": "Allergens updated", "allergens": data.allergens}

# ============== PRODUCT ROUTES ==============
@api_router.get("/")
async def root():
    return {"message": "NutriDive API"}

@api_router.get("/product/{barcode}")
async def get_product(barcode: str):
    product = await fetch_product_from_openfoodfacts(barcode)
    return {"product": product}

@api_router.post("/analyze/{barcode}")
async def analyze_product(barcode: str, user: Optional[dict] = Depends(get_current_user)):
    # Check cache
    existing = await db.analyses.find_one({"barcode": barcode}, {"_id": 0})
    if existing:
        # Add allergen warnings if user is logged in
        if user and user.get("allergens"):
            raw_data = existing.get("raw_product_data", {})
            ingredients_text = raw_data.get("ingredients", "")
            existing["allergen_warnings"] = check_allergens(ingredients_text, user["allergens"])
        return existing
    
    product = await fetch_product_from_openfoodfacts(barcode)
    
    product_data = {
        "name": product.get("product_name", "Unknown"),
        "brand": product.get("brands", "Unknown"),
        "barcode": barcode,
        "quantity": product.get("quantity", "Unknown"),
        "ingredients": product.get("ingredients_text", "Not available"),
        "ingredients_list": product.get("ingredients", []),
        "nutriments": product.get("nutriments", {}),
        "categories": product.get("categories", "").split(",") if product.get("categories") else [],
        "nutriscore_grade": product.get("nutriscore_grade", "Unknown"),
        "nova_group": product.get("nova_group", "Unknown"),
    }
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this food product (respond in ENGLISH only):\n\n{str(product_data)}"}
            ],
            temperature=0.2
        )
        cleaned = response.choices[0].message.content.strip()
        if cleaned.startswith("```json"): cleaned = cleaned[7:]
        if cleaned.startswith("```"): cleaned = cleaned[3:]
        if cleaned.endswith("```"): cleaned = cleaned[:-3]

        try:
            analysis_data = json.loads(cleaned.strip())
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from LLM: {cleaned}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")

        food_type = detect_food_type(product)
        nutrition_facts = extract_nutrition_facts(product.get("nutriments", {}))

        # Ensure nutriscore has grade
        nutriscore = analysis_data.get("nutriscore", {})
        if "grade" not in nutriscore:
            score = int(nutriscore.get("score_out_of_5", 3))
            grade_map = {5: "A", 4: "B", 3: "C", 2: "D", 1: "E"}
            nutriscore["grade"] = grade_map.get(score, "C")

        analysis_result = {
            "id": str(uuid.uuid4()),
            "barcode": barcode,
            "product_summary": {**analysis_data.get("product_summary", {}), "food_type": food_type},
            "relevant_ingredients": analysis_data.get("relevant_ingredients", []),
            "all_ingredients": analysis_data.get("all_ingredients", []),
            "minority_ingredients": analysis_data.get("minority_ingredients", []),
            "nutritional_insights": analysis_data.get("nutritional_insights", {}),
            "nutriscore": nutriscore,
            "confidence_meter": analysis_data.get("confidence_meter", {}),
            "nutrition_facts": nutrition_facts,
            "raw_product_data": product_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Add allergen warnings
        if user and user.get("allergens"):
            analysis_result["allergen_warnings"] = check_allergens(product_data.get("ingredients", ""), user["allergens"])

        await db.analyses.insert_one(analysis_result.copy())
        # Remove _id if it was added by MongoDB
        analysis_result.pop("_id", None)
        return analysis_result

    except Exception as e:
        logger.error(f"Error analyzing product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/compare")
async def compare_products(request: CompareRequest, user: Optional[dict] = Depends(get_current_user)):
    if len(request.barcodes) < 2 or len(request.barcodes) > 3:
        raise HTTPException(status_code=400, detail="Please provide 2-3 barcodes for comparison")
    
    products = []
    for barcode in request.barcodes:
        analysis = await db.analyses.find_one({"barcode": barcode}, {"_id": 0})
        if not analysis:
            # Trigger analysis if not exists
            try:
                from fastapi import Request
                analysis = await analyze_product(barcode, user)
            except:
                raise HTTPException(status_code=404, detail=f"Could not analyze product {barcode}")
        products.append(analysis)
    
    return {"products": products}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_product(request: ChatRequest):
    analysis = await db.analyses.find_one({"barcode": request.barcode}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Product not analyzed yet")
    
    context = f"""Product: {analysis.get('product_summary', {}).get('name', 'Unknown')}
Brand: {analysis.get('product_summary', {}).get('brand', 'Unknown')}
Key Ingredients: {', '.join([i.get('name', '') for i in analysis.get('relevant_ingredients', [])])}
NutriScore: {analysis.get('nutriscore', {}).get('grade', 'N/A')} ({analysis.get('nutriscore', {}).get('score_out_of_5', 'N/A')}/5)
Assessment: {analysis.get('nutritional_insights', {}).get('overall_assessment', 'N/A')}
Full Data: {str(analysis)}"""
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": f"{CHAT_SYSTEM_PROMPT}\n\nContext:\n{context}"},
                {"role": "user", "content": request.message}
            ],
            temperature=0.3
        )
        return ChatResponse(response=response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@api_router.get("/history", response_model=List[ScanHistory])
async def get_scan_history(user: Optional[dict] = Depends(get_current_user)):
    query = {}
    if user:
        query["user_id"] = user["id"]
    
    analyses = await db.analyses.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    history = []
    for a in analyses:
        history.append(ScanHistory(
            id=a.get("id", ""),
            barcode=a.get("barcode", ""),
            product_name=a.get("product_summary", {}).get("name", "Unknown"),
            brand=a.get("product_summary", {}).get("brand", "Unknown"),
            nutriscore=a.get("nutriscore", {}).get("grade", "N/A"),
            food_type=a.get("product_summary", {}).get("food_type", "unknown"),
            created_at=a.get("created_at", "")
        ))
    return history

@api_router.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str):
    result = await db.analyses.delete_one({"id": analysis_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted successfully"}

@api_router.get("/analysis/{barcode}")
async def get_analysis(barcode: str, user: Optional[dict] = Depends(get_current_user)):
    analysis = await db.analyses.find_one({"barcode": barcode}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if user and user.get("allergens"):
        raw_data = analysis.get("raw_product_data", {})
        analysis["allergen_warnings"] = check_allergens(raw_data.get("ingredients", ""), user["allergens"])
    
    return analysis

# Include router and middleware
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
