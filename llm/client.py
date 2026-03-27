import os
from openai import OpenAI
from dotenv import load_dotenv
import json
from typing import Dict, Any, List

# Load environment variables from .env file
load_dotenv()

def call_llm(prompt, model=None):
    """
    Calls the Featherless AI API (OpenAI compatible).
    """
    api_key = os.getenv("FEATHERLESS_API_KEY")
    base_url = os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1")
    default_model = os.getenv("FEATHERLESS_DEFAULT_MODEL", "Qwen/Qwen2.5-7B-Instruct")

    # Use provided model or fall back to default
    target_model = model if model else default_model

    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )

    try:
        response = client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": "You are a helpful coding assistant specialized in Solana and Rust."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error calling LLM: {str(e)}"

# ==================== NEW: AML ALERT PROCESSING ====================

def process_aml_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process an AML alert and determine if it requires SAR filing.
    Uses LLM to analyze transaction patterns and risk factors.
    """
    prompt = f"""
    You are an AML compliance expert analyzing a potential suspicious transaction alert.

    ALERT DATA:
    {json.dumps(alert_data, indent=2)}

    Analyze this alert for suspicious activity indicators including:
    1. Unusual transaction patterns (velocity, amount, frequency)
    2. Geographic anomalies (high-risk jurisdictions, unusual routing)
    3. Counterparty relationships (sanctions, PEP exposure)
    4. Risk scoring trends (escalating risk scores)
    5. Travel Rule compliance gaps

    Determine if this requires a Suspicious Activity Report (SAR) filing.

    Respond with JSON in this format:
    {{
        "requires_sar": true/false,
        "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
        "indicators": ["list", "of", "suspicious", "indicators"],
        "analysis": "brief explanation",
        "recommended_actions": ["list", "of", "actions"]
    }}
    """

    response = call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")
    try:
        return json.loads(response)
    except:
        return {
            "requires_sar": False,
            "risk_level": "UNKNOWN",
            "indicators": [],
            "analysis": "LLM analysis failed",
            "recommended_actions": ["Manual review required"]
        }

def generate_sar_report(alert_data: Dict[str, Any], analysis: Dict[str, Any]) -> str:
    """
    Generate a Suspicious Activity Report (SAR) using LLM analysis.
    Follows standard SAR format for financial institutions.
    """
    prompt = f"""
    You are an AML compliance officer drafting a Suspicious Activity Report (SAR).

    ALERT DATA:
    {json.dumps(alert_data, indent=2)}

    ANALYSIS RESULTS:
    {json.dumps(analysis, indent=2)}

    Generate a comprehensive SAR report including:

    1. SUBJECT: Brief description of suspicious activity
    2. NARRATIVE: Detailed description of transactions and suspicious indicators
    3. SUSPECTED CRIMINAL ACTIVITY: Type of potential crime (money laundering, fraud, etc.)
    4. AMOUNT INVOLVED: Total value of suspicious transactions
    5. DATE/TIME OF ACTIVITY: Timeline of suspicious transactions
    6. LOCATION: Geographic information and jurisdictions involved
    7. REASONS FOR SAR FILING: Specific red flags and risk factors
    8. ADDITIONAL INFORMATION: Any other relevant details

    Format as a professional SAR document with clear sections.
    """

    return call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")

def analyze_transaction_velocity(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze transaction velocity patterns for AML monitoring.
    """
    prompt = f"""
    Analyze these transactions for velocity-based AML red flags:

    TRANSACTIONS:
    {json.dumps(transactions, indent=2)}

    Look for:
    1. Rapid succession of transactions (smurfing/structuring)
    2. Unusual frequency patterns
    3. Amount layering (breaking large amounts into smaller ones)
    4. Geographic velocity (rapid movement between jurisdictions)
    5. Counterparty velocity (rapid changes in counterparties)

    Respond with JSON:
    {{
        "velocity_score": "LOW/MEDIUM/HIGH",
        "red_flags": ["list", "of", "velocity", "issues"],
        "recommendations": ["monitoring", "actions"]
    }}
    """

    response = call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")
    try:
        return json.loads(response)
    except:
        return {
            "velocity_score": "UNKNOWN",
            "red_flags": [],
            "recommendations": ["Manual velocity analysis required"]
        }

