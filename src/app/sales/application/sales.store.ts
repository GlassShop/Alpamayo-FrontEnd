import {computed, Injectable, signal} from '@angular/core';
import {Product, ProductCategory} from '../domain/model/product.entity';
import {Customer} from '../domain/model/customer.entity';
import {SaleItem} from '../domain/model/sale-item.entity';
import {Quote} from '../domain/model/quote.entity';

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'TEMPERED GLASS 10MM', sku: 'TG-10MM-CLR', category: 'glass',      price: 145.00, stock: 248, stockUnit: 'm²' },
  { id: 'p2', name: 'SERIES 20 ALUMINUM PROFILE', sku: 'ALP-S20-BLK', category: 'profiles', price: 82.50,  stock: 52,  stockUnit: 'units' },
  { id: 'p3', name: 'STAINLESS STEEL DOOR KIT', sku: 'HW-SS-DKIT',  category: 'accessories', price: 312.00, stock: 18,  stockUnit: 'kits' },
  { id: 'p4', name: 'STRUCTURAL SILICONE BLACK', sku: 'ACC-SIL-BLK', category: 'accessories', price: 24.90,  stock: 120, stockUnit: 'units' },
  { id: 'p5', name: 'ACID ETCHED FROSTED GLASS', sku: 'TG-8MM-FRST', category: 'glass',      price: 185.00, stock: 85,  stockUnit: 'm²' },
  { id: 'p6', name: 'ALUMINUM PROFILE 30MM', sku: 'ALP-S30-SLV',    category: 'profiles', price: 95.00,  stock: 74,  stockUnit: 'bars' },
  { id: 'p7', name: 'CLEAR FLOAT GLASS 6MM', sku: 'TG-6MM-CLR',     category: 'glass',      price: 68.00,  stock: 310, stockUnit: 'm²' },
  { id: 'p8', name: 'NEOPRENE RUBBER SEAL', sku: 'ACC-NEO-8MM',      category: 'accessories', price: 12.50,  stock: 500, stockUnit: 'units' },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Constructora Altiplano S.A.C.', docType: 'RUC', docNumber: '20601234567' },
  { id: 'c2', name: 'Juan Carlos Mamani',            docType: 'DNI', docNumber: '43210987' },
  { id: 'c3', name: 'Inversiones del Sur E.I.R.L.',  docType: 'RUC', docNumber: '20500112233' },
];

@Injectable({ providedIn: 'root' })
export class SalesStore {
  // ── catalogue ──────────────────────────────────────────────────────────────
  readonly allProducts   = signal<Product[]>(MOCK_PRODUCTS);
  readonly searchQuery   = signal('');
  readonly selectedCategory = signal<'all' | ProductCategory>('all');

  readonly filteredProducts = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const cat  = this.selectedCategory();
    return this.allProducts().filter(p => {
      const matchCat  = cat === 'all' || p.category === cat;
      const matchText = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  });

  // ── customer ───────────────────────────────────────────────────────────────
  readonly availableCustomers = signal<Customer[]>(MOCK_CUSTOMERS);
  readonly customerQuery      = signal('');
  readonly selectedCustomer   = signal<Customer | null>(null);
  readonly showCustomerDropdown = signal(false);

  readonly filteredCustomers = computed(() => {
    const q = this.customerQuery().toLowerCase();
    if (!q) return this.availableCustomers();
    return this.availableCustomers().filter(c =>
      c.name.toLowerCase().includes(q) || c.docNumber.includes(q)
    );
  });

  // ── sale items ─────────────────────────────────────────────────────────────
  readonly saleItems = signal<SaleItem[]>([]);

  readonly subtotal = computed(() =>
    this.saleItems().reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  );
  readonly taxRate  = 0.18;
  readonly taxes    = computed(() => this.subtotal() * this.taxRate);
  readonly total    = computed(() => this.subtotal() + this.taxes());

  // ── catalogue actions ──────────────────────────────────────────────────────
  setSearchQuery(q: string): void { this.searchQuery.set(q); }
  setCategory(cat: 'all' | ProductCategory): void { this.selectedCategory.set(cat); }

  addProductToCatalogue(product: Product): void {
    this.allProducts.update(list => [...list, product]);
  }

  updateProduct(productId: string, updated: Partial<Product>): void {
    this.allProducts.update(list =>
      list.map(p => p.id === productId ? { ...p, ...updated } : p)
    );
    // sync image/name changes inside sale items too
    this.saleItems.update(items =>
      items.map(i => i.product.id === productId ? { ...i, product: { ...i.product, ...updated } } : i)
    );
  }

  // ── sale actions ───────────────────────────────────────────────────────────
  addProduct(product: Product): void {
    const existing = this.saleItems().find(i => i.product.id === product.id);
    if (existing) {
      this.saleItems.update(items =>
        items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      this.saleItems.update(items => [...items, { product, quantity: 1, unitPrice: product.price }]);
    }
  }

  removeItem(productId: string): void {
    this.saleItems.update(items => items.filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: string, qty: number): void {
    if (qty <= 0) { this.removeItem(productId); return; }
    this.saleItems.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
  }

  updateUnitPrice(productId: string, price: number): void {
    if (price < 0) return;
    this.saleItems.update(items =>
      items.map(i => i.product.id === productId ? { ...i, unitPrice: price } : i)
    );
  }

  clearSale(): void { this.saleItems.set([]); }

  // ── saved quotes ───────────────────────────────────────────────────────────
  readonly savedQuotes = signal<Quote[]>([]);
  readonly pendingContractType = signal<import('../domain/model/quote.entity').QuoteType | null>(null);

  setPendingContractType(type: import('../domain/model/quote.entity').QuoteType): void {
    this.pendingContractType.set(type);
  }

  saveQuote(quote: Quote): void {
    this.savedQuotes.update(list => [quote, ...list]);
    this.pendingContractType.set(null);
    this.clearSale();
    this.clearCustomer();
  }

  // ── customer actions ───────────────────────────────────────────────────────
  setCustomerQuery(q: string): void {
    this.customerQuery.set(q);
    this.showCustomerDropdown.set(q.length > 0);
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerQuery.set('');
    this.showCustomerDropdown.set(false);
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.showCustomerDropdown.set(false);
  }

  addCustomer(customer: Customer): void {
    this.availableCustomers.update(list => [...list, customer]);
    this.selectCustomer(customer);
  }
}

