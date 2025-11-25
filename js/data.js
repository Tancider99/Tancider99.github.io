// --- Data Helper ---
const formatVar = (text) => `<span class="var">${text}</span>`;

// --- Constants (Default Values) ---
const DEFAULTS = {
    LG_PA: 28500, LG_RUNS: 2800, LG_HITS: 6900,
    LG_2B: 1150, LG_3B: 120, LG_HR: 485, LG_BB: 2300,
    LG_AB: 28750, LG_HBP: 300, LG_SF: 190, LG_SH: 550
};

// --- 統一された詳細設定の定義 (11項目) ---
const ADVANCED_LEAGUE_INPUTS = [
    {id:'lg_pa', label:'リーグ総打席', type:'number', advanced:true, default: DEFAULTS.LG_PA},
    {id:'lg_runs', label:'リーグ総得点', type:'number', advanced:true, default: DEFAULTS.LG_RUNS},
    {id:'lg_ab', label:'リーグ総打数', type:'number', advanced:true, default: DEFAULTS.LG_AB}, 
    {id:'lg_hits', label:'リーグ総安打', type:'number', advanced:true, default: DEFAULTS.LG_HITS},
    {id:'lg_2b', label:'リーグ総二塁打', type:'number', advanced:true, default: DEFAULTS.LG_2B},
    {id:'lg_3b', label:'リーグ総三塁打', type:'number', advanced:true, default: DEFAULTS.LG_3B},
    {id:'lg_hr', label:'リーグ総本塁打', type:'number', advanced:true, default: DEFAULTS.LG_HR},
    {id:'lg_bb', label:'リーグ総四球', type:'number', advanced:true, default: DEFAULTS.LG_BB},
    {id:'lg_hbp', label:'リーグ総死球', type:'number', advanced:true, default: DEFAULTS.LG_HBP},
    {id:'lg_sf', label:'リーグ総犠飛', type:'number', advanced:true, default: DEFAULTS.LG_SF},
    {id:'lg_sh', label:'リーグ総犠打', type:'number', advanced:true, default: DEFAULTS.LG_SH}
];

// Park Factors
const PARK_FACTORS = {
    'avg': {name: '平均', pf: 1.00},
    'jingu': {name: '明治神宮', pf: 1.19},
    'yoko': {name: '横浜', pf: 1.04},
    'mazda': {name: 'マツダ', pf: 0.99},
    'tokyo': {name: '東京ドーム', pf: 0.97},
    'koshien': {name: '甲子園', pf: 0.92},
    'nagoya': {name: 'バンテリン', pf: 0.86},
    'escon': {name: 'エスコン', pf: 1.06},
    'zozo': {name: 'ZOZOマリン', pf: 1.06},
    'paypay': {name: 'PayPay', pf: 1.05},
    'belluna': {name: 'ベルーナ', pf: 0.97},
    'kyocera': {name: '京セラ', pf: 0.95},
    'rakuten': {name: '楽天モバイル', pf: 0.94}
};

// Icon Definitions
const icons = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    barChart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="10" y2="18"/><line x1="8" x2="8" y1="10" y2="18"/><line x1="12" x2="12" y1="10" y2="18"/><line x1="8" x2="16" y1="14" y2="14"/></svg>`,
    gear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.44a2 2 0 0 1-2 2h-.44a2 2 0 0 0-2 2v.44a2 2 0 0 1-2 2H2v.44a2 2 0 0 0 2 2h.44a2 2 0 0 1 2 2v.44a2 2 0 0 0 2 2h.44a2 2 0 0 1 2 2v.44a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.44a2 2 0 0 1 2-2h.44a2 2 0 0 0 2-2v-.44a2 2 0 0 1 2-2h.44v-.44a2 2 0 0 0-2-2h-.44a2 2 0 0 1-2-2v-.44a2 2 0 0 0-2-2h-.44a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="m12 3-1.83 2.66-2.67 1.84 2.67 1.84L12 13l1.83-2.66 2.67-1.84-2.67-1.84L12 3z"/><path d="m20.2 16.2-1.22 1.8-1.78 1.22 1.78 1.22 1.22 1.8 1.22-1.8 1.78-1.22-1.78-1.22-1.22-1.8z"/><path d="m4.64 10.36-1.15 1.68-1.57 1.08 1.57 1.08 1.15 1.68 1.15-1.68 1.57-1.08-1.57-1.08-1.15-1.68z"/></svg>`,
    loader: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 3h6"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-copy"><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 22v-3a3 3 0 0 0-3-3l-2.5 2.5"/><path d="M8 13l2.5 2.5"/></svg>`
};

// --- Terms Database ---
const terms = [

            
];
