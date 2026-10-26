/**
 * Persistent User Persona & Moveset Lorebook Storage
 * Saved permanently in localStorage and synced to active MongoDB sessions.
 */

const STORAGE_KEY_PERSONAS = 'rp_saved_personas_v2';
const STORAGE_KEY_ACTIVE_ID = 'rp_active_persona_id_v2';

const DEFAULT_PERSONAS = [
  {
    id: 'persona-patrick-yokam',
    name: 'Patrick Yokam',
    avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b183885-HOmw8CqcJdv3.jpg',
    gender: 'Male',
    physique: 'Tall, lean-athletic stature with observant amber eyes and dark untamed hair. Wears dark traveler attire with a reinforced leather duster and silver signet ring.',
    traits: 'Analytical, composed, subtly sarcastic, fiercely perceptive, never bows to intimidation or hubris.',
    details: 'An interdimensional participant traversing anime verses with sovereign agency and adaptive combat instincts.',
    movesetKnowledge: JSON.stringify([
      {
        id: 'move-dim-shift',
        name: 'Dimensional Shift',
        keywords: ['dimensional shift', 'teleport', 'blink', 'phase shift', 'evade'],
        description: 'Instantly phase shifts 10-15 meters through spacetime, leaving an afterimage and completely evading incoming attacks.',
        action: 'I execute Dimensional Shift to phase behind the enemy in an instant.'
      },
      {
        id: 'move-aether-blade',
        name: 'Aether Blade',
        keywords: ['aether blade', 'mana sword', 'energy blade', 'crescent slash', 'aether strike'],
        description: 'Channels concentrated kinetic aether along the weapon edge, releasing a high-velocity violet slash capable of cleaving reinforced barriers.',
        action: 'I coat my blade in pulsing violet aether and unleash a high-velocity crescent slash.'
      }
    ], null, 2),
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000
  },
  {
    id: 'persona-kaelen-valerius',
    name: 'Kaelen Valerius',
    avatar: 'https://s4.anilist.co/file/anilistcdn/character/large/b89364-7Th8Tv1XKJtt.png',
    gender: 'Male',
    physique: 'Striking silver hair tied back, sharp amethyst eyes, dressed in tailored midnight-blue coats with silver arcane filigree.',
    traits: 'Stoic, tactical mastermind, polite yet calculating, uncompromising in combat.',
    details: 'A void-weaver sovereign trained in gravitational anomalies and spatial disruption.',
    movesetKnowledge: JSON.stringify([
      {
        id: 'move-gravity-well',
        name: 'Singularity Well',
        keywords: ['singularity', 'gravity well', 'gravitational pull', 'crush', 'collapse'],
        description: 'Condenses localized gravity into an irresistible point of attraction, collapsing enemy formations and immobilizing targets.',
        action: 'I snap my fingers, triggering a Singularity Well at the center of the battlefield to pull and crush their defense.'
      }
    ], null, 2),
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000
  }
];

export function getStoredPersonas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(DEFAULT_PERSONAS));
      return DEFAULT_PERSONAS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(DEFAULT_PERSONAS));
      return DEFAULT_PERSONAS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse personas from localStorage:', err);
    return DEFAULT_PERSONAS;
  }
}

export function saveStoredPersonas(personas) {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(personas));
    window.dispatchEvent(new Event('persona_storage_updated'));
  } catch (err) {
    console.error('Failed to save personas to localStorage:', err);
  }
}

export function getActivePersonaId() {
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (activeId) return activeId;
    const personas = getStoredPersonas();
    const firstId = personas[0]?.id || 'persona-patrick-yokam';
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, firstId);
    return firstId;
  } catch (e) {
    return 'persona-patrick-yokam';
  }
}

export function saveActivePersonaId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    window.dispatchEvent(new Event('persona_storage_updated'));
  } catch (e) {}
}

export function getActivePersona() {
  const personas = getStoredPersonas();
  const activeId = getActivePersonaId();
  return personas.find((p) => p.id === activeId) || personas[0] || DEFAULT_PERSONAS[0];
}

export function createOrUpdatePersona(personaData) {
  const personas = getStoredPersonas();
  const now = Date.now();
  let updatedList;

  if (personaData.id) {
    const index = personas.findIndex((p) => p.id === personaData.id);
    if (index >= 0) {
      personas[index] = { ...personas[index], ...personaData, updatedAt: now };
      updatedList = [...personas];
    } else {
      updatedList = [{ ...personaData, createdAt: now, updatedAt: now }, ...personas];
    }
  } else {
    const newPersona = {
      ...personaData,
      id: `persona-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };
    updatedList = [newPersona, ...personas];
    saveActivePersonaId(newPersona.id);
  }

  saveStoredPersonas(updatedList);
  return updatedList;
}

export function deletePersona(personaId) {
  const personas = getStoredPersonas();
  const filtered = personas.filter((p) => p.id !== personaId);
  const finalList = filtered.length > 0 ? filtered : DEFAULT_PERSONAS;
  saveStoredPersonas(finalList);

  if (getActivePersonaId() === personaId) {
    saveActivePersonaId(finalList[0].id);
  }
  return finalList;
}
