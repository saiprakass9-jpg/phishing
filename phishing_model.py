import sys
import json
import re
from urllib.parse import urlparse

def extract_features(url):
    """
    Extracts features from a URL for phishing detection.
    Matches the logic in the Node.js server for consistency.
    """
    hostname = urlparse(url).netloc
    path = urlparse(url).path
    
    features = {
        "urlLength": len(url),
        "hasIpAddress": 1 if re.search(r'(?:\d{1,3}\.){3}\d{1,3}', url) else 0,
        "hasAtSymbol": 1 if '@' in url else 0,
        "hasDoubleSlash": 1 if url.rfind('//') > 7 else 0,
        "hasDash": 1 if '-' in url else 0,
        "hasHttps": 1 if url.startswith('https') else 0,
        "subdomainCount": max(0, hostname.count('.') - 1),
        "hasSuspiciousWords": 1 if re.search(r'login|signin|bank|account|update|verify|secure', url, re.I) else 0,
        "isShortened": 1 if re.search(r'bit\.ly|goo\.gl|tinyurl|t\.co', url, re.I) else 0,
    }
    return features

def predict(url):
    """
    Simulates SVM and LightGBM predictions.
    In a real scenario, you would load pre-trained models here.
    """
    features = extract_features(url)
    
    # Simulated weights for SVM
    svm_score = 0
    if features["hasIpAddress"]: svm_score += 35
    if features["hasAtSymbol"]: svm_score += 25
    if features["urlLength"] > 75: svm_score += 20
    if not features["hasHttps"]: svm_score += 15
    svm_score = min(max(svm_score, 5), 98) # Add some noise
    
    # Simulated weights for LightGBM
    lgbm_score = 0
    if features["hasSuspiciousWords"]: lgbm_score += 30
    if features["isShortened"]: lgbm_score += 25
    if features["subdomainCount"] > 2: lgbm_score += 20
    if features["hasDoubleSlash"]: lgbm_score += 20
    lgbm_score = min(max(lgbm_score, 8), 95) # Add some noise

    # Aggregate
    avg_score = (svm_score + lgbm_score) / 2
    
    label = "Safe"
    if avg_score >= 70:
        label = "Phishing"
    elif avg_score >= 35:
        label = "Suspicious"
        
    return {
        "url": url,
        "classification": label,
        "confidence": avg_score,
        "svm": {"confidence": svm_score, "label": "Phishing" if svm_score > 50 else "Safe"},
        "lightgbm": {"confidence": lgbm_score, "label": "Phishing" if lgbm_score > 50 else "Safe"},
        "features": features
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url_to_analyze = sys.argv[1]
        result = predict(url_to_analyze)
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps({"error": "No URL provided"}, indent=2))
