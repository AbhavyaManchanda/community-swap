# 🌱 Touch Grass: Community Swap-Meet & Local Event Matchmaker

> **MLH "Touch Grass" Hackathon Project**  
> An open-source, offline-first neighborhood item and skill barter engine that connects neighbors face-to-face in local parks and community gardens without relying on corporate cloud servers.

---

## 🌍 The Vision: "Touch Grass" & Local Barter

Modern platforms trap communities in endless algorithmic feeds, surveillance advertising, and disposable consumerism. **Touch Grass: Comm-Swap** flips this paradigm on its head:

- **Get Outdoors & Meet Your Neighbors**: Instead of shipping packages via corporations, neighbors meet up in public community gardens, park gazebos, and library courtyards in daylight to inspect items and trade skills in the fresh air.
- **Zero Corporate Cloud Surveillance**: User profiles, offers, and desires stay **100% local**. All matching occurs directly on your neighborhood machine using local SQLite and local open-source semantic similarity engines. No telemetry, no Big Tech advertising, and no tracking cookies.
- **Multi-Way Circular Barter Rings ($A \to B \to C \to A$)**: Direct 2-way swaps ($A \leftrightarrow B$) are often limited because Neighbor A might not have what Neighbor B wants. Our graph cycle matching algorithm finds multi-way circular barter loops so three or four neighbors can participate in a simultaneous community exchange!
- **Printable Offline "Swap Pass"**: Generate and print out physical retro-style Swap Passes with perforated tear-away stubs, meetup checklists, and landmark directions before heading out into the park—allowing you to leave your smartphone at home and truly "touch grass".

---

## 🏗️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │            Touch Grass React Client          │
                  │  (Onboarding • Loops Dashboard • Swap Pass)  │
                  └──────────────────────┬───────────────────────┘
                                         │ Local REST API
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               FastAPI Backend                │
                  │               (Local localhost)              │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
            Directed Graph Search│                │Local Embeddings
                                 ▼                ▼
        ┌────────────────────────────────┐   ┌───────────────────────────┐
        │   Multi-Way Barter Matcher     │   │   Local Semantic Engine   │
        │ - DiGraph construction         │   │ - sentence-transformers   │
        │ - Simple cycles (2, 3, 4-way)  │   │   (all-MiniLM-L6-v2)      │
        │ - Compatibility scoring        │   │ - Fast stem-aware vector  │
        │ - Outdoor venue assignment     │   │   token fallback          │
        └────────────────────────────────┘   └───────────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      Local SQLite Database   │
                  │   (zero cloud, fully offline)│
                  └──────────────────────────────┘
