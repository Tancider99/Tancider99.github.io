// js/stats_logic.js

let currentStatsData = [];
let sortCol = 'wRC_PLUS';
let sortAsc = false;

// 規定打席数 (143試合 * 3.1)
const REGULATION_PA = 443; 

// 球団別パークファクター (2024-2025想定)
const TEAM_PF = {
    'ヤクルト': 1.19, 'DeNA': 1.04, '広島': 0.99, '巨人': 0.97, '阪神': 0.92, '中日': 0.86,
    '日本ハム': 1.06, 'ロッテ': 1.06, 'ソフトバンク': 1.05, '西武': 0.97, 'オリックス': 0.95, '楽天': 0.94
};

// チームカラー定義
const TEAM_COLORS = {
    '巨人': '#F97709', 'ヤクルト': '#00AC5B', 'DeNA': '#0055A5', '中日': '#002B6F', '阪神': '#F5C700', '広島': '#FF0000',
    '日本ハム': '#4C7B98', '楽天': '#860038', '西武': '#1F366A', 'ロッテ': '#333333', 'オリックス': '#B08E52', 'ソフトバンク': '#F9D324'
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof NPB_STATS_DATA !== 'undefined') {
        initStatsBoard();
    } else {
        console.warn("Stats data not found.");
        const loading = document.getElementById('stats-loading');
        if(loading) loading.textContent = "データがありません";
    }
});

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.style.display = 'block';
    
    const targetTab = document.getElementById(`tab-${viewName}`);
    if (targetTab) targetTab.classList.add('active');
}

function initStatsBoard() {
    const teamSelect = document.getElementById('filter-team');
    if (!teamSelect) return;

    const teams = [...new Set(NPB_STATS_DATA.map(p => p.Team).filter(t => t))];
    teams.forEach(t => {
        const op = document.createElement('option');
        op.value = t;
        op.textContent = t;
        teamSelect.appendChild(op);
    });

    calculateAdvancedStats();

    const loading = document.getElementById('stats-loading');
    if(loading) loading.style.display = 'none';
    
    renderStatsTable();
}

function calculateAdvancedStats() {
    // --- リーグ全体の合計値を算出 ---
    const total = NPB_STATS_DATA.reduce((acc, p) => {
        const pa = p['打席'] || 0;
        const h = p['安打'] || 0;
        const bb = p['四球'] || 0;
        const ibb = p['申告敬遠'] || 0;
        const hbp = p['死球'] || 0;
        const sf = p['犠飛'] || 0;
        const sh = p['犠打'] || 0;
        const hr = p['本塁打'] || 0;
        const _2b = p['二塁打'] || 0;
        const _3b = p['三塁打'] || 0;
        
        const ab = pa - (bb + hbp + sh + sf);
        const tb = h + _2b + (2 * _3b) + (3 * hr);

        acc.PA += pa; acc.AB += ab; acc.H += h; acc.BB += bb; acc.IBB += ibb;
        acc.HBP += hbp; acc.SF += sf; acc.HR += hr; acc._2B += _2b; acc._3B += _3b; acc.TB += tb;
        return acc;
    }, { PA:0, AB:0, H:0, BB:0, IBB:0, HBP:0, SF:0, HR:0, _2B:0, _3B:0, TB:0 });

    // --- リーグ定数の計算 ---
    const woba_scale = 1.24;
    const single = total.H - total._2B - total._3B - total.HR;
    const ubb = total.BB - total.IBB; 

    const woba_numerator = 
        (0.692 * ubb) + (0.73  * total.HBP) + (0.865 * single) + 
        (1.334 * total._2B) + (1.725 * total._3B) + (2.065 * total.HR);
        
    const woba_denominator = total.AB + total.BB - total.IBB + total.SF + total.HBP;
    const lg_woba = woba_denominator > 0 ? woba_numerator / woba_denominator : 0.320;

    const on_base = total.H + total.BB + total.HBP;
    const advance = total.TB;
    const opportunity = total.AB + total.BB + total.HBP + total.SF;
    const estimated_runs = (opportunity > 0) ? (on_base * advance) / opportunity : 0;
    const lg_r_pa = (total.PA > 0) ? estimated_runs / total.PA : 0.11;

    console.log(`League Constants: wOBA=${lg_woba.toFixed(3)}, Est.Runs=${Math.round(estimated_runs)}, R/PA=${lg_r_pa.toFixed(3)}`);

    // --- 各選手の指標計算 ---
    currentStatsData = NPB_STATS_DATA.map(p => {
        const pa = p['打席'] || 0;
        const h = p['安打'] || 0;
        const bb = p['四球'] || 0;
        const ibb = p['申告敬遠'] || 0;
        const hbp = p['死球'] || 0;
        const sf = p['犠飛'] || 0;
        const sh = p['犠打'] || 0;
        const hr = p['本塁打'] || 0;
        const _2b = p['二塁打'] || 0;
        const _3b = p['三塁打'] || 0;
        const so = p['三振'] || 0;
        
        const ab = pa - (bb + hbp + sh + sf);
        const single = h - _2b - _3b - hr;
        const ubb = bb - ibb;

        const go_out = p['ゴロ'] || 0;
        const fo_out = (p['外野フライ'] || 0) + (p['内野フライ'] || 0);
        const lo_out = p['ライナー'] || 0;
        const e_inf = p['内野手捕手エラー'] || 0;
        const e_out = p['外野手エラー'] || 0;
        const fc_inf = p['内野手捕手野選'] || 0;

        // wRC+
        const w_den = ab + bb - ibb + sf + hbp;
        const w_num = (0.692 * ubb) + (0.73 * hbp) + (0.865 * single) + (1.334 * _2b) + (1.725 * _3b) + (2.065 * hr);
        const woba = w_den > 0 ? w_num / w_den : 0;
        const wraa = woba_scale > 0 ? ((woba - lg_woba) / woba_scale) * pa : 0;
        const pf = TEAM_PF[p.Team] || 1.00;
        const pf_coef = (0.5 * pf) + 0.5;
        const park_adj = (1 - pf_coef) * lg_r_pa * pa;
        
        let wrc_plus = 0;
        if (pa > 0 && lg_r_pa > 0) {
            wrc_plus = (((wraa + park_adj) / pa) + lg_r_pa) / lg_r_pa * 100;
        }

        // GB%, FB%, LD%
        const raw_gb = go_out + 0.5*single + 0.1*_2b + 0.8*e_inf + 0.9*fc_inf;
        const raw_fb = fo_out + 0.3*single + 0.8*_2b + _3b + hr + e_out;
        const raw_ld = lo_out + 0.2*single + 0.1*_2b + 0.2*e_inf + 0.1*fc_inf;
        const total_batted = raw_gb + raw_fb + raw_ld;
        const gb_pct = total_batted > 0 ? (raw_gb / total_batted) * 100 : 0;
        const fb_pct = total_batted > 0 ? (raw_fb / total_batted) * 100 : 0;
        const ld_pct = total_batted > 0 ? (raw_ld / total_batted) * 100 : 0;

        // ISO
        const true_tb = h + _2b + (2*_3b) + (3*hr);
        const slg = ab > 0 ? true_tb / ab : 0;
        const avg = ab > 0 ? h / ab : 0;
        const iso = slg - avg;

        // K% (K_PCT)
        const k_pct_val = pa > 0 ? (so / pa) * 100 : 0;

        return {
            ...p,
            H: h, HR: hr, PA_CALC: pa,
            wOBA: woba, wRC_PLUS: wrc_plus, ISO: iso,
            K_PCT: k_pct_val,
            GB_PCT: gb_pct, FB_PCT: fb_pct, LD_PCT: ld_pct
        };
    });
}

