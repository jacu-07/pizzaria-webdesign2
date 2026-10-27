/* =====================================================================
   BELLA MASSA PIZZERIA — LÓGICA DO SITE (JAVASCRIPT)
   Este arquivo faz os elementos responderem a ações: busca, filtros,
   carrinho, personalização de pizza, tema claro/escuro e formulário do clube.
   ===================================================================== */
'use strict'; // Pede ao JavaScript um modo mais rigoroso para ajudar a encontrar erros.

// CARDÁPIO: cada objeto representa um produto. Para cadastrar outro item,
// copie um objeto e ajuste id (único), name, category, price, descrição e imagem. 

const MENU = [
  {id:'margherita',name:'Margherita da Casa',category:'Clássicas',price:42,tag:'A queridinha',description:'Molho de tomate, muçarela, manjericão fresco e azeite.',image:'assets/produtos/margherita.webp'},
  {id:'calabresa',name:'Calabresa Artesanal',category:'Clássicas',price:46,tag:'Clássica',description:'Calabresa fatiada, cebola roxa, muçarela e orégano.',image:'assets/produtos/calabresa.webp'},
  {id:'portuguesa',name:'Portuguesa da Vila',category:'Clássicas',price:49,tag:'Favorita',description:'Presunto, ovo, cebola, azeitona, ervilha e muçarela.',image:'assets/produtos/portuguesa.webp'},
  {id:'mussarela',name:'Muçarela Tradicional',category:'Clássicas',price:40,tag:'Simples e perfeita',description:'Molho da casa, muçarela derretida e orégano.',image:'assets/produtos/mussarela.webp'},
  {id:'napolitana',name:'Napolitana',category:'Clássicas',price:44,tag:'Receita clássica',description:'Muçarela, rodelas de tomate, parmesão e orégano.',image:'assets/produtos/margherita.webp'},
  {id:'frango-catupiry',name:'Frango com Catupiry',category:'Clássicas',price:50,tag:'Muito cremosa',description:'Frango desfiado temperado, catupiry e muçarela.',image:'assets/produtos/frango-catupiry.webp'},
  {id:'bacon-milho',name:'Bacon & Milho',category:'Clássicas',price:48,tag:'Queridinha',description:'Bacon crocante, milho, muçarela e toque de orégano.',image:'assets/produtos/calabresa.webp'},
  {id:'quatro-queijos',name:'Quatro Queijos',category:'Especiais',price:52,tag:'Cremosa',description:'Muçarela, provolone, parmesão e gorgonzola na medida.',image:'assets/produtos/quatro-queijos.webp'},
  {id:'diavola',name:'Diavola Piccante',category:'Especiais',price:55,tag:'Levemente picante',description:'Salame picante, muçarela, molho da casa e toque de pimenta.',image:'assets/produtos/pepperoni.webp'},
  {id:'parma',name:'Parma & Rúcula',category:'Especiais',price:59,tag:'Especial da casa',description:'Presunto tipo parma, rúcula fresca, parmesão e azeite.',image:'assets/produtos/vegetariana.webp'},
  {id:'pepperoni',name:'Pepperoni Supreme',category:'Especiais',price:56,tag:'Mais pedida',description:'Pepperoni generoso, muçarela e molho artesanal.',image:'assets/produtos/pepperoni.webp'},
  {id:'costela',name:'Costela BBQ',category:'Especiais',price:62,tag:'Sabor intenso',description:'Costela desfiada, barbecue, cebola roxa e muçarela.',image:'assets/produtos/calabresa.webp'},
  {id:'lombo',name:'Lombo Canadense',category:'Especiais',price:54,tag:'Especial',description:'Lombo canadense, cebola, muçarela e cream cheese.',image:'assets/produtos/portuguesa.webp'},
  {id:'bacon-cheddar',name:'Bacon & Cheddar',category:'Especiais',price:55,tag:'Cheia de sabor',description:'Bacon crocante, cheddar cremoso e muçarela.',image:'assets/produtos/pepperoni.webp'},
  {id:'fungui',name:'Funghi & Rúcula',category:'Vegetarianas',price:54,tag:'Sem carne',description:'Cogumelos salteados, muçarela, rúcula e parmesão.',image:'assets/produtos/vegetariana.webp'},
  {id:'caprese',name:'Caprese Fresca',category:'Vegetarianas',price:50,tag:'Fresquinha',description:'Tomate, muçarela, pesto de manjericão e folhas frescas.',image:'assets/produtos/margherita.webp'},
  {id:'vegetariana',name:'Da Horta',category:'Vegetarianas',price:48,tag:'Colorida e leve',description:'Abobrinha, tomate, champignon, cebola roxa e muçarela.',image:'assets/produtos/vegetariana.webp'},
  {id:'brocolis',name:'Brócolis Cremoso',category:'Vegetarianas',price:49,tag:'Verde & cremosa',description:'Brócolis, alho dourado, catupiry e muçarela.',image:'assets/produtos/vegetariana.webp'},
  {id:'abobrinha',name:'Abobrinha com Parmesão',category:'Vegetarianas',price:47,tag:'Leve',description:'Abobrinha grelhada, parmesão, muçarela e ervas frescas.',image:'assets/produtos/vegetariana.webp'},
  {id:'tomate-seco',name:'Tomate Seco & Rúcula',category:'Vegetarianas',price:52,tag:'Toque gourmet',description:'Tomate seco, rúcula, muçarela e creme de ricota.',image:'assets/produtos/vegetariana.webp'},
  {id:'chocolate',name:'Chocolate Cremoso',category:'Pizzas doces',price:45,tag:'Doce favorita',description:'Chocolate ao leite derretido sobre massa dourada.',image:'assets/produtos/chocolate.webp'},
  {id:'banana-canela',name:'Banana com Canela',category:'Pizzas doces',price:42,tag:'Clássica doce',description:'Banana, açúcar e canela com um toque de leite condensado.',image:'assets/produtos/banana-canela.webp'},
  {id:'romeu-julieta',name:'Romeu e Julieta',category:'Pizzas doces',price:46,tag:'Combinação perfeita',description:'Goiabada cremosa e queijo derretido.',image:'assets/produtos/romeu-julieta.webp'},
  {id:'prestigio',name:'Prestígio',category:'Pizzas doces',price:48,tag:'Coco & chocolate',description:'Chocolate, coco ralado e leite condensado.',image:'assets/produtos/prestigio.webp'},
  {id:'doce-de-leite',name:'Doce de Leite com Paçoca',category:'Pizzas doces',price:49,tag:'Bem brasileira',description:'Doce de leite cremoso finalizado com paçoca esfarelada.',image:'assets/produtos/doce-de-leite-pacoca.webp'},
  {id:'morango-chocolate',name:'Morango com Chocolate',category:'Pizzas doces',price:52,tag:'Especial doce',description:'Chocolate cremoso com morangos frescos.',image:'assets/produtos/morango-chocolate.webp'},
  {id:'refrigerante-lata',name:'Refrigerante Lata 350 ml',category:'Bebidas',price:7,tag:'350 ml',description:'Consulte os sabores disponíveis no atendimento.',image:'assets/produtos/refrigerantes.webp'},
  {id:'refrigerante-2l',name:'Refrigerante 2 litros',category:'Bebidas',price:14,tag:'Para compartilhar',description:'Garrafa de 2 litros. Sabor sujeito à disponibilidade.',image:'assets/produtos/refrigerantes.webp'},
  {id:'agua-sem-gas',name:'Água sem gás 500 ml',category:'Bebidas',price:4,tag:'500 ml',description:'Água mineral sem gás, garrafa de 500 ml.',image:'assets/produtos/sucos-agua.webp'},
  {id:'agua-com-gas',name:'Água com gás 500 ml',category:'Bebidas',price:5,tag:'500 ml',description:'Água mineral com gás, garrafa de 500 ml.',image:'assets/produtos/sucos-agua.webp'},
  {id:'suco-laranja',name:'Suco de Laranja 300 ml',category:'Bebidas',price:9,tag:'300 ml',description:'Suco de laranja. Confirme a disponibilidade no atendimento.',image:'assets/produtos/sucos-agua.webp'},
  {id:'cha-gelado',name:'Chá Gelado 450 ml',category:'Bebidas',price:8,tag:'450 ml',description:'Bebida gelada pronta para acompanhar sua pizza.',image:'assets/produtos/sucos-agua.webp'},
  {id:'energetico',name:'Energético 250 ml',category:'Bebidas',price:10,tag:'250 ml',description:'Lata de energético. Marca conforme disponibilidade.',image:'assets/produtos/refrigerantes.webp'},
  {id:'suco-uva',name:'Suco de Uva 300 ml',category:'Bebidas',price:9,tag:'300 ml',description:'Suco de uva. Confirme a disponibilidade no atendimento.',image:'assets/produtos/sucos-agua.webp'}
];
// INGREDIENTES DA PIZZA PERSONALIZADA: nome e preço adicional de cada extra.
const INGREDIENTS = [
  {name:'Muçarela extra',price:5},{name:'Calabresa',price:5},{name:'Tomate fresco',price:3},{name:'Cebola roxa',price:2},{name:'Bacon crocante',price:6},{name:'Cogumelos',price:6},{name:'Azeitonas',price:2},{name:'Rúcula',price:3},{name:'Frango desfiado',price:6},{name:'Catupiry',price:5}
];
// CHAVES DO ARMAZENAMENTO LOCAL: nomes usados para guardar dados neste navegador.
// localStorage não é um banco de dados online; os dados ficam neste dispositivo/navegador.
const CART_KEY='bellaMassaCart_v1';
const CLUB_KEY='bellaMassaClub_v1';
// Ao iniciar, recupera o carrinho salvo; se não houver dados, começa vazio.
let cart=loadCart();
let activeFilter='Todas';
let toastTimer;
// Formata números como moeda brasileira, por exemplo 42 vira “R$ 42,00”.
const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const byId=id=>document.getElementById(id);
// LÊ O CARRINHO: tenta recuperar e validar os dados salvos. Se houver erro,
// retorna uma lista vazia para evitar que o site pare de funcionar.
function loadCart(){try{const value=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(value)?value.filter(item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&Number.isFinite(item.price)&&Number.isFinite(item.qty)&&item.qty>0):[]}catch{return []}}
// SALVA O CARRINHO: grava os itens e redesenha os totais/quantidades exibidos.
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch{} updateCart()}
// AVISO TEMPORÁRIO: mostra uma mensagem curta e a esconde depois de 2,5 segundos.
function showToast(message){const toast=byId('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2500)}
// DESENHA O CARDÁPIO: aplica busca e categoria ativa e cria os cartões de produtos no HTML.
function renderMenu(){const query=byId('menu-search').value.trim().toLocaleLowerCase('pt-BR');const products=MENU.filter(p=>(activeFilter==='Todas'||p.category===activeFilter)&&`${p.name} ${p.description} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query));byId('product-grid').innerHTML=products.map(p=>`<article class="product-card"><div class="product-photo"><img src="${p.image}" alt="${p.category === 'Bebidas' ? 'Bebida' : p.category === 'Pizzas doces' ? 'Pizza doce' : 'Pizza salgada'} ${p.name}" loading="lazy"><span class="product-tag">${p.tag}</span></div><div class="product-info"><h3>${p.name}</h3><p>${p.description}</p><div class="product-bottom"><span class="product-price">${money(p.price)}</span><button class="add-button" type="button" data-add-product="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">+</button></div></div></article>`).join('');byId('empty-menu').classList.toggle('hidden',products.length>0)}
// ADICIONA UM ITEM: se o produto já estiver na sacola, aumenta a quantidade;
// caso contrário, cria uma nova linha no carrinho.
function addToCart(item){const found=cart.find(row=>row.id===item.id);if(found)found.qty+=1;else cart.push({...item,qty:1});saveCart();showToast(`${item.name} adicionada à sacola`)}
// ATUALIZA O CARRINHO VISUAL: calcula quantidade e subtotal, cria as linhas,
// atualiza os números dos botões e alterna entre estado vazio e resumo.
function updateCart(){const count=cart.reduce((sum,item)=>sum+item.qty,0);byId('cart-count').textContent=count;byId('mobile-cart-count').textContent=count;const total=cart.reduce((sum,item)=>sum+item.price*item.qty,0);byId('cart-subtotal').textContent=money(total);byId('cart-total').textContent=money(total);byId('cart-items').innerHTML=cart.map(item=>`<article class="cart-item"><div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.details||'Pizza do cardápio')}</p><div class="cart-item-controls"><button class="quantity-button" type="button" data-qty="-1" data-id="${escapeAttr(item.id)}" aria-label="Diminuir quantidade">−</button><span class="quantity-value">${item.qty}</span><button class="quantity-button" type="button" data-qty="1" data-id="${escapeAttr(item.id)}" aria-label="Aumentar quantidade">+</button><button class="remove-button" type="button" data-remove="${escapeAttr(item.id)}">Remover</button></div></div><span class="cart-item-price">${money(item.price*item.qty)}</span></article>`).join('');const empty=cart.length===0;byId('cart-empty').classList.toggle('hidden',!empty);byId('cart-summary').classList.toggle('hidden',empty);byId('cart-items').classList.toggle('hidden',empty)}
// PROTEÇÃO DE TEXTO: escapa caracteres especiais antes de colocar nomes no HTML.
// Isso reduz o risco de um nome de produto ser interpretado como marcação HTML.
function escapeHTML(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function escapeAttr(value){return escapeHTML(value)}
// ABRE O PAINEL DO CARRINHO e move o foco para o botão de fechar.
function openCart(){byId('cart-modal').classList.remove('hidden');document.body.classList.add('modal-open');byId('close-cart').focus()}
// FECHA O PAINEL DO CARRINHO e devolve o foco ao botão que o abriu.
function closeCart(){byId('cart-modal').classList.add('hidden');document.body.classList.remove('modal-open');byId('open-cart').focus()}
// CALCULA O PREÇO DA PIZZA PERSONALIZADA: tamanho + massa + ingredientes escolhidos.
// Também bloqueia extras quando o limite de cinco ingredientes é atingido.
function updateCustomTotal(){const size=document.querySelector('input[name="size"]:checked');const dough=byId('dough-select').selectedOptions[0];const chosen=[...document.querySelectorAll('#ingredient-grid input:checked')];const total=Number(size?.dataset.price||32)+Number(dough?.dataset.price||0)+chosen.reduce((sum,input)=>sum+Number(input.dataset.price),0);byId('custom-total').textContent=money(total);byId('ingredient-help').textContent=chosen.length>=5?'Você chegou ao limite de 5 ingredientes.':`Escolha até 5 ingredientes. ${5-chosen.length} ${5-chosen.length===1?'escolha restante':'escolhas restantes'}.`;document.querySelectorAll('#ingredient-grid input:not(:checked)').forEach(input=>input.disabled=chosen.length>=5)}
// CRIA AS OPÇÕES DE INGREDIENTES usando a lista INGREDIENTS e atualiza o preço inicial.
function renderIngredients(){byId('ingredient-grid').innerHTML=INGREDIENTS.map((item,index)=>`<label class="ingredient-choice"><input type="checkbox" name="ingredient" value="${item.name}" data-price="${item.price}" id="ingredient-${index}"><span>${item.name}</span><small>+ ${money(item.price)}</small></label>`).join('');updateCustomTotal()}
// NAVEGAÇÃO: destaca o link da seção indicada na URL (#inicio, #cardapio etc.).
function navigateToHash(){const hash=location.hash.slice(1)||'inicio';const section=document.getElementById(hash);document.querySelectorAll('[data-nav]').forEach(link=>link.classList.toggle('active',link.dataset.nav===hash));if(section){document.querySelectorAll('.page-section[id],.custom-section[id]').forEach(el=>el.classList.toggle('current-section',el===section))}}
// FINALIZAÇÃO DEMONSTRATIVA: gera e baixa um arquivo .txt com o resumo do pedido.
// Atenção: esta função não envia o pedido para a pizzaria e não recebe pagamentos.
function checkout(){if(!cart.length)return;const subtotal=cart.reduce((sum,item)=>sum+item.price*item.qty,0);const notes=byId('order-notes').value.trim();const lines=['PEDIDO — BELLA MASSA PIZZERIA','',...cart.map(item=>`${item.qty}x ${item.name} — ${money(item.price*item.qty)}${item.details?`\n   ${item.details}`:''}`),'',`Subtotal: ${money(subtotal)}`,'Entrega: a combinar no atendimento',...(notes?[`Observações: ${notes}`]:[]),'','Este pedido foi montado no site. Confirmar disponibilidade, entrega e pagamento com a pizzaria.'];const text=lines.join('\n');const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='pedido-bella-massa.txt';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);showToast('Resumo do pedido baixado! Confira o arquivo.');}

// TEMA CLARO/ESCURO: troca o atributo data-theme, o rótulo do botão e a cor do navegador;
// salva a escolha para que ela seja lembrada neste navegador.
function applyTheme(theme){const light=theme==='light';document.documentElement.dataset.theme=light?'light':'dark';const button=byId('theme-toggle');if(button){button.setAttribute('aria-label',light?'Ativar modo escuro':'Ativar modo claro');button.setAttribute('title',light?'Ativar modo escuro':'Ativar modo claro');button.innerHTML=light?'<span class="theme-icon" aria-hidden="true">☾</span><span class="theme-label">Modo escuro</span>':'<span class="theme-icon" aria-hidden="true">☀</span><span class="theme-label">Modo claro</span>';}const meta=byId('theme-color-meta');if(meta)meta.setAttribute('content',light?'#fffaf4':'#17130f');try{localStorage.setItem('bella-massa-theme',light?'light':'dark')}catch{}}
// RECUPERA O TEMA ESCOLHIDO ANTERIORMENTE; usa escuro como padrão na primeira visita.
let savedTheme='dark';try{savedTheme=localStorage.getItem('bella-massa-theme')||'dark'}catch{}applyTheme(savedTheme);byId('theme-toggle').addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='light'?'dark':'light'));
// INICIALIZAÇÃO: coloca o ano atual no rodapé, desenha o cardápio e ingredientes,
// e atualiza o carrinho com o que foi recuperado do armazenamento.
byId('year').textContent=new Date().getFullYear();renderMenu();renderIngredients();updateCart();
// BUSCA: redesenha os produtos sempre que o visitante digita no campo de pesquisa.
byId('menu-search').addEventListener('input',renderMenu);
// FILTROS: quando uma categoria é clicada, marca o botão e refaz a lista de produtos.
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(btn=>btn.classList.toggle('active',btn===button));renderMenu()}));
// BOTÕES “+” DOS PRODUTOS: identifica qual produto foi clicado e adiciona ao carrinho.
byId('product-grid').addEventListener('click' ,event=>{const button=event.target.closest('[data-add-product]');if(!button)return;const product=MENU.find(item=>item.id===button.dataset.addProduct);if(product)addToCart({id:product.id,name:product.name,price:product.price,details:product.description})});
// PERSONALIZADOR: recalcula o preço quando tamanho, massa ou ingredientes mudam.
byId('custom-form').addEventListener('change' ,event=>{if(event.target.matches('input[name="size"],#dough-select,#ingredient-grid input'))updateCustomTotal()});
byId('custom-form').addEventListener('submit',event=>{event.preventDefault();const size=document.querySelector('input[name="size"]:checked');const dough=byId('dough-select').selectedOptions[0];const chosen=[...document.querySelectorAll('#ingredient-grid input:checked')];const total=Number(size.dataset.price)+Number(dough.dataset.price||0)+chosen.reduce((sum,input)=>sum+Number(input.dataset.price),0);const ingredients=chosen.map(input=>input.value);const name=`Pizza personalizada ${size.value}`;const details=`Tamanho: ${size.value}; massa: ${dough.value}; ingredientes: ${ingredients.length?ingredients.join(', '):'sem adicionais'}`;const id=`custom-${size.value}-${dough.value}-${ingredients.slice().sort().join('-')}`.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9-]/g,'');addToCart({id,name,price:total,details});});
// CONTROLES DO CARRINHO: abrir, fechar, clicar fora para fechar e voltar ao cardápio.
byId('open-cart').addEventListener('click' ,openCart);byId('mobile-cart').addEventListener('click',openCart);byId('close-cart').addEventListener('click',closeCart);byId('cart-modal').addEventListener('click',event=>{if(event.target===byId('cart-modal'))closeCart()});byId('browse-menu').addEventListener('click',()=>{closeCart();document.getElementById('cardapio').scrollIntoView({behavior:'smooth'})});
// QUANTIDADES: os botões + e − alteram a quantidade; “Remover” exclui o item.
byId('cart-items').addEventListener('click' ,event=>{const qty=event.target.closest('[data-qty]');const remove=event.target.closest('[data-remove]');if(qty){const item=cart.find(row=>row.id===qty.dataset.id);if(!item)return;item.qty+=Number(qty.dataset.qty);if(item.qty<=0)cart=cart.filter(row=>row.id!==item.id);saveCart()}else if(remove){cart=cart.filter(row=>row.id!==remove.dataset.remove);saveCart()}});
// BOTÃO DE FINALIZAÇÃO: baixa o resumo do pedido criado pela função checkout().
byId('checkout-button').addEventListener('click',checkout);
// CLUBE BELLA: valida nome/e-mail e guarda o cadastro localmente neste navegador.
// Para cadastros reais compartilhados entre dispositivos, é necessário backend ou serviço externo.
byId('club-form').addEventListener('submit' ,event=>{event.preventDefault();const name=byId('club-name').value.trim();const email=byId('club-email').value.trim();if(!name||!email)return;let members=[];try{members=JSON.parse(localStorage.getItem(CLUB_KEY)||'[]');if(!Array.isArray(members))members=[]}catch{members=[]}if(members.some(member=>member.email.toLowerCase()===email.toLowerCase())){byId('club-message').textContent='Este e-mail já está cadastrado neste navegador.';return}members.push({name,email,createdAt:new Date().toISOString()});try{localStorage.setItem(CLUB_KEY,JSON.stringify(members));byId('club-message').textContent=`Tudo certo, ${name.split(' ')[0]}! Seu cadastro de demonstração foi salvo neste navegador.`;byId('club-form').reset()}catch{byId('club-message').textContent='Não foi possível salvar neste navegador. Verifique as configurações de armazenamento.'}});
// LINKS INTERNOS: rola suavemente até a seção escolhida e atualiza o destaque da navegação.
document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const target=document.getElementById(link.getAttribute('href').slice(1));if(target){event.preventDefault();history.replaceState(null,'',link.getAttribute('href'));target.scrollIntoView({behavior:'smooth',block:'start'});navigateToHash()}});
window.addEventListener('hashchange',navigateToHash);document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!byId('cart-modal').classList.contains('hidden'))closeCart()});
// DETECÇÃO DA SEÇÃO VISÍVEL: atualiza o link ativo durante a rolagem, quando o navegador suporta IntersectionObserver.
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;const id=visible.target.id;if(['inicio','cardapio','monte'].includes(id)){document.querySelectorAll('[data-nav]').forEach(link=>link.classList.toggle('active',link.dataset.nav===id))}},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.3,.6]});['inicio','cardapio','monte'].forEach(id=>{const el=byId(id);if(el)observer.observe(el)})}
navigateToHash();
