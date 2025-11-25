// --- Career Simulation Logic ---

let careerMode = 'batter'; 

function openCareerSim() {
    const overlay = document.getElementById('career-overlay');
    renderCareerCreationUI();
    overlay.classList.add('active');
    closeModal();
}

function closeCareerSim() {
    document.getElementById('career-overlay').classList.remove('active');
}

function setCareerMode(mode) {
    careerMode = mode;
    renderCareerCreationUI();
}

function getRank(val) {
    if (val >= 90) return { rank: 'S', class: 'rank-s' };
    if (val >= 80) return { rank: 'A', class: 'rank-a' };
    if (val >= 70) return { rank: 'B', class: 'rank-b' };
    if (val >= 60) return { rank: 'C', class: 'rank-c' };
    if (val >= 53) return { rank: 'D', class: 'rank-d' };
    if (val >= 40) return { rank: 'E', class: 'rank-e' };
    if (val >= 20) return { rank: 'F', class: 'rank-f' };
    return { rank: 'G', class: 'rank-g' };
}

function updateRankDisplay(id, val) {
    const r = getRank(val);
    const labelEl = document.getElementById(`val-${id}`);
    const fillEl = document.getElementById(`fill-${id}`);
    
    if(labelEl && fillEl) {
        labelEl.innerHTML = `<span class="${r.class}" style="margin-right:8px; font-size:1.1em;">${r.rank}</span>${val}`;
        fillEl.style.width = `${val}%`;
        
        const colorMap = {
            'S': '#eab308', 'A': '#f97316', 'B': '#ef4444', 
            'C': '#f43f5e', 'D': '#10b981', 'E': '#3b82f6', 
            'F': '#64748b', 'G': '#94a3b8'
        };
        fillEl.style.background = colorMap[r.rank];
    }
}

