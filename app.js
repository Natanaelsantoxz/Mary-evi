// ---------- Storage ----------
const STORAGE_ORDENS = 'maryeve_ordens';
const STORAGE_ESTOQUE = 'maryeve_estoque';

function carregar(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Erro ao carregar', key, e);
    return [];
  }
}
function salvar(key, dados){
  localStorage.setItem(key, JSON.stringify(dados));
}

let ordens = carregar(STORAGE_ORDENS);
let estoque = carregar(STORAGE_ESTOQUE);

// ---------- Helpers ----------
function gerarId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}
function formatarMoeda(v){
  return (Number(v)||0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}
function formatarData(iso){
  if(!iso) return '—';
  const [ano,mes,dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
function badgeStatus(status){
  const map = {
    'Recebido':'badge-recebido',
    'Em andamento':'badge-andamento',
    'Concluído':'badge-concluido',
    'Entregue':'badge-entregue'
  };
  return `<span class="badge ${map[status]||''}">${status}</span>`;
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-'+tab.dataset.tab).classList.add('active');
    if(tab.dataset.tab === 'faturamento') renderFaturamento();
  });
});

// ---------- ORDENS: render ----------
function renderOrdens(){
  const termo = document.getElementById('busca-ordem').value.trim().toLowerCase();
  const filtroStatus = document.getElementById('filtro-status').value;

  const filtradas = ordens.filter(o=>{
    const bate = !termo ||
      o.cliente.toLowerCase().includes(termo) ||
      o.defeito.toLowerCase().includes(termo) ||
      o.numero.toString().includes(termo);
    const bateStatus = !filtroStatus || o.status === filtroStatus;
    return bate && bateStatus;
  }).sort((a,b)=> b.numero - a.numero);

  const corpo = document.getElementById('corpo-ordens');
  corpo.innerHTML = '';

  document.getElementById('ordens-vazio').hidden = ordens.length > 0;

  filtradas.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${o.numero}</td>
      <td>${escapeHtml(o.cliente)}</td>
      <td>${escapeHtml(o.contato)}</td>
      <td>${escapeHtml(o.defeito)}</td>
      <td>${formatarData(o.data)}</td>
      <td>${formatarData(o.previsao)}</td>
      <td>${formatarMoeda(o.valor)}</td>
      <td>${badgeStatus(o.status)}</td>
      <td>${o.pago ? '<span class="pago-sim">Sim</span>' : '<span class="pago-nao">Não</span>'}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Editar" data-editar-ordem="${o.id}">✎</button>
          <button class="icon-btn" title="Excluir" data-excluir-ordem="${o.id}">🗑</button>
        </div>
      </td>
    `;
    corpo.appendChild(tr);
  });

  corpo.querySelectorAll('[data-editar-ordem]').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirModalOrdem(btn.dataset.editarOrdem));
  });
  corpo.querySelectorAll('[data-excluir-ordem]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(confirm('Excluir esta ordem de serviço? Essa ação não pode ser desfeita.')){
        ordens = ordens.filter(o=>o.id !== btn.dataset.excluirOrdem);
        salvar(STORAGE_ORDENS, ordens);
        renderOrdens();
      }
    });
  });
}

document.getElementById('busca-ordem').addEventListener('input', renderOrdens);
document.getElementById('filtro-status').addEventListener('change', renderOrdens);

// ---------- ORDENS: modal ----------
const modalOrdemBackdrop = document.getElementById('modal-ordem-backdrop');
const formOrdem = document.getElementById('form-ordem');

function abrirModalOrdem(id){
  formOrdem.reset();
  document.getElementById('ordem-id').value = '';
  document.getElementById('ordem-modal-titulo').textContent = 'Nova ordem de serviço';

  if(id){
    const o = ordens.find(x=>x.id === id);
    if(o){
      document.getElementById('ordem-modal-titulo').textContent = `Editar ordem #${o.numero}`;
      document.getElementById('ordem-id').value = o.id;
      document.getElementById('ordem-cliente').value = o.cliente;
      document.getElementById('ordem-contato').value = o.contato;
      document.getElementById('ordem-defeito').value = o.defeito;
      document.getElementById('ordem-valor').value = o.valor;
      document.getElementById('ordem-data').value = o.data;
      document.getElementById('ordem-previsao').value = o.previsao || '';
      document.getElementById('ordem-status').value = o.status;
      document.getElementById('ordem-pago').checked = !!o.pago;
    }
  } else {
    document.getElementById('ordem-data').value = new Date().toISOString().slice(0,10);
  }
  modalOrdemBackdrop.classList.add('open');
}

