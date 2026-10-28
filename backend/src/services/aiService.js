/**
 * AI Service for EventCEO AI
 * Uses Claude (Anthropic) with offline fallback template generator.
 * Prompts and schemas are documented here.
 */

const Anthropic = require('@anthropic-ai/sdk');

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPT for Event Planner
// ═══════════════════════════════════════════════════════════
const PLANNER_SYSTEM_PROMPT = `You are EventCEO AI, an expert Indian event planning assistant. 
You help plan weddings, birthdays, college events, and community celebrations across India.
You understand Indian customs, vendor ecosystems, local pricing (INR), and regional preferences.
Always respond with valid JSON matching the exact schema provided. Do not add markdown fences or extra text.`;

// ═══════════════════════════════════════════════════════════
// OUTPUT SCHEMA for Event Planner
// ═══════════════════════════════════════════════════════════
const PLANNER_SCHEMA = {
  tasks: [{ title: 'string', category: 'string', daysBeforeEvent: 'number', priority: 'low|medium|high|urgent' }],
  budgetBreakdown: [{ category: 'string', name: 'string', estimated: 'number', percentage: 'number' }],
  timeline: [{ time: 'string', activity: 'string', responsible: 'string' }],
  vendorCategories: ['string'],
  themeIdeas: [{ name: 'string', description: 'string', colorPalette: ['string'], decor: 'string' }],
  tips: ['string'],
};

