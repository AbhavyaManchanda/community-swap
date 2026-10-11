import React, { useState } from 'react';
import { MapPin, Sun, Trees, Clock, Plus, CheckCircle2 } from 'lucide-react';

export default function NeighborhoodSpots({ meetups, onSpotAdded }) {
  const [showAdd, setShowAdd] = useState(false);
  const [neighborhood, setNeighborhood] = useState('Maplewood Hills');
  const [locationName, setLocationName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [recommendedTimes, setRecommendedTimes] = useState('Saturday 10:00 AM - 1:00 PM');
  const [outdoorActivityHint, setOutdoorActivityHint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddSpot = async (e) => {
    e.preventDefault();
    if (!locationName.trim() || !address.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/meetups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neighborhood,
          location_name: locationName.trim(),
          landmark: landmark.trim() || 'Public Benches',
          address: address.trim(),
          recommended_times: recommendedTimes.trim(),
          outdoor_activity_hint: outdoorActivityHint.trim() || 'Enjoy the sun, touch grass, and meet neighbors!'
        })
      });
      if (res.ok) {
        const created = await res.json();
        onSpotAdded(created);
        setShowAdd(false);
        setLocationName('');
        setLandmark('');
        setAddress('');
        setOutdoorActivityHint('');
      }
    } catch (err) {
      console.error("Failed to add spot:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Trees className="w-3.5 h-3.5" />
            Verified Grass-Touching Locations
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Neighborhood Meetup Spots
          </h1>
          <p className="text-sm text-stone-500 max-w-xl">
            Safe, open, daylight public locations designed for face-to-face neighbor swaps and getting outdoors.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Nominate Meetup Spot'}
        </button>
      </div>

      {/* Add Spot Form */}
      {showAdd && (
        <form onSubmit={handleAddSpot} className="bg-white p-6 rounded-2xl border-2 border-forest-500/40 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900">Nominate an Outdoor Spot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Spot Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pine Ridge Community Orchard"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Neighborhood</label>
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Landmark / Meeting Point</label>
              <input
                type="text"
                required
                placeholder="e.g. Near the picnic tables by the pond"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Street Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 700 Orchard Boulevard"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-stone-600 block mb-1">Touch Grass Activity Hint</label>
              <input
                type="text"
                placeholder="e.g. Bring a picnic blanket, sit under the trees, and trade seedlings."
                value={outdoorActivityHint}
                onChange={(e) => setOutdoorActivityHint(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-forest-800 text-white text-xs font-bold rounded-lg hover:bg-forest-900 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Spot'}
          </button>
        </form>
      )}

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetups.map((spot, idx) => (
          <div 
            key={spot.id || idx}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:border-forest-400 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs bg-forest-100 text-forest-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  {spot.neighborhood}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-2">
                  {spot.location_name}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                <Sun className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span>{spot.address}</span>
              </div>
              <div className="text-stone-500 italic pl-6">
                <strong>Meeting point:</strong> {spot.landmark}
              </div>
              <div className="flex items-center gap-2 text-forest-800 font-semibold pt-1">
                <Clock className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>Recommended: {spot.recommended_times}</span>
              </div>
            </div>

            <div className="p-3 bg-forest-50/70 rounded-xl border border-forest-100 text-xs text-forest-900">
              🌿 <strong>Touch Grass Hint:</strong> {spot.outdoor_activity_hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

