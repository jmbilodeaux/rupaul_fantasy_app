// ============================================================
// data.js — Mock data for Drag Race Fantasy League Demo
// All episode scores and codes sourced from the real CSV.
// Show queens and team assignments are fictional demo data.
// ============================================================

const SCORING_RULES = {
  A: { points:  5,  label: "Mini challenge — top queen",                    emoji: "✨" },
  B: { points:  3,  label: "Safe / Lip sync winner",                        emoji: "💋" },
  C: { points:  2,  label: "Wig snatch / Clothing reveal",                  emoji: "💇‍♀️" },
  D: { points: 10,  label: "Maxi challenge winner",                         emoji: "🏆" },
  E: { points:  1,  label: "Makes Ru laugh / Acrobatic / Winning bestie",   emoji: "😂" },
  F: { points: -2,  label: "Relying on body / Loses wig / Nip slip",        emoji: "😬" },
  G: { points: -1,  label: "Feuding queens",                                emoji: "👊" },
  H: { points: 50,  label: "You correctly picked the season winner!",       emoji: "👑" },
  I: { points: 30,  label: "Season winner is on your team",                 emoji: "⭐" },
  J: { points: 25,  label: "Miss Congeniality on your team",                emoji: "💝" },
  K: { points: 20,  label: "Your queen makes the finale",                   emoji: "🎭" },
};

// The actual drag queens competing on the show (fictional names for demo)
const SHOW_QUEENS = [
  { id:  1, name: "Alexis Malone",     color: "#FF6B9D", eliminated: false },
  { id:  2, name: "Bombé LaRue",       color: "#C77DFF", eliminated: true,  eliminatedEp: 2 },
  { id:  3, name: "Crystal Vega",      color: "#00D4FF", eliminated: false },
  { id:  4, name: "Destiny Darling",   color: "#FFB347", eliminated: true,  eliminatedEp: 4 },
  { id:  5, name: "Elektra Storm",     color: "#FF4D6D", eliminated: false },
  { id:  6, name: "Fantasia Belle",    color: "#80B918", eliminated: true,  eliminatedEp: 1 },
  { id:  7, name: "Gloria Swansong",   color: "#FFD60A", eliminated: false },
  { id:  8, name: "Honey Badger",      color: "#FB8500", eliminated: true,  eliminatedEp: 5 },
  { id:  9, name: "Iris Eleganza",     color: "#B5179E", eliminated: false },
  { id: 10, name: "Jade Phoenix",      color: "#4CC9F0", eliminated: false },
  { id: 11, name: "Karma Chameleon",   color: "#52B788", eliminated: true,  eliminatedEp: 3 },
  { id: 12, name: "Luna Tique",        color: "#E63946", eliminated: false },
];