```

---

## 📦 Project Structure

```
comm-swap/
├── backend/
│   ├── main.py              # FastAPI server with endpoints for users, listings, matches, & swap pass
│   ├── matcher.py           # Local semantic engine & directed graph multi-way cycle detection
│   ├── database.py          # SQLite schema & sample neighborhood seed data
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── index.html           # HTML entry point with Inter & JetBrains Mono typography
│   ├── vite.config.js       # Vite build setup with /api proxy to localhost:8000
│   ├── tailwind.config.js   # Earthy forest color palette
│   ├── postcss.config.js    # PostCSS pipeline
│   ├── package.json         # React 18, Vite, Lucide-react, & Tailwind CSS
│   └── src/
│       ├── main.jsx         # React application root
│       ├── index.css        # Tailwind styles & @media print stylesheet for paper tickets
│       ├── App.jsx          # Tab navigation, state management, & offline indicator
│       └── components/
│           ├── OnboardingForm.jsx     # Low-screen friction neighbor offer & want form
│           ├── MatchDashboard.jsx     # Active community 2-way and 3-way barter loop visualizer
│           ├── SwapPass.jsx           # Minimalist printable offline ticket generator
│           └── NeighborhoodSpots.jsx  # Outdoor grass-touching locations & landmarks
└── README.md
```

---

## ⚡ Multi-Way Barter Loop Algorithm

Traditional barter requires a "double coincidence of wants": Neighbor A must want what Neighbor B has, and vice versa.

In real neighborhoods, this is rare. But multi-way trade rings solve this:
1. **Neighbor Maya (Backyard Baker)**: Offers *Heirloom Sourdough Starter & Proofing Basket*; Wants *Garden Shovel & Pruning Shears*.
2. **Neighbor Carlos (Bike Mechanic)**: Offers *Heavy Duty Garden Shovel & Pruners*; Wants *2-Person Camping Tent*.
3. **Neighbor Aisha (Book & Outdoor Fan)**: Offers *REI 2-Person Backpacking Tent*; Wants *Sourdough Starter*.

### How the Matcher Works:
1. **Directed Match Graph**: Creates a directed graph $G = (V, E)$, where each vertex $v \in V$ is a neighbor.
2. **Semantic Similarity Edge**: An edge $u \xrightarrow{w} v$ is established if an offer from $u$ semantically satisfies a want of $v$ with similarity $w \ge \text{threshold}$.
3. **Cycle Extraction**: Using directed simple cycle search (elementary circuits bounded at length 2, 3, and 4), the engine isolates closed loops:
   $$\text{Maya} \longrightarrow \text{Aisha} \longrightarrow \text{Carlos} \longrightarrow \text{Maya}$$
4. **Offline Spot Allocation**: Maps participating neighborhoods to the nearest verified outdoor open space (e.g. *Sunny Creek Community Garden by the Sunflower Patch*).

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ and npm

---

### 2. Backend Setup (FastAPI & Local Matcher)

```bash
# 1. Navigate to backend directory
cd backend

# 2. (Optional but recommended) Create a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will now be running at `http://localhost:8000`.  
- Interactive API Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

### 3. Frontend Setup (React + Tailwind CSS)

Open a new terminal window:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🎫 The Printable "Swap Pass" Feature

When a barter loop is discovered, click **"Swap Pass"** to view and print your physical ticket:
- **Perforated Stub Aesthetic**: Includes a dotted line for cutting or tearing verification stubs.
- **Printed Instructions**: Step-by-step handoff sequence ("Step 1: Maya hands sourdough starter to Aisha; Step 2: Aisha hands tent to Carlos...").
- **Landmark Directions**: Exact daylight meeting spot (e.g. "Under the 100-year-old Willow Tree at Oak Grove Library Courtyard").
- **Handshake Verification**: Physical signature lines for both neighbors upon completing the exchange on the grass.
- **Optimized for Print**: Built with `@media print` CSS so all browser clutter, buttons, and backgrounds disappear when pressing `Ctrl+P` or clicking **Print Offline Swap Pass**.

---

## 🔒 Privacy & Open-Source AI Guarantee

| Feature | Corporate Barter / Marketplace Apps | Touch Grass: Comm-Swap |
|---|---|---|
| **Data Storage** | Centralized corporate cloud servers | 100% Local SQLite (`comm_swap.db`) |
| **User Tracking** | Location telemetry & ad tracking | Zero tracking, zero telemetry |
| **Embeddings** | Sent to third-party proprietary APIs | Run locally (`all-MiniLM-L6-v2` / local vectors) |
| **Connectivity** | Requires constant internet & login | Runs on local WiFi, mesh network, or offline |
| **Exchange Medium** | In-app screen time & payments | Real-world physical handshakes in parks |

---

## 🏆 MLH Hackathon Submission Highlights
- **Theme**: "Touch Grass" — encouraging tech enthusiasts to leave their desks, disconnect from corporate apps, and socialize with neighbors in green outdoor spaces.
- **Multi-Way Algorithmic Innovation**: Barter cycles beyond simple pairwise matching.
- **Offline-First Resilience**: Ready to deploy on local community mesh networks, local Raspberry Pi stations, or home laptops during neighborhood block parties.

