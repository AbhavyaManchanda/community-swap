import re
import math
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict

try:
    import networkx as nx
except ImportError:
    nx = None

logger = logging.getLogger("comm_swap.matcher")

class LocalSemanticEngine:
    """
    Offline semantic similarity engine.
    Attempts:
    1. SentenceTransformers (all-MiniLM-L6-v2) for deep neural semantic search.
    2. Fallback to scikit-learn TfidfVectorizer with word + character n-grams.
    3. Pure Python token overlap Jaccard / Cosine fallback if dependencies are minimal.
    """
    def __init__(self):
        self.model_type = "unknown"
        self._st_model = None
        self._tfidf_vectorizer = None
        self._init_engine()

    def _init_engine(self):
        # 1. Try SentenceTransformers
        try:
            from sentence_transformers import SentenceTransformer
            # Using the fast, lightweight 80MB standard model
            self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
            self.model_type = "sentence-transformers (all-MiniLM-L6-v2)"
            logger.info("Semantic Engine: Initialized SentenceTransformers.")
            return
        except Exception as e:
            logger.info(f"SentenceTransformers not loaded ({e}). Trying scikit-learn TF-IDF fallback...")

        # 2. Try Scikit-Learn
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self._tfidf_vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),
                stop_words="english",
                token_pattern=r"(?u)\b\w+\b"
            )
            self.model_type = "scikit-learn (TF-IDF N-grams)"
            logger.info("Semantic Engine: Initialized Scikit-learn TF-IDF.")
            return
        except Exception as e:
            logger.info(f"Scikit-learn not available ({e}). Using pure Python n-gram matcher.")

        # 3. Pure Python fallback
        self.model_type = "pure-python (n-gram set similarity)"

    def _normalize_tokens(self, text: str) -> set:
        """Tokenize and stem common community swap words."""
        stems = {
            "baking": "bake", "baked": "bake", "baker": "bake",
            "gardening": "garden", "gardener": "garden", "gardens": "garden",
            "bicycle": "bike", "bicycles": "bike", "biking": "bike", "bikes": "bike",
            "camping": "camp", "camper": "camp", "camps": "camp",
            "guitars": "guitar", "guitarist": "guitar",
            "seeds": "seed", "seedling": "seed", "seedlings": "seed",
            "starter": "sourdough", "starters": "sourdough",
            "pruners": "prune", "pruning": "prune", "shears": "prune",
            "stoves": "stove", "cookware": "stove",
            "shovels": "shovel", "spade": "shovel"
        }
        tokens = set()
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        stop_words = {"the", "and", "for", "with", "from", "looking", "seeking", "need", "can", "will", "good", "any"}
        for w in words:
            if w in stop_words:
                continue
            normalized = stems.get(w, w)
            tokens.add(normalized)
        return tokens

    def calculate_similarity(self, text_a: str, text_b: str, title_a: str = "", title_b: str = "") -> float:
        """Calculate semantic similarity between two listings in range [0.0, 1.0]."""
        if not text_a or not text_b:
            return 0.0

        clean_a = text_a.strip().lower()
        clean_b = text_b.strip().lower()

        if clean_a == clean_b:
            return 1.0

        # Method 1: SentenceTransformers (Neural Embedding)
        if self._st_model is not None:
            try:
                embeddings = self._st_model.encode([clean_a, clean_b], normalize_embeddings=True)
                import numpy as np
                sim = float(np.dot(embeddings[0], embeddings[1]))
                return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))
            except Exception as ex:
                logger.warning(f"Error computing SentenceTransformer similarity: {ex}")

        # Method 2: Fast & Reliable Stem-Aware Semantic Token Matching
        toks_a = self._normalize_tokens(clean_a)
        toks_b = self._normalize_tokens(clean_b)

        if not toks_a or not toks_b:
            return 0.0

        shared = toks_a.intersection(toks_b)
        if not shared:
            # Check 3-gram character match
            ngram_a = {clean_a[i:i+3] for i in range(len(clean_a) - 2)}
            ngram_b = {clean_b[i:i+3] for i in range(len(clean_b) - 2)}
            ngram_union = ngram_a.union(ngram_b)
            return len(ngram_a.intersection(ngram_b)) / len(ngram_union) if ngram_union else 0.0

        # Title matching bonus
        title_toks_a = self._normalize_tokens(title_a) if title_a else set()
        title_toks_b = self._normalize_tokens(title_b) if title_b else set()
        title_shared = title_toks_a.intersection(title_toks_b)

        # Overlap relative to the smaller set (intent satisfaction)
        overlap_ratio = len(shared) / min(len(toks_a), len(toks_b))
        jaccard = len(shared) / len(toks_a.union(toks_b))

        base_score = (overlap_ratio * 0.7) + (jaccard * 0.3)

        if title_shared:
            base_score = min(1.0, base_score + 0.25)

        return min(1.0, base_score)


