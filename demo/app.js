// ============================================================
// app.js — Drag Race Fantasy League Demo
// ============================================================

// ── App State ─────────────────────────────────────────────────
let state = {
  currentTab:    'leaderboard',
  viewingPlayer: 1,
  expandedEp:    null,
  adminModal:    false,
  // Score entry state for next episode: { queenId: { A:bool, B:bool, C:int, D:bool, E:int, F:bool, G:bool } }
  pendingCodes:  {},
  // Queen elimination state (mutable in demo)
  queens: SHOW_QUEENS.map(q => ({ ...q })),
};

// ── Core Helpers ──────────────────────────────────────────────

function getQueen(id) {
  return state.queens.find(q => q.id === id);
}

function getActiveQueens() {
  return state.queens.filter(q => !q.eliminated);
}

// Calculate a queen's total points across all aired episodes
function queenTotal(queen) {
  return Object.values(queen.episodePoints).reduce((s, v) => s + v, 0);
}

// Calculate a league player's total = sum of their 5 queens' totals
function playerTotal(player) {
  return player.team.reduce((sum, qid) => {
    const q = getQueen(qid);
    return sum + (q ? queenTotal(q) : 0);
  }, 0);
}

// Ranked league players (highest score first)
function getRankedPlayers() {
  return [...LEAGUE_PLAYERS]
    .map(p => ({ ...p, total: playerTotal(p) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function getPlayerRank(playerId) {
  return getRankedPlayers().findIndex(p => p.id === playerId) + 1;
}

function getPotWinning(rank) {
  const { first, second, third } = SEASON_CONFIG.potSplit;
  const splits = [first, second, third];
  return rank <= 3 ? Math.round(SEASON_CONFIG.totalPot * splits[rank - 1]) : 0;
}

// Parse a code string like "E,E,D,B" into { E:2, D:1, B:1 }
function parseCodes(codeStr) {
  if (!codeStr) return {};
  const counts = {};
  codeStr.split(',').map(c => c.trim()).filter(c => SCORING_RULES[c]).forEach(c => {
    counts[c] = (counts[c] || 0) + 1;
  });
  return counts;
}

// Render code chips for display (in episode breakdown)
function renderCodeChips(codeStr) {
  if (!codeStr) return '<span class="code-chip">—</span>';
  const counts = parseCodes(codeStr);
  return Object.entries(counts).map(([code, count]) => {
    const rule = SCORING_RULES[code];
    const pts  = rule.points * count;
    const cls  = ['H','I','J','K','D'].includes(code) ? 'big'
               : rule.points > 0 ? 'pos' : 'neg';
    const label = count > 1 ? `${code}×${count} (${pts>0?'+':''}${pts})` : `${code} (${pts>0?'+':''}${pts})`;
    return `<span class="code-chip ${cls}">${label}</span>`;
  }).join('');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Screen: Leaderboard ───────────────────────────────────────
function renderLeaderboard() {
  const ranked = getRankedPlayers();
  const cfg    = SEASON_CONFIG;
  const pct    = Math.round((cfg.airedEpisodes / cfg.totalEpisodes) * 100);
  const activeCount = getActiveQueens().length;

  document.getElementById('screen-leaderboard').innerHTML = `
    <div class="screen-header">
      <div class="header-title">🏁 Leaderboard</div>
      <div class="header-sub">${cfg.name} · Ep ${cfg.airedEpisodes}/${cfg.totalEpisodes} · ${activeCount} queens remaining</div>
      <div class="progress-wrap">
        <div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label">${cfg.totalEpisodes - cfg.airedEpisodes} episodes remaining</div>
      </div>
    </div>

    <div class="pot-card">
      <div class="pot-left">
        <div class="pot-label">💰 Season Pot</div>
        <div class="pot-amount">$${cfg.totalPot}</div>
        <div class="pot-meta">${LEAGUE_PLAYERS.length} players × $${cfg.potPerPlayer}</div>
      </div>
      <div class="pot-splits">
        <div class="pot-split-row">🥇 $${getPotWinning(1)}</div>
        <div class="pot-split-row">🥈 $${getPotWinning(2)}</div>
        <div class="pot-split-row">🥉 $${getPotWinning(3)}</div>
      </div>
    </div>

    <div class="section-label">STANDINGS · ${LEAGUE_PLAYERS.length} PLAYERS</div>

    ${ranked.map((p, i) => {
      const rank = i + 1;
      const top  = rank <= 3;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      return `
        <div class="player-row ${top ? 'top3' : ''}"
             onclick="selectPlayer(${p.id}); switchTab('myteam')">
          <div class="rank-chip ${top ? 'rank-' + rank : 'rank-n'}">${medal}</div>
          <div class="row-info">
            <div class="row-name">${p.avatar} ${p.name}</div>
            <div class="row-sub">
              ${top
                ? `<span class="winnings-tag">💰 $${getPotWinning(rank)} projected</span>`
                : `${p.team.filter(qid => !getQueen(qid)?.eliminated).length}/5 queens still in`}
            </div>
          </div>
          <div class="row-score ${top ? 'top' : ''}">${p.total}</div>
        </div>
      `;
    }).join('')}
    <div style="height:20px"></div>
  `;
}

// ── Screen: My Team ───────────────────────────────────────────
function renderMyTeam() {
  const player = LEAGUE_PLAYERS.find(p => p.id === state.viewingPlayer);
  const total  = playerTotal(player);
  const rank   = getPlayerRank(player.id);
  const ranked = getRankedPlayers();

  // Queen cards
  const queensHtml = player.team.map(qid => {
    const queen     = getQueen(qid);
    if (!queen) return '';
    const qTotal    = queenTotal(queen);
    const isWinner  = player.pickedWinner === qid;
    const initials  = queen.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const elim      = queen.eliminated;

    return `
      <div class="queen-card ${isWinner ? 'winner-pick' : ''} ${elim ? 'eliminated' : ''}">
        <div class="queen-dot" style="background:${queen.color}">${initials}</div>
        <div class="queen-info">
          <div class="queen-name">${queen.name}</div>
          <div class="queen-status ${elim ? 'out' : 'active'}">
            ${elim ? `❌ Eliminated Ep ${queen.eliminatedEp}` : '✅ Still competing'}
          </div>
          ${isWinner ? '<div class="queen-crown">👑 Your winner pick</div>' : ''}
        </div>
        <div class="queen-pts">${qTotal > 0 ? '+' : ''}${qTotal}</div>
      </div>
    `;
  }).join('');

  // Episode-by-episode breakdown: one row per episode, columns per queen
  const airedEps = Object.keys(player.team[0] ? getQueen(player.team[0])?.episodePoints || {} : {})
    .map(Number).sort((a, b) => a - b).filter(ep => ep <= SEASON_CONFIG.airedEpisodes);

  const epRows = airedEps.map(ep => {
    let epTotal = 0;
    const queenCells = player.team.map(qid => {
      const q   = getQueen(qid);
      const pts = q?.episodePoints[ep] ?? 0;
      epTotal  += pts;
      const codes = q?.episodeCodes[ep] || '';
      return `<div class="ep-cell">
        <div class="ep-cell-chips">${renderCodeChips(codes)}</div>
        <div class="ep-cell-pts ${pts > 0 ? 'pos' : pts < 0 ? 'neg' : 'zero'}">${pts > 0 ? '+' : ''}${pts}</div>
      </div>`;
    }).join('');

    return `
      <div class="ep-row">
        <div class="ep-num">Ep ${ep}</div>
        <div class="ep-queen-cells">${queenCells}</div>
        <div class="ep-pts ${epTotal > 0 ? 'pos' : epTotal < 0 ? 'neg' : 'zero'}">${epTotal > 0 ? '+' : ''}${epTotal}</div>
      </div>
    `;
  }).join('');

  // Queen name headers
  const queenHeaders = player.team.map(qid => {
    const q = getQueen(qid);
    if (!q) return '';
    const initials = q.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    return `<div class="ep-queen-header" title="${q.name}">
      <span class="q-dot-sm" style="background:${q.color}">${initials}</span>
    </div>`;
  }).join('');

  document.getElementById('screen-myteam').innerHTML = `
    <div class="team-player-header">
      <div class="header-sub" style="margin-bottom:4px">Viewing as</div>
      <div class="header-title">${player.avatar} ${player.name}</div>
      <div class="team-total-row" style="margin-top:12px">
        <div>
          <div class="team-total-label">Total Points</div>
          <div class="team-total-pts">${total}</div>
        </div>
        <div style="text-align:right">
          <div class="team-total-label">Current Rank</div>
          <div class="team-rank-tag">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank} of ${LEAGUE_PLAYERS.length}</div>
          ${rank <= 3 ? `<div class="winnings-tag" style="margin-top:6px">💰 $${getPotWinning(rank)} projected</div>` : ''}
        </div>
      </div>
    </div>

    <div class="section-label">YOUR TEAM OF 5 QUEENS</div>
    ${queensHtml}

    <div class="section-label">EPISODE BREAKDOWN</div>
    <div class="ep-table-wrap">
      <div class="ep-table-header">
        <div class="ep-num-header">EP</div>
        <div class="ep-queen-cells">${queenHeaders}</div>
        <div class="ep-pts-header">PTS</div>
      </div>
      ${epRows}
      <div class="ep-row ep-total-row">
        <div class="ep-num" style="font-weight:800;color:var(--text)">Total</div>
        <div class="ep-queen-cells">
          ${player.team.map(qid => {
            const q = getQueen(qid);
            const t = q ? queenTotal(q) : 0;
            return `<div class="ep-cell"><div class="ep-cell-pts pos" style="font-size:14px">${t}</div></div>`;
          }).join('')}
        </div>
        <div class="ep-pts pos" style="font-size:18px">${total}</div>
      </div>
    </div>
    <div style="height:20px"></div>
  `;
}

// ── Screen: Queens (replaces old Episodes concept for queen tracking) ──
function renderQueens() {
  const active    = state.queens.filter(q => !q.eliminated);
  const eliminated = state.queens.filter(q => q.eliminated)
                                 .sort((a, b) => (b.eliminatedEp || 0) - (a.eliminatedEp || 0));

  const queenCard = (q) => {
    const total    = queenTotal(q);
    const initials = q.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    // How many league players have this queen
    const draftedBy = LEAGUE_PLAYERS.filter(p => p.team.includes(q.id)).length;

    return `
      <div class="queen-stat-card ${q.eliminated ? 'elim-card' : ''}">
        <div class="queen-dot" style="background:${q.color};width:46px;height:46px;font-size:16px">${initials}</div>
        <div class="queen-info" style="flex:1">
          <div class="queen-name">${q.name}</div>
          <div class="queen-status ${q.eliminated ? 'out' : 'active'}">
            ${q.eliminated ? `❌ Elim Ep ${q.eliminatedEp}` : '✅ Still in'}
            <span style="margin-left:8px;color:var(--text-sub)">Drafted by ${draftedBy}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:800;color:var(--text)">${total}</div>
          <div style="font-size:10px;color:var(--text-sub)">pts total</div>
        </div>
      </div>
    `;
  };

  document.getElementById('screen-queens').innerHTML = `
    <div class="screen-header">
      <div class="header-title">👸 Cast</div>
      <div class="header-sub">${active.length} still competing · ${eliminated.length} eliminated</div>
    </div>

    <div class="section-label">STILL COMPETING (${active.length})</div>
    ${active.sort((a,b) => queenTotal(b) - queenTotal(a)).map(queenCard).join('')}

    <div class="section-label">ELIMINATED (${eliminated.length})</div>
    ${eliminated.map(queenCard).join('')}

    <div style="height:20px"></div>
  `;
}

// ── Screen: Episodes ──────────────────────────────────────────
function renderEpisodes() {
  const episodesHtml = EPISODES.map(ep => {
    const future = !ep.aired;

    // Per-queen scores for this episode
    const queenScores = state.queens
      .filter(q => q.episodePoints[ep.number] !== undefined)
      .sort((a, b) => (b.episodePoints[ep.number] || 0) - (a.episodePoints[ep.number] || 0));

    const detailHtml = ep.aired ? `
      <div class="ep-detail ${state.expandedEp === ep.number ? 'open' : ''}" id="ep-detail-${ep.number}">
        <div class="ep-summary">${ep.summary}</div>
        <div class="section-label" style="padding:8px 0 6px">QUEEN SCORES THIS EPISODE</div>
        ${queenScores.filter(q => (q.episodePoints[ep.number] || 0) !== 0).map(q => {
          const pts    = q.episodePoints[ep.number] || 0;
          const codes  = q.episodeCodes[ep.number]  || '';
          const initials = q.name.split(' ').map(w=>w[0]).join('').slice(0,2);
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--card-border)">
              <div class="queen-dot" style="background:${q.color};width:32px;height:32px;font-size:11px;flex-shrink:0">${initials}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text)">${q.name}</div>
                <div style="margin-top:3px">${renderCodeChips(codes)}</div>
              </div>
              <div style="font-size:16px;font-weight:800;color:${pts>0?'var(--green)':'var(--red)'}">${pts>0?'+':''}${pts}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    return `
      <div class="ep-card ${ep.aired ? 'aired' : 'future'}"
           ${ep.aired ? `onclick="toggleEpisode(${ep.number})"` : ''}>
        <div class="ep-card-header">
          <div class="ep-num-bubble">${ep.number}</div>
          <div>
            <div class="ep-title">${ep.title}</div>
            ${ep.aired ? `<div class="ep-aired">✓ Aired</div>` : `<div class="ep-future">Upcoming</div>`}
          </div>
          ${ep.aired ? `<div class="ep-chevron">${state.expandedEp === ep.number ? '▲' : '▼'}</div>` : ''}
        </div>
        ${detailHtml}
      </div>
    `;
  }).join('');

  document.getElementById('screen-episodes').innerHTML = `
    <div class="screen-header">
      <div class="header-title">📺 Episodes</div>
      <div class="header-sub">Tap a card to see queen scores</div>
    </div>
    <div style="margin-top:8px;margin-bottom:16px">${episodesHtml}</div>
  `;
}

// ── Screen: Admin ─────────────────────────────────────────────
function renderAdmin() {
  const cfg    = SEASON_CONFIG;
  const nextEp = cfg.airedEpisodes + 1;

  document.getElementById('screen-admin').innerHTML = `
    <div class="screen-header pink-grad">
      <div class="header-title">⚙️ Admin</div>
      <div class="header-sub">League management · password-protected in production</div>
    </div>

    <div class="admin-header-note">⚠️ Demo mode — changes apply to this session only.</div>

    <div class="admin-stat-row">
      <div class="admin-stat"><div class="s-val">${LEAGUE_PLAYERS.length}</div><div class="s-label">Players</div></div>
      <div class="admin-stat"><div class="s-val">${cfg.airedEpisodes}</div><div class="s-label">Episodes</div></div>
      <div class="admin-stat"><div class="s-val">${getActiveQueens().length}</div><div class="s-label">Queens Left</div></div>
      <div class="admin-stat"><div class="s-val">$${cfg.totalPot}</div><div class="s-label">Pot</div></div>
    </div>

    <div class="section-label">SCORE ENTRY</div>
    <button class="admin-action-btn" onclick="openScoreModal()">
      <span class="btn-icon">➕</span>
      <div>
        <div>Enter Episode ${nextEp} Scores</div>
        <div class="btn-sub">${getActiveQueens().length} queens to score · auto-updates all ${LEAGUE_PLAYERS.length} players</div>
      </div>
    </button>

    <div class="section-label">QUEEN ELIMINATION</div>
    <div style="font-size:12px;color:var(--text-sub);padding:0 16px 10px">
      Mark a queen as eliminated to remove them from future score entry. Past points are kept.
    </div>
    ${state.queens.filter(q => !q.eliminated).sort((a,b) => a.name.localeCompare(b.name)).map(q => {
      const initials = q.name.split(' ').map(w=>w[0]).join('').slice(0,2);
      return `
        <div class="admin-secondary-btn" style="justify-content:space-between"
             onclick="confirmEliminate(${q.id})">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="queen-dot" style="background:${q.color};width:34px;height:34px;font-size:12px;flex-shrink:0">${initials}</div>
            <div>
              <div style="font-size:14px;font-weight:600">${q.name}</div>
              <div style="font-size:11px;color:var(--text-sub)">${queenTotal(q)} pts total</div>
            </div>
          </div>
          <div style="color:var(--red);font-size:12px;font-weight:700">Eliminate ✕</div>
        </div>
      `;
    }).join('')}

    ${state.queens.filter(q => q.eliminated).length > 0 ? `
      <div class="section-label" style="margin-top:4px">ALREADY ELIMINATED</div>
      ${state.queens.filter(q => q.eliminated).map(q => {
        const initials = q.name.split(' ').map(w=>w[0]).join('').slice(0,2);
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;opacity:0.5">
            <div class="queen-dot" style="background:${q.color};width:34px;height:34px;font-size:12px;flex-shrink:0">${initials}</div>
            <div style="font-size:14px;color:var(--text-sub)">${q.name} — out Ep ${q.eliminatedEp}</div>
          </div>
        `;
      }).join('')}
    ` : ''}

    <div class="section-label">OTHER ACTIONS</div>
    <button class="admin-secondary-btn" onclick="showToast('📣 Push notification sent to all players!')">
      <span>📣</span>
      <div><div>Notify All Players</div><div style="font-size:11px;color:var(--text-sub);margin-top:2px">Alert everyone that scores are updated</div></div>
    </button>
    <button class="admin-secondary-btn" onclick="showToast('🔒 Teams locked — no edits allowed')">
      <span>🔒</span>
      <div><div>Team Lock Status</div><div style="font-size:11px;color:var(--text-sub);margin-top:2px">${cfg.teamsLocked ? 'Locked — Ep 1 has aired' : 'Open — players can still edit'}</div></div>
    </button>

    <div style="height:20px"></div>
  `;

  // Append the score modal (hidden until opened)
  renderScoreModal();
}

// ── Score Entry Modal ─────────────────────────────────────────
function renderScoreModal() {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;
  const active = getActiveQueens();

  // Init pending codes for each active queen
  active.forEach(q => {
    if (!state.pendingCodes[q.id]) {
      state.pendingCodes[q.id] = { A:false, B:false, C:0, D:false, E:0, F:false, G:false };
    }
  });

  const queenForms = active.sort((a,b) => a.name.localeCompare(b.name)).map(queen => {
    const codes    = state.pendingCodes[queen.id];
    const initials = queen.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    const epPts    = calcPendingPoints(queen.id);

    return `
      <div class="queen-score-entry" id="qse-${queen.id}">
        <div class="qse-header">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="queen-dot" style="background:${queen.color};width:38px;height:38px;font-size:13px;flex-shrink:0">${initials}</div>
            <div class="qse-name">${queen.name}</div>
          </div>
          <div class="qse-ep-pts ${epPts > 0 ? 'pos' : epPts < 0 ? 'neg' : 'zero'}">${epPts > 0 ? '+' : ''}${epPts}</div>
        </div>
        <div class="qse-codes">
          ${renderCodeButtons(queen.id)}
        </div>
      </div>
    `;
  }).join('');

  const existing = document.getElementById('score-modal');
  const modal    = existing || document.createElement('div');
  modal.id        = 'score-modal';
  modal.className = 'modal-overlay' + (state.adminModal ? ' open' : '');
  modal.innerHTML = `
    <div class="modal-header">
      <button class="modal-back" onclick="closeScoreModal()">← Back</button>
      <div class="modal-title">Ep ${nextEp} Scores</div>
    </div>
    <div style="font-size:12px;color:var(--text-sub);padding:10px 14px 4px">
      Only queens still in the competition are shown. E and C accumulate — tap multiple times.
    </div>
    ${queenForms}
    <div class="section-label">PLAYER SCORE PREVIEW</div>
    <div id="score-preview" class="preview-section">
      <div style="font-size:12px;color:var(--text-sub)">Select codes above to see changes.</div>
    </div>
    <button class="submit-btn" onclick="submitEpisodeScores()">
      ✓ Post Episode ${nextEp} Scores
    </button>
  `;

  if (!existing) {
    document.getElementById('screen-admin').appendChild(modal);
  }
  updateScorePreview();
}

// Render the button row for a single queen in the score modal
function renderCodeButtons(queenId) {
  const codes = state.pendingCodes[queenId];
  if (!codes) return '';

  // Toggle codes (once per episode): A, B, D, F, G
  const toggleCodes = ['A','B','D','F','G'];
  // Accumulator codes (tap to add): E, C
  const accumCodes  = ['E','C'];

  const toggleHtml = toggleCodes.map(code => {
    const rule   = SCORING_RULES[code];
    const active = codes[code];
    const isNeg  = rule.points < 0;
    return `
      <button class="code-toggle ${active ? 'selected' : ''} ${isNeg ? 'neg-code' : ''}"
              onclick="toggleCode(${queenId},'${code}')">
        ${code} <span class="code-pts-label">${rule.points > 0 ? '+' : ''}${rule.points}</span>
      </button>
    `;
  }).join('');

  const accumHtml = accumCodes.map(code => {
    const rule  = SCORING_RULES[code];
    const count = codes[code] || 0;
    return `
      <div class="accum-group">
        <button class="code-toggle accum ${count > 0 ? 'selected' : ''}"
                onclick="incrementCode(${queenId},'${code}')">
          ${code} <span class="code-pts-label">${rule.points > 0 ? '+' : ''}${rule.points}</span>
          ${count > 0 ? `<span class="accum-count">×${count}</span>` : ''}
        </button>
        ${count > 0 ? `<button class="accum-minus" onclick="decrementCode(${queenId},'${code}')">−</button>` : ''}
      </div>
    `;
  }).join('');

  return toggleHtml + accumHtml;
}

function calcPendingPoints(queenId) {
  const codes = state.pendingCodes[queenId];
  if (!codes) return 0;
  let pts = 0;
  ['A','B','D','F','G'].forEach(c => { if (codes[c]) pts += SCORING_RULES[c].points; });
  ['E','C'].forEach(c => { pts += (codes[c] || 0) * SCORING_RULES[c].points; });
  return pts;
}

function refreshQueenEntry(queenId) {
  const container = document.getElementById(`qse-${queenId}`);
  if (!container) return;
  const epPts = calcPendingPoints(queenId);
  container.querySelector('.qse-ep-pts').textContent = `${epPts > 0 ? '+' : ''}${epPts}`;
  container.querySelector('.qse-ep-pts').className = `qse-ep-pts ${epPts > 0 ? 'pos' : epPts < 0 ? 'neg' : 'zero'}`;
  container.querySelector('.qse-codes').innerHTML = renderCodeButtons(queenId);
  updateScorePreview();
}

function toggleCode(queenId, code) {
  if (!state.pendingCodes[queenId]) state.pendingCodes[queenId] = { A:false, B:false, C:0, D:false, E:0, F:false, G:false };
  state.pendingCodes[queenId][code] = !state.pendingCodes[queenId][code];
  refreshQueenEntry(queenId);
}

function incrementCode(queenId, code) {
  if (!state.pendingCodes[queenId]) state.pendingCodes[queenId] = { A:false, B:false, C:0, D:false, E:0, F:false, G:false };
  state.pendingCodes[queenId][code] = (state.pendingCodes[queenId][code] || 0) + 1;
  refreshQueenEntry(queenId);
}

function decrementCode(queenId, code) {
  if (!state.pendingCodes[queenId]) return;
  const current = state.pendingCodes[queenId][code] || 0;
  state.pendingCodes[queenId][code] = Math.max(0, current - 1);
  refreshQueenEntry(queenId);
}

function updateScorePreview() {
  const preview = document.getElementById('score-preview');
  if (!preview) return;

  // For each league player, calculate how many points their queens would earn
  const deltas = LEAGUE_PLAYERS.map(player => {
    let delta = 0;
    player.team.forEach(qid => {
      delta += calcPendingPoints(qid);
    });
    return { player, delta };
  }).filter(d => d.delta !== 0)
    .sort((a, b) => b.delta - a.delta);

  if (deltas.length === 0) {
    preview.innerHTML = '<div style="font-size:12px;color:var(--text-sub)">Select codes above to see changes.</div>';
    return;
  }

  preview.innerHTML = `
    <div class="preview-title">How player scores will change</div>
    ${deltas.map(({ player, delta }) => `
      <div class="preview-row">
        <div class="preview-name">${player.avatar} ${player.name}</div>
        <div class="preview-delta">${delta > 0 ? '+' : ''}${delta} pts</div>
      </div>
    `).join('')}
  `;
}

function openScoreModal() {
  // Reset pending codes for each active queen
  getActiveQueens().forEach(q => {
    state.pendingCodes[q.id] = { A:false, B:false, C:0, D:false, E:0, F:false, G:false };
  });
  state.adminModal = true;
  renderScoreModal();
  document.getElementById('score-modal').classList.add('open');
}

function closeScoreModal() {
  state.adminModal = false;
  const modal = document.getElementById('score-modal');
  if (modal) modal.classList.remove('open');
}

function submitEpisodeScores() {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;

  // Apply pending codes to each queen's episode data
  getActiveQueens().forEach(queen => {
    const codes = state.pendingCodes[queen.id];
    if (!codes) return;

    // Build code string (e.g. "D,E,E,E,B")
    const parts = [];
    if (codes.A) parts.push('A');
    if (codes.B) parts.push('B');
    for (let i = 0; i < (codes.C || 0); i++) parts.push('C');
    if (codes.D) parts.push('D');
    for (let i = 0; i < (codes.E || 0); i++) parts.push('E');
    if (codes.F) parts.push('F');
    if (codes.G) parts.push('G');

    const pts = calcPendingPoints(queen.id);
    queen.episodeCodes[nextEp]  = parts.join(',');
    queen.episodePoints[nextEp] = pts;
  });

  SEASON_CONFIG.airedEpisodes = nextEp;
  state.pendingCodes = {};

  closeScoreModal();
  showToast(`✅ Episode ${nextEp} scores posted!`);
  renderAll();
}

// ── Queen Elimination ─────────────────────────────────────────
function confirmEliminate(queenId) {
  const queen = getQueen(queenId);
  if (!queen) return;

  // Simple confirm in demo (production would be a modal)
  if (confirm(`Eliminate ${queen.name}? Their past points are kept but they won't appear in future score entry.`)) {
    queen.eliminated    = true;
    queen.eliminatedEp  = SEASON_CONFIG.airedEpisodes;
    showToast(`💔 ${queen.name} has been eliminated`);
    renderAdmin();
    renderQueens();
    renderLeaderboard();
  }
}

// ── Navigation ────────────────────────────────────────────────
function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.id === `screen-${tab}`);
  });
  renderScreen(tab);
}

function renderScreen(tab) {
  switch (tab) {
    case 'leaderboard': renderLeaderboard(); break;
    case 'myteam':      renderMyTeam();      break;
    case 'queens':      renderQueens();      break;
    case 'episodes':    renderEpisodes();    break;
    case 'admin':       renderAdmin();       break;
  }
}

function renderAll() {
  renderScreen(state.currentTab);
}

function selectPlayer(id) {
  state.viewingPlayer = id;
  const sel = document.getElementById('player-select');
  if (sel) sel.value = id;
}

function toggleEpisode(num) {
  state.expandedEp = state.expandedEp === num ? null : num;
  renderEpisodes();
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Player selector
  const sel = document.getElementById('player-select');
  if (sel) {
    LEAGUE_PLAYERS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.avatar} ${p.name}`;
      sel.appendChild(opt);
    });
    sel.value = state.viewingPlayer;
    sel.addEventListener('change', () => {
      state.viewingPlayer = +sel.value;
      if (state.currentTab === 'myteam') renderMyTeam();
    });
  }

  // Tab buttons
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  renderAll();
});
