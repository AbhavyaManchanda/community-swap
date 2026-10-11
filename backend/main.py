import json
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import (
    get_db_connection,
    init_db,
    seed_sample_data,
    reset_and_seed
)
from matcher import semantic_engine, find_community_matches

app = FastAPI(
    title="Community Swap-Meet & Local Event Matchmaker",
    description="Offline-First, Zero-Cloud Neighborhood Item & Skill Barter Platform",
    version="1.0.0"
)

# CORS setup for local React client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    name: str = Field(..., example="Maya Lin")
    neighborhood: str = Field(..., example="Maplewood Hills")
    contact_info: str = Field(..., example="@maya_grows (Signal / SMS)")
    bio: Optional[str] = Field(None, example="Urban gardener & sourdough baker.")

class ListingCreate(BaseModel):
    user_id: int
    type: str = Field(..., pattern="^(offer|want)$", example="offer")
    category: str = Field(..., pattern="^(item|skill)$", example="item")
    title: str = Field(..., example="Cast Iron Dutch Oven")
    description: str = Field(..., example="Pre-seasoned 5-quart camp dutch oven, perfect for baking bread.")
    condition_level: Optional[str] = Field("Good", example="Excellent")

class MeetupCreate(BaseModel):
    neighborhood: str
    location_name: str
    landmark: str
    address: str
    recommended_times: str
    outdoor_activity_hint: str

# --- Endpoints ---

@app.on_event("startup")
def on_startup():
    init_db()
    seed_sample_data()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "mode": "offline-local",
        "semantic_engine": semantic_engine.model_type,
        "database": "sqlite3 (local zero-cloud)"
    }

@app.post("/api/seed")
def seed_database():
    reset_and_seed()
    return {"message": "Database reset and seeded with sample neighborhood listings & outdoor spots."}

# --- Users ---

@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(u) for u in users]

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (name, neighborhood, contact_info, bio)
        VALUES (?, ?, ?, ?)
    """, (user.name, user.neighborhood, user.contact_info, user.bio))
    user_id = cursor.lastrowid
    conn.commit()
    created = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(created)

@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    listings = conn.execute("SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    return {
        **dict(user),
        "listings": [dict(l) for l in listings]
    }

# --- Listings ---

@app.get("/api/listings")
def get_listings(
    user_id: Optional[int] = None,
    type: Optional[str] = None,
    category: Optional[str] = None
):
    conn = get_db_connection()
    query = """
        SELECT l.*, u.name as user_name, u.neighborhood, u.contact_info
        FROM listings l
        JOIN users u ON l.user_id = u.id
        WHERE l.is_active = 1
    """
    params = []

    if user_id:
        query += " AND l.user_id = ?"
        params.append(user_id)
    if type:
        query += " AND l.type = ?"
        params.append(type)
    if category:
        query += " AND l.category = ?"
        params.append(category)

    query += " ORDER BY l.id DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/listings", status_code=status.HTTP_201_CREATED)
def create_listing(listing: ListingCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Validate user exists
    user = conn.execute("SELECT id FROM users WHERE id = ?", (listing.user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User does not exist")

    cursor.execute("""
        INSERT INTO listings (user_id, type, category, title, description, condition_level)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        listing.user_id,
        listing.type,
        listing.category,
        listing.title,
        listing.description,
        listing.condition_level
    ))
    listing_id = cursor.lastrowid
    conn.commit()

    created = conn.execute("""
        SELECT l.*, u.name as user_name, u.neighborhood, u.contact_info
        FROM listings l
        JOIN users u ON l.user_id = u.id
        WHERE l.id = ?
    """, (listing_id,)).fetchone()
    conn.close()
    return dict(created)