// ═══════════════════════════════════════════════════════════
// TEMPLATE FALLBACK — works without any API key
// ═══════════════════════════════════════════════════════════
function generateTemplatePlan(input) {
  const { type, eventDate, guestCount, budget, city, preferences } = input;
  const date = new Date(eventDate);
  const daysToEvent = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

  const templates = {
    wedding: {
      tasks: [
        { title: 'Book wedding venue', category: 'Venue', daysBeforeEvent: 90, priority: 'urgent' },
        { title: 'Finalise catering & menu', category: 'Catering', daysBeforeEvent: 60, priority: 'high' },
        { title: 'Book photographer & videographer', category: 'Photography', daysBeforeEvent: 75, priority: 'high' },
        { title: 'Design & print invitations', category: 'Invitations', daysBeforeEvent: 45, priority: 'high' },
        { title: 'Book mehendi artist', category: 'Entertainment', daysBeforeEvent: 60, priority: 'high' },
        { title: 'Book DJ & sound system', category: 'Entertainment', daysBeforeEvent: 45, priority: 'high' },
        { title: 'Arrange floral & stage decoration', category: 'Decor', daysBeforeEvent: 30, priority: 'high' },
        { title: 'Book accommodation for outstation guests', category: 'Logistics', daysBeforeEvent: 45, priority: 'medium' },
        { title: 'Order bridal trousseau & jewellery', category: 'Bridal', daysBeforeEvent: 60, priority: 'high' },
        { title: 'Book hair & makeup artist', category: 'Bridal', daysBeforeEvent: 30, priority: 'medium' },
        { title: 'Arrange transportation & valet', category: 'Transport', daysBeforeEvent: 20, priority: 'medium' },
        { title: 'Finalise wedding day run-of-show', category: 'Planning', daysBeforeEvent: 7, priority: 'urgent' },
        { title: 'Confirm all vendors 48 hours before', category: 'Planning', daysBeforeEvent: 2, priority: 'urgent' },
      ],
      budgetBreakdown: [
        { category: 'Venue', name: 'Venue rental & setup', estimated: budget * 0.30, percentage: 30 },
        { category: 'Catering', name: 'Food & beverages', estimated: budget * 0.25, percentage: 25 },
        { category: 'Photography', name: 'Photography & Videography', estimated: budget * 0.08, percentage: 8 },
        { category: 'Decor', name: 'Flowers, stage, lighting', estimated: budget * 0.12, percentage: 12 },
        { category: 'Entertainment', name: 'DJ, mehendi, sangeet performers', estimated: budget * 0.08, percentage: 8 },
        { category: 'Bridal', name: 'Attire & jewellery', estimated: budget * 0.10, percentage: 10 },
        { category: 'Transport', name: 'Guest transportation', estimated: budget * 0.04, percentage: 4 },
        { category: 'Miscellaneous', name: 'Contingency & extras', estimated: budget * 0.03, percentage: 3 },
      ],
      timeline: [
        { time: '08:00', activity: 'Bridal getting ready, makeup & photography', responsible: 'Bride & Makeup Artist' },
        { time: '10:00', activity: 'Baraat arrival & welcome ceremony', responsible: 'Event Coordinator' },
        { time: '11:00', activity: 'Wedding ceremony (Phere / Vows)', responsible: 'Pandit / Officiant' },
        { time: '13:00', activity: 'Family photos & couple portraits', responsible: 'Photographer' },
        { time: '14:00', activity: 'Wedding luncheon', responsible: 'Catering Team' },
        { time: '17:00', activity: 'Rest & changeover', responsible: 'Couple' },
        { time: '19:00', activity: 'Reception doors open, cocktail hour', responsible: 'Event Coordinator' },
        { time: '20:00', activity: 'Grand entry, first dance', responsible: 'DJ & Couple' },
        { time: '20:30', activity: 'Dinner service', responsible: 'Catering Team' },
        { time: '22:00', activity: 'Cake cutting, open dance floor', responsible: 'DJ & Couple' },
        { time: '23:30', activity: 'Vote of thanks & farewell', responsible: 'Host Family' },
      ],
      vendorCategories: ['Venue', 'Caterer', 'Photographer', 'Videographer', 'Decorator', 'Mehendi Artist', 'DJ/Band', 'Makeup Artist', 'Pandit/Priest', 'Transportation', 'Invitation Designer', 'Wedding Cake Baker'],
      themeIdeas: [
        { name: 'Royal Rajasthani', description: 'Majestic tents, marigold garlands, vintage brass decor, folk musicians', colorPalette: ['#FFD700', '#8B0000', '#FF8C00', '#F5DEB3'], decor: 'Lanterns, peacock motifs, elephant props, hand-block printed fabrics' },
        { name: 'Garden Fairytale', description: 'Lush greenery, fairy lights, floral arches, soft romantic lighting', colorPalette: ['#FFFFFF', '#98FB98', '#FFB6C1', '#87CEEB'], decor: 'Floral canopies, hanging bulb lights, white drapery, vintage chairs' },
        { name: 'Modern Glamour', description: 'Black & gold luxury, crystal chandeliers, sleek contemporary decor', colorPalette: ['#000000', '#FFD700', '#C0C0C0', '#FFFFFF'], decor: 'LED walls, acrylic furniture, geometric patterns, dramatic uplighting' },
      ],
      tips: [
        `With ${guestCount} guests in ${city}, book the venue at least 3 months in advance.`,
        'Always get vendor contracts in writing; pay in installments, retain 20% for after-event satisfaction.',
        'Create a dedicated WhatsApp group for vendors and a separate one for family coordinators.',
        'Keep a 10% contingency fund — unforeseen expenses always arise.',
        'Hire a day-of coordinator so the family can relax and enjoy.',
      ],
    },
    birthday: {
      tasks: [
        { title: 'Book venue or home setup', category: 'Venue', daysBeforeEvent: 21, priority: 'high' },
        { title: 'Send invitations', category: 'Invitations', daysBeforeEvent: 14, priority: 'high' },
        { title: 'Order custom birthday cake', category: 'Catering', daysBeforeEvent: 7, priority: 'high' },
        { title: 'Arrange decorations & balloons', category: 'Decor', daysBeforeEvent: 3, priority: 'medium' },
        { title: 'Plan activities & games', category: 'Entertainment', daysBeforeEvent: 7, priority: 'medium' },
        { title: 'Arrange return gifts', category: 'Gifts', daysBeforeEvent: 5, priority: 'medium' },
        { title: 'Book photographer or designate one', category: 'Photography', daysBeforeEvent: 7, priority: 'low' },
        { title: 'Create playlist & arrange speaker', category: 'Entertainment', daysBeforeEvent: 2, priority: 'medium' },
      ],
      budgetBreakdown: [
        { category: 'Venue', name: 'Venue / home decoration', estimated: budget * 0.30, percentage: 30 },
        { category: 'Catering', name: 'Food, cake & drinks', estimated: budget * 0.35, percentage: 35 },
        { category: 'Decor', name: 'Balloons, streamers, flowers', estimated: budget * 0.15, percentage: 15 },
        { category: 'Entertainment', name: 'Activities, DJ, photographer', estimated: budget * 0.12, percentage: 12 },
        { category: 'Gifts', name: 'Return gifts & favors', estimated: budget * 0.08, percentage: 8 },
      ],
      timeline: [
        { time: '16:00', activity: 'Venue decoration & setup', responsible: 'Planning Team' },
        { time: '18:00', activity: 'Guests arrive, welcome drinks', responsible: 'Host' },
        { time: '18:30', activity: 'Icebreaker games & activities', responsible: 'Host' },
        { time: '19:30', activity: 'Dinner service', responsible: 'Caterer' },
        { time: '20:30', activity: 'Birthday surprise & cake cutting', responsible: 'All' },
        { time: '21:00', activity: 'Open dance floor, music & fun', responsible: 'DJ/Host' },
        { time: '22:30', activity: 'Return gifts distribution', responsible: 'Host' },
        { time: '23:00', activity: 'Farewell & photo session', responsible: 'All' },
      ],
      vendorCategories: ['Venue/Party Hall', 'Caterer', 'Cake Artist', 'Decorator', 'Entertainer/Emcee', 'Photographer'],
      themeIdeas: [
        { name: 'Bollywood Night', description: 'Film posters, dance numbers, desi snacks, retro Bollywood music', colorPalette: ['#FF1493', '#FFD700', '#FF4500', '#800080'], decor: 'Film posters, clapboard props, star cutouts, disco ball' },
        { name: 'Neon Glow Party', description: 'UV lights, neon accessories, glow-in-the-dark face paint', colorPalette: ['#00FF41', '#FF00FF', '#00FFFF', '#FF6600'], decor: 'Neon signs, UV lights, glow sticks, dark walls' },
        { name: 'Garden Brunch', description: 'Daytime celebration, floral decor, mimosas, brunch spread', colorPalette: ['#FFFFFF', '#F9A8D4', '#86EFAC', '#FDE68A'], decor: 'Flower crowns, pastel bunting, wicker furniture' },
      ],
      tips: [
        'For a surprise party, designate a trusted coordinator to manage the honoree\'s schedule.',
        'Order the cake 5-7 days ahead — custom cakes need time.',
        'Create a shared photo album link before the party so guests can upload instantly.',
      ],
    },
    college: {
      tasks: [
        { title: 'Get institutional approval & venue booking', category: 'Admin', daysBeforeEvent: 60, priority: 'urgent' },
        { title: 'Form organizing committee with roles', category: 'Planning', daysBeforeEvent: 60, priority: 'urgent' },
        { title: 'Secure sponsorships', category: 'Sponsorship', daysBeforeEvent: 45, priority: 'high' },
        { title: 'Open competition registrations', category: 'Events', daysBeforeEvent: 30, priority: 'high' },
        { title: 'Book guest speakers & performers', category: 'Entertainment', daysBeforeEvent: 30, priority: 'high' },
        { title: 'Design & launch event website/app', category: 'Tech', daysBeforeEvent: 30, priority: 'high' },
        { title: 'Arrange AV, projectors & internet', category: 'Tech', daysBeforeEvent: 14, priority: 'high' },
        { title: 'Print schedules, certificates, IDs', category: 'Admin', daysBeforeEvent: 7, priority: 'medium' },
        { title: 'Brief all volunteers & assign duties', category: 'Operations', daysBeforeEvent: 3, priority: 'urgent' },
        { title: 'Rehearsal & technical check', category: 'Operations', daysBeforeEvent: 1, priority: 'urgent' },
      ],
      budgetBreakdown: [
        { category: 'Venue', name: 'Auditorium & ground setup', estimated: budget * 0.20, percentage: 20 },
        { category: 'Prizes', name: 'Competition prize money', estimated: budget * 0.25, percentage: 25 },
        { category: 'Marketing', name: 'Banners, social media, PR', estimated: budget * 0.10, percentage: 10 },
        { category: 'Catering', name: 'Food & refreshments', estimated: budget * 0.20, percentage: 20 },
        { category: 'Tech', name: 'AV, internet, equipment', estimated: budget * 0.15, percentage: 15 },
        { category: 'Guests', name: 'Speaker fees & travel', estimated: budget * 0.05, percentage: 5 },
        { category: 'Miscellaneous', name: 'Stationery & contingency', estimated: budget * 0.05, percentage: 5 },
      ],
      timeline: [
        { time: '08:00', activity: 'Volunteer briefing & setup', responsible: 'Core Committee' },
        { time: '09:00', activity: 'Registration desks open, participant check-in', responsible: 'Registration Team' },
        { time: '10:00', activity: 'Inaugural ceremony & keynote', responsible: 'Faculty & Chief Guest' },
        { time: '11:00', activity: 'Technical competitions begin', responsible: 'Event Leads' },
        { time: '13:00', activity: 'Lunch break & networking', responsible: 'Catering Team' },
        { time: '14:00', activity: 'Workshops & panel discussions', responsible: 'Workshop Leads' },
        { time: '17:00', activity: 'Cultural events & entertainment', responsible: 'Cultural Committee' },
        { time: '19:00', activity: 'Prize distribution & valedictory', responsible: 'Faculty & Organizers' },
        { time: '20:00', activity: 'Closing remarks & networking dinner', responsible: 'Organizing Team' },
      ],
      vendorCategories: ['AV Equipment', 'Catering', 'Banner & Print', 'Web Developer', 'Photographer', 'Security', 'First Aid'],
      themeIdeas: [
        { name: 'Cyberpunk 2030', description: 'Neon grids, holographic displays, tech-forward decor', colorPalette: ['#00FFFF', '#FF00FF', '#000000', '#39FF14'], decor: 'LED matrices, circuit board patterns, 3D printed props' },
        { name: 'Mission to Mars', description: 'Space exploration theme, rocket models, astronaut cutouts', colorPalette: ['#FF4500', '#000000', '#C0C0C0', '#FF8C00'], decor: 'Planet mobiles, star maps, mission control aesthetic' },
        { name: 'Startup Expo', description: 'Clean, professional, innovation-forward, pitch-competition vibes', colorPalette: ['#3B82F6', '#FFFFFF', '#1E293B', '#10B981'], decor: 'Branded backdrops, sleek banners, networking pods' },
      ],
      tips: [
        'Collect registrations digitally — it saves time and generates auto-certificates easily.',
        'Assign a dedicated social media volunteer to live-post during the event.',
        'Partner with local startups for sponsorship — they love the visibility.',
      ],
    },
    community: {
      tasks: [
        { title: 'Get municipal/BMC permission for public venue', category: 'Permits', daysBeforeEvent: 45, priority: 'urgent' },
        { title: 'Form volunteer committees', category: 'Operations', daysBeforeEvent: 30, priority: 'urgent' },
        { title: 'Launch donation campaign', category: 'Fundraising', daysBeforeEvent: 30, priority: 'high' },
        { title: 'Book food stall vendors', category: 'Catering', daysBeforeEvent: 21, priority: 'high' },
        { title: 'Arrange stage & sound system', category: 'Entertainment', daysBeforeEvent: 14, priority: 'high' },
        { title: 'Promote via local WhatsApp groups & posters', category: 'Marketing', daysBeforeEvent: 21, priority: 'high' },
        { title: 'Arrange lighting & decor', category: 'Decor', daysBeforeEvent: 7, priority: 'medium' },
        { title: 'Set up first aid & safety measures', category: 'Safety', daysBeforeEvent: 3, priority: 'urgent' },
        { title: 'Volunteer briefing & duty assignment', category: 'Operations', daysBeforeEvent: 1, priority: 'urgent' },
      ],
      budgetBreakdown: [
        { category: 'Venue', name: 'Park/ground booking & stage', estimated: budget * 0.20, percentage: 20 },
        { category: 'Decor', name: 'Lights & cultural decor', estimated: budget * 0.20, percentage: 20 },
        { category: 'Entertainment', name: 'Performers & sound system', estimated: budget * 0.25, percentage: 25 },
        { category: 'Catering', name: 'Food stalls & refreshments', estimated: budget * 0.20, percentage: 20 },
        { category: 'Marketing', name: 'Posters, banners, social', estimated: budget * 0.10, percentage: 10 },
        { category: 'Safety', name: 'Security & first aid', estimated: budget * 0.05, percentage: 5 },
      ],
      timeline: [
        { time: '16:00', activity: 'Venue setup & volunteer positions', responsible: 'Operations Team' },
        { time: '17:00', activity: 'Donation booths open, community arrives', responsible: 'Fundraising Team' },
        { time: '17:30', activity: 'Inaugural lamp lighting ceremony', responsible: 'Community Leaders' },
        { time: '18:00', activity: 'Cultural performances begin', responsible: 'Cultural Committee' },
        { time: '19:30', activity: 'Community dinner & food stalls', responsible: 'Catering Team' },
        { time: '20:30', activity: 'Main event / Fireworks (if applicable)', responsible: 'Event Lead' },
        { time: '21:30', activity: 'Vote of thanks & closing ceremony', responsible: 'Organizers' },
        { time: '22:00', activity: 'Cleanup begins', responsible: 'All Volunteers' },
      ],
      vendorCategories: ['Stage & Sound', 'Lighting', 'Catering/Food Stalls', 'Security', 'First Aid', 'Decoration', 'Photography'],
      themeIdeas: [
        { name: 'Traditional Utsav', description: 'Folk music, rangoli, traditional attire, local cuisine', colorPalette: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'], decor: 'Diyas, rangoli, flowers, traditional fabrics, clay pots' },
        { name: 'Eco Celebration', description: 'Sustainability-focused, zero-waste, organic decor', colorPalette: ['#22C55E', '#FFFFFF', '#84CC16', '#FEF9C3'], decor: 'Bamboo installations, seed packets as souvenirs, compostable materials' },
        { name: 'Unity Mela', description: 'Multicultural, inclusive, celebrate diversity of the community', colorPalette: ['#EF4444', '#F97316', '#EAB308', '#22C55E'], decor: 'Flags of all faiths, shared cultural displays, community art wall' },
      ],
      tips: [
        'Set up a public donation tracker — transparency builds community trust.',
        'Use WhatsApp broadcast lists for reminders; works on low-end phones.',
        'Designate a lost-and-found point and first aid station at the entrance.',
      ],
    },
  };

  return templates[type] || templates.community;
}

// ═══════════════════════════════════════════════════════════
// Validate AI plan output schema
// ═══════════════════════════════════════════════════════════
function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('Plan must be an object');
  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) throw new Error('Plan must have tasks array');
  if (!Array.isArray(plan.budgetBreakdown) || plan.budgetBreakdown.length === 0) throw new Error('Plan must have budgetBreakdown');
  if (!Array.isArray(plan.timeline)) throw new Error('Plan must have timeline');
  if (!Array.isArray(plan.vendorCategories)) throw new Error('Plan must have vendorCategories');
  if (!Array.isArray(plan.themeIdeas)) throw new Error('Plan must have themeIdeas');
  return true;
}