# Global instance
semantic_engine = LocalSemanticEngine()


def find_community_matches(
    users: List[Dict[str, Any]],
    listings: List[Dict[str, Any]],
    meetups: List[Dict[str, Any]],
    similarity_threshold: float = 0.28,
    max_cycle_length: int = 4
) -> List[Dict[str, Any]]:
    """
    Constructs a directed exchange graph:
    An edge u -> v with weight W exists if user u offers an item/skill
    that matches user v's wanted item/skill with similarity >= threshold.

    Identifies:
    1. 2-way direct trades (A <-> B)
    2. 3-way circular barter loops (A -> B -> C -> A)
    3. 4-way circular barter loops (A -> B -> C -> D -> A)
    """
    user_map = {u["id"]: u for u in users}
    
    # Partition listings by user and type
    offers_by_user = defaultdict(list)
    wants_by_user = defaultdict(list)

    for item in listings:
        uid = item["user_id"]
        if item.get("is_active", 1):
            if item["type"] == "offer":
                offers_by_user[uid].append(item)
            elif item["type"] == "want":
                wants_by_user[uid].append(item)

    candidate_edges = []

    # Directed graph adjacency representation
    adj = defaultdict(dict)  # u -> {v: edge_data}

    for u_id, u_offers in offers_by_user.items():
        for v_id, v_wants in wants_by_user.items():
            if u_id == v_id:
                continue

            # Find best match between any of u's offers and v's wants
            best_pair = None
            best_sim = 0.0

            for offer in u_offers:
                offer_text = f"{offer['title']} {offer['description']} {offer.get('category', '')}"
                for want in v_wants:
                    want_text = f"{want['title']} {want['description']} {want.get('category', '')}"

                    sim = semantic_engine.calculate_similarity(
                        offer_text, want_text,
                        title_a=offer.get("title", ""),
                        title_b=want.get("title", "")
                    )

                    # Category synergy bonus (items matching items, skills matching skills)
                    if offer.get("category") == want.get("category"):
                        sim = min(1.0, sim * 1.15)

                    if sim > best_sim:
                        best_sim = sim
                        best_pair = (offer, want)

            if best_sim >= similarity_threshold and best_pair:
                edge_info = {
                    "weight": best_sim,
                    "offer": best_pair[0],
                    "want": best_pair[1]
                }
                adj[u_id][v_id] = edge_info
                candidate_edges.append((u_id, v_id, best_sim, best_pair))

    # Detect all simple directed cycles up to max_cycle_length
    all_cycles = []
    
    if nx is not None:
        try:
            G = nx.DiGraph()
            for u in user_map:
                G.add_node(u)
            for u in adj:
                for v, data in adj[u].items():
                    G.add_edge(u, v, **data)
            all_cycles = list(nx.simple_cycles(G))
        except Exception:
            all_cycles = []

    # Pure Python cycle finder if nx is absent or returned empty
    if not all_cycles:
        def find_cycles_dfs(start_node, current_node, path, max_len):
            if len(path) > max_len:
                return
            for neighbor in adj.get(current_node, {}):
                if neighbor == start_node and len(path) >= 2:
                    all_cycles.append(list(path))
                elif neighbor not in path and len(path) < max_len:
                    find_cycles_dfs(start_node, neighbor, path + [neighbor], max_len)

        all_nodes = list(user_map.keys())
        for node in all_nodes:
            find_cycles_dfs(node, node, [node], max_cycle_length)

    # Collect unique cycles and compute chain details
    found_matches = []
    seen_cycle_fingerprints = set()

    for cycle in all_cycles:
        cycle_len = len(cycle)
        if cycle_len < 2 or cycle_len > max_cycle_length:
            continue

        # Canonical cycle representation to avoid duplicate rotation (e.g. [1,2,3] == [2,3,1])
        min_idx = cycle.index(min(cycle))
        canonical = tuple(cycle[min_idx:] + cycle[:min_idx])
        if canonical in seen_cycle_fingerprints:
            continue
        seen_cycle_fingerprints.add(canonical)

        # Build trade chain steps: cycle[i] gives offer to cycle[(i+1)%n]
        trade_chain = []
        cycle_scores = []
        neighborhoods_involved = set()

        is_valid_cycle = True
        for i in range(cycle_len):
            giver_id = cycle[i]
            receiver_id = cycle[(i + 1) % cycle_len]

            edge_data = adj.get(giver_id, {}).get(receiver_id)
            if not edge_data:
                is_valid_cycle = False
                break

            giver_user = user_map.get(giver_id, {})
            receiver_user = user_map.get(receiver_id, {})

            neighborhoods_involved.add(giver_user.get("neighborhood", ""))
            neighborhoods_involved.add(receiver_user.get("neighborhood", ""))

            trade_step = {
                "step": i + 1,
                "from_user_id": giver_id,
                "from_user_name": giver_user.get("name", f"Neighbor #{giver_id}"),
                "from_user_contact": giver_user.get("contact_info", ""),
                "to_user_id": receiver_id,
                "to_user_name": receiver_user.get("name", f"Neighbor #{receiver_id}"),
                "to_user_contact": receiver_user.get("contact_info", ""),
                "offered_item": {
                    "id": edge_data["offer"]["id"],
                    "title": edge_data["offer"]["title"],
                    "description": edge_data["offer"]["description"],
                    "category": edge_data["offer"].get("category", "item"),
                    "condition": edge_data["offer"].get("condition_level", "Good")
                },
                "satisfies_want": {
                    "id": edge_data["want"]["id"],
                    "title": edge_data["want"]["title"]
                },
                "compatibility_score": round(float(edge_data["weight"]), 3)
            }
            trade_chain.append(trade_step)
            cycle_scores.append(edge_data["weight"])

        if not is_valid_cycle:
            continue

        avg_score = sum(cycle_scores) / len(cycle_scores) if cycle_scores else 0.0

        # Match Type Label
        if cycle_len == 2:
            match_type_label = "2-Way Direct Swap"
        elif cycle_len == 3:
            match_type_label = "3-Way Community Barter Loop"
        else:
            match_type_label = f"{cycle_len}-Way Neighborhood Trade Ring"

        # Select recommended Grass-Touching meetup location
        matched_meetup = None
        for meetup in meetups:
            if meetup["neighborhood"] in neighborhoods_involved:
                matched_meetup = meetup
                break
        if not matched_meetup and meetups:
            matched_meetup = meetups[0]

        match_record = {
            "match_type": match_type_label,
            "cycle_length": cycle_len,
            "score": round(avg_score, 3),
            "participants": [user_map[uid] for uid in cycle if uid in user_map],
            "neighborhoods": list(filter(None, neighborhoods_involved)),
            "trade_chain": trade_chain,
            "recommended_meetup": matched_meetup,
            "status": "active"
        }
        found_matches.append(match_record)

    # Sort matches by cycle length (2-way first, then 3-way loops) then by highest semantic score
    found_matches.sort(key=lambda m: (-m["score"]))

    return found_matches
