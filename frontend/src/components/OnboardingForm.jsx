import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, User, Sparkles, Tag, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function OnboardingForm({ users, activeUser, onSelectUser, onListingCreated, onUserCreated }) {
  // New user registration modal/drawer state
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserNeighborhood, setNewUserNeighborhood] = useState('Maplewood Hills');
  const [newUserContact, setNewUserContact] = useState('');
  const [newUserBio, setNewUserBio] = useState('');

  // Listing fields
  const [offerType, setOfferType] = useState('item'); // 'item' or 'skill'
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerCondition, setOfferCondition] = useState('Good');

  const [wantType, setWantType] = useState('item'); // 'item' or 'skill'
  const [wantTitle, setWantTitle] = useState('');
  const [wantDesc, setWantDesc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sample quick templates for low-friction entry
  const quickTemplates = [
    {
      offer: { type: 'item', title: 'Cast Iron Skillet & Wood Spatula', desc: 'Pre-seasoned Lodge 10-inch skillet in great condition.', cond: 'Good' },
      want: { type: 'skill', title: 'Beginner Bread Baking Tips', desc: 'Advice on knead times and oven steam techniques.' }
    },
    {
      offer: { type: 'skill', title: 'Lawn Mower Blade Sharpening', desc: 'Can sharpen and balance rotary mower blades in minutes.', cond: 'Experienced' },
      want: { type: 'item', title: 'Fresh Heirloom Tomato Seedlings', desc: 'Looking for hearty brandywine or cherry tomato seedlings.' }
    },
    {
      offer: { type: 'item', title: 'Hiking Daypack (28L)', desc: 'Clean Osprey daypack with raincover and hydration sleeve.', cond: 'Excellent' },
      want: { type: 'item', title: 'Trekking Walking Poles', desc: 'Sturdy collapsible aluminum hiking poles.' }
    }
  ];

  const handleApplyTemplate = (tpl) => {
    setOfferType(tpl.offer.type);
    setOfferTitle(tpl.offer.title);
    setOfferDesc(tpl.offer.desc);
    setOfferCondition(tpl.offer.cond);

    setWantType(tpl.want.type);
    setWantTitle(tpl.want.title);
    setWantDesc(tpl.want.desc);
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserContact.trim()) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          neighborhood: newUserNeighborhood,
          contact_info: newUserContact.trim(),
          bio: newUserBio.trim()
        })
      });
      if (res.ok) {
        const created = await res.json();
        onUserCreated(created);
        setShowNewUser(false);
        setNewUserName('');
        setNewUserContact('');
        setNewUserBio('');
      }
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    if (!activeUser || !offerTitle.trim() || !wantTitle.trim()) return;

    setSubmitting(true);
    setSuccessMessage('');

    try {
      // 1. Submit Offer
      const resOffer = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
          type: 'offer',
          category: offerType,
          title: offerTitle.trim(),
          description: offerDesc.trim() || offerTitle.trim(),
          condition_level: offerCondition
        })
      });

      // 2. Submit Want
      const resWant = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
          type: 'want',
          category: wantType,
          title: wantTitle.trim(),
          description: wantDesc.trim() || wantTitle.trim(),
          condition_level: 'Any'
        })
      });

      if (resOffer.ok && resWant.ok) {
        setSuccessMessage('Successfully posted your offer & want to the community board!');
        setOfferTitle('');
        setOfferDesc('');
        setWantTitle('');
        setWantDesc('');
        onListingCreated();
      }
    } catch (err) {
      console.error("Error submitting listings:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider">
          <HeartHandshake className="w-3.5 h-3.5" />
          Neighbor-to-Neighbor Barter Board
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Share What You Have • Ask What You Need
        </h1>
        <p className="text-sm text-stone-500 max-w-xl mx-auto">
          Low-friction local trading with zero cloud tracking. Share physical gardening gear, tools, books, or real-life skills.
        </p>
      </div>

      {/* Neighbor Profile Selector */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-stone-400 block">
              Active Neighbor Profile:
            </label>
            <select
              value={activeUser?.id || ''}
              onChange={(e) => {
                const found = users.find(u => u.id === Number(e.target.value));
                if (found) onSelectUser(found);
              }}
              className="text-sm font-bold text-stone-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-forest-500 rounded"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.neighborhood}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNewUser(!showNewUser)}
          className="text-xs font-bold text-forest-700 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-lg border border-forest-200 transition-colors"
        >
          {showNewUser ? 'Cancel New Profile' : '+ Register New Neighbor'}
        </button>
      </div>

      {/* Quick Profile Creation Form */}
      {showNewUser && (
        <form onSubmit={handleRegisterUser} className="bg-stone-100/80 p-5 rounded-2xl border border-stone-300 space-y-4">
          <h3 className="text-sm font-bold text-stone-800">New Neighbor Registration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Leo Sanders"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Neighborhood</label>
              <input
                type="text"
                required
                placeholder="e.g. Maplewood Hills"
                value={newUserNeighborhood}
                onChange={(e) => setNewUserNeighborhood(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">Local Contact (SMS / Signal)</label>
              <input
                type="text"
                required
                placeholder="e.g. @leo_pine (Signal / SMS)"
                value={newUserContact}
                onChange={(e) => setNewUserContact(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800"
          >
            Save Profile
          </button>
        </form>
      )}

      {/* Quick Inspiration Templates */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wide text-stone-400">
          Instant Low-Friction Inspiration:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickTemplates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="text-left p-3 rounded-xl border border-stone-200 bg-white hover:border-forest-500 hover:bg-forest-50/30 transition-all text-xs space-y-1"
            >
              <div className="font-bold text-stone-800 line-clamp-1">Offer: {tpl.offer.title}</div>
              <div className="text-stone-500 line-clamp-1">Want: {tpl.want.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Barter Form */}
      <form onSubmit={handleSubmitListing} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: What I Offer */}
          <div className="bg-white p-6 rounded-2xl border-2 border-forest-600/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-black uppercase tracking-wider text-forest-700 bg-forest-100 px-2.5 py-1 rounded">
                1. What You Have (Offer)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfferType('item')}
                  className={`text-xs px-2.5 py-1 rounded font-bold ${
                    offerType === 'item' ? 'bg-forest-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Physical Item
                </button>
                <button
                  type="button"
                  onClick={() => setOfferType('skill')}
                  className={`text-xs px-2.5 py-1 rounded font-bold ${
                    offerType === 'skill' ? 'bg-forest-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Hands-on Skill
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                {offerType === 'item' ? 'Item Title & Specs' : 'Skill / Lesson Offered'} *
              </label>
              <input
                type="text"
                required
                placeholder={offerType === 'item' ? 'e.g. Garden Pruning Shears & Spade' : 'e.g. Bicycle Derailleur Tune-up'}
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Short Description & Condition Notes
              </label>
              <textarea
                rows={3}
                placeholder="Explain what it is, its condition, and how it can help a neighbor..."
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            {offerType === 'item' && (
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Condition</label>
                <select
                  value={offerCondition}
                  onChange={(e) => setOfferCondition(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 bg-stone-50"
                >
                  <option value="Like New">Like New / Pristine</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good / Working Order</option>
                  <option value="Fair">Fair / Needs Minor Love</option>
                </select>
              </div>
            )}
          </div>

          {/* RIGHT: What I Want */}
          <div className="bg-white p-6 rounded-2xl border-2 border-earth-600/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-black uppercase tracking-wider text-earth-700 bg-earth-100 px-2.5 py-1 rounded">
                2. What You Want (Desire)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWantType('item')}
                  className={`text-xs px-2.5 py-1 rounded font-bold ${
                    wantType === 'item' ? 'bg-earth-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Physical Item
                </button>
                <button
                  type="button"
                  onClick={() => setWantType('skill')}
                  className={`text-xs px-2.5 py-1 rounded font-bold ${
                    wantType === 'skill' ? 'bg-earth-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Hands-on Skill
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                {wantType === 'item' ? 'Item You Are Seeking' : 'Skill You Wish to Learn'} *
              </label>
              <input
                type="text"
                required
                placeholder={wantType === 'item' ? 'e.g. 2-Person Backpacking Tent' : 'e.g. Beginner Folk Guitar Lessons'}
                value={wantTitle}
                onChange={(e) => setWantTitle(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-earth-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                What are you planning to do with it?
              </label>
              <textarea
                rows={3}
                placeholder="Give context so neighbors can offer suitable gear or lessons..."
                value={wantDesc}
                onChange={(e) => setWantDesc(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-earth-500"
              />
            </div>

            <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 text-xs text-earth-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-earth-700 flex-shrink-0" />
              <span>Multi-way matching will automatically link you into trade rings!</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-4 bg-forest-800 hover:bg-forest-900 text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <PlusCircle className="w-5 h-5" />
            {submitting ? 'Submitting to Board...' : 'Post to Community Board & Find Matches'}
          </button>
        </div>
      </form>
    </div>
  );
}

