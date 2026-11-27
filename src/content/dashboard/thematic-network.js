// Editorial themes adapted from the MedCHI Atlas title and keyword grouping.
// Keys use the reviewed public programme titles in the affiliation snapshot.
const assignments = new Map([
  ["Comparing Mobile Touch-based AR and Gestural Interfaces to Control Smart Environments", ["xr","design"]],
  ["Gamifying Cultural Heritage in Rural Areas with THEODEN", ["heritage","design"]],
  ["From Children's Interactions to Teachers' Use: the Evolution of the poli:bit Toolkit", ["xr","education"]],
  ["Visual Representations for Understanding XR Training Procedures", ["xr","education"]],
  ["Agents in Shared Households: A Research Agenda for Joint Decision-Making by Adults with Intellectual Disability", ["ai","health","design"]],
  ["The Design of an Intelligent Interface for Conceptual Alignment in the Classroom", ["ai","education"]],
  ["Discovering Nature's Heartbeats with Teenagers: Insights for a Playful Experience", ["xr","nature"]],
  ["Sensor-Enhanced Digital Twins for Personalized Wellbeing: Extending the LUMINA Framework", ["ai","health"]],
  ["Beyond the Black Box: Making AI Accessible and Clinically Meaningful in Cardiology", ["ai","health"]],
  ["From Local Sounds to a Mediterranean Research Agenda: Embodied Human–AI Music Creation", ["ai","xr","heritage"]],
  ["From User Manuals to Mixed-Reality Simulations: A Conceptual Model and an AI-supported Authoring Tool", ["ai","xr","education"]],
  ["SpokenIdea: Towards Adaptive Conversational Agents for Voice-Assisted Brainstorming", ["ai","design"]],
  ["Advancing Ocean Literacy in HCI Research through the OL-in-One Compass", ["education","nature"]],
  ["Same Prompt, Different Stance:  How Consumer AI Assistants Take Positions  on Everyday Advice in Italian", ["ai","design"]],
  ["Beyond the Postcard: Negotiating Local Stories with Generative AI", ["ai","heritage"]],
  ["Old City Pushes Back: Site Constraints and Design Pivots in an Outdoor AR Guide for Akko", ["xr","heritage"]],
  ["When the Monument Triggers: Designing AR for Trauma-Exposed Veterans at Military Heritage Sites", ["xr","heritage","health"]],
  ["Rekindling Human-Nature Dialogues: Grounding Design Futuring in Lived Experience", ["nature","design"]],
  ["Bridging Climate Modelling and Local Policymaking: Insights from five European Climate Hotspots", ["nature","design"]],
  ["Virgil: A Prototype of a Virtual Prompt Guide for LLM-Assisted Software Development", ["ai","design"]],
  ["Creating AI-Based Systems in Symbiosis with Humans: a Tool-Kit for Practitioners", ["ai","design"]],
  ["Evaluating Serious Game Interface Usability among Gamers and Non-Gamers via Contextual Event Logging", ["education","design"]],
  ["Cuisine-Aware Seasonal Ingredient Recommendation Through Recipe Co-Occurrence Graphs", ["heritage","nature","design"]],
  ["Privacy-Preserving Clinical Clustering with Fully Homomorphic Encryption: Designing for Clinician Trust and Usability", ["ai","health"]],
  ["Voice First Intention Driven Interaction An Emerging HCI Paradigm for Healthcare in the Era of Agentic AI", ["ai","health"]],
  ["Human-Centered, Policy-Aware Interaction between Administrative Operators and Heterogeneous Information Systems", ["ai","design"]],
  ["Fine-Tuning and Prompt Engineering on LLM-Based Approaches for Generating Biomedical Cypher Queries", ["ai","health"]],
  ["Toward a triadic framework for Teacher-Student-GenAI chatbot interaction in Education", ["ai","education"]],
  ["Using Artificial Intelligence for Authoring Mixed-Reality Simulations of Common Workplace Devices for Training", ["ai","xr","education"]],
  ["Designing for Delegation: Investigating Agentic UX in Web Interaction Through Inclusive Design", ["ai","health","design"]],
  ["When a detector calls a deepfake real", ["ai","design"]],
  ["Culturia: Empowering Mediterranean Villages with Autonomous, Trustworthy AI Digitization to Attract and Engage Tourist Flows", ["ai","heritage"]],
]);

export const themes = {
  ai: 'AI & interaction',
  xr: 'XR & tangible interaction',
  heritage: 'Cultural heritage & place',
  health: 'Health & accessibility',
  education: 'Education & training',
  nature: 'Environment & sustainability',
  design: 'Design & usability',
};

export const themeLabels = {all: 'All themes', ...themes};

export function countryAnchors(rows) {
  const countries = new Map();
  for (const row of rows) {
    if (!Number.isFinite(row.longitude) || !Number.isFinite(row.latitude)) continue;
    if (!countries.has(row.country_code)) countries.set(row.country_code, new Map());
    countries.get(row.country_code).set(row.inst_id, row);
  }
  return new Map([...countries].map(([code, institutions]) => {
    const sites = [...institutions.values()];
    const longitude = sites.reduce((sum, site) => sum + site.longitude, 0) / sites.length;
    const latitude = sites.reduce((sum, site) => sum + site.latitude, 0) / sites.length;
    const eastWestScale = Math.cos(latitude * Math.PI / 180);
    const distance = site => Math.hypot((site.longitude - longitude) * eastWestScale, site.latitude - latitude);
    const nearest = sites.reduce((a, b) => distance(a) <= distance(b) ? a : b);
    return [code, {country: nearest.country, longitude: nearest.longitude, latitude: nearest.latitude}];
  }));
}

export function thematicNetwork(rows, theme, anchors) {
  const matches = [];
  const countries = new Map();
  const activeThemes = new Set();
  for (const row of rows) {
    if (!anchors.has(row.country_code)) continue;
    const assigned = assignments.get(row.title)?.filter(id => theme === 'all' || id === theme);
    if (!assigned?.length) continue;
    matches.push(row);
    if (!countries.has(row.country_code)) {
      countries.set(row.country_code, {titles: new Set(), byTheme: new Map()});
    }
    const {titles, byTheme} = countries.get(row.country_code);
    titles.add(row.title);
    for (const id of assigned) {
      activeThemes.add(id);
      if (!byTheme.has(id)) byTheme.set(id, new Set());
      byTheme.get(id).add(row.title);
    }
  }
  const nodes = [...countries].map(([code, {titles, byTheme}]) => ({
    code,
    ...anchors.get(code),
    count: titles.size,
    links: [...byTheme].map(([theme, titles]) => ({theme, count: titles.size})),
  })).sort((a, b) => a.count - b.count);
  return {
    nodes,
    rows: matches,
    count: new Set(matches.map(row => row.title)).size,
    themeIds: Object.keys(themes).filter(id => activeThemes.has(id)),
  };
}
