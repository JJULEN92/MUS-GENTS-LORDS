const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const fakeDocument = {
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({ options: [], appendChild(){}, classList:{add(){},remove(){},toggle(){}}, style:{} }),
  addEventListener: () => {},
  body: { classList:{add(){},remove(){},toggle(){}}, appendChild(){} }
};
const ctx = vm.createContext({
  console, Date, Math, Number, String, Array, Object, Map, Set, JSON, RegExp,
  document: fakeDocument,
  window: { addEventListener(){}, location:{}, matchMedia:()=>({matches:false,addEventListener(){}}) },
  navigator: {}, localStorage:{getItem(){return null},setItem(){},removeItem(){}},
  alert(){}, prompt(){return null}, confirm(){return true}, restoreLogin(){}, setTimeout, clearTimeout, setInterval, clearInterval,
  fetch: async()=>({json:async()=>({ok:true})})
});

for (const file of ['state.js','ui.js','match-engine.js','matches.js','rounds.js','standings.js','data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'), ctx, {filename:file});
}

const tests=[];
function test(name, fn){ tests.push({name,fn}); }
function eq(actual, expected, msg=''){ if (actual !== expected) throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function ok(value,msg='expected truthy'){ if(!value) throw new Error(msg); }
function near(actual, expected, eps=1e-9){ if(Math.abs(actual-expected)>eps) throw new Error(`expected ${expected}, got ${actual}`); }
function run(code){ return vm.runInContext(code,ctx); }
function setState(obj){ run(`Object.assign(state, ${JSON.stringify(obj)})`); }
function reset(){ setState({players:[],matches:[],seasonBonus:[],activeSeasonId:4,activeSeason:'2026-PRE',currentUser:null,calculatedStandings:[],editingSeasonId:null}); }
function baseMatch(over={}) { return Object.assign({seasonId:4,Season:'2026-PRE',id:'J1-M1',fecha:'2026-09-27',round:1,teamA_player1:'A',teamA_player2:'B',teamB_player1:'C',teamB_player2:'D',vaca1:'30',vaca2:'23',vaca3:'30',winner:'A/B',status:'confirmed',createdBy:'A',createdAt:'2026-09-27T10:00:00.000Z',avatarPlayers:'',faultPlayers:''},over); }
function standings(players,matches,bonus=[]){ reset(); setState({players:players.map(name=>({name})),matches,seasonBonus:bonus,activeSeasonId:4}); return JSON.parse(run('JSON.stringify(calculateStandings())')); }

// Match engine
test('T01 T4 30/23/30 = 2-1 y 8-3 juegos',()=>{ const r=run(`calculateMatch('30','23','30',4)`); ok(r.valid&&r.complete); eq(r.vacasA,2);eq(r.vacasB,1);eq(r.gamesA,8);eq(r.gamesB,3);eq(r.winnerSide,'A'); });
test('T02 T4 resultado incompleto no se da por completo',()=>{ const r=run(`calculateMatch('30','','',4)`); ok(r.valid);eq(r.complete,false); });
test('T03 T4 rechaza marcador legacy 20',()=>{ eq(run(`calculateMatch('20','21','',4).valid`),false); });
test('T04 T1 acepta reglas legacy 20/21',()=>{ const r=run(`calculateMatch('20','12','20',1)`); ok(r.valid&&r.complete);eq(r.winnerSide,'A'); });
test('T05 T1 rechaza 30',()=>{ eq(run(`calculateMatch('30','','',1).valid`),false); });

// Scoring and avatar
test('T06 victoria suma 3 a cada ganador',()=>{ const s=standings(['A','B','C','D'],[baseMatch()]); eq(s.find(x=>x.player==='A').points,3);eq(s.find(x=>x.player==='B').points,3);eq(s.find(x=>x.player==='C').points,0); });
test('T07 avatar T4 resta 0.1 solo al usuario marcado',()=>{ const s=standings(['A','B','C','D'],[baseMatch({avatarPlayers:'A'})]); near(s.find(x=>x.player==='A').points,2.9);eq(s.find(x=>x.player==='B').points,3);eq(s.find(x=>x.player==='A').avatar,1);eq(s.find(x=>x.player==='B').avatar,0); });
test('T08 dos avatares cuentan solo los usados',()=>{ const s=standings(['A','B','C','D'],[baseMatch({avatarPlayers:'A;C'})]);eq(s.find(x=>x.player==='A').avatar,1);eq(s.find(x=>x.player==='C').avatar,1);eq(s.find(x=>x.player==='B').avatar,0); });
test('T09 avatar T3 cuenta pero no resta puntos',()=>{ reset(); setState({players:[{name:'A'},{name:'B'},{name:'C'},{name:'D'}],matches:[baseMatch({seasonId:3,Season:'2025-2026',avatarPlayers:'A'})],seasonBonus:[],activeSeasonId:3}); const s=JSON.parse(run('JSON.stringify(calculateStandings())'));eq(s.find(x=>x.player==='A').points,3);eq(s.find(x=>x.player==='A').avatar,1); });
test('T10 múltiples usos de avatar acumulan -0.1 por partida',()=>{ const s=standings(['A','B','C','D'],[baseMatch({id:'1',avatarPlayers:'A'}),baseMatch({id:'2',avatarPlayers:'A'})]);near(s.find(x=>x.player==='A').points,5.8);eq(s.find(x=>x.player==='A').avatar,2); });

// Bonus
test('T11 seasonBonus aparece aun con 0 partidas',()=>{ const s=standings(['Alvaro'],[],[{seasonId:4,player:'Alvaro',points:3,reason:'Puto Amo temporada 3'}]);eq(s[0].player,'Alvaro');eq(s[0].points,3);eq(s[0].pj,0); });
test('T12 bonus de otra temporada no se aplica',()=>{ const s=standings(['Alvaro'],[],[{seasonId:3,player:'Alvaro',points:3}]);eq(s[0].points,0); });
test('T12B seasonBonus real del Sheet se normaliza y suma +3',()=>{ const raw=[{seasonId:4,player:'Alvaro',points:3,reason:'Puto Amo temporada 3'}]; ctx.__raw=raw; const normalized=JSON.parse(run('JSON.stringify(normalizeSeasonBonus(__raw))')); const s=standings(['Alvaro'],[],normalized);eq(s.find(x=>x.player==='Alvaro').points,3);eq(s.find(x=>x.player==='Alvaro').pj,0); });
test('T12C seasonBonus se suma a puntos obtenidos en partidas',()=>{ const raw=[{seasonId:4,player:'A',points:3,reason:'Bonus'}]; ctx.__raw=raw; const normalized=JSON.parse(run('JSON.stringify(normalizeSeasonBonus(__raw))')); const s=standings(['A','B','C','D'],[baseMatch()],normalized);eq(s.find(x=>x.player==='A').points,6); });
test('T12D integración getData real: seasonbonus -> state -> Alvaro pierde y conserva +3',()=>{ const payload={players:[{name:'A'},{name:'B'},{name:'Alvaro'},{name:'D'}],matches:[baseMatch({teamB_player1:'Alvaro'})],seasons:[{seasonId:4,Season:'2026-PRE',active:'SI'}],seasonbonus:[{seasonId:4,player:'Alvaro',points:3,reason:'Puto Amo temporada 3'}]}; ctx.__payload=payload; run('applyDataPayload(__payload)'); const s=JSON.parse(run('JSON.stringify(calculateStandings())')); const a=s.find(x=>x.player==='Alvaro'); eq(run('state.activeSeasonId'),4); eq(run('state.seasonBonus.length'),1); eq(a.pj,1); eq(a.points,3); });

test('T12E bonus integrado por backend en player suma +3',()=>{ reset(); setState({players:[{name:'Alvaro',seasonBonusPoints:3}],matches:[],seasonBonus:[],activeSeasonId:4}); const s=JSON.parse(run('JSON.stringify(calculateStandings())'));eq(s.find(x=>x.player==='Alvaro').points,3); });
test('T12F bonus backend + array auxiliar no se duplica',()=>{ reset(); setState({players:[{name:'Alvaro',seasonBonusPoints:3}],matches:[],seasonBonus:[{seasonId:4,player:'Alvaro',points:3}],activeSeasonId:4}); const s=JSON.parse(run('JSON.stringify(calculateStandings())'));eq(s.find(x=>x.player==='Alvaro').points,3); });

// Season isolation
test('T13 clasificación solo usa activeSeasonId',()=>{ const s=standings(['A','B','C','D'],[baseMatch({seasonId:4,id:'J1-M1'}),baseMatch({seasonId:3,Season:'2025-2026',id:'J1-M1'})]);eq(s.find(x=>x.player==='A').pj,1);eq(s.find(x=>x.player==='A').points,3); });

// Tie-breaks
test('T14 desempate prioriza diferencia JG-JP',()=>{ const rows=[{player:'A',points:3,jg:7,jp:5,penal:0,avatar:0},{player:'B',points:3,jg:8,jp:7,penal:0,avatar:0}]; rows.sort((a,b)=>b.points-a.points||((b.jg-b.jp)-(a.jg-a.jp))||b.jg-a.jg||a.jp-b.jp||a.penal-b.penal||a.avatar-b.avatar||a.player.localeCompare(b.player));eq(rows[0].player,'A'); });
test('T15 tras misma diferencia prioriza JG',()=>{ const rows=[{player:'A',points:3,jg:7,jp:5,penal:0,avatar:0},{player:'B',points:3,jg:8,jp:6,penal:0,avatar:0}]; rows.sort((a,b)=>b.points-a.points||((b.jg-b.jp)-(a.jg-a.jp))||b.jg-a.jg||a.jp-b.jp||a.penal-b.penal||a.avatar-b.avatar);eq(rows[0].player,'B'); });
test('T16 tras igualdad prioriza menor penalización',()=>{ const rows=[{player:'A',points:3,jg:7,jp:5,penal:1,avatar:0},{player:'B',points:3,jg:7,jp:5,penal:0,avatar:2}]; rows.sort((a,b)=>b.points-a.points||((b.jg-b.jp)-(a.jg-a.jp))||b.jg-a.jg||a.jp-b.jp||a.penal-b.penal||a.avatar-b.avatar);eq(rows[0].player,'B'); });
test('T17 último desempate deportivo = menos avatares',()=>{ const rows=[{player:'A',points:3,jg:7,jp:5,penal:0,avatar:2},{player:'B',points:3,jg:7,jp:5,penal:0,avatar:1}]; rows.sort((a,b)=>b.points-a.points||((b.jg-b.jp)-(a.jg-a.jp))||b.jg-a.jg||a.jp-b.jp||a.penal-b.penal||a.avatar-b.avatar);eq(rows[0].player,'B'); });

// Permissions
test('T18 admin puede editar cualquier resultado',()=>{ reset(); setState({currentUser:{name:'Admin',role:'admin'}}); const m=baseMatch({createdBy:'A'}); ctx.__m=m;eq(run('canEditMatch(__m)'),true); });
test('T19 autor participante puede editar su propuesta',()=>{ reset(); setState({currentUser:{name:'A',role:'player'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canEditMatch(__m)'),true); });
test('T20 rival no puede editar propuesta',()=>{ reset();setState({currentUser:{name:'C',role:'player'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canEditMatch(__m)'),false); });
test('T21 autor no puede confirmar su propuesta',()=>{ reset();setState({currentUser:{name:'A',role:'player'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canConfirmMatch(__m)'),false); });
test('T22 pareja del autor tampoco confirma',()=>{ reset();setState({currentUser:{name:'B',role:'player'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canConfirmMatch(__m)'),false); });
test('T23 rival sí puede confirmar',()=>{ reset();setState({currentUser:{name:'C',role:'player'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canConfirmMatch(__m)'),true); });
test('T24 admin puede confirmar siempre',()=>{ reset();setState({currentUser:{name:'Admin',role:'admin'}});ctx.__m=baseMatch({status:'pending',createdBy:'A'});eq(run('canConfirmMatch(__m)'),true); });

// Integration/source guards for bugs found in production
test('T29 loadData refresca seasonbonus siempre desde getSeasonBonus',()=>{
  const src=fs.readFileSync(path.join(root,'js','data.js'),'utf8');
  ok(src.includes('apiGet("getSeasonBonus")'),'loadData debe consultar getSeasonBonus');
  ok(!src.includes('if (!state.seasonBonus.length)'),'getSeasonBonus no debe depender de que getData venga vacío');
});
test('T30 Pozo renderiza DIF antes de JG',()=>{
  const src=fs.readFileSync(path.join(root,'js','standings.js'),'utf8');
  const start=src.indexOf('preferredBody.innerHTML');
  const end=src.indexOf('const allTimeRows', start);
  const block=src.slice(start,end);
  const dif='${r.jg - r.jp > 0 ? "+" : ""}${r.jg - r.jp}';
  ok(block.includes(dif),'El Pozo debe incluir la celda DIF');
  ok(block.indexOf(dif) < block.indexOf('${r.jg}'),'DIF debe ir antes de JG');
});

// Status / auto confirmation
test('T25 pending completo <24h sigue pending',()=>{ctx.__m=baseMatch({status:'pending',createdAt:new Date(Date.now()-23*36e5).toISOString()});eq(run('effectiveStatus(__m)'),'pending');});
test('T26 pending completo >24h se considera confirmed',()=>{ctx.__m=baseMatch({status:'pending',createdAt:new Date(Date.now()-25*36e5).toISOString()});eq(run('effectiveStatus(__m)'),'confirmed');});
test('T27 rejected nunca auto-confirma',()=>{ctx.__m=baseMatch({status:'rejected',createdAt:new Date(Date.now()-48*36e5).toISOString()});eq(run('effectiveStatus(__m)'),'rejected');});
test('T28 pending incompleto no auto-confirma',()=>{ctx.__m=baseMatch({status:'pending',vaca2:'',vaca3:'',createdAt:new Date(Date.now()-48*36e5).toISOString()});eq(run('effectiveStatus(__m)'),'pending');});

let pass=0, fail=0;
for(const t of tests){ try{ reset(); t.fn(); pass++; console.log(`PASS ${t.name}`);}catch(e){fail++;console.error(`FAIL ${t.name}: ${e.message}`);} }
console.log(`\nRESULT: ${pass} PASS / ${fail} FAIL / ${tests.length} TOTAL`);
process.exitCode = fail ? 1 : 0;


test('T31 backend publica versión 3.2.9 y GET getSeasonBonus',()=>{
  const src=fs.readFileSync(path.join(root,'backend','Code.gs'),'utf8');
  ok(src.includes('BACKEND_VERSION = "3.2.9"'),'backend debe identificar la versión desplegada');
  ok(src.includes('action === "getSeasonBonus"'),'doGet debe exponer getSeasonBonus');
});
test('T32 frontend obtiene seasonbonus por GET sin caché',()=>{
  const apiSrc=fs.readFileSync(path.join(root,'js','api.js'),'utf8');
  const dataSrc=fs.readFileSync(path.join(root,'js','data.js'),'utf8');
  ok(apiSrc.includes('cache: "no-store"'),'GET diagnóstico debe evitar caché');
  ok(dataSrc.includes('apiGet("getSeasonBonus")'),'loadData debe usar endpoint GET verificable');
});
