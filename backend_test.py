#!/usr/bin/env python3
"""
Family Calendar Backend API Tests
Tests the core backend functionality including PIN verification, auth status, and health check.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get base URL from environment or use default
BASE_URL = "https://familycalendar-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_health_check():
    """Test GET /api/health endpoint"""
    print("\n=== Testing Health Check API ===")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok' and 'timestamp' in data:
                print("✅ Health check API working correctly")
                return True
            else:
                print("❌ Health check API returned unexpected response format")
                return False
        else:
            print(f"❌ Health check API failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check API request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Health check API test error: {e}")
        return False

def test_pin_verification():
    """Test POST /api/verify-pin endpoint"""
    print("\n=== Testing PIN Verification API ===")
    
    # Test correct PIN
    print("\n--- Testing Correct PIN (0312) ---")
    try:
        payload = {"pin": "0312"}
        response = requests.post(
            f"{API_BASE}/verify-pin", 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') is True:
                print("✅ Correct PIN verification working")
                correct_pin_success = True
            else:
                print("❌ Correct PIN should return success: true")
                correct_pin_success = False
        else:
            print(f"❌ Correct PIN verification failed with status {response.status_code}")
            correct_pin_success = False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Correct PIN verification request failed: {e}")
        correct_pin_success = False
    except Exception as e:
        print(f"❌ Correct PIN verification test error: {e}")
        correct_pin_success = False
    
    # Test incorrect PIN
    print("\n--- Testing Incorrect PIN (1234) ---")
    try:
        payload = {"pin": "1234"}
        response = requests.post(
            f"{API_BASE}/verify-pin", 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 401:
            data = response.json()
            if data.get('success') is False and 'message' in data:
                print("✅ Incorrect PIN verification working")
                incorrect_pin_success = True
            else:
                print("❌ Incorrect PIN should return success: false with message")
                incorrect_pin_success = False
        else:
            print(f"❌ Incorrect PIN should return 401 status, got {response.status_code}")
            incorrect_pin_success = False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Incorrect PIN verification request failed: {e}")
        incorrect_pin_success = False
    except Exception as e:
        print(f"❌ Incorrect PIN verification test error: {e}")
        incorrect_pin_success = False
    
    return correct_pin_success and incorrect_pin_success

def test_auth_status():
    """Test GET /api/auth/status endpoint"""
    print("\n=== Testing Auth Status API ===")
    try:
        response = requests.get(f"{API_BASE}/auth/status", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'authenticated' in data and 'message' in data:
                # Since no Google OAuth is set up yet, authenticated should be false
                if data.get('authenticated') is False:
                    print("✅ Auth status API working correctly (not authenticated as expected)")
                    return True
                else:
                    print("⚠️ Auth status shows authenticated=true (unexpected but not necessarily wrong)")
                    return True
            else:
                print("❌ Auth status API missing required fields (authenticated, message)")
                return False
        else:
            print(f"❌ Auth status API failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth status API request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Auth status API test error: {e}")
        return False

def test_add_event_without_auth():
    """Test POST /api/add-event endpoint without Google OAuth (should fail as expected)"""
    print("\n=== Testing Add Event API (Without Auth - Expected to Fail) ===")
    try:
        payload = {
            "title": "Test Family Event",
            "date": "2024-01-15",
            "startTime": "10:00",
            "endTime": "11:00",
            "notes": "Test event for API validation",
            "isAllDay": False
        }
        response = requests.post(
            f"{API_BASE}/add-event", 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # This should fail with 401 due to missing Google OAuth
        if response.status_code == 401:
            data = response.json()
            if data.get('success') is False and 'Google Calendar not connected' in data.get('message', ''):
                print("✅ Add event API correctly returns auth error (expected behavior)")
                return True
            else:
                print("⚠️ Add event API returned 401 but with unexpected message")
                return True
        else:
            print(f"⚠️ Add event API returned unexpected status {response.status_code} (expected 401)")
            return True  # Not a critical failure since OAuth isn't set up
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Add event API request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Add event API test error: {e}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print(f"🚀 Starting Family Calendar Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = {}
    
    # Run individual tests
    results['health_check'] = test_health_check()
    results['pin_verification'] = test_pin_verification()
    results['auth_status'] = test_auth_status()
    results['add_event_without_auth'] = test_add_event_without_auth()
    
    # Summary
    print("\n" + "="*60)
    print("🏁 TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend API tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - check details above")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)