document.getElementById('btn-nova-ordem').addEventListener('click', ()=> abrirModalOrdem(null));

formOrdem.addEventListener('submit', e=>{
  e.preventDefault();
  const id = document.getElementById('ordem-id').value;
  const dados = {
    cliente: document.getElementById('ordem-cliente').value.trim(),
    contato: document.getElementById('ordem-contato').value.trim(),
    defeito: document.getElementById('ordem-defeito').value.trim(),
    valor: parseFloat(document.getElementById('ordem-valor').value) || 0,
    data: document.getElementById('ordem-data').value,
    previsao: document.getElementById('ordem-previsao').value,
    status: document.getElementById('ordem-status').value,
    pago: document.getElementById('ordem-pago').checked
  };

  if(id){
    const idx = ordens.findIndex(o=>o.id === id);
    ordens[idx] = {...ordens[idx], ...dados};
  } else {
    const proximoNumero = ordens.reduce((max,o)=>Math.max(max,o.numero||0),0) + 1;
    ordens.push({ id: gerarId(), numero: proximoNumero, ...dados });
  }
  salvar(STORAGE_ORDENS, ordens);
  fecharModais();
  renderOrdens();
});

// ---------- ESTOQUE: render ----------
function renderEstoque(){
  const termo = document.getElementById('busca-estoque').value.trim().toLowerCase();
  const filtrados = estoque.filter(i=>
    !termo || i.nome.toLowerCase().includes(termo) || (i.categoria||'').toLowerCase().includes(termo)
  );

  const corpo = document.getElementById('corpo-estoque');
  corpo.innerHTML = '';
  document.getElementById('estoque-vazio').hidden = estoque.length > 0;

  filtrados.forEach(i=>{
    const tr = document.createElement('tr');
    const totalItem = (i.quantidade||0) * (i.valor||0);
    tr.innerHTML = `
      <td>${escapeHtml(i.nome)}</td>
      <td>${escapeHtml(i.categoria||'—')}</td>
      <td>${i.quantidade}</td>
      <td>${escapeHtml(i.unidade||'un')}</td>
      <td>${formatarMoeda(i.valor)}</td>
      <td>${formatarMoeda(totalItem)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Editar" data-editar-item="${i.id}">✎</button>
          <button class="icon-btn" title="Excluir" data-excluir-item="${i.id}">🗑</button>
        </div>
      </td>
    `;
    corpo.appendChild(tr);
  });

  corpo.querySelectorAll('[data-editar-item]').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirModalEstoque(btn.dataset.editarItem));
  });
  corpo.querySelectorAll('[data-excluir-item]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(confirm('Excluir este item do estoque?')){
        estoque = estoque.filter(i=>i.id !== btn.dataset.excluirItem);
        salvar(STORAGE_ESTOQUE, estoque);
        renderEstoque();
      }
    });
  });
}

document.getElementById('busca-estoque').addEventListener('input', renderEstoque);

// ---------- ESTOQUE: modal ----------
const modalEstoqueBackdrop = document.getElementById('modal-estoque-backdrop');
const formEstoque = document.getElementById('form-estoque');

function abrirModalEstoque(id){
  formEstoque.reset();
  document.getElementById('estoque-id').value = '';
  document.getElementById('estoque-modal-titulo').textContent = 'Novo item de estoque';

  if(id){
    const i = estoque.find(x=>x.id === id);
    if(i){
      document.getElementById('estoque-modal-titulo').textContent = 'Editar item';
      document.getElementById('estoque-id').value = i.id;
      document.getElementById('estoque-nome').value = i.nome;
      document.getElementById('estoque-categoria').value = i.categoria || '';
      document.getElementById('estoque-unidade').value = i.unidade || '';
      document.getElementById('estoque-quantidade').value = i.quantidade;
      document.getElementById('estoque-valor').value = i.valor;
    }
  }
  modalEstoqueBackdrop.classList.add('open');
}

document.getElementById('btn-novo-item').addEventListener('click', ()=> abrirModalEstoque(null));

