// ============================================================
// data.js — Drag Race Fantasy League Demo
//
// DATA MODEL (corrected):
//   SHOW_QUEENS   = the actual drag queens competing on the show
//                   (these are what players DRAFT onto their teams)
//   LEAGUE_PLAYERS = the human people playing the fantasy league
//                   (each picks 5 queens; their score = sum of queens' scores)
//
// Queen names + episode scores come directly from the real CSV.
// League player names/teams are placeholder until Leaderboard tab CSV is shared.
// ============================================================

var SCORING_RULES = {
  // Accumulating — can happen multiple times per queen per episode
  E: { points:  1, label: "Makes Ru laugh / Acrobatic / Winning bestie", emoji: "😂", accumulates: true  },
  C: { points:  2, label: "Wig snatch / Clothing reveal",                emoji: "💇‍♀️", accumulates: true  },
  // Once per episode per queen
  A: { points:  5, label: "Mini challenge — top queen",                  emoji: "✨", accumulates: false },
  B: { points:  3, label: "Safe / Lip sync winner",                      emoji: "💋", accumulates: false },
  D: { points: 10, label: "Maxi challenge winner",                       emoji: "🏆", accumulates: false },
  F: { points: -2, label: "Relying on body / Loses wig / Nip slip",      emoji: "😬", accumulates: false },
  G: { points: -1, label: "Feuding queens",                              emoji: "👊", accumulates: false },
  // Season-end bonuses (applied at finale)
  H: { points: 50, label: "You correctly picked the season winner!",     emoji: "👑", accumulates: false, seasonal: true },
  I: { points: 30, label: "Season winner is on your team",               emoji: "⭐", accumulates: false, seasonal: true },
  J: { points: 25, label: "Miss Congeniality is on your team",           emoji: "💝", accumulates: false, seasonal: true },
  K: { points: 20, label: "Your queen makes the finale",                 emoji: "🎭", accumulates: false, seasonal: true },
};

