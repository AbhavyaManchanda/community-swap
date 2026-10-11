import React, { useState, useEffect } from 'react';
import { Printer, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Scissors, QrCode } from 'lucide-react';

export default function SwapPass({ selectedMatch, allMatches, onSelectMatch }) {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState(selectedMatch?.id || (allMatches[0]?.id || 1));

  useEffect(() => {
    if (selectedMatch) {
      setActiveMatchId(selectedMatch.id);
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (!activeMatchId) return;
    setLoading(true);
    fetch(`/api/swappass/${activeMatchId}`)
      .then(res => res.json())
      .then(data => {
        setPassData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch swap pass:", err);
        setLoading(false);
      });
  }, [activeMatchId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mb-4"></div>
        <p>Generating your printable offline pass...</p>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="p-8 text-center text-stone-600 bg-white rounded-xl border border-stone-200">
        <p>No active trade loop selected. Run the matching engine or select a match from the dashboard first.</p>
      </div>
    );
  }

  const { meetup, trade_chain, ticket_code, match_type, score_percent, offline_checklist } = passData;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Controls (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-stone-600">Select Community Match:</label>
          <select 
            value={activeMatchId} 
            onChange={(e) => setActiveMatchId(Number(e.target.value))}
            className="text-sm border border-stone-300 rounded-lg px-3 py-1.5 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            {allMatches.map((m, idx) => (
              <option key={m.id || idx} value={m.id}>
                Match #{m.id} - {m.match_type} ({Math.round(m.score * 100)}% Match)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          Print Offline Swap Pass
        </button>
      </div>

      {/* The Printable Swap Pass Card */}
      <div className="printable-pass-container bg-white border-2 border-stone-800 rounded-2xl shadow-md p-6 sm:p-8 text-stone-900 transition-all font-sans">
        {/* Pass Top Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-stone-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-forest-800 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Touch Grass • Offline Barter
              </span>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                100% Zero-Cloud Privacy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-stone-900">
              COMMUNITY SWAP PASS
            </h1>
            <p className="text-xs text-stone-500">
              Valid for verified neighborhood exchange • Keep this ticket with you at the meetup spot
            </p>
          </div>

          <div className="text-right sm:border-l-2 sm:border-stone-800 sm:pl-6">
            <div className="font-mono text-lg font-bold tracking-widest text-stone-900 bg-stone-100 px-3 py-1 rounded border border-stone-300 inline-block">
              {ticket_code}
            </div>
            <div className="text-xs font-medium text-stone-600 mt-1">
              Loop Type: <span className="font-bold text-forest-700">{match_type}</span>
            </div>
            <div className="text-xs text-stone-400">
              Compatibility: <span className="font-bold text-stone-700">{score_percent}%</span>
            </div>
          </div>
        </div>

        {/* Outdoor Meetup Details */}
        {meetup && (
          <div className="my-6 p-4 rounded-xl bg-forest-50 border border-forest-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-forest-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-forest-900">
                    {meetup.location_name}
                  </h3>
                  <span className="text-xs bg-forest-200 text-forest-800 px-2 py-0.5 rounded font-medium">
                    {meetup.neighborhood}
                  </span>
                </div>
                <p className="text-sm text-forest-800 font-medium">
                  {meetup.address}
                </p>
                <p className="text-xs text-forest-700 italic">
                  <strong>Landmark:</strong> {meetup.landmark}
                </p>
                <div className="flex items-center gap-2 text-xs text-forest-900 pt-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-forest-700" />
                  <span>Recommended Daylight Time: {meetup.recommended_times}</span>
                </div>
                <div className="text-xs text-forest-800 pt-1 bg-white/60 p-2 rounded border border-forest-100">
                  🌿 <strong>Touch Grass Activity:</strong> {meetup.outdoor_activity_hint}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Loop Protocol (Who Hands What to Whom) */}
        <div className="my-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
            <span>Exchange Manifest & Trade Loop</span>
            <span className="text-xs font-normal lowercase text-stone-400">({trade_chain.length} connected participants)</span>
          </h2>

          <div className="space-y-3">
            {trade_chain.map((step, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-lg border border-stone-300 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-800 text-white font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">{step.from_user_name}</span>
                    <span className="text-stone-400 text-xs mx-1.5">hands over to</span>
                    <span className="font-bold text-stone-900">{step.to_user_name}</span>
                  </div>
                </div>

                <div className="bg-white px-3 py-1.5 rounded border border-stone-200 text-stone-800">
                  <span className="text-xs font-semibold text-stone-500 uppercase mr-1">
                    [{step.offered_item.category}]:
                  </span>
                  <span className="font-semibold text-forest-800">
                    {step.offered_item.title}
                  </span>
                  {step.offered_item.condition && (
                    <span className="text-xs text-stone-500 ml-1.5">
                      ({step.offered_item.condition})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perforated Cut Line */}
        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-stone-400"></div>
          </div>
          <div className="relative inline-flex items-center gap-1.5 bg-white px-3 text-xs font-mono text-stone-500">
            <Scissors className="w-3.5 h-3.5 text-stone-500" />
            <span>CUT OR TEAR ALONG DOTTED LINE FOR OFFLINE CONFIRMATION STUB</span>
          </div>
        </div>

        {/* Lower Stub & Offline Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Offline Etiquette Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Offline Meetup Etiquette:
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600">
              {offline_checklist?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400 font-mono select-none">[ ]</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Verification & Handshake Box */}
          <div className="border border-stone-300 p-3 rounded-lg bg-stone-50 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase text-stone-700">
                  Neighbor Signatures & Handshake
                </span>
                <span className="font-mono text-[10px] text-stone-400">
                  VERIFIED LOCAL
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Sign upon completion of the swap on the grass. No digital tracking required.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="h-6 border-b border-stone-400"></div>
                <span className="text-[10px] text-stone-400">Giver Signature</span>
              </div>
              <div>
                <div className="h-6 border-b border-stone-400"></div>
                <span className="text-[10px] text-stone-400">Receiver Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-6 pt-4 border-t border-stone-200 text-center text-[10px] text-stone-400 font-mono">
          Powered by Local Semantic Matcher (Zero Cloud • 100% Offline SQLite Engine) • MLH Touch Grass Hackathon
        </div>
      </div>
    </div>
  );
}

