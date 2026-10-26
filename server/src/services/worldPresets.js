/**
 * World & Universe Presets with Canon Synopses and Sequential Timeline Arcs.
 * Provides rich canonical introductions and anime chapter sequences so users can select
 * an arc and enter their own raw scenario start prompt.
 */

export const WORLD_PRESETS = [
  {
    id: 'frieren',
    universe: 'Sousou no Frieren (Beyond Journey\'s End)',
    title: 'Frieren: Northern Plateau Remnants',
    synopsis: 'A contemplative and radiant high-fantasy world decades after the Hero Party defeated the Demon King. The elven mage Frieren journeys toward Aureole at the continent\'s northern edge. Magic is an art of visualization and scientific discovery.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Post-Himmel Northern Journey', era: 'Year 28 After Hero Himmel', date: 'Year 28 After Himmel' },
      { id: 'arc2', label: 'Arc 2: First-Class Mage Exam Arc', era: 'Äußerst Imperial Magic Academy Trials', date: 'Year 29 After Himmel' },
      { id: 'arc3', label: 'Arc 3: Northern Plateau Demon Incursions', era: 'Macht of El Dorado Arc', date: 'Year 30 After Himmel' },
      { id: 'arc4', label: 'Arc 4: Himmel Hero Party Flashback Era', era: 'Ten-Year Demon King Campaign', date: 'Year 40 Before Himmel\'s Passing' }
    ],
    knownNPCs: [
      { name: 'Frieren', relation: 'Elven Mage / Legend', status: 'Examining grimoire' },
      { name: 'Fern', relation: 'First-Class Apprentice', status: 'Serving warm herbal tea' },
      { name: 'Stark', relation: 'Warrior Vanguard', status: 'Keeping watch on the ridge' }
    ]
  },
  {
    id: 'jujutsu_kaisen',
    universe: 'Jujutsu Kaisen',
    title: 'JJK: Shibuya & Cursed Thresholds',
    synopsis: 'A brutal modern urban supernatural world where negative human emotions manifest as lethal Cursed Spirits. Jujutsu Sorcerers manipulate cursed energy beneath magical veils to protect humanity from disaster curses.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Shibuya Incident', era: 'Shibuya Curtain Descent', date: 'October 31, 2018' },
      { id: 'arc2', label: 'Arc 2: Culling Game Colonies', era: 'Ancient Reincarnated Sorcerer Bloodbaths', date: 'November 2018' },
      { id: 'arc3', label: 'Arc 3: Shinjuku Decisive Showdown', era: 'The Battle of the Strongest', date: 'December 24, 2018' },
      { id: 'arc4', label: 'Arc 4: Hidden Inventory / Premature Death', era: 'Tokyo Prefectural High 2006', date: 'Summer 2006' }
    ],
    knownNPCs: [
      { name: 'Satoru Gojo', relation: 'The Strongest Sorcerer', status: 'Unleashing Limitless' },
      { name: 'Ryomen Sukuna', relation: 'King of Curses', status: 'Watching from the shadow' },
      { name: 'Yuji Itadori', relation: 'Resolute Vanguard', status: 'Channeling Divergent Fist' }
    ]
  },
  {
    id: 'solo_leveling',
    universe: 'Solo Leveling',
    title: 'Solo Leveling: Shadow Monarch Domain',
    synopsis: 'Dimensional Gates connect Earth to deadly monster-filled dungeons where awakened Hunters battle for survival. Behind the Hunter Association lies a cosmic war between Primordial Monarchs and Rulers.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Double Dungeon Awakening', era: 'Cartenon Temple Trial', date: 'Day of the Statues' },
      { id: 'arc2', label: 'Arc 2: Jeju Island S-Rank Raid', era: 'Ant Queen Extermination', date: 'Year 3 of S-Rank Guilds' },
      { id: 'arc3', label: 'Arc 3: Monarch War Apocalypse', era: 'S-Rank Gate Crisis & Sovereign Clashes', date: 'The Final Eclipse' },
      { id: 'arc4', label: 'Arc 4: International Guild Conference', era: 'Global Hunter Concordat', date: 'Eve of the Dragon Monarch' }
    ],
    knownNPCs: [
      { name: 'Sung Jin-Woo', relation: 'Shadow Monarch / Equal Sovereign', status: 'Commanding the shadow army' },
      { name: 'Cha Hae-In', relation: 'Vice-Guild Master / Allied Hunter', status: 'Surveying gate perimeter' },
      { name: 'Igris', relation: 'Blood-Red Knight', status: 'Guarding the sovereign flank' }
    ]
  },
  {
    id: 'chainsaw_man',
    universe: 'Chainsaw Man',
    title: 'Chainsaw Man: Public Safety & Primal Fears',
    synopsis: 'A gritty, violent alternate 1997 where devils born from collective human fears terrorize humanity. Public Safety Devil Hunters form contracts with devils to hunt lethal threats like the Gun Devil and the Control Devil.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Public Safety Special Division 4', era: 'Tokyo Devil Extermination Arc', date: 'Autumn 1997' },
      { id: 'arc2', label: 'Arc 2: Katana Man & Gun Devil Incursion', era: 'Ambush at Tokyo HQ', date: 'Winter 1997' },
      { id: 'arc3', label: 'Arc 3: International Assassins Arc', era: 'Global Hitmen Descend on Tokyo', date: 'Spring 1998' },
      { id: 'arc4', label: 'Arc 4: Control Devil Climax', era: 'Makima\'s Ultimate Contract', date: 'End of Part 1' }
    ],
    knownNPCs: [
      { name: 'Denji', relation: 'Chainsaw Fiend / Comradely Rebel', status: 'Revving his cord' },
      { name: 'Makima', relation: 'Special Division Director / Enigmatic Superior', status: 'Observing with a calm smile' },
      { name: 'Power', relation: 'Blood Fiend Roommate', status: 'Boasting wildly' }
    ]
  },
  {
    id: 'tensura',
    universe: 'Tensura (Slime) / Jura Tempest',
    title: 'Tensura: The Astral Convergence',
    synopsis: 'A high-magic fantasy world where monsters and nations evolve through naming and magicules. Rimuru Tempest established the Jura Tempest Federation where monsters and humans coexist amidst looming Great War conflicts.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Tempest Founding & Orc Lord Arc', era: 'Birth of the Monster Nation', date: 'Year 2040 Jura Calendar' },
      { id: 'arc2', label: 'Arc 2: Demon Lord Awakening & Walpurgis', era: 'Octagram Demon Lord Assembly', date: 'Year 2041 Jura Calendar' },
      { id: 'arc3', label: 'Arc 3: Eastern Empire War', era: 'Invasion of the Imperial Airships', date: 'Year 2042 Jura Calendar' },
      { id: 'arc4', label: 'Arc 4: Tenma Great War Pre-Dawn', era: 'The Primordial Clashes', date: 'Year 2043 Jura Calendar' }
    ],
    knownNPCs: [
      { name: 'Rimuru Tempest', relation: 'Demon Lord / Allied Sovereign', status: 'Welcoming you to Tempest' },
      { name: 'Guy Crimson', relation: 'Lord of Darkness', status: 'Watching the cosmic anomaly' },
      { name: 'Milim Nava', relation: 'Destroyer / Dragonoid Ally', status: 'Cheering eagerly' }
    ]
  },
  {
    id: 'mushoku_tensei',
    universe: 'Mushoku Tensei: Jobless Reincarnation',
    title: 'Mushoku Tensei: The Six-Faced World',
    synopsis: 'A deeply detailed fantasy world governed by mana, elemental sword styles (Sword God, Water God, North God), and vocal spell chantings. Reincarnated prodigy Rudeus Greyrat journeys across continents while entangled in the schemes of the Man-God and Dragon God Orsted.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Roa & Buena Village Childhood', era: 'Boreas Household Tutoring', date: 'Year 417 Dragon Calendar' },
      { id: 'arc2', label: 'Arc 2: Teleportation Incident & Demon Continent', era: 'Dead End Journey Across the Red Dunes', date: 'Year 420 Dragon Calendar' },
      { id: 'arc3', label: 'Arc 3: Ranoa Magic Academy Arc', era: 'Silent Fitz & Student Council', date: 'Year 423 Dragon Calendar' },
      { id: 'arc4', label: 'Arc 4: Begaritt Labyrinth & Turning Point', era: 'Teleportation Labyrinth Rescue', date: 'Year 425 Dragon Calendar' }
    ],
    knownNPCs: [
      { name: 'Rudeus Greyrat', relation: 'Quagmire Prodigy Mage', status: 'Channeling chantless stone cannon' },
      { name: 'Eris Boreas Greyrat', relation: 'Sword Saint Vanguard', status: 'Grip on her curved blade' },
      { name: 'Orsted', relation: 'Dragon God / Sovereign Apex', status: 'Gazing through the divine veil' }
    ]
  },
  {
    id: 'rezero',
    universe: 'Re:Zero - Starting Life in Another World',
    title: 'Re:Zero: The Lugnica Royal Selection',
    synopsis: 'A beautiful yet treacherous fantasy kingdom of Lugnica where Subaru Natsuki awakens with Return by Death. Five candidates compete for the Dragon Throne amidst witch cult conspiracies, archbishop atrocities, and ancient sin.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Capital Slums & Loot House', era: 'First Loop of Destiny', date: 'First Day in Lugnica' },
      { id: 'arc2', label: 'Arc 2: Roswaal Mansion & Beast Mabeasts', era: 'Twin Maids Trial', date: 'Month 1 in Lugnica' },
      { id: 'arc3', label: 'Arc 3: White Whale & Sloth Archbishop Petelgeuse', era: 'Crusch Camp Alliance', date: 'Month 3 in Lugnica' },
      { id: 'arc4', label: 'Arc 4: Sanctuary of the Witch of Greed', era: 'Echidna\'s Tomb & Great Rabbit Trial', date: 'Autumn of Lugnica' }
    ],
    knownNPCs: [
      { name: 'Emilia', relation: 'Half-Elf Royal Candidate', status: 'Calling forth lesser spirits' },
      { name: 'Rem', relation: 'Demon Maid of Roswaal', status: 'Readying morning star' },
      { name: 'Reinhard van Astrea', relation: 'Sword Saint of the Divine Dragon', status: 'Surveying the capital gates' }
    ]
  },
  {
    id: 'bleach',
    universe: 'Bleach: Thousand-Year Blood War',
    title: 'Bleach: Soul Society Blood War',
    synopsis: 'The spiritual realm of the Soul Society, governed by Shinigami using Zanpakuto spirit blades. The millennial war reignites as the Quincy Wandenreich led by Emperor Yhwach invades the Seireitei to extinguish the Soul King.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: First Wandenreich Incursion', era: 'Fall of the Seireitei', date: 'Third Day of the Quincy Incursion' },
      { id: 'arc2', label: 'Arc 2: Royal Guard & Soul King Palace', era: 'Zero Division Ascension', date: 'Day of the Final Getsuga' },
      { id: 'arc3', label: 'Arc 3: Warwelt Citadel Climax', era: 'Schutzstaffel vs Gotei 13', date: 'The Auswahlen Rebirth' },
      { id: 'arc4', label: 'Arc 4: Fake Karakura Town (Espada War)', era: 'Aizen\'s Hogyoku Transcendence', date: 'Winter of the Arrancar' }
    ],
    knownNPCs: [
      { name: 'Ichigo Kurosaki', relation: 'Substitute Shinigami / Key Ally', status: 'Descending with dual Zangetsu' },
      { name: 'Sosuke Aizen', relation: 'Bound Mastermind in Muken', status: 'Smirking from his spiritual seal' },
      { name: 'Yhwach', relation: 'Father of Quincies / Emperor', status: 'Assaulting the Royal Realm' }
    ]
  },
  {
    id: 'fate',
    universe: 'Fate / Stay Night & Grand Order',
    title: 'Fate: The Holy Grail War',
    synopsis: 'A secret war where modern magi summon legendary historical, mythological, and heroic figures across seven servant classes to clash with Noble Phantasms for the omnipotent Holy Grail.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Fifth Fuyuki Holy Grail War', era: 'Unlimited Blade Works / Heaven\'s Feel', date: 'February 2004' },
      { id: 'arc2', label: 'Arc 2: Fourth Holy Grail War (Fate/Zero)', era: 'Kiritsugu & Kotomine Clashes', date: 'Autumn 1994' },
      { id: 'arc3', label: 'Arc 3: Babylonia Singularity', era: 'Age of the Gods - Demonic Beast Front', date: 'BC 2600 Mesopotamia' },
      { id: 'arc4', label: 'Arc 4: Lostbelt 6: Avalon le Fae', era: 'Fae Kingdom of Britain', date: 'Lost Depth EX' }
    ],
    knownNPCs: [
      { name: 'Saber (Artoria)', relation: 'King of Knights', status: 'Guarding with Excalibur' },
      { name: 'Gilgamesh', relation: 'King of Heroes', status: 'Summoning Gate of Babylon' },
      { name: 'Rin Tohsaka', relation: 'Top Magus Ally', status: 'Casting jewel spells' }
    ]
  },
  {
    id: 'cyberpunk',
    universe: 'Cyberpunk: Edgerunners / 2077',
    title: 'Cyberpunk: Night City Overdrive',
    synopsis: 'A ruthless corporate dystopia dominated by megacorporations Arasaka and Militech. Mercenaries augment their bodies with chrome cyberware, Sandevistans, and neural links, risking cyberpsychosis to become legends.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Night City 2076 (Edgerunners)', era: 'David & Lucy Crew Hegemony', date: 'Late 2076' },
      { id: 'arc2', label: 'Arc 2: Arasaka Tower Assault', era: 'Cyberskeleton Rampage', date: 'December 2076' },
      { id: 'arc3', label: 'Arc 3: 2077 Relic Biochip Crisis', era: 'Johnny Silverhand & V Era', date: 'Year 2077' },
      { id: 'arc4', label: 'Arc 4: Dogtown Phantom Liberty', era: 'Blackwall Incursions', date: 'Late 2077' }
    ],
    knownNPCs: [
      { name: 'Lucy', relation: 'Elite Netrunner', status: 'Jacked into Arasaka sub-grid' },
      { name: 'David Martinez', relation: 'Edgerunner Crew Leader', status: 'Readying his chrome' },
      { name: 'Rebecca', relation: 'Heavy Weapons Specialist', status: 'Grinning with her shotgun' }
    ]
  },
  {
    id: 'attack_on_titan',
    universe: 'Attack on Titan (Shingeki no Kyojin)',
    title: 'Attack on Titan: The Wall Bastions',
    synopsis: 'Humanity lives enclosed within three concentric walls to protect against man-eating Titans. When the Colossal Titan shatters the outer wall, the Survey Corps using ODM gear uncovers the geopolitical truth of Eldia and Marley.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Fall of Shiganshina & Trost Defense', era: 'Cadet Corps Graduation', date: 'Year 850' },
      { id: 'arc2', label: 'Arc 2: Female Titan & Wall Rose Incursion', era: 'Survey Corps Expedition Beyond the Walls', date: 'Year 850' },
      { id: 'arc3', label: 'Arc 3: Return to Shiganshina', era: 'Battle to Reclaim Wall Maria', date: 'Year 850' },
      { id: 'arc4', label: 'Arc 4: The Rumbling & War for Paradis', era: 'Founding Titan Awakening', date: 'Year 854' }
    ],
    knownNPCs: [
      { name: 'Eren Yeager', relation: 'Attack Titan Vanguard', status: 'Eyes blazing with resolve' },
      { name: 'Levi Ackerman', relation: 'Humanity\'s Strongest Soldier', status: 'Spinning blades through the smoke' },
      { name: 'Mikasa Ackerman', relation: 'Elite Scout Protector', status: 'Watching Eren\'s flank' }
    ]
  },
  {
    id: 'demon_slayer',
    universe: 'Demon Slayer (Kimetsu no Yaiba)',
    title: 'Demon Slayer: Taisho Blade Chronicles',
    synopsis: 'Taisho-era Japan where demons created by Muzan Kibutsuji lurk in the night. The Demon Slayer Corps wield Nichirin katanas and Total Concentration Breathing to vanquish demons and avenge their fallen.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Final Selection & Mount Natagumo', era: 'Water Breathing Awakening', date: 'Taisho Year 2' },
      { id: 'arc2', label: 'Arc 2: Mugen Train & Flame Hashira', era: 'Upper Rank 3 Clash', date: 'Taisho Year 3' },
      { id: 'arc3', label: 'Arc 3: Entertainment District Incursion', era: 'Sound Hashira vs Upper Rank 6', date: 'Taisho Year 3' },
      { id: 'arc4', label: 'Arc 4: Infinity Castle Final Battle', era: 'Total War against Muzan Kibutsuji', date: 'Taisho Year 4' }
    ],
    knownNPCs: [
      { name: 'Tanjiro Kamado', relation: 'Sun Breathing Swordsman', status: 'Holding his black Nichirin blade' },
      { name: 'Nezuko Kamado', relation: 'Awakened Demon Maiden', status: 'Guarding her brother' },
      { name: 'Kyojuro Rengoku', relation: 'Flame Hashira', status: 'Radiating unyielding warmth' }
    ]
  },
  {
    id: 'hunter_x_hunter',
    universe: 'Hunter x Hunter',
    title: 'Hunter x Hunter: Nen Mastery',
    synopsis: 'A vast world of danger, ancient treasures, and unmapped territory. Elite Hunters wield Nen—the manipulation of life aura across six categories (Enhancer, Transmuter, Conjurer, Emitter, Manipulator, Specialist).',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Hunter Exam & Heavens Arena', era: 'First Nen Awakening', date: 'Hunter Exam Year 287' },
      { id: 'arc2', label: 'Arc 2: Yorknew City & Phantom Troupe', era: 'Southern Underground Auction', date: 'September 1999' },
      { id: 'arc3', label: 'Arc 3: Greed Island Game', era: 'Card Spellcraft & Training', date: 'Year 2000' },
      { id: 'arc4', label: 'Arc 4: Chimera Ant Crisis', era: 'NGL & Royal Palace Assault', date: 'Year 2001' }
    ],
    knownNPCs: [
      { name: 'Killua Zoldyck', relation: 'Lightning Transmuter Ally', status: 'Gathering electrical aura' },
      { name: 'Kurapika', relation: 'Chain Specialist Hunter', status: 'Eyes turning scarlet' },
      { name: 'Hisoka Morow', relation: 'Enigmatic Magician', status: 'Shuffling playing cards' }
    ]
  },
  {
    id: 'naruto',
    universe: 'Naruto Shippuden',
    title: 'Naruto: Shinobi World War',
    synopsis: 'The Hidden Leaf Village and the Five Great Shinobi Nations where ninja manipulate chakra to execute Ninjutsu, Genjutsu, and Taijutsu. Hidden organizations like the Akatsuki seek the Tailed Beasts to cast Infinite Tsukuyomi.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Chunin Exam & Konoha Crush', era: 'First Leaf Incursion', date: 'Age 12 Era' },
      { id: 'arc2', label: 'Arc 2: Akatsuki Suppression & Pain\'s Assault', era: 'Devastation of the Leaf', date: 'Post-Sage Training' },
      { id: 'arc3', label: 'Arc 3: Five Kage Summit', era: 'Declaration of Fourth World War', date: 'Land of Iron' },
      { id: 'arc4', label: 'Arc 4: Fourth Great Ninja War', era: 'Ten-Tails & Madara Uchiha Clashes', date: 'Fourth Shinobi War' }
    ],
    knownNPCs: [
      { name: 'Kakashi Hatake', relation: 'Copy Ninja Mentor', status: 'Uncovering the Sharingan' },
      { name: 'Itachi Uchiha', relation: 'Legendary Shadow of the Leaf', status: 'Dispersing into crows' },
      { name: 'Sasuke Uchiha', relation: 'Avenger of the Uchiha', status: 'Coating Chidori in lightning' }
    ]
  },
  {
    id: 'one_piece',
    universe: 'One Piece',
    title: 'One Piece: The Grand Line Seas',
    synopsis: 'The golden age of pirates across the Grand Line and New World. Pirates consume supernatural Devil Fruits and train Armament, Observation, and Conqueror\'s Haki in pursuit of the ultimate treasure, the One Piece.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Alabasta & Enies Lobby', era: 'Grand Line Infiltration', date: 'Early Grand Line' },
      { id: 'arc2', label: 'Arc 2: Marineford Summit War', era: 'Paramount War of the Best', date: 'The Great Sea Divide' },
      { id: 'arc3', label: 'Arc 3: Dressrosa & Whole Cake Island', era: 'Yonko Fleet Incursions', date: 'New World Awakening' },
      { id: 'arc4', label: 'Arc 4: Wano Country & Onigashima Raid', era: 'Gear 5 Sun God Awakening', date: 'Dawn of the New Era' }
    ],
    knownNPCs: [
      { name: 'Monkey D. Luffy', relation: 'Straw Hat Captain', status: 'Grinning on the bow' },
      { name: 'Roronoa Zoro', relation: 'Three-Sword Style Master', status: 'Tying his dark bandanna' },
      { name: 'Trafalgar Law', relation: 'Heart Pirates Captain / Tactician', status: 'Expanding ROOM' }
    ]
  },
  {
    id: 'eminence_in_shadow',
    universe: 'The Eminence in Shadow (Kage no Jitsuryokusha)',
    title: 'Eminence in Shadow: Shadow Garden',
    synopsis: 'Cid Kagenou roleplays a shadow mastermind operating behind the scenes, unaware that his fabricated enemy—the Cult of Diablos—is entirely real. His elite Shadow Garden operatives revere him as Lord Shadow.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Royal Spellsword Academy', era: 'School Hijacking & Terrorist Assault', date: 'Year 1 Midgar Academy' },
      { id: 'arc2', label: 'Arc 2: Goddess Trial & Sanctuary', era: 'Lindwurm Ancient Trial', date: 'Sanctuary Infiltration' },
      { id: 'arc3', label: 'Arc 3: Lawless City & Blood Queen', era: 'Red Tower Vampire Awakening', date: 'Blood Moon Eve' },
      { id: 'arc4', label: 'Arc 4: Oriana Kingdom Black Rose', era: 'War for the Oriana Throne', date: 'Black Rose Crisis' }
    ],
    knownNPCs: [
      { name: 'Shadow (Cid)', relation: 'Lord of Shadow Garden', status: 'Whispering "I am Atomic"' },
      { name: 'Alpha', relation: 'First of the Seven Shadows', status: 'Orchestrating Shadow Garden' },
      { name: 'Delta', relation: 'Beastkin Berserker', status: 'Sniffing the air for prey' }
    ]
  },
  {
    id: 'overlord',
    universe: 'Overlord: The Great Tomb of Nazarick',
    title: 'Overlord: Sorcerer King Reign',
    synopsis: 'When the DMMO-RPG Yggdrasil shuts down, guild leader Momonga is transported with the Great Tomb of Nazarick and its fiercely loyal custom NPCs into an unknown fantasy world. He adopts the name Ainz Ooal Gown to conquer the new world.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Carne Village & Re-Estize Infiltration', era: 'The Adventurer Momon Era', date: 'Year 1 of Nazarick' },
      { id: 'arc2', label: 'Arc 2: Men in the Kingdom & Eight Fingers', era: 'Demon Invasion of the Capital', date: 'Year 2 of Nazarick' },
      { id: 'arc3', label: 'Arc 3: Katze Plains Massacre & Sorcerer Kingdom', era: 'Founding of the Sorcerer Kingdom', date: 'Year 3 of Nazarick' },
      { id: 'arc4', label: 'Arc 4: Holy Kingdom & Fall of Re-Estize', era: 'Annihilation Campaign', date: 'Year 4 of Nazarick' }
    ],
    knownNPCs: [
      { name: 'Ainz Ooal Gown', relation: 'Supreme Being / Sorcerer King', status: 'Casting super-tier magic' },
      { name: 'Albedo', relation: 'Overseer of the Guardians', status: 'Advising at his side' },
      { name: 'Shalltear Bloodfallen', relation: 'True Vampire Guardian', status: 'Armored with her cursed lance' }
    ]
  },
  {
    id: 'code_geass',
    universe: 'Code Geass: Lelouch of the Rebellion',
    title: 'Code Geass: The Black Knights',
    synopsis: 'An alternate Earth dominated by the Holy Britannian Empire which conquered Japan (Area 11). Exiled prince Lelouch vi Britannia obtains the Geass of Absolute Obedience and dons the mask of Zero to dismantle the empire.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Shinjuku Ghetto & Black Knights Founding', era: 'Zero\'s First Uprising', date: 'Year 2017 a.t.b.' },
      { id: 'arc2', label: 'Arc 2: Black Rebellion & Tokyo Settlement Assault', era: 'Collapse of the First Rebellion', date: 'Year 2017 a.t.b.' },
      { id: 'arc3', label: 'Arc 3: Second Tokyo Conclave & FLEIJA Bomb', era: 'R2 Imperial War', date: 'Year 2018 a.t.b.' },
      { id: 'arc4', label: 'Arc 4: Zero Requiem', era: 'The Emperor Lelouch Hegemony', date: 'Late 2018 a.t.b.' }
    ],
    knownNPCs: [
      { name: 'Zero (Lelouch)', relation: 'Supreme Commander of Black Knights', status: 'Activating Geass in his eye' },
      { name: 'C.C.', relation: 'Immortal Witch / Accomplice', status: 'Offering quiet counsel' },
      { name: 'Kallen Kouzuki', relation: 'Guren Ace Pilot', status: 'Priming the Radiation Wave arm' }
    ]
  },
  {
    id: 'fullmetal_alchemist',
    universe: 'Fullmetal Alchemist: Brotherhood',
    title: 'FMA: The Amestris State Alchemy',
    synopsis: 'A world governed by the scientific and metaphysical laws of Alchemy—Equivalent Exchange. State Alchemist brothers Edward and Alphonse Elric search for the Philosopher\'s Stone, uncovering a nationwide conspiracy engineered by "Father" and the Seven Homunculi.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: East City & Lab 5 Infiltration', era: 'Philosopher\'s Stone Search', date: 'Year 1914 Amestris' },
      { id: 'arc2', label: 'Arc 2: Briggs Mountain & Sloth Awakening', era: 'Northern Fortress of General Armstrong', date: 'Winter 1914' },
      { id: 'arc3', label: 'Arc 3: The Promised Day', era: 'Total Transmutation Circle Eclipse', date: 'The Eclipse of Central' },
      { id: 'arc4', label: 'Arc 4: Ishvalan Civil War Flashbacks', era: 'State Alchemist Deployment', date: 'Year 1908' }
    ],
    knownNPCs: [
      { name: 'Edward Elric', relation: 'Fullmetal Alchemist', status: 'Transmuting his automail arm' },
      { name: 'Roy Mustang', relation: 'Flame Alchemist', status: 'Snapping his spark glove' },
      { name: 'Riza Hawkeye', relation: 'Sniper & Loyal Lieutenant', status: 'Scoping the perimeter' }
    ]
  },
  {
    id: 'elden_ring',
    universe: 'Elden Ring: Lands Between',
    title: 'Elden Ring: The Shattering & Erdtree',
    synopsis: 'The Lands Between, ruled by Queen Marika the Eternal, plunged into war after the Elden Ring shattered into Great Runes held by demigod offspring. The Tarnished return guided by lost grace to claim the throne.',
    timelines: [
      { id: 'arc1', label: 'Arc 1: Limgrave & Stormveil Castle', era: 'Godrick the Grafted Dominion', date: 'Awakening of Grace' },
      { id: 'arc2', label: 'Arc 2: Raya Lucaria & Carian Academy', era: 'Ranni the Witch & Fate of the Stars', date: 'Night of the Full Moon' },
      { id: 'arc3', label: 'Arc 3: Leyndell Royal Capital & Mountaintops', era: 'Ertdtree Burning & Flame of Ruin', date: 'The Fire Giants' },
      { id: 'arc4', label: 'Arc 4: Shadow of the Erdtree (Realm of Shadow)', era: 'Messmer the Impaler Campaign', date: 'Shadow Scadutree Era' }
    ],
    knownNPCs: [
      { name: 'Ranni the Witch', relation: 'Lunar Princess', status: 'Gazing toward the dark moon' },
      { name: 'Melina', relation: 'Maiden of Kindling', status: 'Appearing beside the site of grace' },
      { name: 'Malenia', relation: 'Blade of Miquella', status: 'Unsheathing her prosthetic katana' }
    ]
  }
];

