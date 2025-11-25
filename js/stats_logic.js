// js/stats_logic.js

let currentStatsData = [];
let sortCol = 'wRC_PLUS';
let sortAsc = false;

// 規定打席数 (143試合 * 3.1)
const REGULATION_PA = 443; 

// 球団別パークファクター (2024-2025想定 / data.js準拠)
const TEAM_PF = {
    'ヤクルト': 1.19, // 神宮
    'DeNA': 1.04,     // 横浜
    '広島': 0.99,     // マツダ
    '巨人': 0.97,     // 東京ドーム
    '阪神': 0.92,     // 甲子園
    '中日': 0.86,     // バンテリン
    '日本ハム': 1.06, // エスコン
    'ロッテ': 1.06,   // ZOZOマリン
    'ソフトバンク': 1.05, // PayPay
    '西武': 0.97,     // ベルーナ
    'オリックス': 0.95, // 京セラ
    '楽天': 0.94      // 楽天モバイル
};

document.addEventListener('DOMContentLoaded', () => {
    // データが読み込まれていれば初期化
    if (typeof NPB_STATS_DATA !== 'undefined') {
        initStatsBoard();
    } else {
        console.warn("Stats data not found.");
        const loading = document.getElementById('stats-loading');
        if(loading) loading.textContent = "データがありません";
    }
});

