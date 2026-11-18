/**
 * ============================================================================
 * INCLUSIONKIT STORE - Database-Driven Accessible E-Commerce Engine
 * ============================================================================
 * - Products & categories loaded dynamically from Supabase `products` table
 * - Role-Based Access Control:
 *   * Guest (not signed in): View-only (cannot buy / add to cart)
 *   * User (signed in): Can add to cart, checkout, and view orders
 *   * Admin (role === 'admin'): Can add/delete store products in database
 */
window.InclusionKit = window.InclusionKit || {};

(function () {
  'use strict';

  const DB = window.InclusionKit.DB;
  const State = window.InclusionKit.State;

  const SEED_PRODUCTS = [
    {
      id: 'seed-aurapulse',
      name: 'AuraPulse Max Adaptive Headphones',
      category: 'Audio',
      price: 219,
      original_price: 299,
      rating: 4.9,
      reviews: 1280,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      description: 'Noise-cancelling studio headphones with tactile physical buttons and spatial audio cues.',
      swatches: [
        { id: 'obsidian', name: 'Obsidian Black', hex: '#0f172a', symbol: '●' },
        { id: 'chalk', name: 'Alpine Chalk', hex: '#f1f5f9', symbol: '■' },
        { id: 'azure', name: 'Pacific Azure', hex: '#0284c7', symbol: '◆' }
      ]
    },
    {
      id: 'seed-tactilekey',
      name: 'TactileKey Pro Mechanical Keyboard',
      category: 'Input Devices',
      price: 149,
      original_price: 189,
      rating: 4.8,
      reviews: 640,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
      description: 'High-contrast large-print keycaps with crisp tactile switches and programmable macro keys.',
      swatches: [
        { id: 'obsidian', name: 'Stealth Slate', hex: '#1e293b', symbol: '●' },
        { id: 'amber', name: 'High-Vis Amber', hex: '#f59e0b', symbol: '▲' }
      ]
    },
    {
      id: 'seed-lumina',
      name: 'Lumina 27" Anti-Glare Monitor',
      category: 'Displays',
      price: 349,
      original_price: 429,
      rating: 4.7,
      reviews: 412,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
      description: 'Flicker-free matte IPS display with hardware low-blue-light mode and sharp text clarity.',
      swatches: [
        { id: 'obsidian', name: 'Matte Graphite', hex: '#334155', symbol: '●' },
        { id: 'chalk', name: 'Silver Frost', hex: '#cbd5e1', symbol: '■' }
      ]
    },
    {
      id: 'seed-hapticband',
      name: 'HapticBand S3 Assistive Watch',
      category: 'Wearables',
      price: 179,
      original_price: 219,
      rating: 4.6,
      reviews: 318,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      description: 'High-luminance OLED wearable with distinct vibration patterns and voice-first assistant.',
      swatches: [
        { id: 'obsidian', name: 'Midnight', hex: '#111827', symbol: '●' },
        { id: 'coral', name: 'Signal Orange', hex: '#ea580c', symbol: '▲' }
      ]
    }
  ];

  const CART_KEY = 'ik_store_cart';

  class StoreController {
    constructor() {
      this.products = [];
      this.userRole = 'guest';
      this.cart = this.loadCart();
      this.activeCategory = 'All';
      this.searchQuery = '';
      this.selectedProduct = null;
      this.selectedSwatch = null;
      this.modalQty = 1;
      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', async () => {
        this.bindFilters();
        this.bindProductModal();
        this.bindCartDrawer();
        this.bindCheckoutModal();
        this.bindAdminForm();
        this.updateCartBadge();

        await this.refreshStore();

        if (DB) {
          DB.onAuthChange(async () => {
            await this.refreshStore();
          });
        }
      });
    }

    async refreshStore() {
      await this.syncRole();
      await this.loadProducts();
      await this.renderOrders();
    }

    async syncRole() {
      this.userRole = DB ? await DB.getUserRole() : 'guest';
      const guestBanner = document.getElementById('store-guest-banner');
      const adminPanel = document.getElementById('admin-store-panel');
      const ordersCard = document.getElementById('store-orders-card');

      if (guestBanner) guestBanner.classList.toggle('hidden', this.userRole !== 'guest');
      if (adminPanel) adminPanel.classList.toggle('hidden', this.userRole !== 'admin');
      if (ordersCard) ordersCard.classList.toggle('hidden', this.userRole === 'guest');
    }

    async loadProducts() {
      try {
        const dbProducts = DB ? await DB.getProducts() : [];
        this.products = dbProducts.length ? dbProducts : SEED_PRODUCTS;
      } catch (err) {
        console.warn('[Store] Failed to load DB products, using fallback:', err.message);
        this.products = SEED_PRODUCTS;
      }
      this.renderCategories();
      this.renderProducts();
    }

    loadCart() {
      try {
        return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      } catch {
        return [];
      }
    }

    saveCart() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
      } catch (err) {
        console.warn('[Store] Unable to persist cart:', err);
      }
      this.updateCartBadge();
      this.renderCartDrawer();
    }

    requireSignedInUser() {
      if (!DB || !DB.user) {
        window.InclusionKit?.Workspace?.showToast('Please sign in to buy products.', true);
        document.getElementById('account-modal')?.classList.remove('hidden');
        return false;
      }
      return true;
    }

    bindFilters() {
      const searchInput = document.getElementById('store-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.searchQuery = searchInput.value.trim().toLowerCase();
          this.renderProducts();
        });
      }
    }

    renderCategories() {
      const bar = document.getElementById('store-categories-bar');
      if (!bar) return;
      const cats = ['All', ...new Set(this.products.map(p => p.category).filter(Boolean))];
      if (!cats.includes(this.activeCategory)) this.activeCategory = 'All';

      bar.innerHTML = cats.map(cat => {
        const active = cat === this.activeCategory;
        return `<button type="button" data-store-cat="${this.esc(cat)}" aria-pressed="${active}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">${this.esc(cat)}</button>`;
      }).join('');

      bar.querySelectorAll('[data-store-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeCategory = btn.getAttribute('data-store-cat');
          this.renderCategories();
          this.renderProducts();
        });
      });
    }

    renderProducts() {
      const grid = document.getElementById('store-products-grid');
      if (!grid) return;

      const filtered = this.products.filter(p => {
        const matchCat = this.activeCategory === 'All' || p.category === this.activeCategory;
        const matchSearch = !this.searchQuery ||
          p.name.toLowerCase().includes(this.searchQuery) ||
          (p.description || '').toLowerCase().includes(this.searchQuery) ||
          (p.category || '').toLowerCase().includes(this.searchQuery);
        return matchCat && matchSearch;
      });

      if (!filtered.length) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">No products match your filter.</div>`;
        return;
      }

      const isGuest = this.userRole === 'guest';
      const isAdmin = this.userRole === 'admin';

      grid.innerHTML = filtered.map(p => {
        const swatches = Array.isArray(p.swatches) ? p.swatches : [];
        const img = p.image_url || p.image;
        const orig = p.original_price || p.originalPrice || Math.round(p.price * 1.25);
        return `
        <article class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col surface-card hover:shadow-md transition-shadow">
          <div class="relative aspect-[4/3] bg-slate-100 overflow-hidden">
            <img src="${this.esc(img)}" alt="${this.esc(p.name)}" class="w-full h-full object-cover" loading="lazy" />
            <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-white">${this.esc(p.category)}</span>
            ${isAdmin && !String(p.id).startsWith('seed-') ? `<button type="button" data-admin-del="${p.id}" class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700">Delete</button>` : ''}
          </div>
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-amber-600">★ ${p.rating || 4.8} (${p.reviews || 1})</span>
                <span class="text-xs text-slate-400 line-through">$${orig}</span>
              </div>
              <h3 class="font-black text-slate-900 text-base leading-snug">${this.esc(p.name)}</h3>
              <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${this.esc(p.description)}</p>
            </div>

            <div class="flex flex-wrap items-center gap-1.5" aria-label="Available finishes">
              ${swatches.map(s => `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700">
                  <span class="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block" style="background:${s.hex}"></span>
                  <span>${s.symbol}</span>
                  <span>${this.esc(s.name.split(' ')[0])}</span>
                </span>
              `).join('')}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span class="text-xl font-black text-slate-900">$${p.price}</span>
              <div class="flex items-center gap-2">
                <button type="button" data-quick-view="${p.id}" class="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors">View</button>
                <button type="button" data-quick-add="${p.id}" class="px-3.5 py-2 text-xs font-bold rounded-xl transition-colors shadow-sm ${isGuest ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-sky-600 hover:bg-sky-700 text-white'}">
                  ${isGuest ? 'Sign in to Buy' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </article>`;
      }).join('');

      grid.querySelectorAll('[data-quick-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const prod = this.products.find(p => String(p.id) === btn.getAttribute('data-quick-view'));
          if (prod) this.openProductModal(prod);
        });
      });

      grid.querySelectorAll('[data-quick-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.requireSignedInUser()) return;
          const prod = this.products.find(p => String(p.id) === btn.getAttribute('data-quick-add'));
          if (prod) this.addToCart(prod, (prod.swatches || [])[0], 1);
        });
      });

      grid.querySelectorAll('[data-admin-del]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DB.deleteProduct(btn.getAttribute('data-admin-del'));
            await this.loadProducts();
            window.InclusionKit?.Workspace?.showToast('Product removed from database');
          } catch (err) {
            window.InclusionKit?.Workspace?.showToast(err.message, true);
          }
        });
      });
    }

    // ── Admin Add Product Form ─────────────────────────────────────────────
    bindAdminForm() {
      const form = document.getElementById('admin-add-product-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (this.userRole !== 'admin') {
          window.InclusionKit?.Workspace?.showToast('Admin access required.', true);
          return;
        }
        try {
          await DB.addProduct({
            name: document.getElementById('adm-prod-name').value,
            category: document.getElementById('adm-prod-cat').value,
            price: document.getElementById('adm-prod-price').value,
            imageUrl: document.getElementById('adm-prod-img').value,
            description: document.getElementById('adm-prod-desc').value
          });
          form.reset();
          await this.loadProducts();
          window.InclusionKit?.Workspace?.showToast('Product added to database!');
        } catch (err) {
          window.InclusionKit?.Workspace?.showToast(err.message, true);
        }
      });
    }

    // ── Product Detail Modal ───────────────────────────────────────────────
    bindProductModal() {
      const modal = document.getElementById('product-detail-modal');
      const closeBtn = document.getElementById('btn-close-product-modal');
      const decBtn = document.getElementById('pm-qty-dec');
      const incBtn = document.getElementById('pm-qty-inc');
      const qtyEl = document.getElementById('pm-qty-val');
      const addBtn = document.getElementById('pm-add-to-cart');
      const ttsBtn = document.getElementById('pm-listen-tts');

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      }
      if (decBtn && qtyEl) {
        decBtn.addEventListener('click', () => {
          if (this.modalQty <= 1) {
            window.InclusionKit?.VisualHapticEngine?.triggerBoundaryCollision();
            return;
          }
          this.modalQty--;
          qtyEl.textContent = String(this.modalQty);
        });
      }
      if (incBtn && qtyEl) {
        incBtn.addEventListener('click', () => {
          if (this.modalQty >= 5) {
            window.InclusionKit?.VisualHapticEngine?.triggerBoundaryCollision();
            return;
          }
          this.modalQty++;
          qtyEl.textContent = String(this.modalQty);
        });
      }
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          if (!this.requireSignedInUser()) return;
          if (!this.selectedProduct) return;
          this.addToCart(this.selectedProduct, this.selectedSwatch || (this.selectedProduct.swatches || [])[0], this.modalQty);
          modal.classList.add('hidden');
        });
      }
      if (ttsBtn) {
        ttsBtn.addEventListener('click', () => {
          if (!this.selectedProduct) return;
          const text = `${this.selectedProduct.name}. Price ${this.selectedProduct.price} dollars. ${this.selectedProduct.description}`;
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = State?.get('ttsRate') || 1.0;
          window.speechSynthesis.speak(u);
          DB?.logAnalyticsEvent('store_product_tts', 'tts_read');
        });
      }
    }

    openProductModal(product) {
      const swatches = Array.isArray(product.swatches) && product.swatches.length
        ? product.swatches
        : [{ id: 'default', name: 'Standard', hex: '#0f172a', symbol: '●' }];
      this.selectedProduct = product;
      this.selectedSwatch = swatches[0];
      this.modalQty = 1;

      const img = product.image_url || product.image;
      document.getElementById('pm-image').src = img;
      document.getElementById('pm-image').alt = product.name;
      document.getElementById('pm-category').textContent = product.category;
      document.getElementById('pm-title').textContent = product.name;
      document.getElementById('pm-price').textContent = `$${product.price}`;
      document.getElementById('pm-desc').textContent = product.description;
      document.getElementById('pm-qty-val').textContent = '1';

      const addBtn = document.getElementById('pm-add-to-cart');
      if (addBtn) {
        addBtn.textContent = this.userRole === 'guest' ? 'Sign In to Buy' : 'Add to Cart';
      }

      const swatchesContainer = document.getElementById('pm-swatches');
      swatchesContainer.innerHTML = swatches.map((s, idx) => `
        <button type="button" data-pm-swatch="${s.id}" aria-pressed="${idx === 0 ? 'true' : 'false'}"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${idx === 0 ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/30' : 'border-slate-200 bg-white text-slate-700'}">
          <span class="w-3.5 h-3.5 rounded-full border border-slate-300" style="background:${s.hex}"></span>
          <span>${s.symbol}</span>
          <span>${this.esc(s.name)}</span>
        </button>
      `).join('');

      swatchesContainer.querySelectorAll('[data-pm-swatch]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sw = swatches.find(x => x.id === btn.getAttribute('data-pm-swatch'));
          if (!sw) return;
          this.selectedSwatch = sw;
          swatchesContainer.querySelectorAll('[data-pm-swatch]').forEach(b => {
            const active = b === btn;
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
            b.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${active ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/30' : 'border-slate-200 bg-white text-slate-700'}`;
          });
        });
      });

      document.getElementById('product-detail-modal').classList.remove('hidden');
    }

    // ── Cart Management ────────────────────────────────────────────────────
    addToCart(product, swatch, qty = 1) {
      if (!this.requireSignedInUser()) return;
      const sw = swatch || { id: 'default', name: 'Standard', symbol: '●' };
      const existing = this.cart.find(item => String(item.productId) === String(product.id) && item.swatchId === sw.id);
      if (existing) {
        existing.qty = Math.min(10, existing.qty + qty);
      } else {
        this.cart.push({
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image_url || product.image,
          swatchId: sw.id,
          swatchName: `${sw.symbol} ${sw.name}`,
          qty
        });
      }
      this.saveCart();
      DB?.logAnalyticsEvent('store_add_to_cart', 'cart_action', 0, { product: product.id });
      window.InclusionKit?.Workspace?.showToast(`Added ${product.name} to cart`);
      State?.announce(`Added ${product.name} to cart.`);
    }

    updateCartBadge() {
      const badge = document.getElementById('cart-counter-badge');
      if (!badge) return;
      const total = this.cart.reduce((sum, item) => sum + item.qty, 0);
      badge.textContent = String(total);
      badge.classList.toggle('hidden', total === 0);
    }

    bindCartDrawer() {
      const openBtn = document.getElementById('header-cart-btn');
      const closeBtn = document.getElementById('btn-close-cart');
      const drawer = document.getElementById('cart-drawer');
      const checkoutBtn = document.getElementById('btn-proceed-checkout');

      if (openBtn && drawer) {
        openBtn.addEventListener('click', () => {
          this.renderCartDrawer();
          drawer.classList.remove('hidden');
        });
      }
      if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => drawer.classList.add('hidden'));
      }
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (!this.requireSignedInUser()) return;
          if (!this.cart.length) {
            window.InclusionKit?.Workspace?.showToast('Your cart is empty.', true);
            return;
          }
          drawer.classList.add('hidden');
          this.openCheckoutModal();
        });
      }
    }

    renderCartDrawer() {
      const list = document.getElementById('cart-items-list');
      const subtotalEl = document.getElementById('cart-subtotal');
      if (!list || !subtotalEl) return;

      if (!this.cart.length) {
        list.innerHTML = `<p class="text-xs text-slate-500 italic py-6 text-center">Your cart is empty.</p>`;
        subtotalEl.textContent = '$0.00';
        return;
      }

      const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

      list.innerHTML = this.cart.map((item, idx) => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
          <img src="${this.esc(item.image)}" alt="${this.esc(item.name)}" class="w-14 h-14 rounded-lg object-cover shrink-0" />
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-slate-900 truncate">${this.esc(item.name)}</h4>
            <p class="text-[11px] text-slate-500">${this.esc(item.swatchName)} &bull; $${item.price}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <button type="button" data-cart-dec="${idx}" class="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold">-</button>
              <span class="text-xs font-bold">${item.qty}</span>
              <button type="button" data-cart-inc="${idx}" class="w-6 h-6 rounded bg-white border border-slate-300 text-xs font-bold">+</button>
              <button type="button" data-cart-del="${idx}" class="ml-auto text-[11px] font-bold text-rose-600 hover:underline">Remove</button>
            </div>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-cart-dec]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-cart-dec'));
          if (this.cart[i].qty > 1) this.cart[i].qty--;
          else this.cart.splice(i, 1);
          this.saveCart();
        });
      });

      list.querySelectorAll('[data-cart-inc]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-cart-inc'));
          this.cart[i].qty = Math.min(10, this.cart[i].qty + 1);
          this.saveCart();
        });
      });

      list.querySelectorAll('[data-cart-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.cart.splice(Number(btn.getAttribute('data-cart-del')), 1);
          this.saveCart();
        });
      });
    }

    // ── Accessible Checkout & Orders ───────────────────────────────────────
    openCheckoutModal() {
      if (!this.requireSignedInUser()) return;
      const modal = document.getElementById('checkout-modal');
      const total = this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      document.getElementById('checkout-total-label').textContent = `$${total.toFixed(2)}`;
      if (DB?.user?.email) {
        const emailInput = document.getElementById('checkout-email');
        if (emailInput && !emailInput.value) emailInput.value = DB.user.email;
      }
      modal.classList.remove('hidden');
    }

    bindCheckoutModal() {
      const modal = document.getElementById('checkout-modal');
      const closeBtn = document.getElementById('btn-close-checkout');
      const form = document.getElementById('accessible-checkout-form');

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      }
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.requireSignedInUser()) return;
        const name = document.getElementById('checkout-name').value.trim();
        const email = document.getElementById('checkout-email').value.trim();
        const address = document.getElementById('checkout-address').value.trim();

        const nameErr = document.getElementById('co-name-err');
        const emailErr = document.getElementById('co-email-err');
        const addrErr = document.getElementById('co-addr-err');

        let valid = true;
        if (!name) {
          nameErr.textContent = 'Full name is required.';
          nameErr.classList.remove('hidden');
          valid = false;
        } else nameErr.classList.add('hidden');

        if (!email || !email.includes('@')) {
          emailErr.textContent = 'Valid email address is required.';
          emailErr.classList.remove('hidden');
          valid = false;
        } else emailErr.classList.add('hidden');

        if (!address || address.length < 6) {
          addrErr.textContent = 'Shipping address is required.';
          addrErr.classList.remove('hidden');
          valid = false;
        } else addrErr.classList.add('hidden');

        if (!valid) {
          window.InclusionKit?.VisualHapticEngine?.triggerBoundaryCollision();
          return;
        }

        const totalAmount = this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        await DB.placeOrder({
          customerName: name,
          customerEmail: email,
          shippingAddress: address,
          items: [...this.cart],
          totalAmount
        });

        this.cart = [];
        this.saveCart();
        form.reset();
        modal.classList.add('hidden');
        await DB.logAnalyticsEvent('store_order_placed', 'checkout_complete', 0, { total: totalAmount });
        await this.renderOrders();
        window.InclusionKit?.Workspace?.showToast('Order confirmed & saved to database!');
      });
    }

    async renderOrders() {
      const container = document.getElementById('store-orders-list');
      if (!container || !DB || !DB.user) return;
      const orders = await DB.getOrders();
      if (!orders.length) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No orders placed yet.</p>`;
        return;
      }
      container.innerHTML = orders.map(o => `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-slate-900">Order #${String(o.id).slice(0, 8)}</span>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">${this.esc(o.status)}</span>
            </div>
            <p class="text-xs text-slate-600 mt-0.5">${(o.items || []).map(i => `${i.qty}x ${this.esc(i.name)}`).join(', ')}</p>
          </div>
          <span class="text-sm font-black text-slate-900 shrink-0">$${Number(o.total_amount).toFixed(2)}</span>
        </div>
      `).join('');
    }

    esc(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  window.InclusionKit.Store = new StoreController();
})();
