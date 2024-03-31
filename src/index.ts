import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";

// Import and instantiate Stripe SDK
import Stripe from "stripe";
import { HTTPException } from "hono/http-exception";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create new Hono backend server
const app = new Hono();

app.get("/", (c) => {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Checkout</title>
      <script src="https://js.stripe.com/v3/"></script>
    </head>
    <body>
      <h1>Checkout</h1>
      <button id="checkoutButton">Checkout</button>

      <script>
        const checkoutButton = document.getElementById('checkoutButton');
        checkoutButton.addEventListener('click', async () => {
          const response = await fetch('/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const { id } = await response.json();
          const stripe = Stripe('${process.env.STRIPE_PUBLISHABLE_KEY}');
          await stripe.redirectToCheckout({ sessionId: id });
        });
      </script>
    </body>
  </html>
`;
  return c.html(html);
});

// Simple checkout endpoint
app.post("/checkout", async (c) => {
  try {
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna", "ideal"],
      line_items: [{ price: "price_1P0QCWHWA7Qpg0eCGw6MQOsg", quantity: 1 }],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    return c.json(session);
  } catch (e: any) {
    throw new HTTPException(500, { message: e?.message });
  }
});

// Webhook endpoint for processing events
app.post("/webhook", async (c) => {
  // Retrieve the webhook request body and signature
  const rawBody = await c.req.text();
  const signature = c.req.header("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    throw new HTTPException(400);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("The session succeeded!");
    console.log(session);

    // TODO Fulfill the purchase with your own business logic, for example:
    // Update Database with order details
    // Add credits to customer account
    // Send confirmation email
    // Print shipping label
    // Trigger order fulfillment workflow
    // Update inventory
    // Etc.
  } else {
    const session = event.data.object;
    console.log("Something else happened!");
    console.log(session);
  }

  // Tell Stripe that we successfully handled the webhook
  return c.text("success");
});

// Purchase success page
app.get("/success", (c) => c.text("Success!"));
// Purchase cancelled page
app.get("/cancel", (c) => c.text("Cancelled!"));

// Setup up the Hono server
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
