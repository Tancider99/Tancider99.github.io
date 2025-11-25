// js/stats_logic.js

let currentStatsData = [];
let sortCol = 'OPS';
let sortAsc = false;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    if (typeof NPB_STATS_DATA !== 'undefined') {
        processData();
        renderStatsTable();
    }
});

// ビュー切り替え
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewName}`).style.display = 'block';
    document.getElementById(`tab-${viewName}`).classList.add('active');
}

// データの加工・指標計算
function processData() {
    // data.js の terms から計算可能な指標を探す
    // 計算に必要なキーのマッピング (DBのキー -> termsのinput ID)
    const keyMap = {
        'PA': 'pa', 'AB': 'ab', 'H': 'h', '2B': 'd', '3B': 't', 'HR': 'hr',
        'BB': 'bb', 'HBP': 'hbp', 'SF': 'sf', 'SH': 'sh', 'SO': 'so'
    };

    currentStatsData = NPB_STATS_DATA.map(player => {
        // 基本スタッツを小文字キーに変換して計算用オブジェクトを作成
        const calcObj = {};
        Object.keys(player).forEach(k => {
            if(keyMap[k]) calcObj[keyMap[k]] = player[k];
        });
        // 塁打計算 (TB)
        calcObj.tb = (calcObj.h || 0) + (player['2B']||0) + (2*(player['3B']||0)) + (3*(player['HR']||0));
        // 単打 (S)
        calcObj.s = (calcObj.h || 0) - (player['2B']||0) - (player['3B']||0) - (player['HR']||0);

        // 計算したい指標リスト
        const metricsToCalc = ['avg', 'obp', 'slg', 'ops', 'iso', 'isod', 'bb_k', 'woba', 'rc27'];
        
        const computed = {};
        metricsToCalc.forEach(mid => {
            const term = terms.find(t => t.id === mid);
            if (term && term.calc) {
                try {
                    // 必要なデータが揃っているか確認しつつ計算
                    // ※ wOBAなどはリーグ定数が必要だが、data.jsのデフォルト値を使用する
                    let val = term.calc(calcObj);
                    if (val === "---" || isNaN(parseFloat(val))) val = 0.000;
                    computed[mid.toUpperCase()] = val; // 大文字キーで保存
                } catch(e) {
                    computed[mid.toUpperCase()] = "-";
                }
            }
        });

        return { ...player, ...computed };
    });
}

// テーブル描画
function renderStatsTable() {
    const tbody = document.getElementById('leaderboard');
    const searchText = document.getElementById('stats-search').value.toLowerCase();
    const filterReg = document.getElementById('filter-regulation').checked;

    // 表示するカラム定義
    const columns = [
        { key: 'Team', label: 'チーム' },
        { key: 'Name', label: '選手名' },
        { key: 'AVG', label: '打率', type: 'float' },
        { key: 'OPS', label: 'OPS', type: 'float', color: true },
        { key: 'HR', label: 'HR', type: 'int' },
        { key: 'wOBA', label: 'wOBA', type: 'float' }, // 新指標
        { key: 'RC27', label: 'RC27', type: 'float' }, // 新指標
        { key: 'ISO', label: 'ISO', type: 'float' },   // 新指標
        { key: 'IsoD', label: 'IsoD', type: 'float' }, // 新指標
        { key: 'BB_K', label: 'BB/K', type: 'float' }, // 新指標
        { key: 'PA', label: '打席', type: 'int' },
        { key: 'AB', label: '打数', type: 'int' },
        { key: 'H', label: '安打', type: 'int' },
        // RBI (打点) は除外
        { key: 'SO', label: '三振', type: 'int' },
        { key: 'BB', label: '四球', type: 'int' }
    ];

    // フィルタリングとソート
    let displayData = currentStatsData.filter(p => {
        const hitName = p.Name.toLowerCase().includes(searchText);
        const hitTeam = p.Team && p.Team.toLowerCase().includes(searchText);
        const isReg = !filterReg || p.PA >= 10; // 簡易規定打席: 10 (データが少ないため)
        return (hitName || hitTeam) && isReg;
    });

    displayData.sort((a, b) => {
        let va = a[sortCol], vb = b[sortCol];
        if (typeof va === 'string') va = parseFloat(va) || va;
        if (typeof vb === 'string') vb = parseFloat(vb) || vb;
        
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });

    // ヘッダー生成
    let html = '<thead><tr>';
    columns.forEach(col => {
        const mark = sortCol === col.key ? (sortAsc ? '▲' : '▼') : '';
        html += `<th onclick="changeSort('${col.key}')">${col.label} ${mark}</th>`;
    });
    html += '</tr></thead><tbody>';

    // ボディ生成
    displayData.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
            let val = row[col.key];
            let cls = '';
            
            // 色付け (OPSなどの基準)
            if (col.color) {
                const num = parseFloat(val);
                if (num >= 1.000) cls = 'val-elite';
                else if (num >= 0.800) cls = 'val-good';
            }
            
            html += `<td class="${cls}">${val}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';

    tbody.innerHTML = html;
}

function changeSort(key) {
    if (sortCol === key) sortAsc = !sortAsc;
    else {
        sortCol = key;
        sortAsc = false; // 数値は降順が自然
    }
    renderStatsTable();
}
