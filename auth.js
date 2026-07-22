// ============================================================
// SPLASH + LOGIN COM PIN + SINCRONIZAÇÃO NA NUVEM (Firebase)
// ============================================================

const LOCAL_KEYS = ['maryeve_ordens', 'maryeve_estoque', 'maryeve_despesas', 'maryeve_calculos'];
const LOCAL_PIN_KEY = 'maryeve_pin_hash_local';

let cloudAtivo = false;
let db = null;
let docRef = null;
let pinDigitados = [];
let estadoLogin = 'entrar'; // 'entrar' | 'criar-1' | 'criar-2'
let primeiroPinTemp = '';

// ---------- Splash ----------
function tocarSplash(){
  return new Promise(resolve=>{
    const splash = document.getElementById('splash-screen');
    setTimeout(()=>{
      splash.classList.add('splash-sair');
      setTimeout(()=>{
        splash.hidden = true;
        resolve();
      }, 550);
    }, 1500);
  });
}

// ---------- Hash do PIN ----------
async function hashPin(pin){
  const enc = new TextEncoder().encode('maryeve-salt-fixo::' + pin);
  const buffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ---------- UI helpers ----------
function atualizarPontosPin(){
  document.querySelectorAll('#pin-dots .pin-dot').forEach((dot,i)=>{
    dot.classList.toggle('preenchido', i < pinDigitados.length);
  });
}
function limparPin(){
  pinDigitados = [];
  atualizarPontosPin();
  document.getElementById('pin-erro').hidden = true;
}
function statusLogin(msg, tipo){
  const el = document.getElementById('login-status');
  el.textContent = msg || '';
  el.className = 'login-status' + (tipo ? ' login-status-'+tipo : '');
}

document.getElementById('keypad').addEventListener('click', e=>{
  const btn = e.target.closest('.key');
  if(!btn) return;
  if(btn.id === 'key-back'){
    pinDigitados.pop();
    atualizarPontosPin();
    return;
  }
  if(btn.id === 'key-clear'){
    limparPin();
    return;
  }
  if(pinDigitados.length >= 4) return;
  pinDigitados.push(btn.dataset.num);
  atualizarPontosPin();
  if(pinDigitados.length === 4){
    setTimeout(processarPinCompleto, 150);
  }
});

async function processarPinCompleto(){
  const pin = pinDigitados.join('');

  if(estadoLogin === 'criar-1'){
    primeiroPinTemp = pin;
    limparPin();
    estadoLogin = 'criar-2';
    document.getElementById('login-titulo').textContent = 'Confirme seu PIN';
    document.getElementById('login-hint').textContent = 'Digite novamente para confirmar.';
    return;
  }

  if(estadoLogin === 'criar-2'){
    if(pin !== primeiroPinTemp){
      document.getElementById('pin-erro').textContent = 'Os PINs não coincidem. Vamos começar de novo.';
      document.getElementById('pin-erro').hidden = false;
      limparPin();
      estadoLogin = 'criar-1';
      document.getElementById('login-titulo').textContent = 'Crie seu PIN';
      document.getElementById('login-hint').textContent = 'Escolha 4 números. Você vai usar esse PIN em qualquer aparelho.';
      return;
    }
    await criarPin(pin);
    return;
  }

  // estadoLogin === 'entrar'
  await validarPin(pin);
}

// ---------- Firebase ----------
function firebaseConfigValido(){
  return typeof firebaseConfig === 'object' &&
    firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('COLE_AQUI');
}

async function iniciarFirebase(){
  if(!firebaseConfigValido()){
    cloudAtivo = false;
    return;
  }
  try{
    firebase.initializeApp(firebaseConfig);
    await firebase.auth().signInAnonymously();
    db = firebase.firestore();
    docRef = db.collection('appdata').doc(FIRESTORE_DOC_ID);
    cloudAtivo = true;
  }catch(e){
    console.error('Falha ao iniciar Firebase', e);
    cloudAtivo = false;
  }
}

function coletarDadosLocais(){
  const pacote = {};
  LOCAL_KEYS.forEach(k=>{
    try{ pacote[k] = JSON.parse(localStorage.getItem(k) || '[]'); }
    catch(e){ pacote[k] = []; }
  });
  return pacote;
}
function aplicarDadosLocais(pacote){
  LOCAL_KEYS.forEach(k=>{
    localStorage.setItem(k, JSON.stringify(pacote[k] || []));
  });
}

let pushTimeout = null;
function agendarEnvioNuvem(){
  if(!cloudAtivo) return;
  clearTimeout(pushTimeout);
  pushTimeout = setTimeout(async ()=>{
    try{
      const pacote = coletarDadosLocais();
      await docRef.set({ ...pacote, atualizadoEm: new Date().toISOString() }, { merge: true });
    }catch(e){
      console.error('Erro ao sincronizar com a nuvem', e);
    }
  }, 800);
}

// ---------- Fluxo principal ----------
async function criarPin(pin){
  statusLogin('Salvando seu PIN…', 'ok');
  const hash = await hashPin(pin);

  if(cloudAtivo){
    const pacoteLocal = coletarDadosLocais();
    await docRef.set({ pinHash: hash, ...pacoteLocal, criadoEm: new Date().toISOString() }, { merge: true });
  } else {
    localStorage.setItem(LOCAL_PIN_KEY, hash);
  }
  window.onDadosAlterados = agendarEnvioNuvem;
  desbloquearApp();
}

async function validarPin(pin){
  const hash = await hashPin(pin);

  if(cloudAtivo){
    statusLogin('Verificando…', 'ok');
    let snap;
    try{
      snap = await docRef.get();
    }catch(e){
      document.getElementById('pin-erro').textContent = 'Sem conexão com a nuvem agora. Tente novamente.';
      document.getElementById('pin-erro').hidden = false;
      limparPin();
      return;
    }
    const remoto = snap.exists ? snap.data() : null;
    if(remoto && remoto.pinHash === hash){
      const pacoteRemoto = {};
      LOCAL_KEYS.forEach(k=> pacoteRemoto[k] = remoto[k] || []);
      aplicarDadosLocais(pacoteRemoto);
      window.onDadosAlterados = agendarEnvioNuvem;
      desbloquearApp();
    } else {
      document.getElementById('pin-erro').textContent = 'PIN incorreto. Tente novamente.';
      document.getElementById('pin-erro').hidden = false;
      limparPin();
    }
  } else {
    const salvo = localStorage.getItem(LOCAL_PIN_KEY);
    if(salvo === hash){
      window.onDadosAlterados = null;
      desbloquearApp();
    } else {
      document.getElementById('pin-erro').textContent = 'PIN incorreto. Tente novamente.';
      document.getElementById('pin-erro').hidden = false;
      limparPin();
    }
  }
}

function desbloquearApp(){
  const loginScreen = document.getElementById('login-screen');
  const appRoot = document.getElementById('app-root');
  loginScreen.classList.add('login-sair');
  setTimeout(()=>{
    loginScreen.hidden = true;
    appRoot.hidden = false;
    appRoot.classList.add('app-entrar');
    if(window.recarregarERenderizarTudo) window.recarregarERenderizarTudo();
  }, 400);
}

// ---------- "Esqueci meu PIN" ----------
document.getElementById('btn-esqueci-pin').addEventListener('click', ()=>{
  const aviso = cloudAtivo
    ? 'Isso vai apagar o PIN atual (os dados continuam salvos na nuvem). Você vai criar um PIN novo agora. Continuar?'
    : 'Isso vai apagar o PIN atual deste aparelho. Você vai criar um PIN novo agora. Continuar?';
  if(!confirm(aviso)) return;
  limparPin();
  estadoLogin = 'criar-1';
  document.getElementById('login-titulo').textContent = 'Crie seu PIN';
  document.getElementById('login-hint').textContent = 'Escolha 4 números. Você vai usar esse PIN em qualquer aparelho.';
});

// ---------- Boot ----------
(async function iniciar(){
  await iniciarFirebase();

  const promessaSplash = tocarSplash();

  let temPin = false;
  if(cloudAtivo){
    try{
      const snap = await docRef.get();
      temPin = snap.exists && !!snap.data().pinHash;
    }catch(e){
      console.error(e);
      statusLogin('Não foi possível conectar à nuvem. Verifique sua internet.', 'erro');
    }
  } else {
    temPin = !!localStorage.getItem(LOCAL_PIN_KEY);
  }

  await promessaSplash;

  const loginScreen = document.getElementById('login-screen');
  loginScreen.hidden = false;

  if(!cloudAtivo){
    statusLogin('Sincronização com a nuvem não configurada — o PIN funciona só neste aparelho.', 'aviso');
  }

  document.getElementById('btn-esqueci-pin').hidden = false;

  if(temPin){
    estadoLogin = 'entrar';
    document.getElementById('login-titulo').textContent = 'Digite seu PIN';
    document.getElementById('login-hint').textContent = cloudAtivo
      ? 'Use o mesmo PIN em qualquer aparelho para acessar seus dados.'
      : 'PIN salvo neste aparelho.';
  } else {
    estadoLogin = 'criar-1';
    document.getElementById('login-titulo').textContent = 'Crie seu PIN';
    document.getElementById('login-hint').textContent = 'Escolha 4 números. Você vai usar esse PIN em qualquer aparelho.';
    document.getElementById('btn-esqueci-pin').hidden = true;
  }
})();
