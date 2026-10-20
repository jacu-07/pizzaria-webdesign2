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
  cart = cart.filter(x => x && typeof x.name === 'string').map((x, i) => ({id:x.id || String(Date.now()+i), name:x.name, price:Math.max(0,Number(x.price)||0), qty:Math.max(1,Number(x.qty)||1)}));
  const cartCountEls = $$('[data-cart-count]'), cartTotalEls = $$('[data-cart-total]');
  const cartPanel = $('#tab-carrinho');
  const orderHeading = cartPanel && [...cartPanel.querySelectorAll('*')].find(el => el.children.length === 0 && el.textContent.trim() === 'Seu Pedido');
  const orderHeader = orderHeading?.parentElement?.parentElement;
  let cartItemsHost = $('#live-cart-items');
  if (orderHeader && !cartItemsHost) {
    cartItemsHost = document.createElement('div'); cartItemsHost.id = 'live-cart-items'; cartItemsHost.className = 'flex flex-col gap-3';
    orderHeader.insertAdjacentElement('afterend', cartItemsHost);
    ['Pizza Meio a Meio','Tartufo & Funghi','Coca-Cola Zero'].forEach(name => {
      const h = [...cartPanel.querySelectorAll('h3')].find(el => el.textContent.trim() === name);
      const card = h?.closest('.bg-surface-container.rounded-xl'); if (card) card.hidden = true;
    });
    const sumTitle = [...cartPanel.querySelectorAll('h3')].find(el => el.textContent.trim() === 'Resumo de Valores');
    if (sumTitle?.parentElement) sumTitle.parentElement.dataset.liveSummary = 'true';
  }
  const saveCart = () => safeWrite('bellaMassaCart', cart);
  function renderCart() {
    const count = cart.reduce((s,x)=>s+x.qty,0), subtotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
    const tip = Math.max(0,Number(safeRead('bellaTip',0))||0);
    const pickup = safeRead('bellaFulfillment','delivery') === 'pickup';
    const delivery = pickup || subtotal === 0 || subtotal >= 150 ? 0 : 8;
    const total = subtotal + delivery + tip;
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
        if(label.includes('Cupom')){row.hidden=true;}
      });
      const totalEl=summary.querySelector('[data-cart-total]'); if(totalEl)totalEl.textContent=money(total);
    }
    cartPanel?.querySelectorAll('button[data-go-cart] .font-headline-sm').forEach(el=>el.textContent=money(total));
    const itemsLabel=[...(cartPanel?.querySelectorAll('span')||[])].find(el=>/^3 itens$/.test(el.textContent.trim()));
    if(itemsLabel)itemsLabel.textContent=count+' '+(count===1?'item':'itens');
    const subLabel=[...(cartPanel?.querySelectorAll('span')||[])].find(el=>/^Subtotal \(3 itens\)$/.test(el.textContent.trim()));
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
    if(/Ir para Pagamento/.test(label))button.addEventListener('click',()=>{
      if(!cart.length){showToast('Adicione pelo menos um produto antes de continuar.');activateTab('cardapio');return;}
      showToast('O pagamento online ainda precisa ser conectado a um serviço de pagamento.');
    });
    if(/PIZZA10|Cupom/.test(label))button.addEventListener('click',()=>showToast('Cupons ainda não estão conectados a um sistema de pedidos.'));
  });

  // Personalizador da pizza.
  window.selectFlavor = (name, ingredients, priceDiff, element) => {
    const title = $('#preview-b-title'), sideName = $('#side-b-name'), sideIngredients = $('#side-b-ingredients');
    if (title) title.textContent = name.split(' ')[0];
    if (sideName) sideName.textContent = name;
    if (sideIngredients) sideIngredients.textContent = ingredients;
    const parent = element?.parentElement;
    if (parent) $$('button', parent).forEach(button => {
      button.classList.remove('ring-2', 'ring-primary', 'border-primary');
      button.setAttribute('aria-pressed', 'false');
    });
    element?.classList.add('ring-2', 'ring-primary', 'border-primary');
    element?.setAttribute('aria-pressed', 'true');
    const diff = $('#flavor-price-diff');
    if (diff) diff.textContent = priceDiff;
    showToast(`Sabor ${name} selecionado.`);
  };
  window.handleAddPizza = () => {
    const name = ($('#side-b-name')?.textContent || 'Pizza personalizada').trim();
    const priceText = $('#pizza-total-price')?.textContent || '';
    const match = priceText.match(/([\d.]+,\d{2})/);
    const price = match ? Number(match[1].replace(/\./g, '').replace(',', '.')) : 78.50;
    addToCart(`Pizza personalizada — ${name}`, price);
    activateTab('carrinho');
  };

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
  $('#tab-carrinho button') && $$('#tab-carrinho button').forEach(button => {
    if (/Ir para Pagamento/i.test(button.textContent)) {
      button.addEventListener('click', () => showToast('Pagamento não configurado. Este site ainda não processa pedidos reais.'));
    }
    if (/Cupom|PIZZA10/i.test(button.textContent)) {
      button.addEventListener('click', () => showToast('Cupom demonstrativo: a validação real exige um sistema de pedidos.'));
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
        showToast(`Gorjeta demonstrativa selecionada: ${label}.`);
      });
      button.dataset.jsHandled = 'true';
      return;
    }
    if (/^Outro$/i.test(label)) {
      button.addEventListener('click', () => {
        const value = prompt('Valor da gorjeta em reais:');
        const amount = Number(String(value || '').replace(',', '.'));
        if (Number.isFinite(amount) && amount >= 0) { safeWrite('bellaTip', amount); showToast(`Gorjeta demonstrativa de ${money(amount)} selecionada.`); }
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