import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const StoreContext = createContext();

// ── API base ─────────────────────────────────────────────
// Vite dev server proxies /api to http://localhost:4000
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

// ── Fetcher — direct path, no mangling ────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("nng_token");
  const url = API_BASE + path; // /api + /slides/all = /api/slides/all ✓
  const res = await fetch(url, {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ── Translations ─────────────────────────────────────────
export const translations = {
  en: {
    brand: "NNG",
    tagline: "Luxury Timepieces",
    home: "Home",
    shop: "Shop",
    brands: "Brands",
    about: "About",
    contact: "Contact",
    search: "Search",
    cart: "Cart",
    wishlist: "Wishlist",
    account: "Account",
    admin: "Admin",
    signIn: "Sign In",
    signOut: "Sign Out",
    addToCart: "Add to Cart",
    addedToCart: "Added to cart",
    buyNow: "Buy Now",
    removeFromCart: "Remove",
    emptyCart: "Your cart is empty",
    emptyWishlist: "Your wishlist is empty",
    total: "Total",
    subtotal: "Subtotal",
    checkout: "Proceed to Checkout",
    continueShopping: "Continue Shopping",
    filterBy: "Filter By",
    sortBy: "Sort By",
    price: "Price",
    brand_filter: "Brand",
    category: "Category",
    availability: "Availability",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    new_arrivals: "New Arrivals",
    featured: "Featured",
    price_asc: "Price: Low to High",
    price_desc: "Price: High to Low",
    newest: "Newest First",
    all: "All",
    results: "results",
    noResults: "No products found",
    searchPlaceholder: "Search for watches, brands...",
    heroTitle: "Timeless Elegance",
    heroSub:
      "Discover the world's finest luxury timepieces, curated for the discerning collector.",
    heroCta: "Explore Collection",
    heroCtaSecondary: "View Brands",
    featuredTitle: "Featured Timepieces",
    newArrivalsTitle: "New Arrivals",
    brandsTitle: "Prestigious Brands",
    whatsappMessage: "Hello, I'm interested in this product.",
    whatsappBtn: "Chat on WhatsApp",
    quantity: "Quantity",
    reference: "Reference",
    movement: "Movement",
    caseMaterial: "Case Material",
    diameter: "Diameter",
    waterResistance: "Water Resistance",
    relatedProducts: "You May Also Like",
    productDetails: "Product Details",
    specifications: "Specifications",
    description: "Description",
    share: "Share",
    orderSummary: "Order Summary",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    address: "Shipping Address",
    city: "City",
    country: "Country",
    placeOrder: "Place Order",
    orderSuccess: "Order placed successfully!",
    categories: {
      dress: "Dress Watches",
      sport: "Sport Watches",
      diver: "Diver Watches",
      pilot: "Pilot Watches",
      vintage: "Vintage",
    },
    adminDashboard: "Dashboard",
    adminProducts: "Products",
    adminOrders: "Orders",
    adminUsers: "Users",
    adminCategories: "Categories",
    adminBrands: "Brands",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    productName: "Product Name",
    productPrice: "Price",
    productBrand: "Brand",
    productCategory: "Category",
    productImages: "Images",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    totalOrders: "Total Orders",
    totalRevenue: "Total Revenue",
    totalProducts: "Total Products",
    totalUsers: "Total Users",
    recentOrders: "Recent Orders",
    status: "Status",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    filterResults: "Filter Results",
    applyFilters: "Apply Filters",
    clearFilters: "Clear Filters",
    close: "Close",
    menu: "Menu",
    backToShop: "← Back to Shop",
    loading: "Loading...",
    error: "Something went wrong",
    loginEmail: "Email",
    loginPassword: "Password",
    loginBtn: "Sign In",
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in to your NNG account",
    noAccount: "Don't have an account?",
    register: "Register",
    registerTitle: "Create Account",
    registerName: "Full Name",
  },
  ar: {
    brand: "NNG",
    tagline: "ساعات فاخرة",
    home: "الرئيسية",
    shop: "المتجر",
    brands: "الماركات",
    about: "عن المتجر",
    contact: "تواصل معنا",
    search: "بحث",
    cart: "السلة",
    wishlist: "المفضلة",
    account: "حسابي",
    admin: "لوحة التحكم",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    addToCart: "أضف إلى السلة",
    addedToCart: "تمت الإضافة إلى السلة",
    buyNow: "اشتر الآن",
    removeFromCart: "إزالة",
    emptyCart: "سلة التسوق فارغة",
    emptyWishlist: "قائمة المفضلة فارغة",
    total: "المجموع",
    subtotal: "المجموع الجزئي",
    checkout: "إتمام الشراء",
    continueShopping: "مواصلة التسوق",
    filterBy: "تصفية حسب",
    sortBy: "ترتيب حسب",
    price: "السعر",
    brand_filter: "الماركة",
    category: "الفئة",
    availability: "التوفر",
    inStock: "متوفر",
    outOfStock: "غير متوفر",
    // new_arrivals: "وصل حديثاً",
    // featured: "مميز",
    price_asc: "السعر: من الأقل إلى الأعلى",
    price_desc: "السعر: من الأعلى إلى الأقل",
    newest: "الأحدث أولاً",
    all: "الكل",
    results: "نتيجة",
    noResults: "لم يتم العثور على منتجات",
    searchPlaceholder: "ابحث عن ساعات، ماركات...",
    heroTitle: "أناقة خالدة",
    heroSub: "اكتشف أرقى الساعات الفاخرة في العالم.",
    heroCta: "استكشف المجموعة",
    heroCtaSecondary: "عرض الماركات",
    featuredTitle: "ساعات مميزة",
    // newArrivalsTitle: "وصل حديثاً",
    brandsTitle: "ماركات مرموقة",
    whatsappMessage: "مرحباً، أنا مهتم بهذا المنتج.",
    whatsappBtn: "تحدث عبر واتساب",
    quantity: "الكمية",
    reference: "المرجع",
    movement: "الحركة",
    caseMaterial: "مادة العلبة",
    diameter: "القطر",
    waterResistance: "مقاومة الماء",
    relatedProducts: "قد يعجبك أيضاً",
    productDetails: "تفاصيل المنتج",
    specifications: "المواصفات",
    description: "الوصف",
    share: "مشاركة",
    orderSummary: "ملخص الطلب",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    address: "عنوان الشحن",
    city: "المدينة",
    country: "الدولة",
    placeOrder: "تأكيد الطلب",
    orderSuccess: "تم تقديم الطلب بنجاح!",
    categories: {
      dress: "ساعات رسمية",
      sport: "ساعات رياضية",
      diver: "ساعات الغوص",
      pilot: "ساعات الطيار",
      vintage: "كلاسيكية",
    },
    adminDashboard: "لوحة المعلومات",
    adminProducts: "المنتجات",
    adminOrders: "الطلبات",
    adminUsers: "المستخدمون",
    adminCategories: "الفئات",
    adminBrands: "الماركات",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    deleteProduct: "حذف المنتج",
    productName: "اسم المنتج",
    productPrice: "السعر",
    productBrand: "الماركة",
    productCategory: "الفئة",
    productImages: "الصور",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    totalOrders: "إجمالي الطلبات",
    totalRevenue: "إجمالي الإيرادات",
    totalProducts: "إجمالي المنتجات",
    totalUsers: "إجمالي المستخدمين",
    recentOrders: "الطلبات الأخيرة",
    status: "الحالة",
    pending: "معلق",
    processing: "جاري المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    filterResults: "تصفية النتائج",
    applyFilters: "تطبيق الفلاتر",
    clearFilters: "مسح الفلاتر",
    close: "إغلاق",
    menu: "القائمة",
    backToShop: "→ العودة للمتجر",
    loading: "جاري التحميل...",
    error: "حدث خطأ ما",
    loginEmail: "البريد الإلكتروني",
    loginPassword: "كلمة المرور",
    loginBtn: "تسجيل الدخول",
    loginTitle: "مرحباً بعودتك",
    loginSubtitle: "سجّل الدخول إلى حسابك",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    registerTitle: "إنشاء حساب",
    registerName: "الاسم الكامل",
  },
};

const WHATSAPP_NUMBER = "+9647504437579";

// Local admin — change these to your preferred credentials
const ADMIN_EMAIL = "nawfel@nng.com";
const ADMIN_PASSWORD = "12qwaszx";

export function StoreProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("nng_lang") || "en",
  );
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nng_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nng_user") || "null");
    } catch {
      return null;
    }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const t = translations[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("nng_lang", lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("nng_cart", JSON.stringify(cart));
  }, [cart]);

  // ── Data loaders ─────────────────────────────────────────
  const loadProducts = useCallback(async (params = {}) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await apiFetch(`/products${qs ? "?" + qs : ""}`);
      setProducts(res.data ?? []);
    } catch (e) {
      setProductsError(e.message);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      const res = await apiFetch("/brands");
      setBrands(res.data ?? []);
    } catch {}
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch("/categories");
      setCategories(res.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
    loadBrands();
    loadCategories();
  }, []);

  // ── Wishlist (local per user) ────────────────────────────
  const loadWishlist = useCallback(async () => {
    if (!user) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(`nng_wish_${user.id}`) || "[]",
      );
      setWishlist(saved);
    } catch {}
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  // ── Toast ────────────────────────────────────────────────
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3000);
  }, []);

  // ── Cart ─────────────────────────────────────────────────
  const addToCart = useCallback(
    (product) => {
      setCart((prev) => {
        const ex = prev.find((x) => x.id === product.id);
        if (ex)
          return prev.map((x) =>
            x.id === product.id ? { ...x, qty: x.qty + 1 } : x,
          );
        return [...prev, { ...product, qty: 1 }];
      });
      addToast(t.addedToCart);
    },
    [t.addedToCart, addToast],
  );

  const removeFromCart = useCallback(
    (id) => setCart((p) => p.filter((x) => x.id !== id)),
    [],
  );
  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return;
    setCart((p) => p.map((x) => (x.id === id ? { ...x, qty } : x)));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);
  const cartTotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);

  // ── Wishlist ─────────────────────────────────────────────
  const toggleWishlist = useCallback(
    (product) => {
      setWishlist((prev) => {
        const has = prev.find((x) => x.id === product.id);
        const next = has
          ? prev.filter((x) => x.id !== product.id)
          : [...prev, product];
        if (user)
          localStorage.setItem(`nng_wish_${user.id}`, JSON.stringify(next));
        return next;
      });
    },
    [user],
  );
  const isInWishlist = useCallback(
    (id) => wishlist.some((x) => x.id === id),
    [wishlist],
  );

  // ── Auth ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Local admin first
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: 1,
        name: "Admin NNG",
        email: ADMIN_EMAIL,
        role: "admin",
      };
      localStorage.setItem("nng_user", JSON.stringify(adminUser));
      localStorage.setItem("nng_token", "local-admin-token");
      setUser(adminUser);
      return adminUser;
    }
    // Otherwise API
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("nng_token", res.token);
      localStorage.setItem("nng_user", JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } catch (e) {
      throw new Error("Invalid email or password");
    }
  }, []);

  const register = useCallback(async (name, email, password, phone = "") => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    localStorage.setItem("nng_token", res.token);
    localStorage.setItem("nng_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nng_token");
    localStorage.removeItem("nng_user");
    setUser(null);
    setWishlist([]);
  }, []);

  const isAdmin = user?.role === "admin";

  // ── WhatsApp ─────────────────────────────────────────────
  const openWhatsApp = useCallback(
    (product) => {
      const msg = product
        ? `${t.whatsappMessage} ${product.name} – ${product.brand_name} ($${Number(product.price).toLocaleString()})`
        : t.whatsappMessage;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    },
    [t.whatsappMessage],
  );

  // ── Admin CRUD ───────────────────────────────────────────
  const createProduct = useCallback(
    async (data) => {
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await loadProducts();
      addToast("Product added");
      return res;
    },
    [loadProducts, addToast],
  );

  const updateProduct = useCallback(
    async (id, data) => {
      const res = await apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await loadProducts();
      addToast("Product updated");
      return res;
    },
    [loadProducts, addToast],
  );

  const deleteProduct = useCallback(
    async (id) => {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      await loadProducts();
      addToast("Product deleted");
    },
    [loadProducts, addToast],
  );

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiFetch("/orders");
      setOrders(res.data ?? []);
    } catch (e) {
      addToast(e.message, "error");
    }
  }, [addToast]);

  const updateOrderStatus = useCallback(
    async (id, status) => {
      await apiFetch(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      addToast("Order status updated");
    },
    [addToast],
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch("/stats");
      setStats(res);
    } catch (e) {
      addToast(e.message, "error");
    }
  }, [addToast]);

  const placeOrder = useCallback(
    async (formData) => {
      const items = cart.map((x) => ({ product_id: x.id, quantity: x.qty }));
      const res = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({ ...formData, user_id: user?.id ?? null, items }),
      });
      clearCart();
      return res;
    },
    [cart, user, clearCart],
  );

  const addBrand = useCallback(
    async (data) => {
      await apiFetch("/brands", { method: "POST", body: JSON.stringify(data) });
      await loadBrands();
      addToast("Brand added");
    },
    [loadBrands, addToast],
  );

  const deleteBrand = useCallback(
    async (id) => {
      await apiFetch(`/brands/${id}`, { method: "DELETE" });
      await loadBrands();
      addToast("Brand deleted");
    },
    [loadBrands, addToast],
  );

  const addCategory = useCallback(
    async (data) => {
      await apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await loadCategories();
      addToast("Category added");
    },
    [loadCategories, addToast],
  );

  const deleteCategory = useCallback(
    async (id) => {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      await loadCategories();
      addToast("Category deleted");
    },
    [loadCategories, addToast],
  );

  // ── Upload image ─────────────────────────────────────────
  const uploadImage = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const token = localStorage.getItem("nng_token");
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data.url;
  }, []);

  const api = useCallback(apiFetch, []);

  return (
    <StoreContext.Provider
      value={{
        lang,
        setLang,
        dir,
        t,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
        cartCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        searchOpen,
        setSearchOpen,
        toasts,
        user,
        isAdmin,
        login,
        logout,
        register,
        authOpen,
        setAuthOpen,
        products,
        productsLoading,
        productsError,
        loadProducts,
        brands,
        categories,
        loadBrands,
        loadCategories,
        createProduct,
        updateProduct,
        deleteProduct,
        orders,
        loadOrders,
        updateOrderStatus,
        stats,
        loadStats,
        placeOrder,
        addBrand,
        deleteBrand,
        addCategory,
        deleteCategory,
        uploadImage,
        openWhatsApp,
        addToast,
        api,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
