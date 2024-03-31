import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";

// Import and instantiate Stripe SDK
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Start up new Hono backend server
const app = new Hono();

app.get("/", (c) => c.text("GET it"));
app.post("/", (c) => c.text("POST it"));

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
