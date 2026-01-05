🥗 NutriDive

A full-stack nutrition analysis application that scans food barcodes and provides detailed ingredient and nutritional information, along with AI-powered insights to help users make healthier choices.

🚀 Features

📷 Barcode Scanning – Scan packaged food barcodes to fetch product data

🧾 Ingredient Breakdown – View ingredients with clarity

🍎 Nutritional Information – Calories, macros, and other key nutrients

🤖 AI Insights – Smart analysis of the product (health impact, warnings, suggestions)

🏗️ Tech Stack
Frontend

JavaScript / React

Yarn for package management

Backend

Python

FastAPI

Uvicorn

📂 Project Structure
├── frontend/
│   └── (UI code)
│
├── backend/
│   ├── server.py
│   └── (API & AI logic)
│
└── README.md

🖥️ Getting Started
1️⃣ Clone the Repository
git clone https://github.com/utsavagg2007/NutriDive-Project.git

cd your-repo-name

▶️ Running the Application
🔹 Frontend

Navigate to the frontend directory and start the app:

yarn start


The frontend will launch in your browser (usually at http://localhost:3000).

🔹 Backend

Navigate to the backend directory and run:

uvicorn server:app --reload --port 8001


The API will be available at:

http://localhost:8001

🔗 API Overview

Barcode scanning endpoint

Nutrition & ingredient data retrieval

AI-powered analysis and insights

(You can expand this section later with actual endpoints.)

🧠 AI Insights

The AI analyzes:

Ingredient quality

Nutritional balance

Potential health concerns

Overall food rating or recommendations

📌 Future Enhancements

User profiles & history

Health goal-based recommendations

Mobile app support

Multi-language support


📄 License

This project is licensed under the MIT License.
