// src/controllers/StripeController.ts

import { Stripe } from 'stripe';

const SECRET_STRIPE_KEY = "sk_test_51Nk0IODtvZGWcW3MwkEuTOoZjGILPJkk5t1NkGpSEMQXG3sZHRU4da4vPm9pr5aDP3ZIf0iAbrHs4e6KQoINUVO500Q4NxR8xk";
const stripe = new Stripe(SECRET_STRIPE_KEY, {
  apiVersion: "2023-10-16"
});


const CLIENT_URL = 'www.google.com';
const MONTHLY_SUBSCRIPTION = "price_1Oud3SDtvZGWcW3M7runWv1b"

const YEARLY_SUBSCRIPTION = "price_1OvgsrDtvZGWcW3MrNpFn3uR"

export const StripeController = {
  createCheckoutSession: async (sessionIdCookie: string, isYearly: boolean) => {
    if (!sessionIdCookie) {
      throw new Error("Session ID cookie is missing.");
    }

    console.log('we hit the stripe controller. yay!')



    const trialEnd = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60);
    const priceId = isYearly ? YEARLY_SUBSCRIPTION : MONTHLY_SUBSCRIPTION;

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${CLIENT_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}`,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_end: trialEnd,
      },
    });



    return stripeSession.url;
  },

  handleWebhook: async (reqBody: Buffer, sig: string | string[]) => {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(reqBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      // @ts-expect-error adds
      console.error(`Webhook signature verification failed: ${err.message}`);
      throw err; // This should be caught and handled to return an appropriate response to Stripe
    }

    // Switch or if-else logic to handle different event types
    // For example:
    // if (event.type === 'checkout.session.completed') { ... }

    // Return a message or object that indicates the result of the operation
    return { received: true, event };
  },
};
