/* Bella Massa Pizzeria — interações do site
   Demonstração front-end: dados salvos neste navegador (localStorage).
   Para pedidos reais/pagamentos, conecte um backend seguro. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const safeRead = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

  let toastTimer;
  function showToast(message) {
    const toast = $('#quick-toast'), label = $('#toast-message');
    if (label) label.textContent = message;
    if (!toast) { console.info(message); return; }
    toast.classList.remove('translate-y-32', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('translate-y-32', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2400);
  }
  window.showToast = showToast;
  window.triggerToast = showToast;

  // Navegação entre abas/painéis.
  const panels = $$('.tab-panel');
  const tabButtons = $$('[data-tab]');
  function activateTab(name, updateHash = true) {
    if (!panels.some(panel => panel.dataset.panel === name)) name = 'inicio';
    panels.forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.classList.toggle('active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
    tabButtons.forEach(button => {
      const active = button.dataset.tab === name;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (updateHash) history.replaceState(null, '', `#${name}`);
    document.body.dataset.currentTab = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.activateTab = activateTab;
  tabButtons.forEach(button => button.addEventListener('click', () => activateTab(button.dataset.tab)));
  $$('[data-go-tab]').forEach(el => el.addEventListener('click', () => activateTab(el.dataset.goTab)));
  $$('[data-go-cart]').forEach(el => el.addEventListener('click', () => activateTab('carrinho')));
  const initialTab = location.hash.slice(1);
  activateTab(panels.some(p => p.dataset.panel === initialTab) ? initialTab : 'inicio', false);
  window.addEventListener('hashchange', () => activateTab(location.hash.slice(1), false));

  $('#notification-button')?.addEventListener('click', () => showToast('Você não tem novas notificações.'));
  $$('header button').filter(b => !b.id && /Rua Oscar Freire|30-40 min/.test(b.textContent)).forEach(b => {
    b.addEventListener('click', () => showToast('Endereço demonstrativo. Configure seu endereço na etapa de entrega.'));
  });

  // Cardápio: pesquisa e filtros por categoria.
  const searchInput = $('#menu-search');
  const filterButtons = $$('.menu-filter');
  const productCards = $$('[data-product-card]');
  let activeFilter = 'todos';
  function filterMenu() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase('pt-BR');
    productCards.forEach(card => {
      const text = card.textContent.toLocaleLowerCase('pt-BR');
      const category = card.dataset.category || 'todos';
      card.classList.toggle('filtered-out', Boolean(query && !text.includes(query)) ||
        (activeFilter !== 'todos' && category !== activeFilter));
    });
  }
  searchInput?.addEventListener('input', filterMenu);
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'todos';
    filterButtons.forEach(b => b.classList.toggle('filter-active', b === button));
    filterMenu();
  }));
  // Busca adicional do cardápio (se presente no layout).
  const extraSearch = $$('#tab-cardapio input[type="search"], #tab-cardapio input[type="text"]')
    .filter(input => input !== searchInput);
  extraSearch.forEach(input => input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('pt-BR');
    productCards.forEach(card => {
      const text = card.textContent.toLocaleLowerCase('pt-BR');
      card.classList.toggle('filtered-out', Boolean(query && !text.includes(query)) ||
        (activeFilter !== 'todos' && (card.dataset.category || 'todos') !== activeFilter));
    });
  }));

  // Carrinho funcional, com itens dinâmicos e persistência local.
  let cart = safeRead('bellaMassaCart', []);
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter(x => x && typeof x.name === 'string' && !['Pizza Meio a Meio','Tartufo & Funghi','Tartufo & Funghi Selvatici','Coca-Cola Zero'].includes(x.name.trim())).map((x, i) => ({id:x.id || String(Date.now()+i), name:x.name, price:Math.max(0,Number(x.price)||0), qty:Math.max(1,Number(x.qty)||1)}));
  const cartCountEls = $$('[data-cart-count]'), cartTotalEls = $$('[data-cart-total]');
  const cartPanel = $('#tab-carrinho');
  const orderHeading = cartPanel && [...cartPanel.querySelectorAll('*')].find(el => el.children.length === 0 && el.textContent.trim() === 'Seu Pedido');
  const orderHeader = orderHeading?.closest('.flex.items-center.justify-between');
  let cartItemsHost = $('#live-cart-items');
  if (orderHeader && !cartItemsHost) {
    cartItemsHost = document.createElement('div');
    cartItemsHost.id = 'live-cart-items';
    cartItemsHost.className = 'flex flex-col gap-3';
    orderHeader.insertAdjacentElement('afterend', cartItemsHost);
  }
  // O HTML do carrinho não contém mais produtos de demonstração; só renderCart() lista itens reais.
  // O resumo é o cartão inteiro, não apenas o cabeçalho.
  const sumTitle = [...(cartPanel?.querySelectorAll('h3') || [])].find(el => el.textContent.trim() === 'Resumo de Valores');
  const summary = sumTitle?.closest('.bg-surface-container.rounded-xl');
  if (summary) summary.dataset.liveSummary = 'true';
  const saveCart = () => safeWrite('bellaMassaCart', cart);
  function renderCart() {
    const count = cart.reduce((s,x)=>s+x.qty,0), subtotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
    const tip = Math.max(0,Number(safeRead('bellaTip',0))||0);
    // Todos os valores de gorjeta começam iguais; apenas a opção selecionada ganha destaque.
    cartPanel?.querySelectorAll('button').forEach(button => {
      const label = (button.textContent || '').trim();
      if (!/^(R\$\s*(3|5|10)|Outro)$/.test(label)) return;
      const amount = label === 'Outro' ? null : Number(label.replace(/[^0-9]/g, ''));
      const selected = amount !== null && tip === amount;
      button.classList.remove('bg-secondary-container','text-on-secondary-container','font-bold','shadow-sm','ring-2');
      button.classList.add('bg-surface-container-high','text-on-surface-variant');
      if (selected) {
        button.classList.remove('bg-surface-container-high','text-on-surface-variant');
        button.classList.add('bg-secondary-container','text-on-secondary-container','font-bold','shadow-sm','ring-2');
      }
    });
    const pickup = safeRead('bellaFulfillment','delivery') === 'pickup';
    const delivery = pickup || subtotal === 0 || subtotal >= 150 ? 0 : 8;
    const discount = pickup ? subtotal * 0.10 : 0;
    const total = Math.max(0, subtotal - discount + delivery + tip);
    cartCountEls.forEach(el => el.textContent = count);
    cartTotalEls.forEach(el => el.textContent = money(total));
    if (cartItemsHost) {
      cartItemsHost.replaceChildren();
      if (!cart.length) {
        const empty = document.createElement('div'); empty.className = 'rounded-xl p-5 text-center';
        const title = document.createElement('strong'); title.textContent = 'Sua sacola está vazia';
        const desc = document.createElement('p'); desc.className = 'mt-1 text-sm opacity-75'; desc.textContent = 'Adicione pizzas e outros produtos pelo cardápio.';
        const go = document.createElement('button'); go.type='button'; go.className='mt-4 px-4 py-2 rounded-full bg-primary-container text-on-primary-container'; go.textContent='Ver cardápio'; go.onclick=()=>activateTab('cardapio');
        empty.append(title,desc,go); cartItemsHost.append(empty);
      } else cart.forEach(item => {
        const row = document.createElement('article'); row.className='bg-surface-container rounded-xl p-4 flex flex-wrap items-center gap-3';
        const info=document.createElement('div'); info.className='min-w-0 flex-1';
        const name=document.createElement('strong'); name.className='block break-words'; name.textContent=item.name;
        const price=document.createElement('span'); price.className='block mt-1 text-secondary'; price.textContent=money(item.price)+' cada'; info.append(name,price);
        const controls=document.createElement('div'); controls.className='flex items-center gap-2';
        [['−','minus','Diminuir'],[String(item.qty),'qty','Quantidade'],['+','plus','Aumentar'],['×','delete','Remover']].forEach(([label,op,aria])=>{
          const b=document.createElement(op==='qty'?'span':'button'); b.textContent=label; b.setAttribute('aria-label',aria+' '+item.name); b.className='w-8 h-8 inline-flex items-center justify-center rounded-full bg-surface-container-high';
          if(op!=='qty'){b.type='button';b.dataset.cartOp=op;b.dataset.id=item.id;} controls.append(b);
        });
        const line=document.createElement('strong'); line.className='ml-auto'; line.textContent=money(item.price*item.qty); row.append(info,controls,line); cartItemsHost.append(row);
      });
    }
    const summary=cartPanel?.querySelector('[data-live-summary]');
    if(summary){
      summary.querySelectorAll('.justify-between').forEach(row=>{
        const label=row.firstElementChild?.textContent.trim()||''; const val=row.lastElementChild;
        if(!val)return; if(label.startsWith('Subtotal'))val.textContent=money(subtotal);
        if(label.includes('Gorjeta'))val.textContent=money(tip);
        if(label.includes('Taxa de Entrega'))val.textContent=money(delivery);
        if(label.includes('Retirada') || label.includes('Desconto')) { row.hidden = !pickup; val.textContent = '-' + money(discount); }
      });
      const totalEl=summary.querySelector('[data-cart-total]'); if(totalEl)totalEl.textContent=money(total);
      const paymentTotal = $('#payment-total'); if (paymentTotal) paymentTotal.textContent = money(total);
    }
    cartPanel?.querySelectorAll('button[data-go-cart] .font-headline-sm, #scroll-to-payment .font-headline-sm').forEach(el=>el.textContent=money(total));
    const itemsLabel=[...(cartPanel?.querySelectorAll('span')||[])].find(el=>/^3 itens$/.test(el.textContent.trim()));
    if(itemsLabel)itemsLabel.textContent=count+' '+(count===1?'item':'itens');
    const subLabel=[...(cartPanel?.querySelectorAll('span')||[])].find(el=>/^Subtotal \(.*\)$/.test(el.textContent.trim()));
    if(subLabel)subLabel.textContent='Subtotal ('+count+' '+(count===1?'item':'itens')+')';
    saveCart();
  }
  function addToCart(name, price=0) {
    name=String(name||'Produto').trim(); price=Math.max(0,Number(price)||0);
    const found=cart.find(x=>x.name===name && x.price===price);
    if(found)found.qty++; else cart.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),name,price,qty:1});
    renderCart(); showToast(name+' foi adicionado ao carrinho.');
  }
  function extractPrice(el) {
    const card=el?.closest('[data-product-card],.menu-product-card,article') || el?.parentElement?.parentElement;
    const match=(card?.innerText||'').match(/R\$\s*([\d.]+,\d{2})/);
    return match?Number(match[1].replace(/\./g,'').replace(',','.')):0;
  }
  window.quickAdd=(button,name)=>addToCart(name,extractPrice(button));
  window.addHeroPizza=()=>addToCart('Tartufo & Funghi Selvatici',89.90);
  $$('[data-add-product]').forEach(button=>{ if(button.hasAttribute('onclick')) return; button.addEventListener('click',()=>addToCart(button.dataset.addProduct||'Produto',Number(button.dataset.price)||extractPrice(button))); });
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-cart-op]'); if(!b)return;
    const item=cart.find(x=>x.id===b.dataset.id); if(!item)return;
    if(b.dataset.cartOp==='plus')item.qty++;
    if(b.dataset.cartOp==='minus')item.qty--;
    if(b.dataset.cartOp==='delete'||item.qty<=0)cart=cart.filter(x=>x.id!==item.id);
    renderCart();
  });
  $$('[data-action="plus"]').forEach(button=>{
    if(button.closest('#live-cart-items'))return;
    button.addEventListener('click',()=>{
      const card=button.closest('.bg-surface-container.rounded-xl');
      const name=card?.querySelector('span.font-title-md,span.font-label-lg')?.textContent.trim() || card?.innerText.match(/\n\s*([^\n]+)\n/)?.[1] || 'Produto';
      addToCart(name,extractPrice(button));
    });
  });
  // Limpar sacola e finalizar: checkout real precisa de integração de pagamento/servidor.
  [...(cartPanel?.querySelectorAll('button')||[])].forEach(button=>{
    const label=(button.innerText||button.getAttribute('aria-label')||'').trim();
    if(label==='Limpar')button.addEventListener('click',()=>{if(confirm('Deseja remover todos os itens do carrinho?')){cart=[];renderCart();showToast('Carrinho limpo.');}});
    if(button.id === 'scroll-to-payment' || /Ir para (?:formas de )?Pagamento/i.test(label))button.addEventListener('click',()=>{
      if(!cart.length){showToast('Adicione pelo menos um produto antes de continuar.');activateTab('cardapio');return;}
      const paymentArea = $('#payment-area');
      if (paymentArea) {
        paymentArea.classList.remove('hidden');
        paymentArea.classList.add('flex');
        const totalTarget = $('#payment-total');
        const totalText = cartPanel?.querySelector('[data-cart-total]')?.textContent || 'R$ 0,00';
        if (totalTarget) totalTarget.textContent = totalText;
        paymentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  // Área de pagamento demonstrativa: nenhuma cobrança real é processada.
  const paymentForm = $('#payment-form');
  const paymentArea = $('#payment-area');
  const paymentResult = $('#payment-result');
  const cashChangeField = $('#cash-change-field');
  $$('input[name="payment-method"]', paymentForm || document).forEach(input => {
    input.addEventListener('change', () => {
      if (cashChangeField) cashChangeField.classList.toggle('hidden', input.value !== 'cash' || !input.checked);
      if (paymentResult) { paymentResult.classList.add('hidden'); paymentResult.textContent = ''; }
    });
  });
  paymentForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!cart.length) {
      showToast('Adicione pelo menos um produto antes de confirmar o pedido.');
      activateTab('cardapio');
      return;
    }
    const method = paymentForm.querySelector('input[name="payment-method"]:checked')?.value;
    if (!method) { showToast('Escolha uma forma de pagamento.'); return; }
    const methodNames = { pix: 'Pix (aguardando integração de pagamento)', 'card-delivery': 'Cartão na entrega/retirada', cash: 'Dinheiro' };
    const change = method === 'cash' ? $('#cash-change')?.value.trim() : '';
    if (paymentResult) {
      paymentResult.classList.remove('hidden');
      paymentResult.innerHTML = '';
      const heading = document.createElement('strong');
      heading.textContent = 'Pedido preparado para demonstração';
      const detail = document.createElement('p');
      detail.className = 'mt-2 text-sm';
      detail.textContent = `Forma selecionada: ${methodNames[method]}. Total: ${$('#payment-total')?.textContent || 'R$ 0,00'}.${change ? ' Troco solicitado para: R$ ' + change + '.' : ''} Nenhuma cobrança foi realizada.`;
      paymentResult.append(heading, detail);
      paymentResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToast('Dados do pedido conferidos. Pagamento real ainda não está conectado.');
  });

  // Personalizador da pizza: tamanho, divisão, sabores, massa, borda e preço em tempo real.
  const builder = $('#tab-pizza');
  const builderState = {
    size: 'grande',
    mode: 'meio',
    flavors: []
  };
  const builderMoney = value => money(value);
  const sizePrices = { media: 32.50, grande: 41.50 };
  const sizeNames = { media: 'Média', grande: 'Grande' };
  const flavorCards = () => $$('[data-builder-flavor]', builder || document);
  const selectedRadioExtra = name => {
    const input = $(`#tab-pizza input[name="${name}"]:checked`);
    if (!input) return 0;
    const label = input.closest('label');
    const match = (label?.innerText || '').match(/\+\s*R\$\s*([\d.]+,\d{2})/);
    return match ? Number(match[1].replace(/\./g, '').replace(',', '.')) : 0;
  };
  const selectedRadioName = name => {
    const input = $(`#tab-pizza input[name="${name}"]:checked`);
    return input?.closest('label')?.querySelector('.font-title-md')?.textContent.trim() || '';
  };
  function builderPrice() {
    const base = sizePrices[builderState.size];
    const flavors = builderState.flavors;
    const flavorExtra = flavors.length ? flavors.reduce((sum, f) => sum + f.price, 0) / flavors.length : 0;
    return base + flavorExtra + selectedRadioExtra('crust-dough') + selectedRadioExtra('crust-edge');
  }
  function renderBuilder() {
    if (!builder) return;
    const isSingle = builderState.mode === 'unico';
    const isStations = builderState.mode === 'estacoes';
    const maxFlavors = isSingle ? 1 : isStations ? 4 : 2;
    const sideB = $('#pizza-side-b-layer');
    const sideBSummary = $('#card-b-summary');
    if (sideB) sideB.style.display = isSingle ? 'none' : 'flex';
    if (sideBSummary) sideBSummary.style.display = isSingle ? 'none' : 'flex';
    const selectedNames = builderState.flavors.map(f => f.name);
    const mainFlavor = builderState.flavors[0] || { name: 'Margherita', ingredients: 'San Marzano, Fior di Latte', price: 0 };
    const title = $('#preview-b-title');
    const sideName = $('#side-b-name');
    const sideIngredients = $('#side-b-ingredients');
    if (title) title.textContent = `${selectedNames.length}/${maxFlavors} sabores`;
    if (sideName) sideName.textContent = selectedNames.length ? selectedNames.join(' + ') : 'Escolha os sabores';
    if (sideIngredients) sideIngredients.textContent = builderState.flavors.map(f => f.ingredients).filter(Boolean).join(' • ') || 'Selecione os sabores abaixo';
    const sideALabel = $('#tab-pizza .grid.grid-cols-2 p.font-headline-sm');
    const sideAIngredients = sideALabel?.nextElementSibling;
    if (isSingle && sideALabel) {
      sideALabel.textContent = mainFlavor.name;
      if (sideAIngredients) sideAIngredients.textContent = mainFlavor.ingredients;
    } else if (sideALabel) {
      sideALabel.textContent = selectedNames[0] || 'Sabor 1';
      if (sideAIngredients) sideAIngredients.textContent = builderState.flavors[0]?.ingredients || 'Primeiro sabor selecionado';
    }
    flavorCards().forEach(card => {
      const name = card.dataset.builderFlavor;
      const selected = builderState.flavors.some(f => f.name === name);
      card.classList.toggle('builder-flavor-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
      card.classList.toggle('shadow-md', selected);
      card.classList.toggle('ring-2', selected);
      card.classList.toggle('ring-primary', selected);
      const check = card.querySelector('.w-6.h-6 .material-symbols-outlined');
      if (check) check.textContent = selected ? 'check' : 'add';
    });
    const sizeLabel = $('#pizza-size-label');
    if (sizeLabel) sizeLabel.textContent = builderState.size === 'grande' ? 'Grande • 35 cm • 8 fatias' : 'Média • 30 cm • 6 fatias';
    $$('[data-pizza-size]', builder).forEach(button => {
      const active = button.dataset.pizzaSize === builderState.size;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('[data-pizza-mode]', builder).forEach(button => {
      const active = button.dataset.pizzaMode === builderState.mode;
      button.classList.toggle('bg-primary-container', active);
      button.classList.toggle('text-on-primary-container', active);
      button.classList.toggle('shadow-md', active);
      button.classList.toggle('text-on-surface-variant', !active);
      button.setAttribute('aria-pressed', String(active));
    });
    const total = builderPrice();
    const totalEl = $('#pizza-total-price');
    const bottomTotal = $('#bottom-total-price');
    const composition = $('#pizza-composition-price');
    if (totalEl) totalEl.textContent = builderMoney(total);
    if (bottomTotal) bottomTotal.textContent = builderMoney(total);
    if (composition) {
      const modeName = isSingle ? 'Pizza inteira' : isStations ? '4 estações' : 'Meio a meio';
      const dough = selectedRadioName('crust-dough');
      const edge = selectedRadioName('crust-edge');
      composition.textContent = `${sizeNames[builderState.size]} · ${modeName} · ${dough}${edge ? ` · ${edge}` : ''}`;
    }
    const modeHelp = builder.querySelector('[data-builder-help]');
    if (modeHelp) modeHelp.textContent = isStations ? `Selecione 4 sabores (${selectedNames.length}/4 escolhidos).` : isSingle ? `Selecione 1 sabor (${selectedNames.length}/1 escolhido).` : `Selecione 2 sabores (${selectedNames.length}/2 escolhidos).`;
  }
  window.selectFlavor = (name, ingredients, priceDiff, element) => {
    const price = Number(String(priceDiff || element?.dataset.builderPrice || '0').replace(/[^0-9,.-]/g, '').replace(',', '.')) || Number(element?.dataset.builderPrice) || 0;
    const flavor = { name: String(name).replace(/&amp;/g, '&'), ingredients, price };
    const existing = builderState.flavors.findIndex(f => f.name === flavor.name);
    const maxFlavors = builderState.mode === 'unico' ? 1 : builderState.mode === 'estacoes' ? 4 : 2;
    if (existing >= 0) {
      builderState.flavors.splice(existing, 1);
    } else if (builderState.flavors.length < maxFlavors) {
      builderState.flavors.push(flavor);
    } else {
      showToast(`Nesta divisão, escolha no máximo ${maxFlavors} sabor${maxFlavors > 1 ? 'es' : ''}.`);
      return;
    }
    renderBuilder();
    showToast(`Sabores selecionados: ${builderState.flavors.length}/${maxFlavors}.`);
  };
  $$('[data-pizza-size]', builder).forEach(button => {
    button.addEventListener('click', () => { builderState.size = button.dataset.pizzaSize; renderBuilder(); });
    button.dataset.jsHandled = 'true';
  });
  $$('[data-pizza-mode]', builder).forEach(button => {
    button.addEventListener('click', () => {
      builderState.mode = button.dataset.pizzaMode;
      const maxFlavors = builderState.mode === 'unico' ? 1 : builderState.mode === 'estacoes' ? 4 : 2;
      if (builderState.flavors.length > maxFlavors) builderState.flavors = builderState.flavors.slice(0, maxFlavors);
      renderBuilder();
      showToast(`Divisão selecionada: ${button.innerText.trim()}.`);
    });
    button.dataset.jsHandled = 'true';
  });
  flavorCards().forEach(card => {
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
    });
  });
  $$('input[name="crust-dough"], input[name="crust-edge"]', builder || document).forEach(input => {
    input.addEventListener('change', renderBuilder);
  });
  // Wizard real: cada etapa mostra somente os controles correspondentes.
  const wizardContent = $('#builder-step-content', builder || document);
  const wizardTabs = $$('.builder-step-tab', builder || document);
  const sizeOptions = $('.pizza-size-options', builder || document);
  const modeGroup = $('.pizza-mode-options', builder || document)?.parentElement;
  const doughInput = $('input[name="crust-dough"]', builder || document);
  const edgeInput = $('input[name="crust-edge"]', builder || document);
  const findOptionSection = input => {
    let node = input;
    while (node && node !== builder) {
      if (node.matches?.('div.flex.flex-col.gap-space-xs.mt-space-xs') && node.querySelector('input')) return node;
      node = node.parentElement;
    }
    return null;
  };
  const doughGroup = findOptionSection(doughInput);
  const edgeGroup = findOptionSection(edgeInput);
  const flavorGroup = flavorCards()[0]?.parentElement?.parentElement;
  const wizardSteps = [
    { title: 'Escolha o tamanho', description: 'Defina o tamanho ideal para sua fome.', node: sizeOptions },
    { title: 'Como dividir a pizza?', description: 'Escolha pizza inteira, meio a meio ou quatro estações.', node: modeGroup },
    { title: 'Escolha os sabores', description: 'Selecione o sabor ou os sabores da sua pizza.', node: flavorGroup },
    { title: 'Escolha a massa', description: 'Selecione a massa que combina com seu pedido.', node: doughGroup },
    { title: 'Escolha a borda', description: 'Finalize com a borda que você mais gosta.', node: edgeGroup }
  ];
  let activeBuilderStep = 0;
  const originalConfig = modeGroup?.parentElement;
  const finalization = originalConfig?.querySelector('.bg-surface-container-low.rounded-xl.p-space-sm.flex.items-center.justify-between.shadow-sm.cursor-pointer');
  if (wizardContent) {
    wizardContent.innerHTML = '';
    wizardSteps.forEach((step, index) => {
      const panel = document.createElement('section');
      panel.className = 'builder-step-panel' + (index === 0 ? ' is-active' : '');
      panel.dataset.builderPanel = String(index);
      panel.setAttribute('role', 'tabpanel');
      const heading = document.createElement('div');
      heading.className = 'builder-step-heading';
      const title = document.createElement('h2'); title.textContent = step.title;
      const description = document.createElement('p'); description.textContent = step.description;
      heading.append(title, description);
      panel.appendChild(heading);
      if (step.node) panel.appendChild(step.node);
      else panel.appendChild(document.createTextNode('Não foi possível carregar esta etapa.'));
      wizardContent.appendChild(panel);
    });
    // Remove the now-empty original configuration container, but preserve the sticky price/action summary.
    if (modeGroup && doughGroup && edgeGroup && flavorGroup) {
      const flavorPanel = $('[data-builder-panel="2"]', wizardContent);
      if (finalization && flavorPanel) flavorPanel.appendChild(finalization);
      // Preserve only the sticky price/action summary; remove empty wrappers to avoid blank space.
      if (originalConfig) {
        [...originalConfig.children].forEach(child => {
          if (child.classList.contains('sticky') || child.querySelector?.('.sticky')) return;
          if (!child.contains?.(modeGroup) && !child.contains?.(doughGroup) && !child.contains?.(edgeGroup) && !child.contains?.(flavorGroup)) child.remove();
        });
        originalConfig.style.gap = '0';
      }
    }
  }
  function showBuilderStep(index, scroll = true) {
    activeBuilderStep = Math.max(0, Math.min(wizardSteps.length - 1, index));
    $$('.builder-step-panel', wizardContent || builder).forEach((panel, i) => {
      const active = i === activeBuilderStep;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    wizardTabs.forEach((tab, i) => {
      const active = i === activeBuilderStep;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const submit = $('[data-builder-submit]', builder);
    if (submit) {
      const label = submit.querySelector('.font-label-lg');
      if (label) label.textContent = activeBuilderStep === wizardSteps.length - 1 ? 'Adicionar ao Pedido' : 'Próxima etapa';
      const icon = submit.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = activeBuilderStep === wizardSteps.length - 1 ? 'local_pizza' : 'arrow_forward';
    }
    if (scroll) builder?.querySelector('.builder-wizard-nav')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  wizardTabs.forEach((tab, index) => tab.addEventListener('click', () => showBuilderStep(index)));
  const builderSubmit = $('[data-builder-submit]', builder || document);
  builderSubmit?.addEventListener('click', event => {
    event.preventDefault();
    // Não deixe sair da etapa Sabores sem completar a quantidade exigida pela divisão.
    if (activeBuilderStep === 2) {
      const requiredFlavors = builderState.mode === 'unico' ? 1 : builderState.mode === 'estacoes' ? 4 : 2;
      if (builderState.flavors.length !== requiredFlavors) {
        showToast(`Selecione ${requiredFlavors} sabor${requiredFlavors > 1 ? 'es' : ''} para esta divisão (${builderState.flavors.length}/${requiredFlavors}).`);
        renderBuilder();
        showBuilderStep(2, false);
        return;
      }
    }
    if (activeBuilderStep < wizardSteps.length - 1) showBuilderStep(activeBuilderStep + 1);
    else window.handleAddPizza();
  });
  showBuilderStep(0, false);
  window.handleAddPizza = () => {
    const requiredFlavors = builderState.mode === 'unico' ? 1 : builderState.mode === 'estacoes' ? 4 : 2;
    if (builderState.flavors.length !== requiredFlavors) { showToast(`Escolha ${requiredFlavors} sabor${requiredFlavors > 1 ? 'es' : ''} antes de adicionar a pizza (${builderState.flavors.length}/${requiredFlavors}).`); showBuilderStep(2); return; }
    const modeName = builderState.mode === 'unico' ? 'Inteira' : builderState.mode === 'estacoes' ? '4 Estações' : 'Meio a Meio';
    const flavors = builderState.flavors.map(f => f.name).join(' + ');
    const dough = selectedRadioName('crust-dough');
    const edge = selectedRadioName('crust-edge');
    const description = `${sizeNames[builderState.size]} ${modeName} — ${flavors} — ${dough} — ${edge}`;
    addToCart(`Pizza personalizada (${description})`, builderPrice());
    activateTab('carrinho');
  };
  renderBuilder();

  // Alternância entrega/retirada.
  const deliveryBtn = $('#toggle-delivery'), pickupBtn = $('#toggle-pickup');
  function setFulfillment(mode, announce = true) {
    [deliveryBtn, pickupBtn].forEach(button => {
      if (!button) return;
      const active = button.id === (mode === 'delivery' ? 'toggle-delivery' : 'toggle-pickup');
      button.classList.toggle('bg-primary-container', active);
      button.classList.toggle('text-on-primary-container', active);
      button.classList.toggle('bg-surface-container-high', !active);
      button.classList.toggle('text-on-surface', !active);
      button.setAttribute('aria-pressed', String(active));
    });
    safeWrite('bellaFulfillment', mode);
    if (announce) showToast(mode === 'delivery' ? 'Entrega selecionada.' : 'Retirada selecionada: desconto demonstrativo de 10%.');
  }
  deliveryBtn?.addEventListener('click', () => setFulfillment('delivery'));
  pickupBtn?.addEventListener('click', () => setFulfillment('pickup'));

  // Formulário do Clube: valida e guarda apenas neste navegador.
  $('#club-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const nameInput = $('#club-name'), emailInput = $('#club-email');
    const name = nameInput?.value.trim(), email = emailInput?.value.trim();
    if (!name || !email || !emailInput.checkValidity()) {
      showToast('Preencha seu nome e um e-mail válido.');
      return;
    }
    safeWrite('bellaClubMember', { name, email, joinedAt: new Date().toISOString() });
    event.target.reset();
    showToast(`Bem-vindo ao Clube, ${name}! Cadastro salvo neste navegador.`);
  });

  // Botões genéricos sem ação de servidor: feedback honesto, sem simular pagamento real.
  $$('button').forEach(button => {
    if (button.dataset.jsBound) return;
    const label = button.getAttribute('aria-label') || button.textContent.trim();
    if (/Limpar/i.test(label) && /pedido|sacola|carrinho/i.test(label)) {
      button.addEventListener('click', () => {
        if (!confirm('Deseja limpar os itens demonstrativos da sacola?')) return;
        cart = []; saveCart(); renderCart(); showToast('Sacola demonstrativa limpa.');
      });
    }
  });
  // Complemento: dá ação aos controles visuais que antes não tinham eventos.
  // Navegação para montagem a partir dos botões de chamada.
  $$('button').forEach(button => {
    const label = (button.getAttribute('aria-label') || button.innerText || '').replace(/\s+/g, ' ').trim();
    const iconText = button.querySelector('.material-symbols-outlined')?.textContent.trim() || '';
    if (button.hasAttribute('onclick') || button.dataset.jsHandled === 'true') return;

    if (/Começar Montagem/i.test(label)) {
      button.addEventListener('click', () => activateTab('pizza'));
      button.dataset.jsHandled = 'true';
      return;
    }
    if (button.matches('[data-category]')) {
      button.addEventListener('click', () => {
        activateTab('cardapio');
        const cat = button.dataset.category;
        const map = { destaques: 'todos', tradicionais: 'pizza', assinatura: 'pizza', vegetarianas: 'pizza', sobremesas: 'doce', bebidas: 'bebida' };
        activeFilter = map[cat] || 'todos';
        filterButtons.forEach(b => b.classList.toggle('filter-active', (b.dataset.filter || 'todos') === activeFilter));
        if (searchInput) searchInput.value = '';
        filterMenu();
        showToast(`Categoria: ${label.replace(/[🔥🍕✨🌱🍫🍷]/g, '').trim()}`);
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/Limpar busca/i.test(label) || iconText === 'mic') {
      button.addEventListener('click', () => {
        const input = button.closest('div')?.querySelector('input[type="search"], input[type="text"]') || searchInput;
        if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }
        showToast('Busca limpa.');
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/Filtros avançados/i.test(label) || iconText === 'tune') {
      button.addEventListener('click', () => {
        const filters = button.closest('section')?.querySelectorAll('button') || [];
        filters.forEach((b, i) => { if (i > 0) b.hidden = !b.hidden; });
        showToast('Filtros adicionais exibidos/ocultados.');
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/Favoritar pizza/i.test(label) || iconText === 'favorite') {
      button.addEventListener('click', () => {
        const active = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('text-primary', active);
        button.classList.toggle('is-favorite', active);
        showToast(active ? 'Pizza adicionada aos favoritos.' : 'Pizza removida dos favoritos.');
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^(Média \(4 fatias\)|Grande \(8 fatias\))$/i.test(label)) {
      button.addEventListener('click', () => {
        const siblings = button.parentElement?.querySelectorAll('button') || [];
        siblings.forEach(b => { b.classList.toggle('bg-surface-container-high', b === button); b.classList.toggle('text-outline', b !== button); b.setAttribute('aria-pressed', String(b === button)); });
        showToast(`Tamanho selecionado: ${label}.`);
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^(Único \(100%\)|Meio a Meio|4 Estações)$/i.test(label)) {
      button.addEventListener('click', () => {
        button.parentElement?.querySelectorAll('button').forEach(b => {
          b.classList.toggle('bg-primary-container', b === button);
          b.classList.toggle('text-on-primary-container', b === button);
          b.setAttribute('aria-pressed', String(b === button));
        });
        const sideB = $('#pizza-side-b-layer');
        if (sideB) sideB.style.display = /Único/i.test(label) ? 'none' : 'flex';
        showToast(`Divisão selecionada: ${label}.`);
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^(Alterar)$/i.test(label)) {
      button.addEventListener('click', () => {
        const current = document.querySelector('#delivery-address, [data-delivery-address]');
        const address = prompt('Digite o endereço de entrega:');
        if (address && address.trim()) {
          const target = current || button.closest('.bg-surface-container')?.querySelector('.truncate');
          if (target) target.textContent = address.trim();
          safeWrite('bellaDeliveryAddress', address.trim());
          showToast('Endereço atualizado neste navegador.');
        }
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (iconText === 'edit' || /Editar pizza/i.test(label)) {
      button.addEventListener('click', () => { activateTab('pizza'); showToast('Edite os sabores e adicione a pizza novamente.'); });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^R\$\s*(3|5|10)$/.test(label)) {
      button.addEventListener('click', () => {
        button.parentElement?.querySelectorAll('button').forEach(b => b.classList.toggle('ring-2', b === button));
        safeWrite('bellaTip', Number(label.replace(/[^0-9]/g, '')));
        renderCart();
        showToast(`Gorjeta selecionada: ${label}.`);
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^Outro$/i.test(label)) {
      button.addEventListener('click', () => {
        const value = prompt('Valor da gorjeta em reais:');
        const amount = Number(String(value || '').replace(',', '.'));
        if (value !== null && Number.isFinite(amount) && amount >= 0) {
          safeWrite('bellaTip', amount);
          renderCart();
          showToast(`Gorjeta de ${money(amount)} selecionada.`);
        }
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    // Botões de etapas do personalizador: indicam a etapa e destacam a seleção.
    if (/^(1 Divisão|2 Massa|3 Borda|4 Sabores)$/i.test(label)) {
      button.addEventListener('click', () => {
        button.parentElement?.querySelectorAll('button').forEach(b => b.classList.toggle('text-secondary', b === button));
        showToast(`Etapa selecionada: ${label}.`);
      });
      button.dataset.jsHandled = 'true';
    }
  });

  // Persistência e apresentação inicial do modo de entrega.
  const savedFulfillment = safeRead('bellaFulfillment', 'delivery');
  setFulfillment(savedFulfillment === 'pickup' ? 'pickup' : 'delivery', false);
  const savedAddress = safeRead('bellaDeliveryAddress', '');
  if (savedAddress) {
    const addressTarget = $('#delivery-address') || $('#tab-carrinho .truncate');
    if (addressTarget) addressTarget.textContent = savedAddress;
  }

  renderCart();
})();