// Fantasy league players — names from real CSV, teams/winners are demo mock data
const FANTASY_PLAYERS = [
  {
    id: 1, name: "Athena Dion", avatar: "🌙",
    team: [1, 3, 7, 9, 12], pickedWinner: 7,
    episodeScores: { 1:3,  2:3,  3:3,  4:3,  5:0,  6:15, 7:4,  8:6  },
    episodeCodes:  { 1:"E,G,B", 2:"B", 3:"B", 4:"E,B,G", 5:"", 6:"D,B,E,E", 7:"B,E", 8:"B,E,E,E" },
  },
  {
    id: 2, name: "Briar Blush", avatar: "🌹",
    team: [2, 5, 8, 10, 11], pickedWinner: 10,
    episodeScores: { 1:2,  2:3,  3:3,  4:-1, 5:0,  6:0,  7:0,  8:0  },
    episodeCodes:  { 1:"G,B", 2:"B", 3:"B", 4:"G", 5:"", 6:"", 7:"", 8:"" },
  },
  {
    id: 3, name: "Ciara Myst", avatar: "💫",
    team: [1, 3, 6, 9, 11], pickedWinner: 3,
    episodeScores: { 1:4,  2:3,  3:3,  4:6,  5:2,  6:0,  7:0,  8:0  },
    episodeCodes:  { 1:"E,B", 2:"B", 3:"B", 4:"A,E", 5:"C", 6:"", 7:"", 8:"" },
  },
  {
    id: 4, name: "Darlene Mitchell", avatar: "🌺",
    team: [1, 5, 7, 9, 12], pickedWinner: 9,
    episodeScores: { 1:4,  2:3,  3:5,  4:3,  5:6,  6:0,  7:6,  8:5  },
    episodeCodes:  { 1:"E,B", 2:"B", 3:"A", 4:"B", 5:"B,E,C", 6:"", 7:"A,E", 8:"B,E,E" },
  },
  {
    id: 5, name: "DD Fuego", avatar: "🔥",
    team: [4, 6, 8, 10, 11], pickedWinner: 4,
    episodeScores: { 1:3,  2:0,  3:0,  4:0,  5:0,  6:0,  7:0,  8:0  },
    episodeCodes:  { 1:"B", 2:"", 3:"", 4:"", 5:"", 6:"", 7:"", 8:"" },
  },
  {
    id: 6, name: "Discord Addams", avatar: "🕷️",
    team: [2, 4, 7, 10, 12], pickedWinner: 12,
    episodeScores: { 1:3,  2:3,  3:3,  4:3,  5:0,  6:4,  7:3,  8:8  },
    episodeCodes:  { 1:"B", 2:"B", 3:"B", 4:"B", 5:"", 6:"B,E", 7:"B", 8:"B,E,E,E,E,E" },
  },
  {
    id: 7, name: "Jane Don't", avatar: "⚡",
    team: [1, 3, 5, 7, 9], pickedWinner: 5,
    episodeScores: { 1:4,  2:12, 3:5,  4:6,  5:0,  6:6,  7:6,  8:9  },
    episodeCodes:  { 1:"E,B", 2:"E,E,D", 3:"A", 4:"A,E", 5:"", 6:"A,E", 7:"A,E", 8:"A,E,E,E,E" },
  },
  {
    id: 8, name: "Juicy Love Dion", avatar: "🍊",
    team: [3, 5, 7, 9, 12], pickedWinner: 7,
    episodeScores: { 1:4,  2:5,  3:10, 4:4,  5:18, 6:0,  7:7,  8:4  },
    episodeCodes:  { 1:"E,B", 2:"E,E,B", 3:"D", 4:"E,B", 5:"D,E,E,E,E,E,B", 6:"", 7:"B,E,E,E,E", 8:"B,E" },
  },
  {
    id: 9, name: "Kenya Pleaser", avatar: "💅",
    team: [1, 5, 9, 10, 12], pickedWinner: 1,
    episodeScores: { 1:7,  2:4,  3:4,  4:4,  5:0,  6:4,  7:4,  8:4  },
    episodeCodes:  { 1:"E,A,E", 2:"E,B", 3:"B,E", 4:"B,E", 5:"", 6:"B,E", 7:"B,E", 8:"B,E" },
  },
  {
    id: 10, name: "Mandy Mango", avatar: "🥭",
    team: [2, 6, 8, 11, 12], pickedWinner: 12,
    episodeScores: { 1:0,  2:3,  3:0,  4:0,  5:0,  6:0,  7:0,  8:0  },
    episodeCodes:  { 1:"", 2:"B", 3:"", 4:"", 5:"", 6:"", 7:"", 8:"" },
  },
  {
    id: 11, name: "Mia Starr", avatar: "⭐",
    team: [1, 3, 8, 9, 10], pickedWinner: 3,
    episodeScores: { 1:4,  2:6,  3:3,  4:2,  5:15, 6:0,  7:3,  8:1  },
    episodeCodes:  { 1:"E,B", 2:"E,A", 3:"B", 4:"B,G", 5:"D,C,B", 6:"", 7:"B", 8:"E" },
  },
  {
    id: 12, name: "Myki Meeks", avatar: "🎭",
    team: [1, 5, 7, 10, 12], pickedWinner: 5,
    episodeScores: { 1:4,  2:3,  3:3,  4:3,  5:0,  6:5,  7:11, 8:13 },
    episodeCodes:  { 1:"E,B", 2:"B", 3:"B", 4:"B", 5:"", 6:"B,E,E", 7:"D,E", 8:"A,E,E,E,E,E,E,E,E" },
  },
  {
    id: 13, name: "Nini Coco", avatar: "🌴",
    team: [3, 5, 7, 9, 12], pickedWinner: 9,
    episodeScores: { 1:13, 2:3,  3:3,  4:4,  5:5,  6:0,  7:4,  8:15 },
    episodeCodes:  { 1:"D,B", 2:"B", 3:"B", 4:"E,B", 5:"B,E,E", 6:"", 7:"B,E", 8:"D,E,E,E,E,E" },
  },
  {
    id: 14, name: "Vita VonTesse Starr", avatar: "✨",
    team: [1, 3, 7, 9, 10], pickedWinner: 7,
    episodeScores: { 1:6,  2:3,  3:3,  4:11, 5:3,  6:0,  7:0,  8:0  },
    episodeCodes:  { 1:"A,E", 2:"B", 3:"B", 4:"D,E", 5:"B", 6:"", 7:"", 8:"" },
  },
];