// ═══════════════════════════════════════════════════════════
// Main AI Plan Generator
// ═══════════════════════════════════════════════════════════
async function generateEventPlan(input) {
  const { type, title, eventDate, guestCount, budget, city, preferences, language } = input;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[AI] No API key — using template fallback');
    return { plan: generateTemplatePlan(input), source: 'template' };
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Generate a detailed event plan for the following event:

Event Type: ${type}
Title: ${title}
Date: ${eventDate}
City: ${city}, India
Guest Count: ${guestCount}
Total Budget: ₹${budget.toLocaleString('en-IN')} INR
Preferences/Vibe: ${preferences || 'Traditional Indian style, elegant and warm'}
Language preference: ${language || 'English'}

Return a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "tasks": [{ "title": "string", "category": "string", "daysBeforeEvent": number, "priority": "low|medium|high|urgent" }],
  "budgetBreakdown": [{ "category": "string", "name": "string", "estimated": number, "percentage": number }],
  "timeline": [{ "time": "HH:MM", "activity": "string", "responsible": "string" }],
  "vendorCategories": ["string"],
  "themeIdeas": [{ "name": "string", "description": "string", "colorPalette": ["hex"], "decor": "string" }],
  "tips": ["string"]
}

Rules:
- All monetary values in INR
- Budget percentages must sum to ~100
- Include 8-15 tasks with realistic Indian context
- Include 6-10 timeline items for event day
- Include exactly 3 theme ideas
- Include 3-5 practical tips specific to ${city}, India`;

  let lastError = null;

  // Try up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        system: PLANNER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const content = response.content[0]?.text || '';
      // Strip potential markdown fences
      const cleaned = content.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
      const plan = JSON.parse(cleaned);
      validatePlan(plan);
      return { plan, source: 'claude', model: response.model };
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Attempt ${attempt} failed:`, err.message);
    }
  }

  // Fallback after 2 failures
  console.warn('[AI] Falling back to template after 2 failed attempts:', lastError?.message);
  return { plan: generateTemplatePlan(input), source: 'template', error: lastError?.message };
}

