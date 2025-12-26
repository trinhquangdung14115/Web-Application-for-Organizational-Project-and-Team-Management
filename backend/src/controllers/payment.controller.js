import Stripe from "stripe";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js"; 

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_CONFIG = {
  'PREMIUM': {
    name: "Premium Plan Upgrade",
    description: "Unlock unlimited projects and AI features",
    amount: 2000, 
    currency: "usd" 
  },
};

/**
 * @desc    Create Stripe Checkout Session (Get Payment Link)
 * @route   POST /payment/session
 * @access  Private
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;
    const { planName = 'PREMIUM' } = req.body; 

    // Validate Plan
    const selectedPlan = PLAN_CONFIG[planName];
    if (!selectedPlan) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid plan name. Available plans: ${Object.keys(PLAN_CONFIG).join(', ')}` 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", 
      customer_email: userEmail,
      
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount, 
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId: userId.toString(), 
        targetPlan: planName 
      },

      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/cancel`,
    });

    res.status(200).json({ 
        success: true, 
        url: session.url 
    });

  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Handle Stripe Webhook
 * @route   POST /payment/webhook
 * @access  Public
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const targetPlan = session.metadata.targetPlan || "PREMIUM";

    console.log(`Payment success for User ID: ${userId} - Plan: ${targetPlan}`);

    try {
      const user = await User.findById(userId);
      if (user && user.currentOrganizationId) {
          await Organization.findByIdAndUpdate(user.currentOrganizationId, { 
              plan: targetPlan 
          });
          console.log(`Organization ${user.currentOrganizationId} upgraded to ${targetPlan}`);

          if (user.role !== "Admin") {
              user.role = "Admin";
              await user.save();
              console.log("User role updated to ADMIN");
          }
      } else {
          console.error("User not found or no Organization linked.");
      }

    } catch (err) {
      console.error("Database update failed:", err);
    }
  }

  res.status(200).json({ received: true });
};