@app.delete("/api/listings/{listing_id}")
def delete_listing(listing_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
    conn.commit()
    conn.close()
    return {"message": "Listing deleted"}

# --- Outdoor Meetup Spots (Touch Grass) ---

@app.get("/api/meetups")
def get_meetup_spots():
    conn = get_db_connection()
    meetups = conn.execute("SELECT * FROM meetups ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(m) for m in meetups]

@app.post("/api/meetups", status_code=status.HTTP_201_CREATED)
def create_meetup_spot(spot: MeetupCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO meetups (neighborhood, location_name, landmark, address, recommended_times, outdoor_activity_hint)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        spot.neighborhood,
        spot.location_name,
        spot.landmark,
        spot.address,
        spot.recommended_times,
        spot.outdoor_activity_hint
    ))
    mid = cursor.lastrowid
    conn.commit()
    created = conn.execute("SELECT * FROM meetups WHERE id = ?", (mid,)).fetchone()
    conn.close()
    return dict(created)

# --- Matching Engine & Trade Loop Endpoints ---

@app.post("/api/match/run")
def run_matching_engine():
    """
    Executes local semantic cycle matching across active community offers & wants.
    Persists found direct and multi-way cycles into the SQLite database.
    """
    conn = get_db_connection()
    users = [dict(u) for u in conn.execute("SELECT * FROM users").fetchall()]
    listings = [dict(l) for l in conn.execute("SELECT * FROM listings WHERE is_active = 1").fetchall()]
    meetups = [dict(m) for m in conn.execute("SELECT * FROM meetups").fetchall()]

    matches = find_community_matches(users, listings, meetups)

    # Save to database
    cursor = conn.cursor()
    cursor.execute("DELETE FROM matches")  # Refresh current match batch

    saved_records = []
    for match in matches:
        meetup_id = match["recommended_meetup"]["id"] if match.get("recommended_meetup") else None
        chain_serialized = json.dumps(match)

        cursor.execute("""
            INSERT INTO matches (match_type, score, chain_json, meetup_id, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            match["match_type"],
            match["score"],
            chain_serialized,
            meetup_id,
            "active"
        ))
        match_id = cursor.lastrowid
        match["id"] = match_id
        saved_records.append(match)

    conn.commit()
    conn.close()

    return {
        "engine_used": semantic_engine.model_type,
        "total_matches_found": len(saved_records),
        "matches": saved_records
    }

@app.get("/api/matches")
def get_matches():
    """Retrieve all identified community matches and barter loops."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM matches ORDER BY score DESC, id ASC").fetchall()
    conn.close()

    results = []
    for row in rows:
        match_data = json.loads(row["chain_json"])
        match_data["id"] = row["id"]
        match_data["status"] = row["status"]
        results.append(match_data)
    return results

@app.get("/api/swappass/{match_id}")
def generate_swap_pass(match_id: int):
    """
    Generates a printable Swap Pass with ticket security hash,
    chain of exchange instructions, meetup details, and offline checklist.
    """
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM matches WHERE id = ?", (match_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Match not found")

    match_data = json.loads(row["chain_json"])
    ticket_code = f"PASS-{match_id:04d}-{uuid.uuid4().hex[:6].upper()}"

    swap_pass = {
        "ticket_code": ticket_code,
        "match_id": match_id,
        "match_type": match_data.get("match_type"),
        "cycle_length": match_data.get("cycle_length", 2),
        "score_percent": int(match_data.get("score", 0.8) * 100),
        "generated_at": match_data.get("created_at") or "2026-10-12",
        "meetup": match_data.get("recommended_meetup"),
        "trade_chain": match_data.get("trade_chain", []),
        "participants": match_data.get("participants", []),
        "offline_checklist": [
            "Inspect physical items or test skill equipment together on the grass.",
            "Confirm receipt with your trading neighbor before parting ways.",
            "Leave the park or garden cleaner than you found it (pack out all trash).",
            "Say hello to your neighbors and enjoy the fresh air!"
        ],
        "safety_notes": "All exchanges occur in daylight in public community parks or courtyards with zero online tracking."
    }

    return swap_pass