function renderStatsTable() {
    const tbody = document.getElementById('leaderboard');
    if (!tbody) return;

    const searchInput = document.getElementById('stats-search');
    const teamSelect = document.getElementById('filter-team');
    const paInput = document.getElementById('filter-pa');
    const regCheck = document.getElementById('filter-regulation');

    const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
    const teamVal = teamSelect ? teamSelect.value : '';
    const userPaVal = paInput ? (parseInt(paInput.value) || 0) : 0;
    const isReg = regCheck ? regCheck.checked : true;

    let data = currentStatsData.filter(p => {
        const matchName = !searchVal || p.Name.toLowerCase().includes(searchVal);
        const matchTeam = !teamVal || p.Team === teamVal;
        const limit = isReg ? REGULATION_PA : userPaVal;
        const matchPA = p.PA_CALC >= limit;
        return matchName && matchTeam && matchPA;
    });

    data.sort((a, b) => {
        let va = a[sortCol];
        let vb = b[sortCol];
        if (typeof va === 'undefined') va = -9999;
        if (typeof vb === 'undefined') vb = -9999;
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });

    // カラム定義 (BB_K -> K_PCTに変更)
    const columns = [
        { k: 'Team', label: 'チーム' },
        { k: 'Name', label: '選手名' },
        { k: 'wRC_PLUS', label: '推定wRC+', type: 'int', color: true },
        { k: 'wOBA', label: '推定wOBA', type: 'float3' },
        { k: 'ISO', label: 'ISO', type: 'float3' },
        { k: 'GB_PCT', label: '推定GB%', type: 'pct' },
        { k: 'FB_PCT', label: '推定FB%', type: 'pct' },
        { k: 'LD_PCT', label: '推定LD%', type: 'pct' },
        { k: 'HR', label: 'HR', type: 'int' },
        { k: 'PA_CALC', label: '打席', type: 'int' },
        { k: 'H', label: '安打', type: 'int' },
        { k: 'K_PCT', label: 'K%', type: 'pct' } // K%に変更
    ];

    let html = '<thead><tr>';
    columns.forEach(c => {
        const mark = sortCol === c.k ? (sortAsc ? '▲' : '▼') : '';
        html += `<th onclick="changeSort('${c.k}')">${c.label} ${mark}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (data.length === 0) {
        html += '<tr><td colspan="12" style="text-align:center; padding:20px;">該当する選手がいません</td></tr>';
    } else {
        data.forEach(row => {
            const teamColor = TEAM_COLORS[row.Team] || 'transparent';
            // チームカラーの左ボーダーと薄い背景色を適用
            html += `<tr style="border-left: 4px solid ${teamColor}; background: linear-gradient(90deg, ${teamColor}11 0%, transparent 30%);">`;
            
            columns.forEach(c => {
                let val = row[c.k];
                let display = val;
                let cls = '';

                if (c.type === 'float3') display = val.toFixed(3).replace(/^0/, '');
                if (c.type === 'float2') display = val.toFixed(2);
                if (c.type === 'int') display = Math.round(val);
                if (c.type === 'pct') display = val.toFixed(1) + '%';

                if (c.color) {
                    if (c.k === 'wRC_PLUS') {
                        if (val >= 160) cls = 'val-elite';
                        else if (val >= 140) cls = 'val-great';
                        else if (val >= 120) cls = 'val-good';
                        else if (val < 80) cls = 'val-bad';
                    }
                }
                html += `<td class="${cls}">${display}</td>`;
            });
            html += '</tr>';
        });
    }
    html += '</tbody>';
    tbody.innerHTML = html;
}

function changeSort(key) {
    if (sortCol === key) sortAsc = !sortAsc;
    else {
        sortCol = key;
        sortAsc = false;
    }
    renderStatsTable();
}
