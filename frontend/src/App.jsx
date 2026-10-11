import React, { useState, useEffect } from 'react';
import { 
  Trees, 
  Repeat, 
  PlusCircle, 
  Printer, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Leaf, 
  RotateCcw, 
  Radio
} from 'lucide-react';

import OnboardingForm from './components/OnboardingForm';
import MatchDashboard from './components/MatchDashboard';
import SwapPass from './components/SwapPass';
import NeighborhoodSpots from './components/NeighborhoodSpots';

export default function App() {
  const [activeTab, setActiveTab] = useState('matches'); // 'matches', 'post', 'pass', 'spots'
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [meetups, setMeetups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [serverStatus, setServerStatus] = useState('connecting');

  // Initial data loading
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Health check
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) setServerStatus('offline-local-active');

      // 2. Users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData);
      if (usersData.length > 0 && !activeUser) {
        setActiveUser(usersData[0]);
      }

      // 3. Meetup spots
      const meetupsRes = await fetch('/api/meetups');
      const meetupsData = await meetupsRes.json();
      setMeetups(meetupsData);

      // 4. Initial matches
      const matchesRes = await fetch('/api/matches');
      let matchesData = await matchesRes.json();
      
      // If no matches yet, trigger initial run
      if (!matchesData || matchesData.length === 0) {
        const runRes = await fetch('/api/match/run', { method: 'POST' });
        const runData = await runRes.json();
        matchesData = runData.matches || [];
      }
      
      setMatches(matchesData);
      if (matchesData.length > 0) {
        setSelectedMatch(matchesData[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setServerStatus('offline-waiting-backend');
    }
  };

  const handleRunMatcher = async () => {
    setMatchingInProgress(true);
    try {
      const res = await fetch('/api/match/run', { method: 'POST' });
      const data = await res.json();
      setMatches(data.matches || []);
      if (data.matches && data.matches.length > 0) {
        setSelectedMatch(data.matches[0]);
      }
    } catch (err) {
      console.error("Failed to run matcher:", err);
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset neighborhood database back to initial sample items and trade loops?")) return;
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchInitialData();
      await handleRunMatcher();
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  const handleSelectMatchForPass = (match) => {
    setSelectedMatch(match);
    setActiveTab('pass');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Top Hackathon & Offline Status Bar */}
      <header className="no-print bg-stone-900 text-stone-200 border-b border-stone-800 py-2.5 px-4 sm:px-8 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold tracking-wide uppercase text-stone-300">
            MLH "Touch Grass" Hackathon Edition
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-emerald-400 font-mono font-medium">
            100% Offline Local AI & SQLite
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
            <span>Zero Corporate Cloud Telemetry</span>
          </div>

          <button
            onClick={handleResetData}
            title="Reset to default seed data"
            className="hover:text-stone-200 text-stone-400 flex items-center gap-1 text-[11px] underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Demo Data
          </button>
        </div>
      </header>

      {/* Main App Navigation */}
      <nav className="no-print bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-sm">
              <Trees className="w-6 h-6 text-forest-200" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-stone-900 flex items-center gap-2">
                <span>COMM-SWAP</span>
                <span className="text-[10px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded-full font-bold uppercase">
                  Touch Grass
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Offline Neighborhood Item & Skill Barter Rings
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'matches'
                  ? 'bg-white text-forest-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5 text-forest-700" />
              <span>Community Loops</span>
              {matches.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-forest-800 text-white text-[10px] flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'post'
                  ? 'bg-white text-forest-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-earth-700" />
              <span>Post Offer & Want</span>
            </button>

            <button
              onClick={() => setActiveTab('pass')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'pass'
                  ? 'bg-white text-forest-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-stone-700" />
              <span>Printable Swap Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('spots')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'spots'
                  ? 'bg-white text-forest-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-forest-600" />
              <span>Meetup Spots</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'matches' && (
          <MatchDashboard
            matches={matches}
            onRunMatcher={handleRunMatcher}
            matchingInProgress={matchingInProgress}
            onSelectMatchForPass={handleSelectMatchForPass}
          />
        )}

        {activeTab === 'post' && (
          <OnboardingForm
            users={users}
            activeUser={activeUser}
            onSelectUser={setActiveUser}
            onListingCreated={() => {
              handleRunMatcher();
              setActiveTab('matches');
            }}
            onUserCreated={(newUser) => {
              setUsers(prev => [...prev, newUser]);
              setActiveUser(newUser);
            }}
          />
        )}

        {activeTab === 'pass' && (
          <SwapPass
            selectedMatch={selectedMatch}
            allMatches={matches}
            onSelectMatch={setSelectedMatch}
          />
        )}

        {activeTab === 'spots' && (
          <NeighborhoodSpots
            meetups={meetups}
            onSpotAdded={(newSpot) => {
              setMeetups(prev => [...prev, newSpot]);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-600 font-semibold">
            <Leaf className="w-4 h-4 text-forest-700" />
            <span>Built for MLH Hackathon — Get Outside, Meet Neighbors, Touch Grass.</span>
          </div>
          <div className="text-stone-400">
            Open-source • Zero Big Tech Cloud Requirements • Local SQLite & Neural Vector Matcher
          </div>
        </div>
      </footer>
    </div>
  );
}

