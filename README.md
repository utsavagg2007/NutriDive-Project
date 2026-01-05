# 🥗 NutriDive

**NutriDive** is a full-stack nutrition analysis application that scans food barcodes to provide detailed ingredient breakdowns and nutritional data. Powered by AI insights, it helps users make informed dietary choices by translating complex labels into actionable health information.

## 🚀 Features

* 📷 **Barcode Scanning** – Instantly fetch product data from packaged foods.
* 🧾 **Ingredient Breakdown** – Detailed, easy-to-read lists of what’s actually in your food.
* 🍎 **Nutritional Information** – Comprehensive data on calories, macros, and micronutrients.
* 🤖 **AI Insights** – Smart analysis regarding health impact, allergen warnings, and healthier alternatives.

## 🏗️ Tech Stack

* **Frontend:** React (JavaScript), Yarn
* **Backend:** Python, FastAPI, Uvicorn
* **Database:** MongoDB
* **AI:** OpenAI API

---

## 📂 Project Structure

    plaintext
    ├── frontend/          # React UI components and logic
    ├── backend/           # FastAPI server, AI logic, and DB connection
    └── README.md          # Project documentation

  🖥️ Getting Started
1️⃣ Clone the Repository
Bash

git clone [https://github.com/utsavagg2007/NutriDive-Project.git](https://github.com/utsavagg2007/NutriDive-Project.git)
cd NutriDive-Project
2️⃣ Backend Setup
Navigate to the backend directory, set up a virtual environment, and install dependencies:

Bash

cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
3️⃣ Frontend Setup
Install the necessary packages using Yarn:

Bash

cd ../frontend
yarn install
4️⃣ Environment Configuration
Create .env files in both directories to store your credentials:

Backend (backend/.env):

Code snippet

MONGO_URL=mongodb://localhost:27017
DB_NAME=nutridive_db
OPENAI_API_KEY=your_openai_api_key_here
Frontend (frontend/.env):

Code snippet

REACT_APP_BACKEND_URL=http://localhost:8001
▶️ Running the Application
Ensure MongoDB is running locally at localhost:27017.

Start Backend:

Bash

cd backend
uvicorn server:app --reload --port 8001
Start Frontend:

Bash

cd frontend
yarn start
The app will be available at http://localhost:3000.

🔗 API Overview
Barcode Lookup: Retrieve product data via GTIN/Barcode.

AI Analysis: Post-processed nutritional insights via OpenAI.

History: Fetch previously scanned items (if logged in).

📌 Future Enhancements
👤 User Profiles: Save scan history and dietary preferences.

🎯 Goal Tracking: Recommendations based on weight loss or muscle gain.

📱 Mobile App: React Native support for easier on-the-go scanning.

📄 License
This project is licensed under the MIT License.
