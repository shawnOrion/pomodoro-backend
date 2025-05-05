// deployed at:
// https://pomodoro-backend-b0a66f34659c.herokuapp.com/ 
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./db/queries'); // your user db helper
const authRoutes = require('./routes/authRoutes');
const goalRoutes = require('./routes/goalRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const chatRoutes = require('./routes/chatRoutes')
const Stripe = require('stripe')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { appSettings } = require('./utility');
const { sendSms } = require('./services/smsService');
const { startReminderScheduler } = require('./services/schedulerService');
const billingService = require('./services/billingService');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});
// 👇 Place BEFORE express.json() in index.js
// Stripe requires the raw body to validate the signature
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('✅ [Webhook] Checkout completed for:', session.customer_email || session.customer);
      // TODO: Mark user as active subscriber, store session info, etc.
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      console.log('💰 [Webhook] Invoice paid for:', invoice.customer_email || invoice.customer);
      // TODO: Ensure user subscription stays active
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.warn('❌ [Webhook] Payment failed for:', invoice.customer_email || invoice.customer);
      // TODO: Pause access, notify user
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object;
      console.log('🆕 [Webhook] Subscription created:', subscription.id);
      // TODO: Store subscription metadata if needed
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log('🔁 [Webhook] Subscription updated:', subscription.id);
      // TODO: Reflect plan changes or renewal dates in your DB
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('🗑️ [Webhook] Subscription cancelled:', subscription.id);
      // TODO: Revoke access, notify user
      break;
    }

    default:
      console.log(`ℹ️ [Webhook:${event.id}] Unhandled type: ${event.type}`);
    }


  res.json({ received: true });
});

// Middleware
app.use(express.json());
const corsOptions = {
  origin: 'https://canvas.play.rosebud.ai',
  credentials: true, // if you use cookies or sessions
};

app.use(cors(corsOptions));

// Session + Passport setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());app.use(bodyParser.json());

// Configure Passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await db.getUserAuthDataByUsername(username);
    if (!user) {
      console.warn('⚠️ No user found with username:', username);
      console.groupEnd();
      return done(null, false, { message: 'Incorrect username.' });
    }
    const isValid = await bcrypt.compare(password, user.hashed_password);

    if (!isValid) {
      console.warn('⚠️ Password mismatch for username:', username);
      console.groupEnd();
      return done(null, false, { message: 'Incorrect password.' });
    }
    console.groupEnd();
    return done(null, user);

  } catch (error) {
    console.error('❌ Error during authentication process:', error.message || error);
    console.groupEnd();
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


const { port, showDebugLogs } = appSettings;



startReminderScheduler({ io, sendSms, showDebugLogs });

app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', goalRoutes);
app.use('/api', userRoutes);
app.use('/api', chatRoutes);

app.post('/api/create-subscription', async (req, res) => {
  console.group('🧾 [POST] /api/create-subscription');
  const { userId, email, paymentMethodId, priceId } = req.body;
  console.log('📥 Payload received:', { email, paymentMethodId, priceId });

  if (!email || !paymentMethodId || !priceId) {
    console.warn('⚠️ Missing required fields.');
    return res.status(400).json({ error: 'Missing required fields: email, paymentMethodId, priceId' });
  }

  try {
    const customer = await billingService.findOrCreateCustomer(email);
    await billingService.attachPaymentMethodToCustomer(customer.id, paymentMethodId);
    await billingService.setDefaultPaymentMethod(customer.id, paymentMethodId);
    const subscription = await billingService.createSubscription(customer.id, priceId);
    console.log('📦 Subscription created with ID:', subscription.id);

    // 👇 Update user's subscription status in DB
    const user = await db.getUserById(userId)
    if (user) {
      await db.updateUser(
        user.id,
        user.username,
        user.phone,
        null,
        'active',
        subscription.id
      );
      console.log('✅ User subscription status updated to active.');
    }

    res.status(200).json({
      message: 'Subscription created successfully.',
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error('❌ Failed to create subscription:', err.message);
    res.status(500).json({ error: 'Failed to create subscription.' });
  } finally {
    console.groupEnd();
  }
});






app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  try {
    const messageId = await sendSms({ to, message });
    return res.status(200).json({ success: true, messageId });
  } catch (err) {
    console.error('❌ SMS Service Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start server with WebSocket support
server.listen(port, () => {
  console.log(`🚀 Pomodoro API running at http://localhost:${port}`);
});