// ── Show Queens ─────────────────────────────────────────────
// Real names from "Episode Point Tally" CSV.
// episodeCodes: exactly as entered in the CSV cell.
// episodePoints: the calculated totals from the POINTS section.
// eliminated: inferred from where codes stop — admin can update in-app.
var SHOW_QUEENS = [
  {
    id: 1, name: "Athena Dion", color: "#FF6B9D", eliminated: false,
    episodeCodes:  { 1:"E,G,B",  2:"B",    3:"B",   4:"E,B,G", 5:"",        6:"D,B,E,E",       7:"B,E",         8:"B,E,E,E"                },
    episodePoints: { 1:3,        2:3,      3:3,     4:3,       5:0,         6:15,              7:4,             8:6                        },
  },
  {
    id: 2, name: "Briar Blush", color: "#A78BFA", eliminated: true, eliminatedEp: 4,
    episodeCodes:  { 1:"G,B",    2:"B",    3:"B",   4:"G",     5:"",        6:"",              7:"",            8:""                       },
    episodePoints: { 1:2,        2:3,      3:3,     4:-1,      5:0,         6:0,               7:0,             8:0                        },
  },
  {
    id: 3, name: "Ciara Myst", color: "#34D399", eliminated: true, eliminatedEp: 5,
    episodeCodes:  { 1:"E,B",    2:"B",    3:"B",   4:"A,E",   5:"C",       6:"",              7:"",            8:""                       },
    episodePoints: { 1:4,        2:3,      3:3,     4:6,       5:2,         6:0,               7:0,             8:0                        },
  },
  {
    id: 4, name: "Darlene Mitchell", color: "#FB923C", eliminated: false,
    episodeCodes:  { 1:"E,B",    2:"B",    3:"A",   4:"B",     5:"B,E,C",   6:"",              7:"A,E",         8:"B,E,E"                  },
    episodePoints: { 1:4,        2:3,      3:5,     4:3,       5:6,         6:0,               7:6,             8:5                        },
  },
  {
    id: 5, name: "DD Fuego", color: "#F87171", eliminated: true, eliminatedEp: 1,
    episodeCodes:  { 1:"B",      2:"",     3:"",    4:"",      5:"",        6:"",              7:"",            8:""                       },
    episodePoints: { 1:3,        2:0,      3:0,     4:0,       5:0,         6:0,               7:0,             8:0                        },
  },
  {
    id: 6, name: "Discord Addams", color: "#818CF8", eliminated: false,
    episodeCodes:  { 1:"B",      2:"B",    3:"B",   4:"B",     5:"",        6:"B,E",           7:"B",           8:"B,E,E,E,E,E"            },
    episodePoints: { 1:3,        2:3,      3:3,     4:3,       5:0,         6:4,               7:3,             8:8                        },
  },
  {
    id: 7, name: "Jane Don't", color: "#FBBF24", eliminated: false,
    episodeCodes:  { 1:"E,B",    2:"E,E,D",3:"A",   4:"A,E",   5:"",        6:"A,E",           7:"A,E",         8:"A,E,E,E,E"              },
    episodePoints: { 1:4,        2:12,     3:5,     4:6,       5:0,         6:6,               7:6,             8:9                        },
  },
  {
    id: 8, name: "Juicy Love Dion", color: "#F472B6", eliminated: false,
    episodeCodes:  { 1:"E,B",    2:"E,E,B",3:"D",   4:"E,B",   5:"D,E,E,E,E,E,B", 6:"",      7:"B,E,E,E,E",   8:"B,E"                    },
    episodePoints: { 1:4,        2:5,      3:10,    4:4,       5:18,        6:0,               7:7,             8:4                        },
  },
  {
    id: 9, name: "Kenya Pleaser", color: "#2DD4BF", eliminated: false,
    episodeCodes:  { 1:"E,A,E",  2:"E,B",  3:"B,E", 4:"B,E",   5:"",        6:"B,E",           7:"B,E",         8:"B,E"                    },
    episodePoints: { 1:7,        2:4,      3:4,     4:4,       5:0,         6:4,               7:4,             8:4                        },
  },
  {
    id: 10, name: "Mandy Mango", color: "#FCD34D", eliminated: true, eliminatedEp: 2,
    episodeCodes:  { 1:"",       2:"B",    3:"",    4:"",      5:"",        6:"",              7:"",            8:""                       },
    episodePoints: { 1:0,        2:3,      3:0,     4:0,       5:0,         6:0,               7:0,             8:0                        },
  },
  {
    id: 11, name: "Mia Starr", color: "#60A5FA", eliminated: false,
    episodeCodes:  { 1:"E,B",    2:"E,A",  3:"B",   4:"B,G",   5:"D,C,B",   6:"",              7:"B",           8:"E"                      },
    episodePoints: { 1:4,        2:6,      3:3,     4:2,       5:15,        6:0,               7:3,             8:1                        },
  },
  {
    id: 12, name: "Myki Meeks", color: "#C084FC", eliminated: false,
    episodeCodes:  { 1:"E,B",    2:"B",    3:"B",   4:"B",     5:"",        6:"B,E,E",         7:"D,E",         8:"A,E,E,E,E,E,E,E,E"      },
    episodePoints: { 1:4,        2:3,      3:3,     4:3,       5:0,         6:5,               7:11,            8:13                       },
  },
  {
    id: 13, name: "Nini Coco", color: "#4ADE80", eliminated: false,
    episodeCodes:  { 1:"D,B",    2:"B",    3:"B",   4:"E,B",   5:"B,E,E",   6:"",              7:"B,E",         8:"D,E,E,E,E,E"            },
    episodePoints: { 1:13,       2:3,      3:3,     4:4,       5:5,         6:0,               7:4,             8:15                       },
  },
  {
    id: 14, name: "Vita VonTesse Starr", color: "#F9A8D4", eliminated: true, eliminatedEp: 5,
    episodeCodes:  { 1:"A,E",    2:"B",    3:"B",   4:"D,E",   5:"B",       6:"",              7:"",            8:""                       },
    episodePoints: { 1:6,        2:3,      3:3,     4:11,      5:3,         6:0,               7:0,             8:0                        },
  },
];