# ==================== NEW: AI AML AGENT ====================

def ai_aml_agent_analysis(transaction_data: Dict[str, Any], historical_pattern: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Advanced AI AML analysis using transaction patterns and historical data.
    """
    prompt = f"""
    You are an advanced AI AML (Anti-Money Laundering) agent analyzing a suspicious transaction.

    CURRENT TRANSACTION:
    {json.dumps(transaction_data, indent=2)}

    HISTORICAL PATTERNS (last 30 days):
    {json.dumps(historical_pattern, indent=2)}

    Perform comprehensive AML analysis including:

    1. PATTERN RECOGNITION:
       - Smurfing (structuring to avoid reporting thresholds)
       - Layering (complex transaction chains)
       - Integration (placing illicit funds into economy)
       - Trade-based money laundering
       - Casino money laundering patterns

    2. BEHAVIORAL ANALYSIS:
       - Deviation from normal transaction patterns
       - Unusual timing (holidays, off-hours)
       - Round number amounts
       - Rapid jurisdiction changes
       - New counterparty relationships

    3. RISK SCORING:
       - Calculate probability of illicit activity (0-100%)
       - Identify specific red flags
       - Assess severity and urgency

    4. RECOMMENDATIONS:
       - Monitoring actions
       - Enhanced due diligence requirements
       - SAR filing recommendations
       - Transaction blocking suggestions

    Respond with JSON:
    {{
        "risk_probability": 0-100,
        "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
        "detected_patterns": ["pattern1", "pattern2"],
        "red_flags": ["flag1", "flag2"],
        "analysis_summary": "brief explanation",
        "recommendations": ["action1", "action2"],
        "sar_required": true/false,
        "block_transaction": true/false,
        "enhanced_monitoring": true/false
    }}
    """

    response = call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")
    try:
        return json.loads(response)
    except:
        return {
            "risk_probability": 50,
            "risk_level": "MEDIUM",
            "detected_patterns": ["analysis_failed"],
            "red_flags": ["manual_review_required"],
            "analysis_summary": "AI analysis failed - manual review required",
            "recommendations": ["Manual AML review"],
            "sar_required": False,
            "block_transaction": False,
            "enhanced_monitoring": True
        }

def predictive_risk_scoring(entity_data: Dict[str, Any], network_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Predictive risk scoring using entity data and network analysis.
    """
    prompt = f"""
    Perform predictive AML risk scoring for an entity using network analysis.

    ENTITY DATA:
    {json.dumps(entity_data, indent=2)}

    NETWORK CONNECTIONS:
    {json.dumps(network_data, indent=2)}

    Analyze:
    1. Direct risk factors (PEP, sanctions, adverse media)
    2. Network risk (connections to high-risk entities)
    3. Behavioral patterns (transaction velocity, amounts)
    4. Geographic risk (high-risk jurisdictions)
    5. Industry risk (high-risk business sectors)

    Calculate predictive risk score considering:
    - Historical behavior patterns
    - Network proximity to risk
    - Transaction patterns
    - External risk databases

    Respond with JSON:
    {{
        "predictive_risk_score": 0-100,
        "risk_category": "LOW/MEDIUM/HIGH/CRITICAL",
        "risk_factors": ["factor1", "factor2"],
        "network_risk_level": "LOW/MEDIUM/HIGH",
        "recommended_actions": ["action1", "action2"],
        "monitoring_level": "STANDARD/ENHANCED/SPECIAL",
        "review_frequency": "DAILY/WEEKLY/MONTHLY"
    }}
    """

    response = call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")
    try:
        return json.loads(response)
    except:
        return {
            "predictive_risk_score": 30,
            "risk_category": "MEDIUM",
            "risk_factors": ["analysis_failed"],
            "network_risk_level": "MEDIUM",
            "recommended_actions": ["Manual review"],
            "monitoring_level": "ENHANCED",
            "review_frequency": "WEEKLY"
        }

def compliance_advisory_engine(transaction_data: Dict[str, Any], jurisdiction: str) -> Dict[str, Any]:
    """
    AI-powered compliance advisory for regulatory requirements.
    """
    prompt = f"""
    Provide compliance advisory for a transaction in {jurisdiction} jurisdiction.

    TRANSACTION DATA:
    {json.dumps(transaction_data, indent=2)}

    JURISDICTION: {jurisdiction}

    Analyze compliance requirements:
    1. Travel Rule applicability (FATF Recommendation 16)
    2. Threshold reporting requirements
    3. Record keeping obligations
    4. Enhanced due diligence requirements
    5. Suspicious activity reporting thresholds

    Consider:
    - Local regulatory requirements
    - International standards (FATF, EU, US)
    - Transaction type and amount
    - Counterparty information
    - Geographic factors

    Respond with JSON:
    {{
        "travel_rule_required": true/false,
        "reporting_required": true/false,
        "record_keeping_days": 365-2555,
        "edd_required": true/false,
        "compliance_actions": ["action1", "action2"],
        "regulatory_notes": "jurisdiction specific notes",
        "risk_mitigation_steps": ["step1", "step2"]
    }}
    """

    response = call_llm(prompt, model="Qwen/Qwen2.5-7B-Instruct")
    try:
        return json.loads(response)
    except:
        return {
            "travel_rule_required": transaction_data.get("amount", 0) >= 100000,  # $1k threshold
            "reporting_required": False,
            "record_keeping_days": 1825,  # 5 years
            "edd_required": False,
            "compliance_actions": ["Standard KYC check"],
            "regulatory_notes": "AI analysis failed - standard compliance applied",
            "risk_mitigation_steps": ["Manual compliance review"]
        }

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        # Test call
        print(call_llm("Hello, who are you?"))
    else:
        command = sys.argv[1]
        
        if command == "process_alert" and len(sys.argv) >= 3:
            alert_data = json.loads(sys.argv[2])
            result = process_aml_alert(alert_data)
            print(json.dumps(result))
            
        elif command == "generate_sar" and len(sys.argv) >= 4:
            alert_data = json.loads(sys.argv[2])
            analysis = json.loads(sys.argv[3])
            sar_report = generate_sar_report(alert_data, analysis)
            print(sar_report)
            
        elif command == "analyze_velocity" and len(sys.argv) >= 3:
            transactions = json.loads(sys.argv[2])
            result = analyze_transaction_velocity(transactions)
            print(json.dumps(result))
            
        elif command == "ai_aml_analysis" and len(sys.argv) >= 4:
            transaction_data = json.loads(sys.argv[2])
            historical_pattern = json.loads(sys.argv[3])
            result = ai_aml_agent_analysis(transaction_data, historical_pattern)
            print(json.dumps(result))
            
        elif command == "predictive_risk" and len(sys.argv) >= 4:
            entity_data = json.loads(sys.argv[2])
            network_data = json.loads(sys.argv[3])
            result = predictive_risk_scoring(entity_data, network_data)
            print(json.dumps(result))
            
        elif command == "compliance_advisory" and len(sys.argv) >= 4:
            transaction_data = json.loads(sys.argv[2])
            jurisdiction = sys.argv[3]
            result = compliance_advisory_engine(transaction_data, jurisdiction)
            print(json.dumps(result))
            
        else:
            print("Usage: python client.py [command] [args...]")
            print("Commands:")
            print("  process_alert <alert_data_json>")
            print("  generate_sar <alert_data_json> <analysis_json>")
            print("  analyze_velocity <transactions_json>")
            print("  ai_aml_analysis <transaction_data_json> <historical_pattern_json>")
            print("  predictive_risk <entity_data_json> <network_data_json>")
            print("  compliance_advisory <transaction_data_json> <jurisdiction>")
