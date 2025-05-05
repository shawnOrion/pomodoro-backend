// services/billingService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const findOrCreateCustomer = async (email) => {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data.length > 0
    ? customers.data[0]
    : await stripe.customers.create({ email });
};

const attachPaymentMethodToCustomer = async (customerId, paymentMethodId) => {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
};

const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
};

const createSubscription = async (customerId, priceId) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice'],
  });
};

module.exports = {
  findOrCreateCustomer,
  attachPaymentMethodToCustomer,
  setDefaultPaymentMethod,
  createSubscription,
};