// ── League Players ────────────────────────────────────────────
// Real names + teams from the "Weekly Tribe Points" sheet of the xlsx.
// team: array of 5 queen IDs (X marks in spreadsheet)
// pickedWinner: queen ID they nominated as season winner (Y mark), null if none
var LEAGUE_PLAYERS = [
  { id: 1,  name: "Mary Grace", team: [7, 8, 9, 12, 13], pickedWinner: null },
  { id: 2,  name: "Jordan",     team: [4, 8, 12, 13, 14], pickedWinner: 7   },
  { id: 3,  name: "Evan",       team: [4, 8, 12, 13, 14], pickedWinner: 7   },
  { id: 4,  name: "Jill",       team: [1, 6, 7, 8, 11],   pickedWinner: null },
  { id: 5,  name: "Matthew",    team: [1, 4, 7, 9, 13],   pickedWinner: null },
  { id: 6,  name: "Meredith",   team: [3, 7, 8, 9, 12],   pickedWinner: null },
  { id: 7,  name: "Mikayla",    team: [4, 5, 8, 12, 13],  pickedWinner: 7   },
  { id: 8,  name: "Mere",       team: [1, 7, 9, 11, 14],  pickedWinner: 8   },
  { id: 9,  name: "Emilee",     team: [1, 3, 11, 12, 13], pickedWinner: null },
  { id: 10, name: "Marci",      team: [7, 8, 9, 10, 12],  pickedWinner: 11  },
  { id: 11, name: "Gaetan",     team: [1, 5, 8, 9, 13],   pickedWinner: null },
  { id: 12, name: "Andi",       team: [1, 10, 12, 13, 14], pickedWinner: 7  },
  { id: 13, name: "Emma",       team: [3, 4, 9, 13, 14],  pickedWinner: 7   },
  { id: 14, name: "Frankie",    team: [3, 8, 9, 10, 13],  pickedWinner: 4   },
  { id: 15, name: "Cabell",     team: [5, 8, 10, 11, 13], pickedWinner: 7   },
  { id: 16, name: "Ellie",      team: [1, 5, 7, 11, 14],  pickedWinner: null },
  { id: 17, name: "Britt",      team: [2, 3, 7, 9, 12],   pickedWinner: null },
  { id: 18, name: "Nadine",     team: [2, 6, 7, 9, 14],   pickedWinner: null },
  { id: 19, name: "Haley",      team: [1, 3, 9, 10, 12],  pickedWinner: null },
  { id: 20, name: "Jeri",       team: [3, 5, 9, 10, 13],  pickedWinner: null },
];

// ── Season Config ────────────────────────────────────────────
var SEASON_CONFIG = {
  name:          "RuPaul's Drag Race",
  shortName:     "RPDR",
  totalEpisodes: 16,
  airedEpisodes: 8,
  teamsLocked:   true,    // locked once Ep 1 airs
  potPerPlayer:  20,      // $20 buy-in
  potSplit:      { first: 0.60, second: 0.25, third: 0.15 },
  seasonWinner:  null,    // set at finale (queen ID)
  missCongen:    null,    // set at finale (queen ID)
  get totalPot() { return LEAGUE_PLAYERS.length * this.potPerPlayer; },
};

// ── Episode Summaries ─────────────────────────────────────────
var EPISODES = [
  { number:1,  title:"Episode 1",  aired:true,  summary:"Nini Coco dominates with a Maxi win (D+B = 13 pts). Kenya Pleaser scores big with E+A+E." },
  { number:2,  title:"Episode 2",  aired:true,  summary:"Jane Don't sweeps with E+E+D (12 pts). Mia Starr wins Mini with E+A." },
  { number:3,  title:"Episode 3",  aired:true,  summary:"Juicy Love Dion wins the Maxi (D = 10 pts). Darlene Mitchell wins Mini (A = 5 pts)." },
  { number:4,  title:"Episode 4",  aired:true,  summary:"Vita VonTesse Starr scores D+E (11 pts). Several G penalties for feuding queens." },
  { number:5,  title:"Episode 5",  aired:true,  summary:"Juicy Love Dion EXPLODES — D + 5×E + B = 18 pts! Mia Starr also scores big with D+C+B." },
  { number:6,  title:"Episode 6",  aired:true,  summary:"Athena Dion rebounds with D+B+E+E (15 pts). Steady episode across the remaining queens." },
  { number:7,  title:"Episode 7",  aired:true,  summary:"Myki Meeks scores D+E (11 pts). Jane Don't and Darlene Mitchell both earn A+E." },
  { number:8,  title:"Episode 8",  aired:true,  summary:"Nini Coco explodes with D+5×E (15 pts)! Myki Meeks also massive — A+8×E (13 pts)." },
  { number:9,  title:"Episode 9",  aired:false, summary:null },
  { number:10, title:"Episode 10", aired:false, summary:null },
  { number:11, title:"Episode 11", aired:false, summary:null },
  { number:12, title:"Episode 12", aired:false, summary:null },
  { number:13, title:"Episode 13", aired:false, summary:null },
  { number:14, title:"Episode 14", aired:false, summary:null },
  { number:15, title:"Episode 15", aired:false, summary:null },
  { number:16, title:"FINALE",     aired:false, summary:null },
];