// ═══════════════════════════════════════════════════════════
// INVITATION WRITER
// ═══════════════════════════════════════════════════════════
const INVITATION_PROMPTS = {
  formal: {
    en: (e) => `Write a formal invitation for ${e.title}, a ${e.type}, held on ${new Date(e.date).toDateString()} at ${e.venue}, ${e.city}. Keep it under 100 words, warm and dignified.`,
    hi: (e) => `${e.title} के लिए एक औपचारिक निमंत्रण लिखें जो ${e.venue}, ${e.city} में ${new Date(e.date).toLocaleDateString('hi-IN')} को आयोजित होगा। हिंदी में, 80 शब्दों में लिखें।`,
    bn: (e) => `${e.venue}, ${e.city}-তে ${new Date(e.date).toLocaleDateString('bn-IN')} তারিখে ${e.title} উপলক্ষে একটি আনুষ্ঠানিক আমন্ত্রণ পত্র বাংলায় লিখুন।`,
  },
  fun: {
    en: (e) => `Write a fun, energetic WhatsApp invitation for ${e.title} on ${new Date(e.date).toDateString()} at ${e.venue}, ${e.city}. Add emojis, make it exciting and under 80 words.`,
    hi: (e) => `${e.title} के लिए एक मज़ेदार WhatsApp निमंत्रण हिंदी में लिखें। इमोजी का उपयोग करें, 70 शब्दों में।`,
    bn: (e) => `${e.title} এর জন্য মজাদার WhatsApp আমন্ত্রণ বাংলায় লিখুন। ইমোজি ব্যবহার করুন।`,
  },
  traditional: {
    en: (e) => `Write a traditional Indian invitation for ${e.title} incorporating cultural greetings and blessings. Event on ${new Date(e.date).toDateString()} at ${e.venue}, ${e.city}. Under 120 words.`,
    hi: (e) => `${e.title} के लिए एक पारंपरिक भारतीय निमंत्रण लिखें। हिंदी में, आशीर्वाद और सांस्कृतिक अभिवादन के साथ।`,
    bn: (e) => `${e.title} এর জন্য একটি ঐতিহ্যবাহী বাংলা আমন্ত্রণ লিখুন।`,
  },
};

