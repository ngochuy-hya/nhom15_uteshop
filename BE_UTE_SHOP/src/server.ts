import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import brandRoutes from './routes/brand.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import addressRoutes from './routes/address.routes';
import couponRoutes from './routes/coupon.routes';
import uploadRoutes from './routes/upload.routes';
import dashboardRoutes from './routes/dashboard.routes';
import blogRoutes from './routes/blog.routes';
import contactRoutes from './routes/contact.routes';
import notificationRoutes from './routes/notification.routes';
import settingsRoutes from './routes/settings.routes';
import analyticsRoutes from './routes/analytics.routes';
import bannerRoutes from './routes/banner.routes';
import paymentRoutes from './routes/payment.routes';
import productAttributeRoutes from './routes/product-attribute.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
];

// Helper function để set CORS headers manually (fallback)
const setCorsHeaders = (req: express.Request, res: express.Response): void => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }
};

// CORS - PHẢI ĐẶT TRƯỚC TẤT CẢ MIDDLEWARE KHÁC
// cors() middleware tự động xử lý preflight requests (OPTIONS)
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
  maxAge: 86400 // 24 hours - cache preflight requests
};

// CORS middleware PHẢI được đặt đầu tiên, TRƯỚC tất cả middleware khác
app.use(cors(corsOptions));

// Logging middleware để debug CORS (chỉ trong development) - ĐẶT SAU CORS
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      console.log('🔄 [PREFLIGHT]', req.method, req.path);
      console.log('Origin:', req.headers.origin);
      console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
      console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
    } else {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      console.log('Origin:', req.headers.origin);
    }
    next();
  });
}

// Security middleware - sau CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Cho phép load resources từ frontend
  crossOriginEmbedderPolicy: false // Disable để không block CORS
}));

// Rate limiting - KHÔNG áp dụng cho OPTIONS requests (preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Áp dụng rate limiter nhưng SKIP hoàn toàn cho OPTIONS requests và một số route quan trọng
app.use('/api/', (req, res, next) => {
  // QUAN TRỌNG: Skip rate limiter cho OPTIONS requests (preflight)
  // CORS middleware sẽ xử lý OPTIONS, không cần rate limit
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Bỏ qua rate limit cho các route cần realtime/ít rủi ro spam
  const path = req.path || '';
  const method = req.method || 'GET';
  // Bỏ qua cho hủy đơn, tạo payment, webhook, health
  if (
    path.startsWith('/orders/') && path.endsWith('/cancel') && method === 'POST' ||
    path.startsWith('/payment/') ||
    path.startsWith('/health')
  ) {
    return next();
  }
  
  // Áp dụng rate limit cho các requests khác
  limiter(req, res, next);
});

// Body parsing middleware
// CORS middleware đã xử lý OPTIONS requests, body parsing sẽ được skip tự động
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  setCorsHeaders(req, res);
  res.json({ 
    success: true, 
    message: 'UTE Shop API is running',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  setCorsHeaders(req, res);
  res.json({ 
    success: true, 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/product-attributes', productAttributeRoutes);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// 404 handler - Must use a function without path for Express 5
app.use((req, res, next) => {
  // Đảm bảo CORS headers được gửi trong 404 responses
  setCorsHeaders(req, res);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Không crash server, chỉ log error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  // Không crash server trong production, chỉ log error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1); // Chỉ exit trong development để debug
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER}`);
  console.log(`🗄️ Database: ${process.env.DB_NAME}`);
});

export default app;