// タブ切り替え機能
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
        const hbp = p['死球'] || 0;
        const sf = p['犠飛'] || 0;
        const sh = p['犠打'] || 0;
        const hr = p['本塁打'] || 0;
        
        // 打数 = 打席 - (四球+死球+犠打+犠飛) ※妨害等は無視
        const ab = pa - (bb + hbp + sh + sf);

        acc.PA += pa;
        acc.AB += ab;
        acc.H += h;
        acc.BB += bb;
        acc.HBP += hbp;
        acc.SF += sf;
        acc.HR += hr;
        
        acc._2B += (p['二塁打'] || 0);
        acc._3B += (p['三塁打'] || 0);
        
        return acc;
    }, { PA:0, AB:0, H:0, BB:0, HBP:0, SF:0, HR:0, _2B:0, _3B:0 });

    // --- リーグ定数の計算 ---
    // wOBA Scale (一般的な値を使用)
    const woba_scale = 1.24;
    
    // リーグ平均 wOBA (Weightsは data.js の定義に合わせて精密化)
    // BB:0.692, HBP:0.73, 1B:0.865, 2B:1.334, 3B:1.725, HR:2.065
    const single = total.H - total._2B - total._3B - total.HR;
    
    const woba_numerator = 
        (0.692 * total.BB) + 
        (0.73  * total.HBP) + 
        (0.865 * single) + 
        (1.334 * total._2B) + 
        (1.725 * total._3B) + 
        (2.065 * total.HR);
        
    const woba_denominator = total.AB + total.BB + total.SF + total.HBP;
    
    const lg_woba = woba_denominator > 0 ? woba_numerator / woba_denominator : 0.320;
    
    // リーグ平均 R/PA (得点期待値)
    const lg_r_pa = 0.12; 

    console.log(`League Constants: wOBA=${lg_woba.toFixed(3)}, R/PA=${lg_r_pa}`);

    // --- 各選手の指標計算 ---
    currentStatsData = NPB_STATS_DATA.map(p => {
        const pa = p['打席'] || 0;
        const h = p['安打'] || 0;
        const bb = p['四球'] || 0;
        const hbp = p['死球'] || 0;
        const sf = p['犠飛'] || 0;
        const sh = p['犠打'] || 0;
        const hr = p['本塁打'] || 0;
        const _2b = p['二塁打'] || 0;
        const _3b = p['三塁打'] || 0;
        const so = p['三振'] || 0;
        
        const ab = pa - (bb + hbp + sh + sf);
        const single = h - _2b - _3b - hr;
        
        // wOBA (係数を統一)
        const w_num = (0.692 * bb) + (0.73 * hbp) + (0.865 * single) + (1.334 * _2b) + (1.725 * _3b) + (2.065 * hr);
        const w_den = ab + bb + sf + hbp;
        const woba = w_den > 0 ? w_num / w_den : 0;

        // wRAA = ((wOBA - lg_wOBA) / wOBA_Scale) * PA
        const wraa = woba_scale > 0 ? ((woba - lg_woba) / woba_scale) * pa : 0;

        // --- Park Factor 補正 ---
        const pf = TEAM_PF[p.Team] || 1.00;
        
        // PF補正係数 = (0.5 * PF) + (0.5 * (6 - PF) / 5)
        // ※本拠地50%・他球場平均(リーグ6球団)を想定した補正
        const home_ratio = 0.5;
        const pf_coef = (home_ratio * pf) + ((1 - home_ratio) * (6 - pf) / 5);
        
        // Park Adjustment (得点単位)
        // 球場補正値 = (1 - 補正係数) * リーグR/PA * 打席数
        // 打者有利な球場(PF>1)ならマイナス、不利な球場(PF<1)ならプラスの補正がかかる
        const parkAdj = (1 - pf_coef) * lg_r_pa * pa;

        // wRC+ = (((wRAA + ParkAdj) / PA + lg_R/PA) / lg_R/PA) * 100
        let wrc_plus = 0;
        if (pa > 0 && lg_r_pa > 0) {
            wrc_plus = (((wraa + parkAdj) / pa) + lg_r_pa) / lg_r_pa * 100;
        }

        const true_tb = h + _2b + (2*_3b) + (3*hr);
        const avg = ab > 0 ? h / ab : 0;
        const slg = ab > 0 ? true_tb / ab : 0;
        const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
        const ops = obp + slg;
        const iso = slg - avg;
        const bb_k = so > 0 ? bb / so : 0;

        return {
            ...p,
            AB: ab,
            H: h,
            HR: hr,
            PA_CALC: pa,
            wOBA: woba,
            wRC_PLUS: wrc_plus,
            AVG: avg,
            OBP: obp,
            SLG: slg,
            OPS: ops,
            ISO: iso,
            BB_K: bb_k
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

    // フィルタリング
    let data = currentStatsData.filter(p => {
        const matchName = !searchVal || p.Name.toLowerCase().includes(searchVal);
        const matchTeam = !teamVal || p.Team === teamVal;
        const limit = isReg ? REGULATION_PA : userPaVal;
        const matchPA = p.PA_CALC >= limit;
        return matchName && matchTeam && matchPA;
    });

    // ソート
    data.sort((a, b) => {
        let va = a[sortCol];
        let vb = b[sortCol];
        if (typeof va === 'undefined') va = -9999;
        if (typeof vb === 'undefined') vb = -9999;

        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });

    // HTML生成
    const columns = [
        { k: 'Team', label: 'チーム' },
        { k: 'Name', label: '選手名' },
        { k: 'wRC_PLUS', label: 'wRC+', type: 'int', color: true },
        { k: 'OPS', label: 'OPS', type: 'float3', color: true },
        { k: 'wOBA', label: 'wOBA', type: 'float3' },
        { k: 'AVG', label: '打率', type: 'float3' },
        { k: 'HR', label: 'HR', type: 'int' },
        { k: 'PA_CALC', label: '打席', type: 'int' },
        { k: 'AB', label: '打数', type: 'int' },
        { k: 'H', label: '安打', type: 'int' },
        { k: 'ISO', label: 'ISO', type: 'float3' },
        { k: 'BB_K', label: 'BB/K', type: 'float2' }
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
            html += '<tr>';
            columns.forEach(c => {
                let val = row[c.k];
                let display = val;
                let cls = '';

                if (c.type === 'float3') display = val.toFixed(3).replace(/^0/, '');
                if (c.type === 'float2') display = val.toFixed(2);
                if (c.type === 'int') display = Math.round(val);

                if (c.color) {
                    if (c.k === 'wRC_PLUS') {
                        if (val >= 160) cls = 'val-elite';
                        else if (val >= 140) cls = 'val-great';
                        else if (val >= 120) cls = 'val-good';
                        else if (val < 80) cls = 'val-bad';
                    }
                    if (c.k === 'OPS') {
                        if (val >= 1.0) cls = 'val-elite';
                        else if (val >= 0.9) cls = 'val-great';
                        else if (val >= 0.8) cls = 'val-good';
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