async function generateInvitation(event, tone, language) {
  const lang = language || 'en';
  const toneKey = tone || 'fun';
  const promptFn = INVITATION_PROMPTS[toneKey]?.[lang] || INVITATION_PROMPTS.fun.en;
  const prompt = promptFn(event);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      invitation: generateTemplateInvitation(event, toneKey, lang),
      source: 'template'
    };
  }

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: 'You are an expert invitation writer for Indian events. Write only the invitation text, no additional commentary.',
      messages: [{ role: 'user', content: prompt }],
    });
    return { invitation: response.content[0]?.text?.trim(), source: 'claude' };
  } catch (err) {
    return { invitation: generateTemplateInvitation(event, toneKey, lang), source: 'template', error: err.message };
  }
}

function generateTemplateInvitation(event, tone, lang) {
  const date = new Date(event.date).toDateString();
  const templates = {
    fun: {
      en: `🎉 You're invited! 🎉\n\nJoin us for ${event.title}!\n📅 ${date}\n📍 ${event.venue}, ${event.city}\n\nIt's going to be EPIC! Don't miss it! 🥳\n\nRSVP: [link] | Queries: WhatsApp us!`,
      hi: `🎉 आप आमंत्रित हैं! 🎉\n\n${event.title} में आइए!\n📅 ${date}\n📍 ${event.venue}, ${event.city}\n\nयह बहुत शानदार होगा! 🥳\n\nRSVP करें: [link]`,
      bn: `🎉 আপনি আমন্ত্রিত! 🎉\n\n${event.title}-এ আসুন!\n📅 ${date}\n📍 ${event.venue}, ${event.city}\n\nএটি অসাধারণ হবে! 🥳`,
    },
    formal: {
      en: `Dear Guest,\n\nWe cordially invite you to ${event.title}.\n\nDate: ${date}\nVenue: ${event.venue}, ${event.city}\n\nYour presence would be our privilege and honour.\n\nKindly RSVP at your earliest convenience.`,
      hi: `प्रिय अतिथि,\n\nहम आपको ${event.title} में सादर आमंत्रित करते हैं।\n\nतिथि: ${date}\nस्थान: ${event.venue}, ${event.city}\n\nआपकी उपस्थिति हमारे लिए सम्मान की बात होगी।`,
      bn: `প্রিয় অতিথি,\n\nআমরা আপনাকে ${event.title}-এ আমন্ত্রণ জানাচ্ছি।\n\nতারিখ: ${date}\nস্থান: ${event.venue}, ${event.city}`,
    },
    traditional: {
      en: `🙏 With the blessings of the Almighty 🙏\n\nWe joyfully invite you and your family to celebrate ${event.title}.\n\n🗓 ${date}\n📍 ${event.venue}, ${event.city}\n\nYour blessings and presence will make this occasion truly auspicious.\n\nJai Hind! 🇮🇳`,
      hi: `🙏 ईश्वर की कृपा से 🙏\n\n${event.title} के शुभ अवसर पर हम आपको सपरिवार आमंत्रित करते हैं।\n\nतिथि: ${date}\nस्थान: ${event.venue}, ${event.city}\n\nआपका आशीर्वाद और उपस्थिति इस उत्सव को और भी मंगलमय बनाएगी।`,
      bn: `🙏 ঈশ্বরের কৃপায় 🙏\n\n${event.title} উপলক্ষে আপনাকে সাদরে আমন্ত্রণ জানানো হচ্ছে।\n\nতারিখ: ${date}\nস্থান: ${event.venue}, ${event.city}`,
    },
  };

  return templates[tone]?.[lang] || templates.fun.en;
}

module.exports = { generateEventPlan, generateInvitation, generateTemplatePlan };