const SEASON_CONFIG = {
  name:           "RuPaul's Drag Race Season 17",
  shortName:      "RPDR S17",
  totalEpisodes:  16,
  airedEpisodes:  8,
  teamsLocked:    true,
  potPerPlayer:   10,
  potSplit:       { first: 0.60, second: 0.25, third: 0.15 },
  get totalPot()  { return FANTASY_PLAYERS.length * this.potPerPlayer; },
};

const EPISODES = [
  { number:1,  title:"Reading is Fundamental",    aired:true,  summary:"Nini Coco dominates with D+B (13 pts). Kenya Pleaser goes mini-maxi with E+A+E." },
  { number:2,  title:"Queens of Queens",           aired:true,  summary:"Jane Don't sweeps with E+E+D (12 pts). Mia Starr scores mini win A+E." },
  { number:3,  title:"Drag Your Boots",            aired:true,  summary:"Juicy Love Dion wins the maxi (D = 10 pts). Multiple players score mini wins." },
  { number:4,  title:"Best Besties",               aired:true,  summary:"Vita VonTesse Starr scores D+E (11 pts). Several G penalties for feuding." },
  { number:5,  title:"Lip Sync for Life",          aired:true,  summary:"Juicy Love Dion EXPLODES — D+5×E+B = 18 pts! Mia Starr also scores D+C+B." },
  { number:6,  title:"Werk Room Confessionals",    aired:true,  summary:"Athena Dion rebounds with D+B+E+E (15 pts). Steady episode across the board." },
  { number:7,  title:"Snatch Game",                aired:true,  summary:"Myki Meeks scores D+E (11 pts). Jane Don't and Darlene both earn A+E." },
  { number:8,  title:"Everybody Dance Now",        aired:true,  summary:"Nini Coco explodes with D+5×E (15 pts)! Myki Meeks also massive — A+8×E (13 pts)." },
  { number:9,  title:"Episode 9",                  aired:false, summary:null },
  { number:10, title:"Episode 10",                 aired:false, summary:null },
  { number:11, title:"Episode 11",                 aired:false, summary:null },
  { number:12, title:"Episode 12",                 aired:false, summary:null },
  { number:13, title:"Episode 13",                 aired:false, summary:null },
  { number:14, title:"Episode 14",                 aired:false, summary:null },
  { number:15, title:"Episode 15",                 aired:false, summary:null },
  { number:16, title:"FINALE",                     aired:false, summary:null },
];
