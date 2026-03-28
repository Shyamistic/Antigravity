"""
SIX BFI Live FX Rate Fetcher
Account: CH56655 | StableHacks 2026
Server TLS: SwissSign (public CA, trusted via certifi)
Client auth: MTLS with SIX-issued certificate
"""

import os
import json
import sys
from pathlib import Path

import requests
try:
    import certifi
    VERIFY = certifi.where()
except ImportError:
    VERIFY = True # Fallback to requests' bundled certs or system store

CREDS_DIR = Path(__file__).parent.parent / "details" / "six_api_creds" / "CH56655-api2026hack38"
CERT_FILE = str(CREDS_DIR / "signed-certificate.pem")
KEY_FILE  = str(CREDS_DIR / "private-key.pem")

SIX_BASE = "https://api.six-group.com/web/v1"

# SIX BFI instrument identifiers for FX pairs (using VALOR_BC scheme)
# Source: Cross Currency and Precious Metals Identifiers.xlsx
FX_VALOR_BCS = {
    "USD/CHF": "275000_148",
    "USD/EUR": "968984_148",
    "EUR/CHF": "897789_148",
    "USD/GBP": "275017_148",
    "XAU/USD": "274702_148",
}

FALLBACK_RATES = {
    "USD/CHF": 0.7974,
    "USD/EUR": 0.9145,
    "EUR/CHF": 0.8715,
    "USD/GBP": 0.7842,
    "XAU/USD": 2185.06,
}


def fetch_live_fx_rate(pair: str) -> dict:
    valor_bc = FX_VALOR_BCS.get(pair)
    if not valor_bc:
        return {"pair": pair, "rate": FALLBACK_RATES.get(pair, 1.0), "source": "fallback-no-id"}

    url = f"{SIX_BASE}/listings/marketData/intradaySnapshot"
    params = {
        "scheme": "VALOR_BC",
        "ids": valor_bc,
        "fields": "last,bid,ask,currency,timestamp"
    }
    headers = {"Accept": "application/json", "User-Agent": "Antigravity/1.0"}

    try:
        resp = requests.get(
            url,
            params=params,
            headers=headers,
            cert=(CERT_FILE, KEY_FILE),
            verify=VERIFY,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        
        # New API structure: data -> data -> listings -> [0] -> marketData -> intradaySnapshot
        listings = data.get("data", {}).get("listings", [])
        if listings:
            snapshot = listings[0].get("marketData", {}).get("intradaySnapshot", {})
            
            # Extract rate from 'last.value'
            last_obj = snapshot.get("last", {})
            last_price = float(last_obj.get("value", FALLBACK_RATES.get(pair, 1.0)))
            
            return {
                "pair": pair,
                "rate": last_price,
                "bid": float(snapshot.get("bid", {}).get("value", last_price)),
                "ask": float(snapshot.get("ask", {}).get("value", last_price)),
                "source": "SIX-BFI-LIVE",
                "timestamp": last_obj.get("timestamp"),
                "valor_bc": valor_bc,
                "http_status": resp.status_code,
            }
        
        return {
            "pair": pair,
            "rate": FALLBACK_RATES.get(pair, 1.0),
            "source": "SIX-BFI-LIVE-EMPTY",
            "http_status": resp.status_code,
            "valor_bc": valor_bc,
        }

    except requests.exceptions.SSLError as e:
        print(f"[SIX API] SSL error for {pair}: {e}", file=sys.stderr)
    except requests.exceptions.HTTPError as e:
        print(f"[SIX API] HTTP {e.response.status_code} for {pair}: {e}", file=sys.stderr)
        # HTTP error means we DID reach SIX — log the status
        return {
            "pair": pair,
            "rate": FALLBACK_RATES.get(pair, 1.0),
            "source": f"SIX-BFI-HTTP-{e.response.status_code}",
            "http_status": e.response.status_code,
            "valor_bc": valor_bc,
        }
    except requests.exceptions.ConnectionError as e:
        print(f"[SIX API] Connection error for {pair}: {e}", file=sys.stderr)
    except Exception as e:
        print(f"[SIX API] Error for {pair}: {e}", file=sys.stderr)

    return {
        "pair": pair,
        "rate": FALLBACK_RATES.get(pair, 1.0),
        "source": "SIX-BFI-FALLBACK",
        "valor_bc": valor_bc,
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        pair = sys.argv[1].upper()
        result = fetch_live_fx_rate(pair)
        print(json.dumps(result, indent=2))
    else:
        print("Fetching all SIX BFI FX rates...\n")
        for pair in FX_VALOR_BCS:
            result = fetch_live_fx_rate(pair)
            tag = "🟢 LIVE" if "LIVE" in result["source"] else "🟡 FALLBACK"
            print(f"  {pair}: {result['rate']:.4f}  [{tag}]  source={result['source']}")
