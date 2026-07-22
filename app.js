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
  if(window.onDadosAlterados) window.onDadosAlterados();
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
    if(tab.dataset.tab === 'despesas') renderDespesas();
    if(tab.dataset.tab === 'calculadora') renderCalculos();
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

// ---------- DESPESAS ----------
const STORAGE_DESPESAS = 'maryeve_despesas';
let despesas = carregar(STORAGE_DESPESAS);

function badgeCategoria(cat){
  return cat === 'Fixa'
    ? `<span class="badge badge-concluido">Fixa</span>`
    : `<span class="badge badge-andamento">Variável</span>`;
}

function renderDespesas(){
  const totalFixa = despesas.filter(d=>d.categoria==='Fixa').reduce((s,d)=>s+(d.valor||0),0);
  const totalVariavel = despesas.filter(d=>d.categoria==='Variável').reduce((s,d)=>s+(d.valor||0),0);

  document.getElementById('stat-despesa-fixa').textContent = formatarMoeda(totalFixa);
  document.getElementById('stat-despesa-variavel').textContent = formatarMoeda(totalVariavel);
  document.getElementById('stat-despesa-total').textContent = formatarMoeda(totalFixa+totalVariavel);

  const corpo = document.getElementById('corpo-despesas');
  corpo.innerHTML = '';
  document.getElementById('despesas-vazio').hidden = despesas.length > 0;

  despesas.slice().sort((a,b)=>(b.data||'').localeCompare(a.data||'')).forEach(d=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(d.descricao)}</td>
      <td>${badgeCategoria(d.categoria)}</td>
      <td>${formatarData(d.data)}</td>
      <td>${formatarMoeda(d.valor)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Editar" data-editar-despesa="${d.id}">✎</button>
          <button class="icon-btn" title="Excluir" data-excluir-despesa="${d.id}">🗑</button>
        </div>
      </td>
    `;
    corpo.appendChild(tr);
  });

  corpo.querySelectorAll('[data-editar-despesa]').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirModalDespesa(btn.dataset.editarDespesa));
  });
  corpo.querySelectorAll('[data-excluir-despesa]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(confirm('Excluir esta despesa?')){
        despesas = despesas.filter(d=>d.id !== btn.dataset.excluirDespesa);
        salvar(STORAGE_DESPESAS, despesas);
        renderDespesas();
      }
    });
  });
}

const modalDespesaBackdrop = document.getElementById('modal-despesa-backdrop');
const formDespesa = document.getElementById('form-despesa');

function abrirModalDespesa(id){
  formDespesa.reset();
  document.getElementById('despesa-id').value = '';
  document.getElementById('despesa-modal-titulo').textContent = 'Nova despesa';
  document.getElementById('despesa-data').value = new Date().toISOString().slice(0,10);

  if(id){
    const d = despesas.find(x=>x.id === id);
    if(d){
      document.getElementById('despesa-modal-titulo').textContent = 'Editar despesa';
      document.getElementById('despesa-id').value = d.id;
      document.getElementById('despesa-descricao').value = d.descricao;
      document.getElementById('despesa-categoria').value = d.categoria;
      document.getElementById('despesa-valor').value = d.valor;
      document.getElementById('despesa-data').value = d.data;
    }
  }
  modalDespesaBackdrop.classList.add('open');
}

document.getElementById('btn-nova-despesa').addEventListener('click', ()=> abrirModalDespesa(null));

formDespesa.addEventListener('submit', e=>{
  e.preventDefault();
  const id = document.getElementById('despesa-id').value;
  const dados = {
    descricao: document.getElementById('despesa-descricao').value.trim(),
    categoria: document.getElementById('despesa-categoria').value,
    valor: parseFloat(document.getElementById('despesa-valor').value) || 0,
    data: document.getElementById('despesa-data').value
  };
  if(id){
    const idx = despesas.findIndex(d=>d.id === id);
    despesas[idx] = {...despesas[idx], ...dados};
  } else {
    despesas.push({ id: gerarId(), ...dados });
  }
  salvar(STORAGE_DESPESAS, despesas);
  fecharModais();
  renderDespesas();
});

// ---------- CALCULADORA ----------
const STORAGE_CALCULOS = 'maryeve_calculos';
let calculos = carregar(STORAGE_CALCULOS);

function calcularResultado(){
  const horas = parseFloat(document.getElementById('calc-horas').value) || 0;
  const valorHora = parseFloat(document.getElementById('calc-valor-hora').value) || 0;
  const material = parseFloat(document.getElementById('calc-material').value) || 0;
  const transporte = parseFloat(document.getElementById('calc-transporte').value) || 0;

  const maoDeObra = horas * valorHora;
  const total = maoDeObra + material + transporte;

  document.getElementById('calc-resultado-mao').textContent = formatarMoeda(maoDeObra);
  document.getElementById('calc-resultado-total').textContent = formatarMoeda(total);

  return { horas, valorHora, material, transporte, maoDeObra, total };
}

['calc-horas','calc-valor-hora','calc-material','calc-transporte'].forEach(id=>{
  document.getElementById(id).addEventListener('input', calcularResultado);
});

function renderCalculos(){
  const corpo = document.getElementById('corpo-calculos');
  corpo.innerHTML = '';
  document.getElementById('calculos-vazio').hidden = calculos.length > 0;

  calculos.slice().reverse().forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(c.nome || '—')}</td>
      <td>${c.horas}</td>
      <td>${formatarMoeda(c.maoDeObra)}</td>
      <td>${formatarMoeda(c.material)}</td>
      <td>${formatarMoeda(c.transporte)}</td>
      <td><strong>${formatarMoeda(c.total)}</strong></td>
      <td><button class="icon-btn" title="Excluir" data-excluir-calculo="${c.id}">🗑</button></td>
    `;
    corpo.appendChild(tr);
  });

  corpo.querySelectorAll('[data-excluir-calculo]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      calculos = calculos.filter(c=>c.id !== btn.dataset.excluirCalculo);
      salvar(STORAGE_CALCULOS, calculos);
      renderCalculos();
    });
  });
}

document.getElementById('btn-salvar-calculo').addEventListener('click', ()=>{
  const r = calcularResultado();
  const nome = document.getElementById('calc-nome').value.trim();
  calculos.push({ id: gerarId(), nome, ...r });
  salvar(STORAGE_CALCULOS, calculos);
  renderCalculos();
});

// ---------- Modais: fechar ----------
function fecharModais(){
  modalOrdemBackdrop.classList.remove('open');
  modalEstoqueBackdrop.classList.remove('open');
  modalDespesaBackdrop.classList.remove('open');
}
document.querySelectorAll('[data-close]').forEach(el=>{
  el.addEventListener('click', fecharModais);
});
[modalOrdemBackdrop, modalEstoqueBackdrop, modalDespesaBackdrop].forEach(bd=>{
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
// Chamada sempre que os dados locais mudarem (após login ou sincronização com a nuvem).
window.recarregarERenderizarTudo = function(){
  ordens = carregar(STORAGE_ORDENS);
  estoque = carregar(STORAGE_ESTOQUE);
  despesas = carregar(STORAGE_DESPESAS);
  calculos = carregar(STORAGE_CALCULOS);
  renderOrdens();
  renderEstoque();
  renderFaturamento();
  renderDespesas();
  renderCalculos();
};

window.recarregarERenderizarTudo();
