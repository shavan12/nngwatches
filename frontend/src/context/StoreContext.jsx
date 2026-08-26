import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
    auctions: "Auctions",
    auctionLive: "Live",
    auctionUpcoming: "Upcoming",
    auctionEnded: "Ended",
    currentBid: "Current Bid",
    startingPrice: "Starting Price",
    minIncrement: "Min Increment",
    placeBid: "Place Bid",
    bidHistory: "Bid History",
    bidders: "Bidders",
    noBidsYet: "No bids yet",
    auctionWinner: "Winner",
    timeRemaining: "Time Remaining",
    auctionStartsIn: "Starts In",
    bidTooLow: "Bid must be at least",
    bidSuccess: "Bid placed successfully!",
    loginToBid: "Sign in to place a bid",
    auctionEndedMsg: "This auction has ended",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    yourBid: "Your Bid",
    adminAuctions: "Auctions",
    createAuction: "Create Auction",
    editAuction: "Edit Auction",
    deleteAuction: "Delete Auction",
    auctionName: "Watch Name",
    auctionBrand: "Brand",
    auctionDescription: "Description",
    auctionImage: "Image",
    auctionStartDate: "Start Date",
    auctionEndDate: "End Date",
    auctionEnabled: "Enabled",
    highestBid: "Highest Bid",
    endAuction: "End Auction",
    viewAllAuctions: "View All Auctions",
    noAuctions: "No auctions available",
    congratsWinner: "Congratulations to the winner!",
    allAuctions: "All",
    auctionNotStarted: "Auction hasn't started yet",
    enterBidAmount: "Enter bid amount",
    // Registration
    confirmPassword: "Confirm Password",
    location: "Location / Address",
    phonePlaceholder: "e.g. +964 750 443 7579",
    locationPlaceholder: "City, Country",
    registerPhone: "Phone Number",
    registerSubtitle: "Join NNG Watches",
    // Registration validation
    errFieldsRequired: "Name, email and password are required",
    errPhoneRequired: "Please enter your phone number",
    errLocationRequired: "Please enter your location",
    errPasswordShort: "Password must be at least 6 characters",
    errPasswordMismatch: "Passwords do not match",
    errInvalidEmail: "Please enter a valid email address",
    errEmailExists: "This email address is already registered",
    errRegistration: "Registration failed. Please try again.",
    // Profile
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    accountCreated: "Account Created",
    accountStatus: "Account Status",
    profileUpdated: "Profile updated successfully!",
    profileInfo: "Profile Information",
    // Notifications
    notifications: "Notifications",
    notificationCenter: "Notification Center",
    markAllRead: "Mark All Read",
    read: "Read",
    unread: "Unread",
    noNotifications: "No notifications yet",
    allCaughtUp: "You're all caught up!",
    viewAllNotifications: "View All Notifications",
    notifPreferences: "Notification Preferences",
    deviceNotifications: "Device Notifications",
    deviceNotifEnabled: "You will receive notifications even when the website is closed",
    deviceNotifDisabled: "Enable to get notifications on your device",
    notifCategories: "Categories",
    newAuctions: "New Auctions",
    newAuctionsDesc: "Notified when new auctions are created",
    upcomingAuctions: "Upcoming Auctions",
    upcomingAuctionsDesc: "Reminders before auctions start",
    bidsActivity: "Bid Activity",
    bidsActivityDesc: "New bids and outbid alerts",
    auctionResults: "Auction Results",
    auctionResultsDesc: "Win/loss notifications when auctions end",
    mandatoryNote: "Outbid alerts and auction results are mandatory and cannot be disabled.",
    loadMore: "Load More",
    // Admin - Customer Management
    adminCustomers: "Customers",
    customerManagement: "Customer Management",
    customerInfo: "Customer Information",
    orderDetails: "Order Details",
    shippingAddress: "Shipping Address",
    orderedItems: "Ordered Items",
    orderDate: "Order Date",
    shipping: "Shipping",
    notes: "Notes",
    customerId: "ID",
    customerName: "Name",
    customerEmail: "Email",
    customerPhone: "Phone",
    customerLocation: "Location",
    registrationDate: "Registration Date",
    customerStatus: "Status",
    totalBids: "Total Bids",
    totalAuctionsParticipated: "Auctions",
    totalWins: "Wins",
    searchCustomers: "Search customers...",
    active: "Active",
    suspended: "Suspended",
    banned: "Banned",
    // Admin - Completed Auctions
    completedAuctions: "Completed Auctions",
    finalPrice: "Final Price",
    winner: "Winner",
    winningBid: "Winning Bid",
    winnerEmail: "Winner Email",
    winnerPhone: "Winner Phone",
    winnerLocation: "Winner Location",
    noWinner: "No Winner",
    noBids: "No Bids",
    orderStatus: "Order Status",
    paymentStatus: "Payment Status",
    createWinnerOrder: "Create Order",
    viewOrder: "View Order",
    // Auction Checkout
    completeOrder: "Complete Your Order",
    auctionCheckout: "Auction Checkout",
    auctionOrderSummary: "Auction Order Summary",
    shippingInfo: "Shipping Information",
    confirmOrder: "Confirm Order",
    orderCreated: "Order created successfully!",
    orderExists: "An order already exists for this auction",
    wonAuction: "You won this auction!",
    winningAmount: "Winning Amount",
    proceedToCheckout: "Proceed to Checkout",
    freeShipping: "Free Shipping",
    // Admin extras
    adminSlides: "Hero Slides",
    adminNotifications: "Notifications",
    settings: "Settings",
    refresh: "Refresh",
    noOrders: "No orders yet",
    orderNotes: "Notes",
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
    auctions: "المزادات",
    auctionLive: "مباشر",
    auctionUpcoming: "قادم",
    auctionEnded: "انتهى",
    currentBid: "المزايدة الحالية",
    startingPrice: "سعر البداية",
    minIncrement: "الحد الأدنى للزيادة",
    placeBid: "قدّم مزايدة",
    bidHistory: "سجل المزايدات",
    bidders: "المزايدون",
    noBidsYet: "لا توجد مزايدات بعد",
    auctionWinner: "الفائز",
    timeRemaining: "الوقت المتبقي",
    auctionStartsIn: "يبدأ خلال",
    bidTooLow: "يجب أن تكون المزايدة على الأقل",
    bidSuccess: "تم تقديم المزايدة بنجاح!",
    loginToBid: "سجّل الدخول لتقديم مزايدة",
    auctionEndedMsg: "انتهى هذا المزاد",
    days: "أيام",
    hours: "ساعات",
    minutes: "دقائق",
    seconds: "ثوانٍ",
    yourBid: "مزايدتك",
    adminAuctions: "المزادات",
    createAuction: "إنشاء مزاد",
    editAuction: "تعديل المزاد",
    deleteAuction: "حذف المزاد",
    auctionName: "اسم الساعة",
    auctionBrand: "الماركة",
    auctionDescription: "الوصف",
    auctionImage: "الصورة",
    auctionStartDate: "تاريخ البداية",
    auctionEndDate: "تاريخ النهاية",
    auctionEnabled: "مفعّل",
    highestBid: "أعلى مزايدة",
    endAuction: "إنهاء المزاد",
    viewAllAuctions: "عرض جميع المزادات",
    noAuctions: "لا توجد مزادات متاحة",
    congratsWinner: "مبروك للفائز!",
    allAuctions: "الكل",
    auctionNotStarted: "لم يبدأ المزاد بعد",
    enterBidAmount: "أدخل مبلغ المزايدة",
    // Registration
    confirmPassword: "تأكيد كلمة المرور",
    location: "الموقع / العنوان",
    phonePlaceholder: "مثال: +964 750 443 7579",
    locationPlaceholder: "المدينة، البلد",
    registerPhone: "رقم الهاتف",
    registerSubtitle: "انضم إلى NNG للساعات",
    // Registration validation
    errFieldsRequired: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
    errPhoneRequired: "يرجى إدخال رقم الهاتف",
    errLocationRequired: "يرجى إدخال الموقع",
    errPasswordShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    errPasswordMismatch: "كلمتا المرور غير متطابقتين",
    errInvalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    errEmailExists: "هذا البريد الإلكتروني مستخدم بالفعل",
    errRegistration: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    // Profile
    myProfile: "ملفي الشخصي",
    editProfile: "تعديل الملف الشخصي",
    saveChanges: "حفظ التغييرات",
    accountCreated: "تاريخ إنشاء الحساب",
    accountStatus: "حالة الحساب",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح!",
    profileInfo: "معلومات الملف الشخصي",
    // Notifications
    notifications: "الإشعارات",
    notificationCenter: "مركز الإشعارات",
    markAllRead: "تحديد الكل كمقروء",
    read: "مقروء",
    unread: "غير مقروء",
    noNotifications: "لا توجد إشعارات بعد",
    allCaughtUp: "أنت على اطلاع بكل شيء!",
    viewAllNotifications: "عرض جميع الإشعارات",
    notifPreferences: "تفضيلات الإشعارات",
    deviceNotifications: "إشعارات الجهاز",
    deviceNotifEnabled: "ستتلقى إشعارات حتى عند إغلاق الموقع",
    deviceNotifDisabled: "فعّل للحصول على إشعارات على جهازك",
    notifCategories: "الفئات",
    newAuctions: "مزادات جديدة",
    newAuctionsDesc: "إشعار عند إنشاء مزادات جديدة",
    upcomingAuctions: "مزادات قادمة",
    upcomingAuctionsDesc: "تذكيرات قبل بدء المزادات",
    bidsActivity: "نشاط المزايدات",
    bidsActivityDesc: "مزايدات جديدة وتنبيهات المزايدة",
    auctionResults: "نتائج المزادات",
    auctionResultsDesc: "إشعارات الفوز/الخسارة عند انتهاء المزادات",
    mandatoryNote: "تنبيهات المزايدة ونتائج المزادات إلزامية ولا يمكن تعطيلها.",
    loadMore: "تحميل المزيد",
    // Admin - Customer Management
    adminCustomers: "العملاء",
    customerManagement: "إدارة العملاء",
    customerInfo: "معلومات العميل",
    orderDetails: "تفاصيل الطلب",
    shippingAddress: "عنوان الشحن",
    orderedItems: "المنتجات المطلوبة",
    orderDate: "تاريخ الطلب",
    shipping: "الشحن",
    notes: "ملاحظات",
    customerId: "الرقم",
    customerName: "الاسم",
    customerEmail: "البريد الإلكتروني",
    customerPhone: "الهاتف",
    customerLocation: "الموقع",
    registrationDate: "تاريخ التسجيل",
    customerStatus: "الحالة",
    totalBids: "إجمالي المزايدات",
    totalAuctionsParticipated: "المزادات",
    totalWins: "الفوز",
    searchCustomers: "البحث عن عملاء...",
    active: "نشط",
    suspended: "معلّق",
    banned: "محظور",
    // Admin - Completed Auctions
    completedAuctions: "المزادات المنتهية",
    finalPrice: "السعر النهائي",
    winner: "الفائز",
    winningBid: "المزايدة الفائزة",
    winnerEmail: "بريد الفائز",
    winnerPhone: "هاتف الفائز",
    winnerLocation: "موقع الفائز",
    noWinner: "لا يوجد فائز",
    noBids: "لا توجد مزايدات",
    orderStatus: "حالة الطلب",
    paymentStatus: "حالة الدفع",
    createWinnerOrder: "إنشاء طلب",
    viewOrder: "عرض الطلب",
    // Auction Checkout
    completeOrder: "أكمل طلبك",
    auctionCheckout: "إتمام طلب المزاد",
    auctionOrderSummary: "ملخص طلب المزاد",
    shippingInfo: "معلومات الشحن",
    confirmOrder: "تأكيد الطلب",
    orderCreated: "تم إنشاء الطلب بنجاح!",
    orderExists: "يوجد طلب مسبق لهذا المزاد",
    wonAuction: "لقد فزت بهذا المزاد!",
    winningAmount: "مبلغ الفوز",
    proceedToCheckout: "متابعة الطلب",
    freeShipping: "شحن مجاني",
    // Admin extras
    adminSlides: "شرائح الصفحة الرئيسية",
    adminNotifications: "الإشعارات",
    settings: "الإعدادات",
    refresh: "تحديث",
    noOrders: "لا توجد طلبات بعد",
    orderNotes: "ملاحظات",
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
  const [auctions, setAuctions] = useState([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const sseRef = useRef(null);

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

  const register = useCallback(async (name, email, password, phone = "", confirm_password = "", location = "") => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone, confirm_password, location }),
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

  // ── Auction CRUD ─────────────────────────────────────────
  const loadAuctions = useCallback(async (params = {}) => {
    setAuctionsLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await apiFetch(`/auctions${qs ? "?" + qs : ""}`);
      setAuctions(res.data ?? []);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setAuctionsLoading(false);
    }
  }, [addToast]);

  const loadAdminAuctions = useCallback(async () => {
    setAuctionsLoading(true);
    try {
      const res = await apiFetch("/auctions/admin/all");
      setAuctions(res.data ?? []);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setAuctionsLoading(false);
    }
  }, [addToast]);

  const createAuction = useCallback(
    async (data) => {
      const res = await apiFetch("/auctions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await loadAdminAuctions();
      addToast("Auction created");
      return res;
    },
    [loadAdminAuctions, addToast],
  );

  const updateAuction = useCallback(
    async (id, data) => {
      const res = await apiFetch(`/auctions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await loadAdminAuctions();
      addToast("Auction updated");
      return res;
    },
    [loadAdminAuctions, addToast],
  );

  const deleteAuction = useCallback(
    async (id) => {
      await apiFetch(`/auctions/${id}`, { method: "DELETE" });
      await loadAdminAuctions();
      addToast("Auction deleted");
    },
    [loadAdminAuctions, addToast],
  );

  const endAuction = useCallback(
    async (id) => {
      await apiFetch(`/auctions/${id}/end`, { method: "POST" });
      await loadAdminAuctions();
      addToast("Auction ended");
    },
    [loadAdminAuctions, addToast],
  );

  const placeBid = useCallback(
    async (auctionId, amount) => {
      const res = await apiFetch(`/auctions/${auctionId}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      return res;
    },
    [],
  );

  // ── Notifications ─────────────────────────────────────────
  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await apiFetch(`/notifications${qs ? "?" + qs : ""}`);
      if (Number(params.offset) > 0) {
        setNotifications((prev) => [...prev, ...(res.data ?? [])]);
      } else {
        setNotifications(res.data ?? []);
      }
      return res;
    } catch {
      return { data: [], total: 0 };
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch("/notifications/unread-count");
      setUnreadCount(typeof res?.count === "number" ? res.count : 0);
    } catch {}
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const res = await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      if (typeof res?.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      const res = await apiFetch("/notifications/read-all", { method: "PATCH" });
      if (typeof res?.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  const deleteNotification = useCallback(async (id) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const res = await apiFetch(`/notifications/${id}`, { method: "DELETE" });
      if (typeof res?.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // SSE connection for real-time notifications
  useEffect(() => {
    if (!user) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const token = localStorage.getItem("nng_token");
    if (!token) return;

    fetchUnreadCount();

    // Try SSE connection
    let es;
    let pollInterval;
    try {
      const sseUrl = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
      es = new EventSource(sseUrl);
      es.addEventListener("notification", (e) => {
        try {
          const data = JSON.parse(e.data);
          setNotifications((prev) => [data, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
        } catch {}
      });
      es.onerror = () => {
        // If SSE fails, fallback to polling
        if (!pollInterval) {
          pollInterval = setInterval(fetchUnreadCount, 30000);
        }
      };
      sseRef.current = es;
    } catch {
      // SSE not available, use polling
      pollInterval = setInterval(fetchUnreadCount, 30000);
    }

    return () => {
      if (es) es.close();
      if (pollInterval) clearInterval(pollInterval);
      sseRef.current = null;
    };
  }, [user]);

  // ── Web Push Notifications ───────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(false);
  const swRef = useRef(null);

  // Check if push is currently active
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
        if (reg) {
          reg.pushManager.getSubscription().then((sub) => {
            setPushEnabled(!!sub);
          });
        }
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        addToast("Push notifications are not supported in this browser", "error");
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        addToast("Notification permission denied", "error");
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      swRef.current = registration;

      // Get VAPID public key from server
      const { publicKey } = await apiFetch("/notifications/push/vapid-key");
      if (!publicKey) {
        addToast("Push not available", "error");
        return false;
      }

      // Convert VAPID key to Uint8Array
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        applicationServerKey[i] = rawData.charCodeAt(i);
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to server
      await apiFetch("/notifications/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      setPushEnabled(true);
      addToast("Push notifications enabled!");
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      addToast("Failed to enable push notifications", "error");
      return false;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await apiFetch("/notifications/push/unsubscribe", {
            method: "POST",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
      }
      setPushEnabled(false);
      addToast("Push notifications disabled");
    } catch {
      addToast("Failed to disable push", "error");
    }
  }, []);

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
        auctions,
        auctionsLoading,
        loadAuctions,
        loadAdminAuctions,
        createAuction,
        updateAuction,
        deleteAuction,
        endAuction,
        placeBid,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        pushEnabled,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
