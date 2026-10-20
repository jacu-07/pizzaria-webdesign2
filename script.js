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

  // Carrinho demonstrativo persistente.
  let cart = safeRead('bellaMassaCart', []);
  if (!Array.isArray(cart)) cart = [];
  const cartCountEls = $$('[data-cart-count]');
  const cartTotalEls = $$('[data-cart-total]');
  function saveCart() { safeWrite('bellaMassaCart', cart); }
  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartCountEls.forEach(el => el.textContent = count);
    cartTotalEls.forEach(el => el.textContent = money(total));
    // Atualiza resumo/indicadores existentes sem reescrever o layout original.
    $$('[data-cart-item]').forEach(item => {
      const qty = Number(item.dataset.qty || 1);
      const price = Number(item.dataset.price || 0);
      const quantity = $('[data-quantity]', item);
      if (quantity) quantity.textContent = qty;
    });
    saveCart();
  }
  function addToCart(name, price = 0) {
    const existing = cart.find(item => item.name === name);
    if (existing) existing.qty += 1;
    else cart.push({ name, price: Number(price) || 0, qty: 1 });
    renderCart();
    showToast(`${name} foi adicionado à sacola.`);
  }
  window.quickAdd = (button, name) => {
    const card = button?.closest('[data-product-card], .group, .menu-product-card') || button?.parentElement?.parentElement;
    const priceText = card?.innerText.match(/R\$\s*([\d.]+,\d{2})/);
    const price = priceText ? Number(priceText[1].replace(/\./g, '').replace(',', '.')) : 0;
    button?.classList.add('scale-75');
    setTimeout(() => button?.classList.remove('scale-75'), 150);
    addToCart(name, price);
  };
  window.addHeroPizza = button => {
    button?.classList.add('scale-95');
    setTimeout(() => button?.classList.remove('scale-95'), 150);
    addToCart('Tartufo & Funghi Selvatici', 89.90);
  };
  $$('[data-add-product]').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('[data-product-card], .menu-product-card, article') || button.parentElement;
    const priceText = card?.innerText.match(/R\$\s*([\d.]+,\d{2})/);
    const parsedPrice = priceText ? Number(priceText[1].replace(/\./g, '').replace(',', '.')) : 0;
    addToCart(button.dataset.addProduct || 'Produto', Number(button.dataset.price || parsedPrice));
  }));
  $$('[data-action="plus"]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('[data-cart-item]');
    if (item) { item.dataset.qty = Number(item.dataset.qty || 1) + 1; renderCart(); }
  }));
  $$('[data-action="minus"]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('[data-cart-item]');
    if (item) { item.dataset.qty = Math.max(1, Number(item.dataset.qty || 1) - 1); renderCart(); }
  }));
  $$('[data-action="delete"]').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('[data-cart-item]');
    if (item) { item.remove(); renderCart(); showToast('Item removido da sacola.'); }
  }));

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