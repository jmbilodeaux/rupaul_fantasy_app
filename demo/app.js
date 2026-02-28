// ============================================================
// app.js — Drag Race Fantasy League Demo
// All logic: state, rendering, event handling
// ============================================================

// ── App State ────────────────────────────────────────────────
let state = {
  currentTab:   'leaderboard',
  viewingPlayer: 1,          // which fantasy player "you" are
  expandedEp:    null,       // which episode card is open
  adminModal:    false,
  episodeData:   {},         // { queenId: [codes] } for score entry
  // Clone episode scores so we can mutate in demo
  scores: FANTASY_PLAYERS.reduce((acc, p) => {
    acc[p.id] = { ...p.episodeScores };
    return acc;
  }, {}),
  codes: FANTASY_PLAYERS.reduce((acc, p) => {
    acc[p.id] = { ...p.episodeCodes };
    return acc;
  }, {}),
};

// ── Helpers ───────────────────────────────────────────────────
function getTotalScore(playerId) {
  return Object.values(state.scores[playerId]).reduce((s, v) => s + v, 0);
}

function getRankedPlayers() {
  return [...FANTASY_PLAYERS]
    .map(p => ({ ...p, total: getTotalScore(p.id) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function getPlayerRank(playerId) {
  const ranked = getRankedPlayers();
  return ranked.findIndex(p => p.id === playerId) + 1;
}

function getPotWinning(rank) {
  const s = SEASON_CONFIG.potSplit;
  const splits = [s.first, s.second, s.third];
  return rank <= 3 ? Math.round(SEASON_CONFIG.totalPot * splits[rank - 1]) : 0;
}

function codeColor(code) {
  if (['H','I','J','K','D'].includes(code)) return 'big';
  if (SCORING_RULES[code] && SCORING_RULES[code].points > 0) return 'pos';
  if (SCORING_RULES[code] && SCORING_RULES[code].points < 0) return 'neg';
  return '';
}

function parseCodes(codeStr) {
  if (!codeStr) return [];
  return codeStr.split(',').map(c => c.trim()).filter(c => c && SCORING_RULES[c]);
}

function codeToPoints(code) {
  return SCORING_RULES[code] ? SCORING_RULES[code].points : 0;
}

function getQueenById(id) {
  return SHOW_QUEENS.find(q => q.id === id);
}

function getPlayerById(id) {
  return FANTASY_PLAYERS.find(p => p.id === id);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Render: Leaderboard ──────────────────────────────────────
function renderLeaderboard() {
  const ranked = getRankedPlayers();
  const cfg    = SEASON_CONFIG;
  const pct    = Math.round((cfg.airedEpisodes / cfg.totalEpisodes) * 100);

  document.getElementById('screen-leaderboard').innerHTML = `
    <div class="screen-header">
      <div class="header-title">🏁 Leaderboard</div>
      <div class="header-sub">${cfg.name} · Ep ${cfg.airedEpisodes}/${cfg.totalEpisodes}</div>
      <div class="progress-wrap">
        <div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label">${cfg.totalEpisodes - cfg.airedEpisodes} episodes remaining</div>
      </div>
    </div>

    <div class="pot-card">
      <div class="pot-left">
        <div class="pot-label">💰 Season Pot</div>
        <div class="pot-amount">$${cfg.totalPot}</div>
        <div class="pot-meta">${FANTASY_PLAYERS.length} players × $${cfg.potPerPlayer}</div>
      </div>
      <div class="pot-splits">
        <div class="pot-split-row">🥇 $${getPotWinning(1)}</div>
        <div class="pot-split-row">🥈 $${getPotWinning(2)}</div>
        <div class="pot-split-row">🥉 $${getPotWinning(3)}</div>
      </div>
    </div>

    <div class="section-label">STANDINGS · ALL ${FANTASY_PLAYERS.length} PLAYERS</div>

    ${ranked.map((p, i) => {
      const rank = i + 1;
      const top  = rank <= 3;
      const rankContent = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      return `
        <div class="player-row ${top ? 'top3' : ''}"
             onclick="selectPlayer(${p.id}); switchTab('myteam')">
          <div class="rank-chip ${top ? 'rank-' + rank : 'rank-n'}">${rankContent}</div>
          <div class="row-info">
            <div class="row-name">${p.avatar} ${p.name}</div>
            <div class="row-sub">
              ${top
                ? `<span class="winnings-tag">💰 $${getPotWinning(rank)}</span>`
                : `Ep 1–${cfg.airedEpisodes} · ${Object.values(state.scores[p.id]).filter(v=>v>0).length} scoring eps`}
            </div>
          </div>
          <div class="row-score ${top ? 'top' : ''}">${p.total}</div>
        </div>
      `;
    }).join('')}
    <div style="height:20px"></div>
  `;
}

// ── Render: My Team ──────────────────────────────────────────
function renderMyTeam() {
  const player = getPlayerById(state.viewingPlayer);
  const total  = getTotalScore(player.id);
  const rank   = getPlayerRank(player.id);
  const codes  = state.codes[player.id];
  const scores = state.scores[player.id];
  const cfg    = SEASON_CONFIG;

  // Queen rows
  const queensHtml = player.team.map(qid => {
    const queen = getQueenById(qid);
    if (!queen) return '';
    const isWinner = player.pickedWinner === qid;
    const initials = queen.name.split(' ').map(w => w[0]).join('').slice(0,2);

    // Estimate queen's contribution (simplified: show status)
    const elim = queen.eliminated;

    return `
      <div class="queen-card ${isWinner ? 'winner-pick' : ''} ${elim ? 'eliminated' : ''}">
        <div class="queen-dot" style="background:${queen.color}">${initials}</div>
        <div class="queen-info">
          <div class="queen-name">${queen.name}</div>
          <div class="queen-status ${elim ? 'out' : 'active'}">
            ${elim ? `❌ Eliminated Ep ${queen.eliminatedEp}` : '✅ Still competing'}
          </div>
          ${isWinner ? '<div class="queen-crown">👑 Your winner pick (+50 if correct)</div>' : ''}
        </div>
      </div>
    `;
  }).join('');

  // Episode breakdown rows
  const epRows = Object.keys(scores)
    .sort((a,b) => +a - +b)
    .map(ep => {
      const pts  = scores[ep];
      const code = codes[ep] || '';
      const chips = parseCodes(code).map(c => {
        const cls = codeColor(c);
        return `<span class="code-chip ${cls}">${c}${SCORING_RULES[c]?` ${SCORING_RULES[c].points>0?'+':''}${SCORING_RULES[c].points}`:''}</span>`;
      }).join('');

      return `
        <div class="ep-row">
          <div class="ep-num">Ep ${ep}</div>
          <div class="ep-codes">${chips || '<span class="code-chip">—</span>'}</div>
          <div class="ep-pts ${pts>0?'pos':pts<0?'neg':'zero'}">${pts>0?'+':''}${pts}</div>
        </div>
      `;
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
          <div class="team-rank-tag">
            ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank} of ${FANTASY_PLAYERS.length}
          </div>
          ${rank <= 3 ? `<div class="winnings-tag" style="margin-top:6px">💰 $${getPotWinning(rank)} projected</div>` : ''}
        </div>
      </div>
    </div>

    <div class="section-label">YOUR DRAFTED QUEENS</div>
    ${queensHtml}

    <div class="ep-table">
      <div class="ep-table-title">Episode-by-episode breakdown</div>
      ${epRows}
    </div>
    <div style="height:20px"></div>
  `;
}

// ── Render: Episodes ─────────────────────────────────────────
function renderEpisodes() {
  const ranked = getRankedPlayers();

  const episodesHtml = EPISODES.map(ep => {
    const future = !ep.aired;

    const detailHtml = ep.aired ? `
      <div class="ep-detail ${state.expandedEp === ep.number ? 'open' : ''}" id="ep-detail-${ep.number}">
        <div class="ep-summary">${ep.summary}</div>
        <div class="ep-scores-grid">
          ${ranked.map(p => {
            const pts = state.scores[p.id][ep.number] || 0;
            return `
              <div class="ep-score-chip">
                <div class="ep-score-name">${p.avatar} ${p.name.split(' ')[0]}</div>
                <div class="ep-score-val ${pts>0?'pos':pts<0?'neg':'zero'}">${pts>0?'+':''}${pts}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="ep-card ${ep.aired ? 'aired' : 'future'}"
           ${ep.aired ? `onclick="toggleEpisode(${ep.number})"` : ''}>
        <div class="ep-card-header">
          <div class="ep-num-bubble">${ep.number}</div>
          <div>
            <div class="ep-title">${ep.title}</div>
            ${ep.aired
              ? `<div class="ep-aired">✓ Aired</div>`
              : `<div class="ep-future">Upcoming</div>`}
          </div>
          ${ep.aired ? `<div class="ep-chevron" id="chev-${ep.number}">${state.expandedEp===ep.number ? '▲' : '▼'}</div>` : ''}
        </div>
        ${detailHtml}
      </div>
    `;
  }).join('');

  document.getElementById('screen-episodes').innerHTML = `
    <div class="screen-header">
      <div class="header-title">📺 Episodes</div>
      <div class="header-sub">Tap a card to see everyone's scores</div>
    </div>
    <div style="margin-top:8px; margin-bottom:16px">
      ${episodesHtml}
    </div>
  `;
}

// ── Render: Rules ─────────────────────────────────────────────
function renderRules() {
  const rules = Object.entries(SCORING_RULES);

  const rulesHtml = rules.map(([code, rule]) => {
    const isNeg     = rule.points < 0;
    const isSpecial = ['H','I','J','K'].includes(code);
    const cls       = isSpecial ? 'special' : isNeg ? 'neg' : 'pos';
    return `
      <div class="rule-card">
        <div class="rule-code ${cls}">${code}</div>
        <div class="rule-desc">${rule.label}</div>
        <div class="rule-pts ${cls}">${rule.points > 0 ? '+' : ''}${rule.points}</div>
      </div>
    `;
  }).join('');

  document.getElementById('screen-rules').innerHTML = `
    <div class="screen-header">
      <div class="header-title">⭐ Scoring Rules</div>
      <div class="header-sub">How points are earned each episode</div>
    </div>
    <div class="rules-intro">
      Each fantasy player drafts a team of <strong>5 queens</strong> before the season premieres.
      Teams are locked once Episode 1 airs — no changes allowed.
      Points are entered by the league admin each week and auto-calculated for all players.
    </div>
    ${rulesHtml}
    <div class="rules-note">
      <strong>Season-end bonuses:</strong> H (50 pts) is awarded if you specifically
      <em>picked</em> the winner. I (30 pts) if the winner is on your team but wasn't your pick.
      J (25 pts) for Miss Congeniality on your team. K (20 pts) for each queen on your team
      who makes the finale.<br><br>
      <strong>Pot split:</strong> 🥇 60% · 🥈 25% · 🥉 15%
    </div>
    <div style="height:20px"></div>
  `;
}

// ── Render: Admin ────────────────────────────────────────────
function renderAdmin() {
  const cfg    = SEASON_CONFIG;
  const nextEp = cfg.airedEpisodes + 1;
  const locked = cfg.teamsLocked;

  document.getElementById('screen-admin').innerHTML = `
    <div class="screen-header pink-grad">
      <div class="header-title">⚙️ Admin Panel</div>
      <div class="header-sub">League management — protected in production</div>
    </div>

    <div class="admin-header-note">
      ⚠️ In production this screen requires a league admin password.
    </div>

    <div class="admin-stat-row">
      <div class="admin-stat">
        <div class="s-val">${FANTASY_PLAYERS.length}</div>
        <div class="s-label">Players</div>
      </div>
      <div class="admin-stat">
        <div class="s-val">${cfg.airedEpisodes}</div>
        <div class="s-label">Episodes</div>
      </div>
      <div class="admin-stat">
        <div class="s-val">$${cfg.totalPot}</div>
        <div class="s-label">Pot</div>
      </div>
    </div>

    <div class="section-label">SCORE ENTRY</div>

    <button class="admin-action-btn" onclick="openScoreModal()">
      <span class="btn-icon">➕</span>
      <div>
        <div>Enter Episode ${nextEp} Scores</div>
        <div class="btn-sub">Select codes per show queen → auto-calculates all players</div>
      </div>
    </button>

    <div class="section-label">SEASON SETTINGS</div>

    <button class="admin-secondary-btn" onclick="showToast('🔒 Teams are locked — no edits allowed')">
      <span>${locked ? '🔒' : '🔓'}</span>
      <div>
        <div>Team Submissions</div>
        <div style="font-size:11px; color:var(--text-sub); margin-top:2px">${locked ? 'Locked — Episode 1 has aired' : 'Open — players can still edit'}</div>
      </div>
    </button>

    <button class="admin-secondary-btn" onclick="showToast('✉️ Reminder sent to all players!')">
      <span>📣</span>
      <div>
        <div>Notify All Players</div>
        <div style="font-size:11px; color:var(--text-sub); margin-top:2px">Push notification when scores are updated</div>
      </div>
    </button>

    <button class="admin-secondary-btn" onclick="showToast('📊 Season report exported!')">
      <span>📊</span>
      <div>
        <div>Export Season Report</div>
        <div style="font-size:11px; color:var(--text-sub); margin-top:2px">CSV with all episode scores</div>
      </div>
    </button>

    <div style="height:20px"></div>
  `;

  // Render the score modal (hidden by default)
  renderScoreModal();
}

// ── Score Entry Modal ────────────────────────────────────────
function renderScoreModal() {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;
  const activeQueens = SHOW_QUEENS.filter(q => !q.eliminated);

  // Initialize episode data
  if (!state.episodeData[nextEp]) {
    state.episodeData[nextEp] = {};
    activeQueens.forEach(q => { state.episodeData[nextEp][q.id] = []; });
  }

  const queenForms = activeQueens.map(queen => {
    const selected = state.episodeData[nextEp][queen.id] || [];
    const codesBtns = Object.entries(SCORING_RULES).map(([code, rule]) => {
      const isNeg = rule.points < 0;
      const isSel = selected.includes(code);
      return `
        <button class="code-toggle ${isNeg ? 'neg-code' : ''} ${isSel ? 'selected' : ''}"
                onclick="toggleCode(${queen.id}, '${code}')">
          ${code} (${rule.points > 0 ? '+' : ''}${rule.points})
        </button>
      `;
    }).join('');

    const initials = queen.name.split(' ').map(w=>w[0]).join('').slice(0,2);
    return `
      <div class="queen-score-entry">
        <div class="qse-name">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${queen.color};
            color:white;font-size:10px;font-weight:800;text-align:center;line-height:28px;margin-right:8px;
            vertical-align:middle">${initials}</span>
          ${queen.name}
        </div>
        <div class="qse-codes" id="codes-${queen.id}">${codesBtns}</div>
      </div>
    `;
  }).join('');

  const existing = document.getElementById('score-modal');
  const modal = existing || document.createElement('div');
  modal.id = 'score-modal';
  modal.className = 'modal-overlay' + (state.adminModal ? ' open' : '');
  modal.innerHTML = `
    <div class="modal-header">
      <button class="modal-back" onclick="closeScoreModal()">← Back</button>
      <div class="modal-title">Episode ${nextEp} Scores</div>
    </div>
    <div style="font-size:13px; color:var(--text-sub); padding:12px 14px 4px">
      Select the codes each queen earned this episode. Fantasy player scores update automatically.
    </div>
    ${queenForms}
    <div class="section-label">SCORE PREVIEW</div>
    <div class="preview-section" id="score-preview">
      <div class="preview-title">Changes to player scores</div>
      <div style="font-size:12px; color:var(--text-sub)">Select codes above to see preview.</div>
    </div>
    <button class="submit-btn" onclick="submitEpisodeScores()">
      ✓ Post Episode ${nextEp} Scores
    </button>
  `;

  const adminScreen = document.getElementById('screen-admin');
  if (!existing) adminScreen.appendChild(modal);
}

function toggleCode(queenId, code) {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;
  if (!state.episodeData[nextEp]) state.episodeData[nextEp] = {};
  if (!state.episodeData[nextEp][queenId]) state.episodeData[nextEp][queenId] = [];

  const arr = state.episodeData[nextEp][queenId];
  const idx = arr.indexOf(code);
  if (idx === -1) arr.push(code); else arr.splice(idx, 1);

  // Re-render just the buttons for this queen
  const container = document.getElementById(`codes-${queenId}`);
  if (container) {
    const selected = state.episodeData[nextEp][queenId];
    container.innerHTML = Object.entries(SCORING_RULES).map(([c, rule]) => {
      const isNeg = rule.points < 0;
      const isSel = selected.includes(c);
      return `
        <button class="code-toggle ${isNeg ? 'neg-code' : ''} ${isSel ? 'selected' : ''}"
                onclick="toggleCode(${queenId}, '${c}')">
          ${c} (${rule.points > 0 ? '+' : ''}${rule.points})
        </button>
      `;
    }).join('');
  }
  updateScorePreview();
}

function updateScorePreview() {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;
  const data   = state.episodeData[nextEp] || {};

  // Calculate delta per fantasy player based on their team + selected codes
  const deltas = FANTASY_PLAYERS.map(player => {
    let delta = 0;
    player.team.forEach(qid => {
      const codes = data[qid] || [];
      codes.forEach(code => { delta += codeToPoints(code); });
    });
    return { player, delta };
  }).filter(d => d.delta !== 0).sort((a,b) => b.delta - a.delta);

  const preview = document.getElementById('score-preview');
  if (!preview) return;

  if (deltas.length === 0) {
    preview.innerHTML = `
      <div class="preview-title">Changes to player scores</div>
      <div style="font-size:12px; color:var(--text-sub)">Select codes above to see preview.</div>
    `;
    return;
  }

  preview.innerHTML = `
    <div class="preview-title">Episode ${nextEp} point changes</div>
    ${deltas.map(({ player, delta }) => `
      <div class="preview-row">
        <div class="preview-name">${player.avatar} ${player.name}</div>
        <div class="preview-delta ${delta === 0 ? 'zero' : ''}">${delta > 0 ? '+' : ''}${delta} pts</div>
      </div>
    `).join('')}
  `;
}

function openScoreModal() {
  state.adminModal = true;
  const modal = document.getElementById('score-modal');
  if (modal) modal.classList.add('open');
}

function closeScoreModal() {
  state.adminModal = false;
  const modal = document.getElementById('score-modal');
  if (modal) modal.classList.remove('open');
}

function submitEpisodeScores() {
  const nextEp = SEASON_CONFIG.airedEpisodes + 1;
  const data   = state.episodeData[nextEp] || {};

  // Apply scores to state
  FANTASY_PLAYERS.forEach(player => {
    let pts = 0;
    const codeParts = [];
    player.team.forEach(qid => {
      const codes = data[qid] || [];
      codes.forEach(code => {
        pts += codeToPoints(code);
        codeParts.push(code);
      });
    });
    state.scores[player.id][nextEp] = pts;
    state.codes[player.id][nextEp] = codeParts.join(',');
  });

  // Advance episode count
  SEASON_CONFIG.airedEpisodes = nextEp;

  closeScoreModal();
  showToast(`✅ Episode ${nextEp} scores posted!`);

  // Re-render everything
  renderAll();
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

  // Re-render target screen
  renderScreen(tab);
}

function renderScreen(tab) {
  switch (tab) {
    case 'leaderboard': renderLeaderboard(); break;
    case 'myteam':      renderMyTeam();      break;
    case 'episodes':    renderEpisodes();     break;
    case 'rules':       renderRules();        break;
    case 'admin':       renderAdmin();        break;
  }
}

function renderAll() {
  renderScreen(state.currentTab);
}

function selectPlayer(id) {
  state.viewingPlayer = id;
  document.getElementById('player-select').value = id;
}

function toggleEpisode(num) {
  state.expandedEp = state.expandedEp === num ? null : num;
  renderEpisodes();
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Build player selector in sidebar
  const sel = document.getElementById('player-select');
  if (sel) {
    FANTASY_PLAYERS.forEach(p => {
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

  // Initial render
  renderAll();
});
