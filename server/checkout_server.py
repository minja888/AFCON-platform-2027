"""
Karibu Arusha — Stripe Checkout backend (Python / Flask).

This is the SAME logic as the live Supabase Edge Function `create-payment`,
written in Python so it can be self-hosted (Flask here; drop the view into
Django just as easily). The website only ever sends a trip id — prices and
the Stripe key live on the server, never in the browser or in this repo.

Run locally:
    pip install flask requests
    set STRIPE_KEY=rk_test_...        (Windows)   |  export STRIPE_KEY=... (Linux/Mac)
    python checkout_server.py
Then point window.CONFIG at http://localhost:5000/create-checkout if you
want the site to use this server instead of the Supabase function.
"""
import os

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

STRIPE_KEY = os.environ.get("STRIPE_KEY", "")          # NEVER hard-code the key
SITE_URL = os.environ.get("SITE_URL", "https://afcon-platform-2027.vercel.app")
DEPOSIT_RATE = 0.20                                     # 20% deposit, min $10

# Server-side price list (USD) — the client can only pick a trip id.
PRICES = {
    "ngorongoro-day":          {"title": "Ngorongoro Crater Day Trip",      "price": 180},
    "tarangire-day":           {"title": "Tarangire Day Safari",            "price": 150},
    "arusha-np-day":           {"title": "Arusha National Park Day",        "price": 110},
    "materuni-coffee":         {"title": "Materuni Waterfalls & Coffee",    "price": 65},
    "maasai-boma":             {"title": "Maasai Boma Cultural Visit",      "price": 55},
    "manyara-ngorongoro-2d":   {"title": "Manyara + Ngorongoro (2 days)",   "price": 460},
    "tarangire-ngorongoro-2d": {"title": "Tarangire + Ngorongoro (2 days)", "price": 440},
    "serengeti-ngorongoro-3d": {"title": "Serengeti + Ngorongoro (3 days)", "price": 720},
}


@app.post("/create-checkout")
def create_checkout():
    body = request.get_json(silent=True) or {}
    trip = PRICES.get(str(body.get("tripId", "")))
    if not trip:
        return jsonify(error="unknown-trip"), 400
    if not STRIPE_KEY:
        return jsonify(error="server-missing-key"), 500

    deposit = max(10, round(trip["price"] * DEPOSIT_RATE))  # USD
    params = {
        "mode": "payment",
        "success_url": f"{SITE_URL}/#/pay-ok",
        "cancel_url": f"{SITE_URL}/#/trip/{body['tripId']}",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": f"Deposit — {trip['title']}",
        "line_items[0][price_data][product_data][description]":
            f"20% booking deposit (trip from ${trip['price']}). "
            "Balance paid to the licensed operator.",
        "line_items[0][price_data][unit_amount]": str(deposit * 100),
        "line_items[0][quantity]": "1",
        "metadata[tripId]": str(body["tripId"]),
    }
    name = str(body.get("name", ""))[:100]
    email = str(body.get("email", ""))
    if name:
        params["metadata[customer]"] = name
    if "@" in email:
        params["customer_email"] = email

    r = requests.post(
        "https://api.stripe.com/v1/checkout/sessions",
        auth=(STRIPE_KEY, ""),
        data=params,
        timeout=20,
    )
    data = r.json()
    if not r.ok:
        return jsonify(error=data.get("error", {}).get("message", "stripe")), 502
    return jsonify(url=data["url"], deposit=deposit)


@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "content-type"
    return resp


if __name__ == "__main__":
    app.run(port=5000, debug=False)
