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

const SCORING_RULES = {
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
const SHOW_QUEENS = [
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
// PLACEHOLDER names — will be replaced once Leaderboard tab CSV is shared.
// Each player picks 5 queens (by queen ID) and nominates one as their winner pick.
// Their leaderboard score = sum of all 5 queens' episode points.
const LEAGUE_PLAYERS = [
  { id:1,  name:"Player 1 ⚠️",  avatar:"🌟", team:[8,7,13,12,9],  pickedWinner:8  },
  { id:2,  name:"Player 2 ⚠️",  avatar:"💫", team:[7,9,13,1,4],   pickedWinner:13 },
  { id:3,  name:"Player 3 ⚠️",  avatar:"✨", team:[8,13,12,7,6],  pickedWinner:7  },
  { id:4,  name:"Player 4 ⚠️",  avatar:"🔥", team:[9,7,1,11,4],   pickedWinner:9  },
  { id:5,  name:"Player 5 ⚠️",  avatar:"🌙", team:[13,8,12,7,6],  pickedWinner:13 },
  { id:6,  name:"Player 6 ⚠️",  avatar:"💎", team:[7,8,13,1,11],  pickedWinner:8  },
  { id:7,  name:"Player 7 ⚠️",  avatar:"🎭", team:[12,9,13,8,7],  pickedWinner:12 },
  { id:8,  name:"Player 8 ⚠️",  avatar:"👑", team:[8,13,7,9,1],   pickedWinner:7  },
  { id:9,  name:"Player 9 ⚠️",  avatar:"🌺", team:[13,12,8,7,4],  pickedWinner:13 },
  { id:10, name:"Player 10 ⚠️", avatar:"🦋", team:[7,9,8,1,6],   pickedWinner:9  },
  { id:11, name:"Player 11 ⚠️", avatar:"🌸", team:[13,8,9,12,11], pickedWinner:8  },
  { id:12, name:"Player 12 ⚠️", avatar:"⚡", team:[8,7,12,13,4],  pickedWinner:8  },
  { id:13, name:"Player 13 ⚠️", avatar:"🎪", team:[9,13,7,1,11],  pickedWinner:13 },
  { id:14, name:"Player 14 ⚠️", avatar:"🌈", team:[12,8,7,9,13],  pickedWinner:7  },
  { id:15, name:"Player 15 ⚠️", avatar:"🦄", team:[7,13,8,12,6],  pickedWinner:13 },
  { id:16, name:"Player 16 ⚠️", avatar:"🐉", team:[8,9,13,7,11],  pickedWinner:8  },
  { id:17, name:"Player 17 ⚠️", avatar:"🌊", team:[13,7,9,12,1],  pickedWinner:13 },
  { id:18, name:"Player 18 ⚠️", avatar:"🎵", team:[8,13,12,7,4],  pickedWinner:12 },
  { id:19, name:"Player 19 ⚠️", avatar:"🍀", team:[7,9,13,8,6],   pickedWinner:7  },
  { id:20, name:"Player 20 ⚠️", avatar:"🌻", team:[13,8,7,9,12],  pickedWinner:9  },
];

// ── Season Config ────────────────────────────────────────────
const SEASON_CONFIG = {
  name:          "RuPaul's Drag Race",
  shortName:     "RPDR",
  totalEpisodes: 16,
  airedEpisodes: 8,
  teamsLocked:   true,    // locked once Ep 1 airs
  potPerPlayer:  20,      // $20 buy-in
  potSplit:      { first: 0.60, second: 0.25, third: 0.15 },
  get totalPot() { return LEAGUE_PLAYERS.length * this.potPerPlayer; },
};

// ── Episode Summaries ─────────────────────────────────────────
const EPISODES = [
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
