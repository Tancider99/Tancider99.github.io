// --- Core Logic Functions ---

// 派生定数の計算 (Derived Constants)
function calcDerived(d) {
    // 基本入力値
    const lg_hr = d.lg_hr || DEFAULTS.LG_HR;
    const lg_bb = d.lg_bb || DEFAULTS.LG_BB;
    // 詳細パラメータ
    const lg_ab = d.lg_ab || DEFAULTS.LG_AB;
    const lg_hbp = d.lg_hbp || DEFAULTS.LG_HBP;
    const lg_sf = d.lg_sf || DEFAULTS.LG_SF;
    const lg_sh = d.lg_sh || DEFAULTS.LG_SH;
    
    // その他のリーグ統計
    const lg_pa = d.lg_pa || DEFAULTS.LG_PA;
    const lg_runs = d.lg_runs || DEFAULTS.LG_RUNS;
    const lg_hits = d.lg_hits || DEFAULTS.LG_HITS;
    const lg_2b = d.lg_2b || DEFAULTS.LG_2B;
    const lg_3b = d.lg_3b || DEFAULTS.LG_3B;

    // --- リーグ詳細データの計算 ---
    const lg_ibb = lg_bb * 0.03; 
    const lg_roe = Math.max(0, lg_pa - (lg_ab + lg_bb + lg_hbp + lg_sf + lg_sh));
    const lg_1b = lg_hits - lg_2b - lg_3b - lg_hr;
    const lg_obp = (lg_hits + lg_bb + lg_hbp) / (lg_ab + lg_bb + lg_hbp + lg_sf);

    // 推定: リーグ三振数 (PAの約18%)
    const lg_so = lg_pa * 0.18;
    
    // 推定: リーグ打球数 (Batted Balls)
    const lg_batted = lg_pa - lg_bb - lg_hbp - lg_so;
    
    // 推定: リーグ外野フライ数 (ユーザー指定: FB% 45%, GB% 45%, LD% 10%)
    const lg_fb_est = lg_batted * 0.45;

    // --- wOBA計算 (基準係数: wOBA Scale=1.28想定) ---
    const woba_denom = lg_ab + lg_bb - lg_ibb + lg_hbp + lg_sf;
    
    const woba_num_std = 
        0.692 * (lg_bb - lg_ibb) +
        0.73  * lg_hbp +
        0.966 * lg_roe +
        0.865 * lg_1b +
        1.334 * lg_2b +
        1.725 * lg_3b +
        2.065 * lg_hr;
        
    const lg_woba_std = woba_denom > 0 ? woba_num_std / woba_denom : 0;

    // --- 係数補正比率 (Fitting Ratio) ---
    const fitting_ratio = (lg_woba_std > 0 && lg_obp > 0) ? (lg_obp / lg_woba_std) : 1.0;
    const lg_woba = lg_woba_std * fitting_ratio;

    // --- wOBA Scale ---
    const woba_scale = 1.28 * fitting_ratio;

    // --- その他パラメータ ---
    const lg_r_pa = lg_runs / lg_pa;
    const est_lg_ip = lg_pa / 4.25;
    const rpw = 20 * (lg_runs / est_lg_ip);
    const rep_per_pa = 0.12 * (lg_woba / woba_scale);
    
    const lg_tra = (lg_runs / est_lg_ip) * 9 * 0.92;

    // --- xFIP定数 & 比率の計算 ---
    const lg_xfip_ratio = lg_hr / lg_fb_est;
    const lg_ra9 = (lg_runs / est_lg_ip) * 9;
    const lg_era_est = lg_ra9 * 0.92;
    const lg_xfip_component = (13 * lg_xfip_ratio * lg_fb_est + 3 * (lg_bb - lg_ibb + lg_hbp) - 2 * lg_so) / est_lg_ip;
    const xfip_constant = lg_era_est - lg_xfip_component;

    // --- tRA定数の計算 ---
    let lg_bip = lg_pa - lg_bb - lg_hbp - lg_so - lg_hr;
    if (lg_bip < 0) lg_bip = 0;

    const lg_gb = lg_bip * 0.45;
    const lg_ld = lg_bip * 0.21;
    const lg_fb_system = lg_bip * 0.34;
    const lg_pu = lg_fb_system * 0.10; 
    const lg_fb = lg_fb_system - lg_pu; 

    const lg_tra_num = 
        0.297 * lg_bb + 
        0.327 * lg_hbp - 
        0.108 * lg_so + 
        1.401 * lg_hr + 
        0.036 * lg_gb - 
        0.124 * lg_pu + 
        0.132 * lg_fb + 
        0.289 * lg_ld;

    const lg_tra_denom = 
        lg_so + 
        0.745 * lg_gb + 
        0.304 * lg_ld + 
        0.994 * lg_pu + 
        0.675 * lg_fb;
    
    let tra_constant = 0;
    if (lg_tra_denom > 0) {
        const lg_tra_raw = (lg_tra_num / lg_tra_denom) * 27;
        tra_constant = lg_ra9 - lg_tra_raw;
    }

    return { 
        lg_r_pa, rpw, rep_per_pa, lg_woba, lg_tra, woba_scale, fitting_ratio, 
        xfip_constant, lg_xfip_ratio, lg_fb_est, tra_constant, lg_ra9, lg_era_est
    };
}

// 打球内訳の推定ロジック
function estimateBattedBalls(d) {
    const lg_hr = d.lg_hr || DEFAULTS.LG_HR;

    let bf = d.bf;
    if (!bf) {
        bf = d.ip * 4.20; 
    }

    const so = d.so || (d.ip * 0.8);
    const bb = d.bb || (d.ip * 0.3);
    const hbp = d.hbp || 0;
    const hr = d.hr || 0;

    let bip = bf - so - bb - hbp - hr;
    if (bip < 0) bip = 0;

    let gb_pct_val = 45; 
    if (d.gb_type) {
        gb_pct_val = parseFloat(d.gb_type);
    }

    const gb_rate = gb_pct_val / 100;
    const ld_rate = 0.21; 
    
    let fb_system_rate = 1.0 - gb_rate - ld_rate;
    if (fb_system_rate < 0) fb_system_rate = 0;

    const iffb_rate = 0.10; 

    const gb = bip * gb_rate;
    const ld = bip * ld_rate;
    const fb_total = bip * fb_system_rate;
    const pu = fb_total * iffb_rate;
    const fb = fb_total - pu;

    d.gb = gb;
    d.ld = ld;
    d.fb = fb;
    d.pu = pu;
    d.bf = bf;
    d.hr = hr;
    d.est_done = true;

    return d;
}

// 詳細スタッツの計算 (Calculate Details from Inputs)
function estimateDetails(d) {
    const ibb = d.bb * 0.04;
    const roe = Math.max(0, d.pa - (d.ab + d.bb + d.hbp + d.sf + d.sh));

    const h = d.h || 0;
    const d_val = d.d || 0;
    const t = d.t || 0;
    const hr = d.hr || 0;
    const s = h - d_val - t - hr;

    return { ibb, roe, s };
}co
