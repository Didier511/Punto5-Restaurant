import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Heart,
  Home,
  Lock,
  LogOut,
  Menu as MenuIcon,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { DEMO_USERS, DISHES, PROMO_CODES } from './data/menu';
import { APP_CONFIG, ROLE_LABELS, STAFF_ROLES } from './lib/config';
import { cartCount, money, orderTotal } from './lib/calculations';
import { createCode, createId, readStorage, removeStorage, writeStorage } from './lib/storage';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'menu', label: 'Menu', icon: ChefHat },
  { id: 'order', label: 'Order', icon: ClipboardList },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'reserve', label: 'Reserve', icon: CalendarDays },
];

const dishMeta = {
  1: { rating: 4.9, orderCount: 188 },
  2: { rating: 4.7, orderCount: 124 },
  3: { rating: 4.8, orderCount: 156 },
  4: { rating: 4.9, orderCount: 171 },
  5: { rating: 4.6, orderCount: 92 },
  6: { rating: 4.8, orderCount: 143 },
  7: { rating: 4.7, orderCount: 117 },
  8: { rating: 4.8, orderCount: 164 },
  9: { rating: 4.7, orderCount: 151 },
  10: { rating: 4.9, orderCount: 177 },
  11: { rating: 4.8, orderCount: 169 },
  12: { rating: 4.7, orderCount: 132 },
  13: { rating: 4.5, orderCount: 86 },
  14: { rating: 4.6, orderCount: 101 },
  15: { rating: 4.5, orderCount: 78 },
  16: { rating: 4.4, orderCount: 69 },
  17: { rating: 4.6, orderCount: 104 },
  18: { rating: 4.5, orderCount: 93 },
  19: { rating: 4.5, orderCount: 74 },
  20: { rating: 4.4, orderCount: 67 },
  21: { rating: 4.8, orderCount: 121 },
  22: { rating: 4.7, orderCount: 129 },
  23: { rating: 4.5, orderCount: 75 },
  24: { rating: 4.7, orderCount: 134 },
  25: { rating: 4.6, orderCount: 84 },
  26: { rating: 4.7, orderCount: 112 },
  27: { rating: 4.5, orderCount: 71 },
  28: { rating: 4.8, orderCount: 149 },
  29: { rating: 4.8, orderCount: 116 },
  30: { rating: 4.6, orderCount: 91 },
  31: { rating: 4.7, orderCount: 98 },
  32: { rating: 4.5, orderCount: 88 },
  33: { rating: 4.6, orderCount: 73 },
  34: { rating: 4.8, orderCount: 107 },
  35: { rating: 4.5, orderCount: 68 },
};

function enrichDish(dish) {
  return { ...dish, ...(dishMeta[dish.id] || { emoji: '🍽️', rating: 4.7, orderCount: 80 }) };
}

