#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class FoodAnalyzerAPITester:
    def __init__(self, base_url="https://health-bites-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root Endpoint", False, str(e))
            return False

    def test_product_fetch(self, barcode="3017620422003"):
        """Test fetching product data from Open Food Facts"""
        try:
            response = requests.get(f"{self.base_url}/product/{barcode}", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                product = data.get("product", {})
                product_name = product.get("product_name", "Unknown")
                details += f", Product: {product_name}"
            self.log_test(f"Product Fetch ({barcode})", success, details)
            return success
        except Exception as e:
            self.log_test(f"Product Fetch ({barcode})", False, str(e))
            return False

    def test_product_analysis(self, barcode="3017620422003"):
        """Test product analysis with GPT"""
        try:
            print(f"🔍 Analyzing product {barcode}... (this may take 10-30 seconds)")
            response = requests.post(f"{self.base_url}/analyze/{barcode}", timeout=60)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                # Check if analysis has required fields
                required_fields = ["product_summary", "relevant_ingredients", "nutriscore", "confidence_meter"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    product_name = data.get("product_summary", {}).get("name", "Unknown")
                    nutriscore = data.get("nutriscore", {}).get("score_out_of_5", "N/A")
                    confidence = data.get("confidence_meter", {}).get("confidence_percentage", "N/A")
                    details += f", Product: {product_name}, NutriScore: {nutriscore}/5, Confidence: {confidence}"
                    
            self.log_test(f"Product Analysis ({barcode})", success, details)
            return success, data if success else None
        except Exception as e:
            self.log_test(f"Product Analysis ({barcode})", False, str(e))
            return False, None

    def test_chat_functionality(self, barcode="3017620422003"):
        """Test chat functionality"""
        try:
            # First ensure we have an analysis
            analysis_success, _ = self.test_product_analysis(barcode)
            if not analysis_success:
                self.log_test("Chat Functionality", False, "Analysis required for chat failed")
                return False

            # Test chat
            chat_data = {
                "barcode": barcode,
                "message": "What are the main health concerns with this product?",
                "history": []
            }
            
            response = requests.post(f"{self.base_url}/chat", json=chat_data, timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                chat_response = data.get("response", "")
                details += f", Response length: {len(chat_response)} chars"
                if len(chat_response) < 10:
                    success = False
                    details += ", Response too short"
                    
            self.log_test("Chat Functionality", success, details)
            return success
        except Exception as e:
            self.log_test("Chat Functionality", False, str(e))
            return False

    def test_history_endpoints(self):
        """Test history retrieval"""
        try:
            response = requests.get(f"{self.base_url}/history", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", History items: {len(data)}"
                
            self.log_test("History Retrieval", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("History Retrieval", False, str(e))
            return False, []

    def test_history_deletion(self):
        """Test history item deletion"""
        try:
            # First get history to find an item to delete
            history_success, history_data = self.test_history_endpoints()
            if not history_success or not history_data:
                self.log_test("History Deletion", False, "No history items to delete")
                return False

            # Try to delete the first item
            item_id = history_data[0].get("id")
            if not item_id:
                self.log_test("History Deletion", False, "No item ID found")
                return False

            response = requests.delete(f"{self.base_url}/history/{item_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Deleted ID: {item_id}"
            
            self.log_test("History Deletion", success, details)
            return success
        except Exception as e:
            self.log_test("History Deletion", False, str(e))
            return False

    def test_sample_barcodes(self):
        """Test all sample barcodes"""
        sample_barcodes = ["3017620422003", "5449000000996", "8001505005592"]
        successful_analyses = 0
        
        for barcode in sample_barcodes:
            print(f"\n🔍 Testing sample barcode: {barcode}")
            success, _ = self.test_product_analysis(barcode)
            if success:
                successful_analyses += 1
            time.sleep(2)  # Brief pause between requests
        
        overall_success = successful_analyses >= 2  # At least 2 out of 3 should work
        self.log_test(f"Sample Barcodes ({successful_analyses}/3)", overall_success, 
                     f"Successfully analyzed {successful_analyses} out of 3 sample barcodes")
        return overall_success

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Food Analyzer API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity
        self.test_root_endpoint()
        
        # Product data fetching
        self.test_product_fetch("3017620422003")  # Nutella
        
        # Core analysis functionality
        print("\n📊 Testing Analysis Features...")
        self.test_product_analysis("3017620422003")
        
        # Chat functionality
        print("\n💬 Testing Chat Features...")
        self.test_chat_functionality("3017620422003")
        
        # History management
        print("\n📚 Testing History Features...")
        self.test_history_endpoints()
        self.test_history_deletion()
        
        # Sample barcodes
        print("\n🏷️ Testing Sample Barcodes...")
        self.test_sample_barcodes()
        
        # Results summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API tests mostly successful!")
            return 0
        elif success_rate >= 60:
            print("⚠️ Backend API has some issues but core functionality works")
            return 1
        else:
            print("❌ Backend API has significant issues")
            return 2

def main():
    tester = FoodAnalyzerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())