function renderCareerCreationUI() {
    const content = document.getElementById('career-content');
    
    const isBat = careerMode === 'batter';
    const activeClassBat = isBat ? 'active' : '';
    const activeClassPit = !isBat ? 'active' : '';

    const params = isBat ? [
        {id:'contact', label:'ミート (Contact)', val:55, desc:'打率・コンタクト能力'},
        {id:'power', label:'パワー (Power)', val:55, desc:'本塁打・長打力'},
        {id:'speed', label:'走力 (Speed)', val:55, desc:'盗塁・内野安打・守備範囲'},
        {id:'arm', label:'肩力 (Arm)', val:55, desc:'補殺・守備貢献(UZR)'},
        {id:'defense', label:'守備力 (Fielding)', val:55, desc:'失策率・守備範囲'},
        {id:'catch', label:'捕球 (Error)', val:55, desc:'失策回避率'}
    ] : [
        {id:'velocity', label:'球速 (km/h)', val:145, min:120, max:170, desc:'最高球速・奪三振率'},
        {id:'control', label:'コントロール', val:55, desc:'与四球率・丁寧さ'},
        {id:'stamina', label:'スタミナ', val:55, desc:'投球回数・完投能力'},
        {id:'breaking', label:'変化球総変化量', val:3, min:0, max:20, desc:'空振り率・被打率'}
    ];

    const slidersHtml = params.map(p => {
        const isSpecial = (p.id === 'velocity' || p.id === 'breaking');
        const min = p.min || 1;
        const max = p.max || 100;
        
        let valDisplay = p.val;
        let rankHtml = '';
        
        if (!isSpecial) {
            const r = getRank(p.val);
            rankHtml = `<span class="${r.class}" style="margin-right:8px; font-size:1.1em;">${r.rank}</span>`;
        }
        
        let percent = ((p.val - min) / (max - min)) * 100;

        return `
            <div class="c-form-group">
                <div class="c-rank-label">
                    <span>${p.label}</span>
                    <span id="val-${p.id}">${rankHtml}${valDisplay}</span>
                </div>
                <div class="c-rank-bar">
                    <div class="c-rank-fill" id="fill-${p.id}" style="width:${percent}%"></div>
                    <input type="range" id="sim-${p.id}" min="${min}" max="${max}" value="${p.val}" class="c-rank-input"
                        oninput="
                            const v = parseInt(this.value);
                            const min = ${min}, max = ${max};
                            const pct = ((v - min) / (max - min)) * 100;
                            if(${!isSpecial}) {
                                updateRankDisplay('${p.id}', v);
                            } else {
                                document.getElementById('val-${p.id}').innerText = v;
                                document.getElementById('fill-${p.id}').style.width = pct + '%';
                            }
                        "
                    >
                </div>
            </div>
        `;
    }).join('');

    const posOptions = isBat 
        ? `<option value="c">キャッチャー</option><option value="1b">ファースト</option><option value="2b">セカンド</option><option value="3b">サード</option><option value="ss">ショート</option><option value="cf">センター</option><option value="lf">レフト</option><option value="rf">ライト</option><option value="dh">DH</option>`
        : `<option value="sp">先発 (Starter)</option><option value="rp">救援 (Reliever)</option>`;

    content.innerHTML = `
        <div class="career-grid">
            <div class="career-panel">
                <div class="career-title">
                    <div>
                        ${icons.save} PLAYER CREATION
                    </div>
                </div>
                
                <div class="role-tabs">
                    <div class="role-tab ${activeClassBat}" onclick="setCareerMode('batter')">野手</div>
                    <div class="role-tab ${activeClassPit}" onclick="setCareerMode('pitcher')">投手</div>
                </div>

                <div class="c-form-group">
                    <label class="c-label">選手名</label>
                    <input type="text" id="sim-name" class="c-input" placeholder="入力なしで「名無し選手」" value="">
                </div>

                <div class="c-form-group">
                    <div class="c-slider-row">
                        <span class="c-label" style="margin:0;">開始年齢</span>
                        <span class="c-slider-val" id="val-age">18歳</span>
                    </div>
                    <input type="range" id="sim-age" min="18" max="30" value="18" class="c-slider"
                        oninput="document.getElementById('val-age').innerText = this.value + '歳'">
                </div>

                <div class="c-form-group">
                    <label class="c-label">ポジション</label>
                    <select id="sim-pos" class="c-select">
                        ${posOptions}
                    </select>
                </div>

                <hr style="border:0; border-top:1px dashed #e2e8f0; margin:20px 0;">

                ${slidersHtml}

                <button class="calc-btn" style="background:#0f172a; margin-top:20px; box-shadow:0 4px 12px rgba(15,23,42,0.2);" onclick="runCareerSim()">
                    キャリアスタート
                </button>
            </div>

            <div class="career-panel" id="career-result-panel" style="min-height:500px; display:flex; align-items:center; justify-content:center; flex-direction:column; text-align:center; color:#94a3b8;">
                <div style="font-size:3rem; margin-bottom:15px; opacity:0.3; filter:grayscale(1);">🏟️</div>
                <div style="font-weight:700;">PLAYER SIMULATION</div>
                <div style="font-size:0.85rem; margin-top:8px;">
                    左側のパネルで能力を設定し、<br>プロ野球人生を開始してください。<br>
                    能力値はパワプロ風（S〜G）を参考にしています。
                </div>
            </div>
        </div>
    `;
    
    if(isBat) {
        ['contact','power','speed','arm','defense','catch'].forEach(id => updateRankDisplay(id, 55));
    } else {
        updateRankDisplay('control', 55);
        updateRankDisplay('stamina', 55);
    }
}

