import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "comm_swap.db")

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    """Initialize SQLite schema with tables for offline-first neighbor trading."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        neighborhood TEXT NOT NULL,
        contact_info TEXT NOT NULL,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('offer', 'want')) NOT NULL,
        category TEXT CHECK(category IN ('item', 'skill')) NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        condition_level TEXT DEFAULT 'Good',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meetups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        neighborhood TEXT NOT NULL,
        location_name TEXT NOT NULL,
        landmark TEXT NOT NULL,
        address TEXT NOT NULL,
        recommended_times TEXT NOT NULL,
        outdoor_activity_hint TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_type TEXT NOT NULL,
        score REAL NOT NULL,
        chain_json TEXT NOT NULL,
        meetup_id INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE SET NULL
    );
    """)

    conn.commit()
    conn.close()

def seed_sample_data() -> None:
    """Seed community data showcasing multi-way barter loops and grass-touching outdoor spots."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # Seed Grass-Touching Local Meetup Spots
    meetup_spots = [
        (
            "Maplewood Hills",
            "Sunny Creek Community Garden",
            "Near the wooden tool shed & sunflower patch",
            "442 Meadow Lane, Maplewood",
            "Saturday 10:00 AM - 12:00 PM",
            "Smell fresh lavender, help water seedlings, and swap gardening seeds!"
        ),
        (
            "Maplewood Hills",
            "Oak Grove Public Library Courtyard",
            "Under the giant 100-year-old Willow Tree",
            "120 Library Square, Maplewood",
            "Sunday 2:00 PM - 4:00 PM",
            "Sit on park benches, touch grass, and exchange books or vintage records."
        ),
        (
            "Riverdale Valley",
            "Riverside Bikeway Gazebo",
            "Gazebo #3 right beside the gravel bike trail",
            "88 Riverbend Road, Riverdale",
            "Saturday 11:00 AM - 1:00 PM",
            "Tune bicycle chains together, walk along the river, and trade sports gear."
        ),
        (
            "Riverdale Valley",
            "Farmers Market Community Lawn",
            "Between the Apple Cider stall and acoustic music circle",
            "500 Valley Way, Riverdale",
            "Sunday 9:00 AM - 1:00 PM",
            "Enjoy fresh open air, local fruit samples, and hand-to-hand maker swaps."
        )
    ]

    cursor.executemany("""
    INSERT INTO meetups (neighborhood, location_name, landmark, address, recommended_times, outdoor_activity_hint)
    VALUES (?, ?, ?, ?, ?, ?)
    """, meetup_spots)

    # Seed Neighbors
    users = [
        ("Maya Lin", "Maplewood Hills", "@maya_grows (Signal / SMS)", "Backyard permaculture enthusiast & sourdough baker."),
        ("Carlos Gomez", "Maplewood Hills", "carlos.repairs@mesh.local", "Amateur bike mechanic and woodcarver."),
        ("Aisha Patel", "Maplewood Hills", "aisha.reads@local.org", "Avid book reader, camper, and beginner gardener."),
        ("Elena Rostova", "Riverdale Valley", "@elena_valley", "Hiker, DIY electronics tinkerer, and herbalist."),
        ("Devon Brooks", "Riverdale Valley", "devon.maker@grass.lan", "Upcycler, camping fanatic, and acoustic guitar player.")
    ]

    cursor.executemany("""
    INSERT INTO users (name, neighborhood, contact_info, bio)
    VALUES (?, ?, ?, ?)
    """, users)

    # Note on Listings designed to form perfect 3-way barter loop and 2-way swaps:
    # Maya (User 1):
    #   OFFERS: Active Sourdough Starter & Proofing Basket (item)
    #   WANTS: Garden Shovel & Pruning Shears (item)
    # Carlos (User 2):
    #   OFFERS: Heavy Duty Garden Shovel & Pruners (item)
    #   WANTS: Bicycle Repair Stand or Tune-up gear / Outdoor Tent (item)
    # Aisha (User 3):
    #   OFFERS: 2-Person Waterproof Camping Tent (item)
    #   WANTS: Fresh Sourdough Starter & Fermentation Guide (item)
    # -> MULTI-WAY LOOP: Maya gives Sourdough to Aisha -> Aisha gives Tent to Carlos -> Carlos gives Shovel to Maya!
    #
    # Plus Direct Swap:
    # Carlos OFFERS: Bicycle Maintenance & Gear Tuning (skill)
    # Aisha WANTS: Basic Bicycle Tune-up & Tire Fix (skill)
    # Aisha OFFERS: Acoustic Guitar Lessons (skill)
    # Devon WANTS: Beginner Acoustic Guitar Lessons (skill)
    # Devon OFFERS: Portable Camping Stove & Mess Kit (item)
    # Elena WANTS: Camping Cookware or Outdoor Gear (item)
    # Elena OFFERS: Wild Herb Salve & Herbal Tea Mix (item)

    listings = [
        # Maya (1)
        (1, "offer", "item", "Heirloom Sourdough Starter & Proofing Basket", "100-year-old bubbly San Francisco sourdough starter in mason jar with rattan banneton basket.", "Like New"),
        (1, "want", "item", "Heavy Duty Garden Shovel & Hand Pruners", "Looking for sturdy rust-resistant spade shovel and ergonomic pruning shears for spring flowerbed prep.", "Good"),
        (1, "offer", "skill", "Organic Compost & Soil Health Consultation", "Can inspect your garden soil and teach vermicomposting techniques in person.", "Expert"),

        # Carlos (2)
        (2, "offer", "item", "Ergonomic Garden Spade & Bypass Pruners", "Tempered steel garden shovel and Fiskars bypass shears, cleaned and sharpened.", "Excellent"),
        (2, "want", "item", "Compact 2-Person Camping Tent", "Need a reliable lightweight tent for weekend wilderness backpacking.", "Good"),
        (2, "offer", "skill", "Bicycle Tune-up & Derailleur Adjustment", "Will inspect brakes, true bicycle wheels, and grease bearings in your driveway or park gazebo.", "Experienced"),

        # Aisha (3)
        (3, "offer", "item", "REI Co-op 2-Person Trail Camping Tent", "Lightweight backpacking dome tent with rainfly, aluminum poles, and ground tarp.", "Excellent"),
        (3, "want", "item", "Artisan Sourdough Starter & Baking Advice", "Eager to bake sourdough bread; seeking lively active starter and beginner tips.", "Any"),
        (3, "offer", "skill", "Beginner Acoustic Guitar Chords Lesson", "Will meet outdoors in the courtyard to teach chord transitions, strumming patterns, and folk tunes.", "Friendly"),
        (3, "want", "skill", "Road Bicycle Brake & Gear Safety Check", "My commuter bike chain slips; need an experienced neighbor to take a look.", "Any"),

        # Elena (4)
        (4, "offer", "item", "Handcrafted Lavender Salve & Dried Mint Tea", "Locally foraged organic herbal soothing balms and dried wild spearmint in cotton pouches.", "Handmade"),
        (4, "want", "item", "Portable Backpacking Camp Stove", "Searching for a compact butane or wood-burning backpacking stove for trail hikes.", "Good"),

        # Devon (5)
        (5, "offer", "item", "Ultralight Camp Stove with Titanium Pot", "Pocket camp stove with nesting cookset and windscreen, burns standard canisters.", "Like New"),
        (5, "want", "skill", "Folk Guitar Lessons for Adults", "Always wanted to play campfire folk music on acoustic guitar. Looking for friendly tutor.", "Beginner Friendly")
    ]

    cursor.executemany("""
    INSERT INTO listings (user_id, type, category, title, description, condition_level)
    VALUES (?, ?, ?, ?, ?, ?)
    """, listings)

    conn.commit()
    conn.close()

def reset_and_seed() -> None:
    """Helper to clear database and reseed fresh demo state."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM matches")
    cursor.execute("DELETE FROM listings")
    cursor.execute("DELETE FROM meetups")
    cursor.execute("DELETE FROM users")
    conn.commit()
    conn.close()
    seed_sample_data()

# Initialize tables when module is imported
init_db()
seed_sample_data()