formEstoque.addEventListener('submit', e=>{
  e.preventDefault();
  const id = document.getElementById('estoque-id').value;
  const dados = {
    nome: document.getElementById('estoque-nome').value.trim(),
    categoria: document.getElementById('estoque-categoria').value.trim(),
    unidade: document.getElementById('estoque-unidade').value.trim(),
    quantidade: parseFloat(document.getElementById('estoque-quantidade').value) || 0,
    valor: parseFloat(document.getElementById('estoque-valor').value) || 0
  };
  if(id){
    const idx = estoque.findIndex(i=>i.id === id);
    estoque[idx] = {...estoque[idx], ...dados};
  } else {
    estoque.push({ id: gerarId(), ...dados });
  }
  salvar(STORAGE_ESTOQUE, estoque);
  fecharModais();
  renderEstoque();
});

// ---------- FATURAMENTO ----------
function renderFaturamento(){
  const pagas = ordens.filter(o=>o.pago);
  const naoPagas = ordens.filter(o=>!o.pago);

  const totalPago = pagas.reduce((s,o)=>s+(o.valor||0),0);
  const totalAReceber = naoPagas.reduce((s,o)=>s+(o.valor||0),0);
  const totalEstoque = estoque.reduce((s,i)=>s+((i.quantidade||0)*(i.valor||0)),0);

  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0,7);
  const qtdMesAtual = ordens.filter(o=>(o.data||'').slice(0,7) === mesAtual).length;

  document.getElementById('stat-pago').textContent = formatarMoeda(totalPago);
  document.getElementById('stat-a-receber').textContent = formatarMoeda(totalAReceber);
  document.getElementById('stat-qtd-mes').textContent = qtdMesAtual;
  document.getElementById('stat-estoque-valor').textContent = formatarMoeda(totalEstoque);

  // gráfico por mês (últimos 6 meses com dados, baseado em ordens pagas)
  const porMes = {};
  pagas.forEach(o=>{
    const chave = (o.data||'').slice(0,7);
    if(!chave) return;
    porMes[chave] = (porMes[chave]||0) + (o.valor||0);
  });
  const chaves = Object.keys(porMes).sort().slice(-6);
  const maxValor = Math.max(...chaves.map(k=>porMes[k]), 1);

  const grafico = document.getElementById('grafico-mensal');
  grafico.innerHTML = '';
  if(chaves.length === 0){
    grafico.innerHTML = '<p class="empty-state" style="padding:0;">Sem ordens pagas ainda para exibir o gráfico.</p>';
  } else {
    chaves.forEach(chave=>{
      const [ano,mes] = chave.split('-');
      const nomesMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const label = `${nomesMes[parseInt(mes,10)-1]}/${ano.slice(2)}`;
      const valor = porMes[chave];
      const altura = Math.max(6, Math.round((valor/maxValor)*140));
      const col = document.createElement('div');
      col.className = 'bar-col';
      col.innerHTML = `
        <span class="bar-value">${formatarMoeda(valor)}</span>
        <div class="bar" style="height:${altura}px"></div>
        <span class="bar-label">${label}</span>
      `;
      grafico.appendChild(col);
    });
  }

  // tabela de ordens pagas
  const corpo = document.getElementById('corpo-faturamento');
  corpo.innerHTML = '';
  document.getElementById('faturamento-vazio').hidden = pagas.length > 0;
  pagas.sort((a,b)=> (b.data||'').localeCompare(a.data||'')).forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${o.numero}</td>
      <td>${escapeHtml(o.cliente)}</td>
      <td>${escapeHtml(o.defeito)}</td>
      <td>${formatarData(o.data)}</td>
      <td>${formatarMoeda(o.valor)}</td>
    `;
    corpo.appendChild(tr);
  });
}

// ---------- Modais: fechar ----------
function fecharModais(){
  modalOrdemBackdrop.classList.remove('open');
  modalEstoqueBackdrop.classList.remove('open');
}
document.querySelectorAll('[data-close]').forEach(el=>{
  el.addEventListener('click', fecharModais);
});
[modalOrdemBackdrop, modalEstoqueBackdrop].forEach(bd=>{
  bd.addEventListener('click', e=>{ if(e.target === bd) fecharModais(); });
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape') fecharModais();
});

// ---------- util ----------
function escapeHtml(str){
  return String(str??'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---------- init ----------
renderOrdens();
renderEstoque();
renderFaturamento();