function App() {
  const [page, setPage] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dishes, setDishes] = useState(() => {
    const savedDishes = readStorage('dishes', null);
    return savedDishes && savedDishes.length >= DISHES.length ? savedDishes : DISHES;
  });
  const [cart, setCart] = useState(() => readStorage('cart', []));
  const [wishlist, setWishlist] = useState(() => readStorage('wishlist', []));
  const [orders, setOrders] = useState(() => readStorage('orders', []));
  const [reservations, setReservations] = useState(() => readStorage('reservations', []));
  const [user, setUser] = useState(() => readStorage('user', null));
  const [promo, setPromo] = useState(() => readStorage('promo', null));
  const [toast, setToast] = useState('');
  const [activeDish, setActiveDish] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);

  const totals = useMemo(() => orderTotal(cart, dishes, promo), [cart, dishes, promo]);
  const count = cartCount(cart);

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.__puntoToast);
    window.__puntoToast = window.setTimeout(() => setToast(''), 2800);
  }

  function go(nextPage) {
    setPage(nextPage);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function persistCart(nextCart) {
    setCart(nextCart);
    writeStorage('cart', nextCart);
  }

  function addToCart(dishId, qty = 1) {
    const nextCart = [...cart];
    const existing = nextCart.find((item) => item.id === dishId);
    if (existing) existing.qty += qty;
    else nextCart.push({ id: dishId, qty });
    persistCart(nextCart);
    notify('Added to cart');
  }

  function updateCart(dishId, delta) {
    const nextCart = cart
      .map((item) => (item.id === dishId ? { ...item, qty: item.qty + delta } : item))
      .filter((item) => item.qty > 0);
    persistCart(nextCart);
  }

  function toggleWishlist(id) {
    const next = wishlist.includes(id) ? wishlist.filter((item) => item !== id) : [...wishlist, id];
    setWishlist(next);
    writeStorage('wishlist', next);
  }

  function clearCart() {
    persistCart([]);
    setPromo(null);
    removeStorage('promo');
  }

  function login(email) {
    const found = DEMO_USERS.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
    const nextUser = found || {
      id: createId('USR'),
      name: email.split('@')[0] || 'Guest',
      email,
      role: 'customer',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUser(nextUser);
    writeStorage('user', nextUser);
    notify(`Welcome, ${nextUser.name}`);
    go(STAFF_ROLES.includes(nextUser.role) ? 'dashboard' : 'home');
  }

  function logout() {
    setUser(null);
    removeStorage('user');
    go('home');
  }

  function placeOrder(formData) {
    if (!cart.length) {
      notify('Add dishes before placing an order');
      go('menu');
      return;
    }

    const order = {
      id: createId('P5'),
      code: createCode(),
      status: 'pending',
      items: cart,
      totals,
      customer: formData,
      createdAt: new Date().toISOString(),
    };
    const nextOrders = [order, ...orders];
    setOrders(nextOrders);
    writeStorage('orders', nextOrders);
    setLastOrder(order);
    clearCart();
    notify(`Order ${order.id} placed. Code: ${order.code}`);
    go('order-confirmation');
  }

  function addReservation(data) {
    const reservation = {
      id: createId('RES'),
      status: 'pending',
      ...data,
      createdAt: new Date().toISOString(),
    };
    const next = [reservation, ...reservations];
    setReservations(next);
    writeStorage('reservations', next);
    notify('Reservation request received');
    go('home');
  }

  function updateOrderStatus(id, status) {
    const next = orders.map((order) => (order.id === id ? { ...order, status } : order));
    setOrders(next);
    writeStorage('orders', next);
  }

  function updateReservationStatus(id, status) {
    const next = reservations.map((reservation) => (
      reservation.id === id ? { ...reservation, status } : reservation
    ));
    setReservations(next);
    writeStorage('reservations', next);
  }

  const shared = {
    dishes,
    cart,
    count,
    totals,
    promo,
    wishlist,
    orders,
    reservations,
    user,
    addToCart,
    updateCart,
    clearCart,
    toggleWishlist,
    setActiveDish,
    setPromo: (nextPromo) => {
      setPromo(nextPromo);
      if (nextPromo) writeStorage('promo', nextPromo);
      else removeStorage('promo');
    },
    placeOrder,
    addReservation,
    updateOrderStatus,
    updateReservationStatus,
    setDishes: (nextDishes) => {
      setDishes(nextDishes);
      writeStorage('dishes', nextDishes);
    },
    notify,
    go,
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Nav
        page={page}
        go={go}
        count={count}
        user={user}
        logout={logout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main>
        {page === 'home' && <HomePage {...shared} />}
        {page === 'menu' && <MenuPage {...shared} />}
        {page === 'cart' && <CartPage {...shared} />}
        {page === 'order' && <OrderPage {...shared} />}
        {page === 'order-confirmation' && <OrderConfirmation order={lastOrder} go={go} />}
        {page === 'reserve' && <ReservePage addReservation={addReservation} />}
        {page === 'auth' && <AuthPage login={login} />}
        {page === 'dashboard' && (
          <DashboardPage
            {...shared}
            requireAuth={() => {
              notify('Sign in to access the dashboard');
              go('auth');
            }}
          />
        )}
      </main>
      {activeDish && <DishModal dish={activeDish} addToCart={addToCart} close={() => setActiveDish(null)} />}
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-leaf-700 px-4 py-3 text-sm font-semibold text-white shadow-soft">{toast}</div>}
    </div>
  );
}

function Nav({ page, go, count, user, logout, mobileOpen, setMobileOpen }) {
  const links = (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => go(item.id)} className={`nav-link ${page === item.id ? 'nav-link-active' : ''}`}>
            <Icon size={18} />
            {item.label}
            {item.id === 'cart' && count > 0 ? <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs text-ink">{count}</span> : null}
          </button>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <button onClick={() => go('home')} className="font-display text-2xl font-bold">
          Punto <span className="text-gold-500">5</span>
        </button>
        <nav className="hidden items-center gap-2 md:flex">{links}</nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {STAFF_ROLES.includes(user.role) && <button onClick={() => go('dashboard')} className="btn btn-secondary">Dashboard</button>}
              <button onClick={logout} className="icon-btn" aria-label="Sign out"><LogOut size={18} /></button>
            </>
          ) : (
            <button onClick={() => go('auth')} className="btn btn-secondary"><Lock size={16} /> Sign in</button>
          )}
        </div>
        <button className="icon-btn md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu">
          {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>
      {mobileOpen && <div className="border-t border-stone-200 bg-white p-4 md:hidden"><div className="grid gap-2">{links}</div></div>}
    </header>
  );
}

function HomePage({ dishes, addToCart, setActiveDish, go }) {
  const featured = dishes.slice(0, 10);
  const popularDishes = getPopularDishes(dishes);

  return (
    <>
      <Carousel dishes={featured} setActiveDish={setActiveDish} />

      <section className="welcome-band">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center text-white md:py-16">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur">
            Accra, Ghana - Est. 2025
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-3xl sm:text-3xl font-bold leading-tight md:text-6xl">
            Welcome to Punto 5
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/90">
            Where West African flavors meet continental cuisine - every dish is
            a journey worth taking.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => go("menu")}
              className="btn min-h-14 bg-gold-500 px-10 text-base text-ink hover:bg-gold-400"
            >
              Explore Menu
            </button>
            <button
              onClick={() => go("order")}
              className="btn min-h-14 border-2 border-white/45 bg-white/10 px-10 text-base text-white hover:bg-white/20"
            >
              Order Now
            </button>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            <HeroStat value="35" label="Unique Dishes" />
            <HeroStat
              value="4.8"
              label="Avg Rating"
              icon={<Star size={17} fill="currentColor" />}
            />
            <HeroStat value="25 min" label="Avg Delivery" />
            <HeroStat value="500+" label="Happy Customers" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="🚀"
            title="Instant Orders"
            text="Order now and get fresh food in 25-35 min"
          />
          <FeatureCard
            icon="🗓️"
            title="Schedule Ahead"
            text="Pre-order for your preferred date & time"
          />
          <FeatureCard
            icon="🛵"
            title="Fast Delivery"
            text="Right to your door with a verification code"
          />
          <FeatureCard
            icon="🪑"
            title="Table Reservation"
            text="Book a table for the perfect dine-in experience"
          />
          <FeatureCard
            icon="💖"
            title="Wishlist"
            text="Save your favourites for later"
          />
          <FeatureCard
            icon="⭐"
            title="Rate & Review"
            text="Rate dishes and read honest community reviews"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display md:text-3xl text-xl font-bold">
              Most Popular Dishes
            </h2>
            <p className="text-stone-600 text-sm">Top picks by orders and rating.</p>
          </div>
          <button onClick={() => go("menu")} className="btn btn-ghost">
            View all
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              addToCart={addToCart}
              setActiveDish={setActiveDish}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function getPopularDishes(dishes) {
  const rank = (dish) => {
    const enriched = enrichDish(dish);
    return (enriched.orderCount * 2) + (enriched.rating * 10);
  };
  const topByType = (type) => dishes
    .filter((dish) => dish.type === type)
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, 2);
  return [...topByType('local'), ...topByType('continental')].map(enrichDish);
}

function Carousel({ dishes, setActiveDish }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (dishes.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % dishes.length), 4200);
    return () => window.clearInterval(timer);
  }, [dishes.length]);

  if (!dishes.length) return null;

  const current = dishes[index];

  return (
    <section className="bg-leaf-900">
      <div className="relative h-[440px] overflow-hidden md:h-[560px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {dishes.map((dish) => (
            <button
              key={dish.id}
              onClick={() => setActiveDish(dish)}
              className="relative h-full min-w-full text-left text-white"
            >
              <img
                src={dish.img}
                alt={dish.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15" />
              <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 pb-10 md:pb-14">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase text-leaf-700">
                    {dish.type === "local" ? "Local Ghanaian" : "Continental"}
                  </span>
                  <span className="rounded-full bg-gold-500 px-3 py-1 text-sm font-bold text-black">
                    {money(dish.price)}
                  </span>
                </div>
                <h2 className="my-4 max-w-2xl font-display text-2xl font-bold md:text-5xl">
                  {dish.name}
                </h2>
              </div>
            </button>
          ))}
        </div>

        <button
          className="carousel-arrow left-4"
          onClick={() => setIndex((index - 1 + dishes.length) % dishes.length)}
          aria-label="Previous dish"
        >
          ‹
        </button>
        <button
          className="carousel-arrow right-4"
          onClick={() => setIndex((index + 1) % dishes.length)}
          aria-label="Next dish"
        >
          ›
        </button>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {dishes.map((dish, dotIndex) => (
            <button
              key={dish.id}
              onClick={() => setIndex(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${dotIndex === index ? "w-8 bg-gold-500" : "w-2.5 bg-white/70"}`}
              aria-label={`Show ${dish.name}`}
            />
          ))}
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold text-white">
          {index + 1} / {dishes.length} - {current.origin}
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label, icon = null }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gold-400">{value}{icon}</div>
      <p className="mt-1 text-sm text-white/85">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mb-6 text-4xl leading-none" aria-hidden="true">{icon}</div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{text}</p>
    </article>
  );
}

function MenuPage({ dishes, addToCart, setActiveDish, wishlist, toggleWishlist }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const visible = dishes.filter((dish) => {
    const matchesFilter = filter === 'all' || dish.type === filter;
    const search = `${dish.name} ${dish.origin} ${dish.desc} ${dish.tags.join(' ')}`.toLowerCase();
    return matchesFilter && search.includes(query.toLowerCase());
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-bold">Menu</h1>
          <p className="text-stone-600">Search, filter, and add dishes to the cart.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'local', 'continental'].map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`btn ${filter === item ? 'btn-secondary' : 'btn-ghost'}`}>{item}</button>
          ))}
        </div>
      </div>
      <label className="mb-6 flex max-w-xl items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
        <Search size={18} className="text-stone-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes, tags, or origins" className="w-full bg-transparent outline-none" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            addToCart={addToCart}
            setActiveDish={setActiveDish}
            wishlisted={wishlist.includes(dish.id)}
            toggleWishlist={toggleWishlist}
          />
        ))}
      </div>
    </section>
  );
}

function DishCard({ dish, addToCart, setActiveDish, wishlisted = false, toggleWishlist }) {
  const displayDish = enrichDish(dish);

  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <button onClick={() => setActiveDish(dish)} className="block w-full text-left">
        <div className="relative aspect-[4/3] bg-stone-100">
          <img src={dish.img} alt={dish.name} className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase text-leaf-700">{dish.type}</span>
          <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-2xl shadow-sm" aria-hidden="true">{displayDish.emoji}</span>
        </div>
      </button>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold">{dish.name}</h3>
            <p className="text-sm text-stone-500">{dish.origin}</p>
          </div>
          <span className="font-bold text-leaf-700">{money(dish.price)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-stone-600">{dish.desc}</p>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span className="text-gold-500">{'★'.repeat(Math.round(displayDish.rating))}</span>
          <span>{displayDish.rating.toFixed(1)}</span>
          <span>•</span>
          <span>{displayDish.orderCount} orders</span>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => addToCart(dish.id)} className="btn btn-secondary"><Plus size={16} /> Add</button>
          {toggleWishlist && (
            <button onClick={() => toggleWishlist(dish.id)} className={`icon-btn ${wishlisted ? 'text-red-600' : 'text-stone-500'}`} aria-label="Toggle wishlist">
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CartPage({ cart, dishes, updateCart, clearCart, totals, promo, setPromo, go }) {
  const [promoInput, setPromoInput] = useState('');
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {!cart.length && <EmptyState title="Your cart is empty" action="Browse menu" onClick={() => go('menu')} />}
          {cart.map((item) => {
            const dish = dishes.find((candidate) => candidate.id === item.id);
            if (!dish) return null;
            return (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-3">
                <img src={dish.img} alt={dish.name} className="h-20 w-20 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{dish.name}</h3>
                  <p className="text-sm text-stone-500">{money(dish.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="icon-btn" onClick={() => updateCart(item.id, -1)}><Minus size={16} /></button>
                  <span className="w-8 text-center font-semibold">{item.qty}</span>
                  <button className="icon-btn" onClick={() => updateCart(item.id, 1)}><Plus size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl font-bold">Order summary</h2>
          <SummaryLine label="Subtotal" value={money(totals.subtotal)} />
          <SummaryLine label="Delivery" value={money(totals.delivery)} />
          {promo && <SummaryLine label={`Discount (${promo.code})`} value={`-${money(totals.discount)}`} />}
          <div className="my-4 flex gap-2">
            <input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Promo code" className="form-input" />
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (promo) setPromo(null);
                else {
                  const code = promoInput.trim().toUpperCase();
                  if (PROMO_CODES[code]) setPromo({ ...PROMO_CODES[code], code });
                }
              }}
            >
              {promo ? 'Remove' : 'Apply'}
            </button>
          </div>
          <SummaryLine label="Total" value={money(totals.total)} strong />
          <button disabled={!cart.length} onClick={() => go('order')} className="btn btn-secondary mt-5 w-full">Proceed to order</button>
          {!!cart.length && <button onClick={clearCart} className="btn btn-ghost mt-2 w-full">Clear cart</button>}
        </aside>
      </div>
    </section>
  );
}

function OrderPage({ cart, dishes, totals, placeOrder }) {
  const [form, setForm] = useState({ name: '', phone: '', type: 'instant', address: '', note: '' });
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Place an order</h1>
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['instant', 'scheduled', 'pickup', 'delivery'].map((type) => (
            <button key={type} onClick={() => setForm({ ...form, type })} className={`rounded-lg border p-4 text-left capitalize ${form.type === type ? 'border-leaf-700 bg-leaf-50' : 'border-stone-200'}`}>
              <ClipboardList size={18} /> <span className="mt-2 block font-semibold">{type}</span>
            </button>
          ))}
        </div>
        <div className="mb-5 rounded-lg bg-stone-50 p-4">
          {cart.map((item) => {
            const dish = dishes.find((candidate) => candidate.id === item.id);
            return dish ? <SummaryLine key={item.id} label={`${dish.name} x ${item.qty}`} value={money(dish.price * item.qty)} /> : null;
          })}
          <SummaryLine label="Total" value={money(totals.total)} strong />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="form-input" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="form-input" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </div>
        <input className="form-input mt-4" placeholder="Delivery address or pickup note" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        <textarea className="form-input mt-4 min-h-24" placeholder="Special instructions" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <button disabled={!form.name || !form.phone} onClick={() => placeOrder(form)} className="btn btn-secondary mt-5 w-full">Place order</button>
      </div>
    </section>
  );
}

function ReservePage({ addReservation }) {
  const [form, setForm] = useState({ name: '', phone: '', guests: '2', date: '', time: '7:00 PM', note: '' });
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Reserve a table</h1>
      <div className="mt-6 grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <input className="form-input" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="form-input" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <select className="form-input" value={form.guests} onChange={(event) => setForm({ ...form, guests: event.target.value })}>
            {['1', '2', '3', '4', '5', '6+'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <input className="form-input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <select className="form-input" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}>
            {['12:00 PM', '12:30 PM', '1:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <textarea className="form-input min-h-24" placeholder="Special requests" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <button disabled={!form.name || !form.phone || !form.date} onClick={() => addReservation(form)} className="btn btn-secondary">Confirm reservation</button>
      </div>
    </section>
  );
}

function AuthPage({ login }) {
  const [email, setEmail] = useState('');
  return (
    <section className="mx-auto flex max-w-md px-4 py-16">
      <div className="w-full rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <UserRound className="mx-auto text-leaf-700" size={34} />
        <h1 className="mt-3 text-center font-display text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-center text-sm text-stone-600">This demo uses email-only local sign-in. Real passwords belong on the backend.</p>
        <input className="form-input mt-6" type="email" placeholder="admin@punto5.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <button disabled={!email} onClick={() => login(email)} className="btn btn-secondary mt-4 w-full">Continue</button>
      </div>
    </section>
  );
}

function OrderConfirmation({ order, go }) {
  if (!order) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="No recent order to show" action="Browse menu" onClick={() => go('menu')} />
      </section>
    );
  }

  const steps = ['Received', 'Confirmed', 'Preparing', 'Ready', 'Delivered'];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-700">Order placed</p>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold">Order #{order.id}</h1>
            <p className="mt-2 text-stone-600">Thanks, {order.customer.name}. Your order has been received.</p>
          </div>
          <div className="rounded-lg bg-leaf-50 px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase text-leaf-700">Delivery code</p>
            <strong className="mt-1 block text-3xl tracking-[0.18em] text-leaf-900">{order.code}</strong>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
              <div className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${index === 0 ? 'bg-leaf-700 text-white' : 'bg-white text-stone-500'}`}>
                {index + 1}
              </div>
              <p className="text-sm font-semibold">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-stone-50 p-4">
          <SummaryLine label="Total" value={money(order.totals.total)} strong />
          <SummaryLine label="Phone" value={order.customer.phone} />
          <SummaryLine label="Type" value={order.customer.type} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-secondary" onClick={() => go('menu')}>Order more</button>
          <button className="btn btn-ghost" onClick={() => go('home')}>Back home</button>
        </div>
      </div>
    </section>
  );
}

function DashboardPage({ user, orders, reservations, updateOrderStatus, updateReservationStatus, requireAuth }) {
  if (!user) {
    requireAuth();
    return null;
  }

  const revenue = orders.reduce((total, order) => total + order.totals.total, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="text-stone-600">{user.name} - {ROLE_LABELS[user.role] || user.role}</p>
        </div>
        <BarChart3 className="text-leaf-700" size={32} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Orders" value={orders.length} />
        <Metric label="Reservations" value={reservations.length} />
        <Metric label="Revenue" value={money(revenue)} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <DataPanel title="Orders">
          {orders.length === 0 && <p className="p-4 text-sm text-stone-500">No orders yet.</p>}
          {orders.map((order) => (
            <div key={order.id} className="grid gap-3 border-t border-stone-100 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <strong>{order.id}</strong>
                <p className="text-sm text-stone-600">{order.customer.name} - {money(order.totals.total)} - Code {order.code}</p>
              </div>
              <select className="form-input" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                {['pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          ))}
        </DataPanel>
        <DataPanel title="Reservations">
          {reservations.length === 0 && <p className="p-4 text-sm text-stone-500">No reservations yet.</p>}
          {reservations.map((reservation) => (
            <div key={reservation.id} className="grid gap-3 border-t border-stone-100 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <strong>{reservation.id}</strong>
                <p className="text-sm text-stone-600">{reservation.name} - {reservation.guests} guests - {reservation.date} at {reservation.time}</p>
              </div>
              <select className="form-input" value={reservation.status} onChange={(event) => updateReservationStatus(reservation.id, event.target.value)}>
                {['pending', 'confirmed', 'cancelled'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          ))}
        </DataPanel>
      </div>
    </section>
  );
}

function DishModal({ dish, addToCart, close }) {
  const [qty, setQty] = useState(1);
  const displayDish = enrichDish(dish);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-soft" onClick={(event) => event.stopPropagation()}>
        <img src={dish.img} alt={dish.name} className="h-72 w-full object-cover" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold"><span className="mr-2">{displayDish.emoji}</span>{dish.name}</h2>
              <p className="text-stone-600">{dish.origin} - {dish.type}</p>
            </div>
            <button className="icon-btn" onClick={close}><X size={18} /></button>
          </div>
          <p className="mt-4 text-stone-700">{dish.desc}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-stone-600">
            <span className="text-gold-500">{'★'.repeat(Math.round(displayDish.rating))}</span>
            <span>{displayDish.rating.toFixed(1)}</span>
            <span>•</span>
            <span>{displayDish.orderCount} orders</span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-2xl font-bold text-leaf-700">{money(dish.price * qty)}</span>
            <div className="flex items-center gap-2">
              <button className="icon-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button className="icon-btn" onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
            </div>
          </div>
          <button onClick={() => { addToCart(dish.id, qty); close(); }} className="btn btn-secondary mt-5 w-full">Add to cart</button>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }) {
  return <div className={`flex justify-between py-2 ${strong ? 'border-t border-stone-200 text-lg font-bold' : 'text-sm text-stone-700'}`}><span>{label}</span><span>{value}</span></div>;
}

function EmptyState({ title, action, onClick }) {
  return <div className="rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-semibold">{title}</p><button onClick={onClick} className="btn btn-secondary mt-4">{action}</button></div>;
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></div>;
}

function DataPanel({ title, children }) {
  return <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"><h2 className="p-4 font-display text-2xl font-bold">{title}</h2>{children}</section>;
}

export default App;
