import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";

// Import and instantiate Stripe SDK
import Stripe from "stripe";
import { HTTPException } from "hono/http-exception";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Start up new Hono backend server
const app = new Hono();

app.get("/", (c) => c.text("Home"));

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

app.get("/success", (c) => c.text("Success!"));
app.get("/cancel", (c) => c.text("Cancelled!"));

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