function runCareerSim() {
    let rawName = document.getElementById('sim-name').value;
    const name = rawName.trim() === "" ? "名無し選手" : rawName;
    
    const startAge = parseInt(document.getElementById('sim-age').value);
    const pos = document.getElementById('sim-pos').value;
    const isBat = careerMode === 'batter';

    let stats = {};
    if (isBat) {
        ['contact', 'power', 'speed', 'arm', 'defense', 'catch'].forEach(id => {
            stats[id] = parseInt(document.getElementById(`sim-${id}`).value);
        });
    } else {
        ['velocity', 'control', 'stamina', 'breaking'].forEach(id => {
            stats[id] = parseInt(document.getElementById(`sim-${id}`).value);
        });
    }

    let age = startAge;
    let active = true;
    let history = [];
    let career = isBat 
        ? { g:0, pa:0, ab:0, h:0, hr:0, rbi:0, sb:0, bb:0, so:0, war:0 }
        : { g:0, ip_outs:0, w:0, l:0, sv:0, hld:0, so:0, bb:0, war:0, er:0 };

    let peakWar = -999;

    while (active && age < 46) {
        let growth = 0;
        if (age < 24) growth = Math.random() * 4 + 1;
        else if (age < 28) growth = Math.random() * 2;
        else if (age < 32) growth = Math.random() * 1 - 1;
        else if (age < 36) growth = -Math.random() * 3 - 1;
        else growth = -Math.random() * 5 - 3;

        if (isBat) {
            Object.keys(stats).forEach(k => {
                stats[k] = Math.max(1, Math.min(100, stats[k] + growth));
            });
        } else {
            stats.velocity = Math.max(120, Math.min(170, stats.velocity + (growth * 0.5))); 
            ['control', 'stamina', 'breaking'].forEach(k => {
                stats[k] = Math.max(1, Math.min(100, stats[k] + growth));
            });
        }

        let abilityScore = 0;
        if (isBat) {
            abilityScore = (stats.contact + stats.power + stats.defense + stats.speed)/4;
        } else {
            let veloScore = (stats.velocity - 130) * 2;
            abilityScore = (veloScore + stats.control + stats.stamina + stats.breaking*5) / 4;
        }

        let season = {};
        let war = 0;

        if (abilityScore < 40) {
            season = isBat 
                ? { g:0, avg:'.---', hr:0, rbi:0, sb:0, ops:'.---', bb:0, so:0, uzr:'---' } 
                : { g:0, w:0, l:0, sv:0, hld:0, era:'-.--', so:0, whip:'-.--', ip:'0.0' };
            war = 0;
            if (age > 25 && Math.random() < 0.3) active = false; 
        } else {
            if (isBat) {
                let games = Math.floor(Math.min(143, (abilityScore - 30) * 2.5 + Math.random()*20));
                if(games > 143) games = 143;
                
                let pa = Math.floor(games * (3.5 + Math.random())); 
                let bb_pct = 0.05 + (stats.contact * 0.0005); 
                let bb = Math.floor(pa * bb_pct);
                let ab = pa - bb;

                let avg = 0.150 + (stats.contact * 0.002) + (Math.random()*0.04 - 0.02);
                let h = Math.floor(ab * avg);

                let hr_rate = Math.pow(stats.power, 2) / 180000;
                let hr = Math.floor(pa * hr_rate * (0.8 + Math.random()*0.4));

                let so_rate = 0.15 + (stats.power*0.0015) - (stats.contact*0.001);
                if(so_rate < 0.05) so_rate = 0.05;
                let so = Math.floor(pa * so_rate);

                let sb = Math.floor(games * (stats.speed > 60 ? (stats.speed-50)*0.02 : 0) * Math.random());
                let rbi = Math.floor(h*0.15 + hr*2.8 + Math.random()*10);

                let obp = pa>0 ? (h+bb)/pa : 0;
                let slg = ab>0 ? (h + hr*3)/ab : 0; 
                let ops = obp + slg;
                
                let defScore = (stats.defense*2 + stats.arm + stats.catch)/4;
                let uzr = (defScore - 50) * 0.5; 
                let posVal = {'ss':1, '2b':0.8, 'cf':0.5, '3b':0, 'rf':-0.5, 'lf':-0.8, '1b':-1, 'dh':-1.5, 'c':1.2}[pos] || 0;
                let effectiveUzr = uzr * (games/143);

                let wRAA = ((ops - 0.730) / 1.2) * pa * 0.1; 
                let rep = 20 * (pa/600);
                let posAdj = posVal * 10 * (games/143);
                war = (wRAA + effectiveUzr + posAdj + rep) / 10;
                if(war > 12) war = 12;

                let opsStr = ops.toFixed(3);
                if(ops < 1.0) opsStr = opsStr.replace(/^0/, ''); 

                season = { g:games, avg: avg.toFixed(3).replace(/^0/,''), hr, rbi, sb, bb, so, ops: opsStr, uzr: effectiveUzr.toFixed(1) };
                
                career.g += games; career.pa += pa; career.ab += ab; career.h += h; 
                career.hr += hr; career.rbi += rbi; career.sb += sb; career.bb += bb; career.so += so;
            } else {
                let isStarter = pos === 'sp';
                let games = isStarter ? Math.floor(Math.min(28, abilityScore/2.2)) : Math.floor(Math.min(70, abilityScore/1.1));
                
                let ipPerG = isStarter ? (4 + stats.stamina*0.05) : (0.5 + stats.stamina*0.01);
                let totalIp = games * ipPerG;
                let outs = Math.floor(totalIp * 3);
                
                let pitSkill = (stats.velocity-100)*1.5 + stats.control + stats.breaking*10;
                let baseEra = 6.00 - (pitSkill * 0.03); 
                let era = Math.max(0.80, baseEra + (Math.random()*1.5 - 0.75));
                
                let k9_velo = (stats.velocity - 130) * 0.15; 
                let k9_break = stats.breaking * 0.35;
                let k9 = 3.5 + k9_velo + k9_break;
                if(k9 > 16.0) k9 = 16.0;

                let so = Math.floor(totalIp * k9 / 9);
                if(so > outs) so = outs - 1; 

                let bb9 = 5.0 - (stats.control * 0.04); 
                if(bb9<1) bb9=1;
                let bb = Math.floor(totalIp * bb9 / 9);

                let whip = 1.30 + (era - 3.50)*0.1; 

                let w=0, l=0, sv=0, hld=0;
                if(isStarter) {
                    let winPct = 0.5 - (era - 3.50)*0.15;
                    let dec = games * 0.9;
                    w = Math.max(0, Math.floor(dec * winPct));
                    l = Math.max(0, Math.floor(dec * (1-winPct)));
                } else {
                    w = Math.floor(games * 0.1);
                    l = Math.floor(games * 0.1);
                    if (stats.velocity >= 150 || stats.breaking >= 10) {
                        sv = Math.floor(games * 0.6);
                    } else {
                        hld = Math.floor(games * 0.5);
                    }
                }

                let fip = era; 
                let raa = (4.50 - fip) * (totalIp/9);
                let rep = 20 * (totalIp/200);
                war = (raa + rep) / 10;

                let ipDisplay = Math.floor(outs/3) + (outs%3 === 0 ? "" : "." + (outs%3));

                season = { g:games, w, l, sv, hld, era: era.toFixed(2), so, whip: whip.toFixed(2), ip: ipDisplay };
                
                career.g += games; career.ip_outs += outs; career.w += w; career.l += l; 
                career.sv += sv; career.hld += hld; career.so += so; career.bb += bb; 
                career.er += (era * (outs/3) / 9);
            }
        }
        
        career.war += war;
        history.push({ age, ...season, war: war.toFixed(1) });

        if (war > peakWar) {
            peakWar = war;
            window.tempPeakStats = isBat ? {
                name: `${name} (${age}歳)`,
                pa: Math.floor(season.g*4), ab: Math.floor(season.g*4)-season.bb, 
                h: Math.floor((season.g*4-season.bb) * parseFloat(season.avg)), 
                hr: season.hr, sb: season.sb, bb: season.bb, so: season.so,
                stadium: 'avg', pos: pos
            } : {
                name: `${name} (${age}歳)`,
                ip: parseFloat(season.ip), 
                er: Math.floor(parseFloat(season.ip)*parseFloat(season.era)/9),
                so: season.so, bb: Math.floor(season.so/3), 
                h: Math.floor(season.so*0.8), hr: Math.floor(season.so/10),
                role: pos, stadium: 'avg'
            };
        }

        age++;
        if (age >= 45) active = false;
        if (age > 30 && war < 0 && Math.random() < 0.5) active = false;
    }

    const resultPanel = document.getElementById('career-result-panel');
    
    let bigStats = '';
    if (isBat) {
        let careerAvg = career.ab ? (career.h / career.ab).toFixed(3).replace(/^0/,'') : '.---';
        bigStats = `
            <div class="c-big-stat"><div class="c-big-val">${career.h}</div><div class="c-big-lbl">安打</div></div>
            <div class="c-big-stat"><div class="c-big-val">${career.hr}</div><div class="c-big-lbl">本塁打</div></div>
            <div class="c-big-stat"><div class="c-big-val">${careerAvg}</div><div class="c-big-lbl">打率</div></div>
            <div class="c-big-stat"><div class="c-big-val">${career.sb}</div><div class="c-big-lbl">盗塁</div></div>
            <div class="c-big-stat"><div class="c-big-val" style="color:#d97706;">${career.war.toFixed(1)}</div><div class="c-big-lbl">通算WAR</div></div>
        `;
    } else {
        let careerIp = Math.floor(career.ip_outs/3) + (career.ip_outs%3===0 ? "" : "." + (career.ip_outs%3));
        bigStats = `
            <div class="c-big-stat"><div class="c-big-val">${career.w}</div><div class="c-big-lbl">勝利</div></div>
            <div class="c-big-stat"><div class="c-big-val">${career.sv}</div><div class="c-big-lbl">セーブ</div></div>
            <div class="c-big-stat"><div class="c-big-val">${career.so}</div><div class="c-big-lbl">奪三振</div></div>
            <div class="c-big-stat"><div class="c-big-val">${careerIp}</div><div class="c-big-lbl">投球回</div></div>
            <div class="c-big-stat"><div class="c-big-val" style="color:#d97706;">${career.war.toFixed(1)}</div><div class="c-big-lbl">通算WAR</div></div>
        `;
    }

    const th = isBat 
        ? `<th>年齢</th><th>試合</th><th>打率</th><th>HR</th><th>打点</th><th>盗塁</th><th>四球</th><th>三振</th><th>OPS</th><th>UZR</th><th>WAR</th>`
        : `<th>年齢</th><th>登板</th><th>勝</th><th>敗</th><th>S</th><th>H</th><th>回</th><th>防率</th><th>奪三振</th><th>WHIP</th><th>WAR</th>`;

    const rows = history.map(h => {
        const w = parseFloat(h.war);
        const style = w >= 5.0 ? 'background:#fff7ed;' : '';
        const warClass = w >= 8.0 ? 'val-outstanding' : (w >= 5.0 ? 'val-great' : (w >= 2.0 ? 'val-good' : ''));
        
        if (isBat) {
            return `<tr style="${style}">
                <td>${h.age}</td><td>${h.g}</td><td>${h.avg}</td><td>${h.hr}</td><td>${h.rbi}</td><td>${h.sb}</td>
                <td>${h.bb}</td><td>${h.so}</td><td>${h.ops}</td><td>${h.uzr}</td>
                <td class="${warClass}">${h.war}</td>
            </tr>`;
        } else {
            return `<tr style="${style}">
                <td>${h.age}</td><td>${h.g}</td><td>${h.w}</td><td>${h.l}</td><td>${h.sv}</td><td>${h.hld}</td>
                <td>${h.ip}</td><td>${h.era}</td><td>${h.so}</td><td>${h.whip}</td>
                <td class="${warClass}">${h.war}</td>
            </tr>`;
        }
    }).join('');

    resultPanel.innerHTML = `
        <div style="width:100%;">
            <div class="career-title" style="justify-content:center; border:none; font-size:1.5rem;">
                ${name} <span style="font-size:0.9rem; font-weight:normal; margin-left:10px; color:#64748b;">${pos.toUpperCase()} / ${history.length}年</span>
            </div>
            
            <div class="c-result-header">
                ${bigStats}
            </div>
            
            <div class="c-history-wrap">
                <table class="c-table">
                    <thead><tr>${th}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>

            <div style="margin-top:20px; text-align:center;">
                <button class="calc-btn" style="background:#3b82f6; width:auto; padding:10px 30px;" onclick="savePeakStats()">
                    全盛期データを保存
                </button>
            </div>
        </div>
    `;
}
