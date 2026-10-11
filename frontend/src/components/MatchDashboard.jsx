import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  MapPin, 
  ArrowRight, 
  Users, 
  Printer, 
  CheckCircle, 
  Repeat, 
  Layers, 
  Compass, 
  ExternalLink 
} from 'lucide-react';

export default function MatchDashboard({ 
  matches, 
  onRunMatcher, 
  matchingInProgress, 
  onSelectMatchForPass 
}) {
  const [filterType, setFilterType] = useState('all');

  const filteredMatches = matches.filter(m => {
    if (filterType === 'all') return true;
    if (filterType === '2-way') return m.cycle_length === 2;
    if (filterType === '3-way') return m.cycle_length === 3;
    if (filterType === '4-way') return m.cycle_length >= 4;
    return true;
  });

  const twoWayCount = matches.filter(m => m.cycle_length === 2).length;
  const multiWayCount = matches.filter(m => m.cycle_length >= 3).length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Trigger */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/80 text-forest-100 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local Semantic Barter Engine • Zero Cloud Surveillance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Community Trade Loops
          </h2>
          <p className="text-forest-100/90 text-sm max-w-xl mt-1">
            Our local matching engine analyzes offers and wants across your neighborhood to detect multi-way barter chains (A → B → C → A) where everyone gets what they need!
          </p>
        </div>

        <button
          onClick={onRunMatcher}
          disabled={matchingInProgress}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-earth-500 hover:bg-earth-600 active:bg-earth-700 text-white font-bold rounded-xl shadow-md transition-all text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${matchingInProgress ? 'animate-spin' : ''}`} />
          {matchingInProgress ? 'Analyzing Graph...' : 'Re-Run Match Engine'}
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{matches.length}</div>
            <div className="text-xs text-stone-500 font-medium">Total Matches Detected</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{multiWayCount}</div>
            <div className="text-xs text-stone-500 font-medium">Multi-Way Barter Loops (3+ Neighbors)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{twoWayCount}</div>
            <div className="text-xs text-stone-500 font-medium">Direct 2-Way Swaps</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'all'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All Matches ({matches.length})
        </button>
        <button
          onClick={() => setFilterType('3-way')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filterType === '3-way'
              ? 'bg-forest-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          3-Way Loops ({matches.filter(m => m.cycle_length === 3).length})
        </button>
        <button
          onClick={() => setFilterType('2-way')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filterType === '2-way'
              ? 'bg-forest-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          2-Way Direct ({twoWayCount})
        </button>
        <button
          onClick={() => setFilterType('4-way')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            filterType === '4-way'
              ? 'bg-forest-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          4-Way Trade Rings ({matches.filter(m => m.cycle_length >= 4).length})
        </button>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-stone-200 text-stone-500 space-y-3">
          <Compass className="w-10 h-10 mx-auto text-stone-400" />
          <h3 className="text-base font-bold text-stone-800">No matches found for this filter</h3>
          <p className="text-sm">Try running the matching engine or posting a new item/skill offer!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMatches.map((match, idx) => {
            const scorePercent = Math.round((match.score || 0.8) * 100);
            const isLoop = match.cycle_length >= 3;

            return (
              <div 
                key={match.id || idx}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                        isLoop 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {match.match_type}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        Match ID: #{match.id || idx + 1}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 flex items-center gap-2 pt-1">
                      <span>Neighborhoods: <strong>{match.neighborhoods?.join(', ') || 'Local District'}</strong></span>
                      <span>•</span>
                      <span>{match.cycle_length} Neighbors Participating</span>
                    </div>
                  </div>

                  {/* Compatibility & Action */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-stone-400 font-semibold uppercase">Compatibility</div>
                      <div className="text-lg font-black text-forest-700">
                        {scorePercent}%
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectMatchForPass(match)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Swap Pass
                    </button>
                  </div>
                </div>

                {/* Trade Chain Visualization */}
                <div className="p-5 sm:p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Trade Chain Execution Sequence:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {match.trade_chain?.map((step, sIdx) => (
                      <div 
                        key={sIdx}
                        className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 rounded-full bg-forest-700 text-white text-[11px] font-bold flex items-center justify-center font-mono">
                            {step.step}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-stone-400">
                            {Math.round((step.compatibility_score || 0.7) * 100)}% match
                          </span>
                        </div>

                        <div>
                          <div className="text-xs text-stone-500 font-medium">
                            <span className="font-bold text-stone-800">{step.from_user_name}</span>
                            <span className="text-stone-400 mx-1">gives to</span>
                            <span className="font-bold text-stone-800">{step.to_user_name}</span>
                          </div>

                          <div className="mt-2 text-sm font-bold text-forest-900 bg-white p-2 rounded border border-stone-200">
                            {step.offered_item.title}
                          </div>
                          
                          <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                            {step.offered_item.description}
                          </div>
                        </div>

                        <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wide pt-1 border-t border-stone-200">
                          Satisfies Want: "{step.satisfies_want?.title}"
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Meetup Spot */}
                  {match.recommended_meetup && (
                    <div className="mt-4 p-3.5 rounded-xl bg-forest-50/60 border border-forest-100 flex items-start sm:items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 text-xs text-forest-900">
                        <MapPin className="w-4 h-4 text-forest-700 flex-shrink-0" />
                        <div>
                          <strong>Meetup Spot:</strong> {match.recommended_meetup.location_name} ({match.recommended_meetup.landmark})
                        </div>
                      </div>

                      <div className="text-xs text-forest-800 font-medium bg-forest-100/70 px-2.5 py-1 rounded">
                        🌿 {match.recommended_meetup.recommended_times}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

