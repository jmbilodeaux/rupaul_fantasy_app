// supabase-client.js — Supabase data layer + auth for the Drag Race Fantasy PWA
// Loaded after config.js and the Supabase CDN (window.supabase is available).

window.SB = (() => {
  let _sb = null;
  let _session = null;

  // ── Client ───────────────────────────────────────────────────
  function client() {
    if (!_sb && window.SUPABASE_CONFIG?.url && window.supabase) {
      _sb = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );
    }
    return _sb;
  }

  // ── Transform helpers ────────────────────────────────────────
  function buildScoringRules(dbRules) {
    const out = {};
    dbRules.forEach(r => {
      out[r.code] = { points: r.points, label: r.label, emoji: r.emoji,
                      accumulates: r.accumulates, seasonal: r.is_seasonal };
    });
    return out;
  }

  function buildShowQueens(dbQueens, eqScores, rulesMap) {
    return dbQueens.map(q => {
      const episodeCodes  = {};
      const episodePoints = {};
      eqScores.filter(s => s.queen_id === q.id).forEach(s => {
        episodeCodes[s.episode]  = s.codes.join(',');
        episodePoints[s.episode] = s.codes.reduce((sum, c) => sum + (rulesMap[c]?.points || 0), 0);
      });
      return {
        id: q.id, name: q.name, color: q.ui_color,
        eliminated: q.eliminated, eliminatedEp: q.eliminated_ep,
        episodeCodes, episodePoints,
      };
    });
  }

  function buildLeaguePlayers(dbPlayers, teamSubs) {
    const subMap = {};
    teamSubs.forEach(ts => { subMap[ts.player_id] = ts; });
    return dbPlayers
      .filter(p => subMap[p.id])
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map((p, i) => ({
        id: i + 1,
        _uuid: p.id,
        name: p.display_name,
        isAdmin: p.is_admin,
        team: subMap[p.id].queen_ids,
        pickedWinner: subMap[p.id].winner_pick,
      }));
  }

  function buildSeasonConfig(s) {
    return {
      name: s.name, shortName: s.short_name || 'RPDR',
      totalEpisodes: s.total_episodes, airedEpisodes: s.aired_episodes,
      teamsLocked: s.teams_locked, potPerPlayer: s.pot_per_player,
      potSplit: s.pot_split, seasonWinner: s.season_winner, missCongen: s.miss_congen,
      get totalPot() { return LEAGUE_PLAYERS.length * this.potPerPlayer; },
    };
  }

  function buildEpisodes(dbEps) {
    return dbEps.map(e => ({ number: e.number, title: e.title || `Episode ${e.number}`,
                              aired: e.aired, summary: e.summary }));
  }

  // ── Apply data to globals ────────────────────────────────────
  async function applyData() {
    const sb = client();
    if (!sb) return false;
    try {
      const [
        { data: season,    error: e1 },
        { data: queens,    error: e2 },
        { data: eqScores,  error: e3 },
        { data: players,   error: e4 },
        { data: teamSubs,  error: e5 },
        { data: episodes,  error: e6 },
        { data: rules,     error: e7 },
      ] = await Promise.all([
        sb.from('seasons').select('*').eq('id', 1).single(),
        sb.from('show_queens').select('*').eq('season_id', 1).order('sort_order'),
        sb.from('episode_queen_scores').select('*').eq('season_id', 1),
        sb.from('players').select('*'),
        sb.from('team_submissions').select('*').eq('season_id', 1),
        sb.from('episodes').select('*').eq('season_id', 1).order('number'),
        sb.from('scoring_rules').select('*'),
      ]);
      if (e1 || e2 || e3 || e4 || e5 || e6 || e7) {
        console.warn('[SB] Load errors:', { e1, e2, e3, e4, e5, e6, e7 });
        return false;
      }
      const rulesMap = buildScoringRules(rules);
      // Override the global vars (data.js uses var, not const)
      SCORING_RULES  = rulesMap;
      SHOW_QUEENS    = buildShowQueens(queens, eqScores, rulesMap);
      LEAGUE_PLAYERS = buildLeaguePlayers(players, teamSubs);
      SEASON_CONFIG  = buildSeasonConfig(season);
      EPISODES       = buildEpisodes(episodes);
      return true;
    } catch (err) {
      console.warn('[SB] Load failed — using static data', err);
      return false;
    }
  }

  // ── Realtime ─────────────────────────────────────────────────
  function setupRealtime(sb) {
    sb.channel('scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_episode_scores' },
        async () => {
          await applyData();
          if (typeof window.onSupabaseUpdate === 'function') window.onSupabaseUpdate();
        })
      .subscribe();
  }

  // ── Public API ───────────────────────────────────────────────
  async function init() {
    const sb = client();
    if (!sb) return false;

    // Process any pending auth callback (magic link redirect)
    const { data: { session } } = await sb.auth.getSession();
    _session = session;

    // Listen for future auth changes
    sb.auth.onAuthStateChange(async (_event, newSession) => {
      _session = newSession;
      await applyData();
      if (typeof window.onSupabaseUpdate === 'function') window.onSupabaseUpdate();
    });

    const ok = await applyData();
    if (ok) setupRealtime(sb);
    return ok;
  }

  async function refreshData() {
    return applyData();
  }

  function getSession() { return _session; }

  function getCurrentPlayer() {
    if (!_session) return null;
    return LEAGUE_PLAYERS.find(p => p._uuid === _session.user.id) || null;
  }

  async function signInWithEmail(email) {
    const sb = client();
    if (!sb) return { error: { message: 'Supabase not configured' } };
    return sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] },
    });
  }

  async function signOut() {
    const sb = client();
    if (!sb) return;
    _session = null;
    return sb.auth.signOut();
  }

  async function postEpisodeScores(episode, queensCodes) {
    if (!_session) return { error: 'Not authenticated' };
    const res = await fetch(
      `${window.SUPABASE_CONFIG.url}/functions/v1/post-episode-scores`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${_session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': window.SUPABASE_CONFIG.anonKey,
        },
        body: JSON.stringify({ season_id: 1, episode, queen_scores: queensCodes }),
      }
    );
    return res.json();
  }

  async function eliminateQueen(queenId, eliminatedEp) {
    const sb = client();
    if (!sb || !_session) return;
    return sb.from('show_queens')
      .update({ eliminated: true, eliminated_ep: eliminatedEp })
      .eq('id', queenId);
  }

  return { init, refreshData, getSession, getCurrentPlayer,
           signInWithEmail, signOut, postEpisodeScores, eliminateQueen };
})();