/**
 * Returns a randomized, shuffled sample of presets every time called.
 * This guarantees completely fresh popular canon worlds every time the window is opened!
 */
export function getShuffledPresets(count = 12) {
  const shuffled = [...WORLD_PRESETS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Creates dynamic template for any user-defined custom universe with full briefing
 */
export function generateCustomWorldTemplate({
  universeTitle,
  customEra,
  startingLocation,
  characterName,
  characterConcept,
  customScenario,
  startingNPCs = [],
}) {
  const cleanUniverse = universeTitle?.trim() || 'Custom Anime World';
  const cleanCharName = characterName?.trim() || 'Protagonist';

  const defaultNPCs = Array.isArray(startingNPCs) && startingNPCs.length > 0 ? startingNPCs : [];

  return {
    title: `${cleanUniverse}: Genesis Chronicle`,
    universe: cleanUniverse,
    synopsis: `The realm of ${cleanUniverse} is a distinctive fictional universe governed by its own laws of physics, magic, and conflict. Factions vie for dominion while legendary figures shape history across its eras.`,
    currentEra: customEra?.trim() || 'Prologue of the Sovereign Awakening',
    inGameDate: 'Day 1 of the Convergence',
    timeOfDay: 'Twilight Dusk',
    currentLocation: startingLocation?.trim() || `${cleanUniverse} Outskirts & Horizon Border`,
    weather: 'Electrified dusk atmosphere charged with exotic atmospheric energy',
    userProfile: {
      name: cleanCharName,
      physique: 'Distinctive silhouette, tailored combat apparel, focused observant eyes carrying the aura of a seasoned traveler',
      traits: characterConcept?.trim() || 'Tactical mind, sovereign calm under pressure, bound to the World Convergence Core',
      details: `Originating beyond the boundary to forge destiny within the world of ${cleanUniverse}.`
    },
    movesetKnowledge: `[Innate Powers of ${cleanCharName}]
- Dimensional Aegis: Manifests a barrier that absorbs and redirects hostile energy.
- Horizon Pierce: Concentrates mana/kinetic force into an instantaneous armor-shattering strike.
- Resonance Surge: Synchronizes with the core laws of ${cleanUniverse} to temporarily multiply combat stats.`,
    knownNPCs: defaultNPCs,
    openingScenario: customScenario?.trim() || `Materialize across the outer dimensional boundary of ${cleanUniverse} into ${startingLocation?.trim() || 'the horizon border'}.`
  };
}
