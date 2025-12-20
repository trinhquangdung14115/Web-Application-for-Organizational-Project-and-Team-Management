import Stripe from "stripe";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Create Stripe Checkout Session (Get Payment Link)
 * @route   POST /payment/session
 * @access  Private
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", 
      customer_email: userEmail,
      
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Plan Upgrade",
              description: "Unlock Admin features.",
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId: userId.toString(), 
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
    
    // 1.  Phải lấy session và userId từ event trước
    const session = event.data.object;
    const userId = session.metadata.userId; // Lấy từ metadata lúc tạo session

    try {
      const user = await User.findOne(userId);
      if (user && user.currentOrganizationId){
        await Organization.findByIdAndUpdate(user.currentOrganizationId,{
          plan: "ADMIN"
        });
        console.log('Organization${user.currentOrganizationId} upgraded to ADMIN plan')
      }
      await User.findByIdAndUpdate(userId,{role: "Admin"})
    } catch (err) {
      console.error("Database update failed:", err);
    }
  }

  res.status(200).json({ received: true });
};