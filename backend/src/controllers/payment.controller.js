import Stripe from "stripe";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import { createNotification } from "../services/notification.service.js";

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

export const createCheckoutSession = async (req, res) => {
  try {
    const { _id: userId, email: userEmail, currentOrganizationId } = req.user;
    const { planName = 'PREMIUM' } = req.body; 

    if (!currentOrganizationId) {
        return res.status(400).json({ 
            success: false, 
            message: "User does not belong to any organization" 
        });
    }

    const selectedPlan = PLAN_CONFIG[planName];
    if (!selectedPlan) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid plan name. Available plans: ${Object.keys(PLAN_CONFIG).join(', ')}` 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", 
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
            recurring: {
                interval: "month", 
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId: userId.toString(), 
        organizationId: currentOrganizationId.toString(),
        userId: userId.toString(), 
        organizationId: currentOrganizationId.toString(),
        targetPlan: planName 
      },

      // Truyền metadata vào subscription để invoice.payment_succeeded có thể tìm org
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          organizationId: currentOrganizationId.toString(),
          targetPlan: planName
        }
      },

      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
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
 * [UPDATED] Webhook with Enhanced Debug Logging
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  console.log("\n========== [STRIPE WEBHOOK DEBUG] ==========");
  console.log("[1] Webhook triggered at:", new Date().toISOString());
  console.log("[2] Stripe Signature:", sig ? "✓ Found" : "✗ Missing");
  console.log("[3] Request Body Type:", typeof req.body);
  console.log("[4] Request Body Size:", JSON.stringify(req.body).length, "bytes");

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("[5] ✓ Event Signature Verified Successfully");
    console.log("[6] Event Type:", event.type);
    console.log("[7] Event ID:", event.id);
    console.log("===========================================\n");
  } catch (err) {
    console.error("\n[ERROR] Webhook Signature Verification Failed!");
    console.error("Error Message:", err.message);
    console.error("Webhook Secret Set:", process.env.STRIPE_WEBHOOK_SECRET ? "Yes" : "No");
    console.error("===========================================\n");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case "checkout.session.completed": {
        const session = event.data.object;
        console.log("\n--- [CHECKOUT SESSION COMPLETED] ---");
        console.log("Session ID:", session.id);
        console.log("Session Metadata:", session.metadata);
        console.log("Subscription ID:", session.subscription);
        console.log("Customer Email:", session.customer_email);
        console.log("Payment Status:", session.payment_status);

        const { organizationId, targetPlan = "PREMIUM", userId } = session.metadata || {};
        
        console.log("Extracted from Metadata:");
        console.log("  - organizationId:", organizationId || "✗ MISSING");
        console.log("  - targetPlan:", targetPlan);
        console.log("  - userId:", userId);

        if (organizationId) {
            try {
                let subscriptionExpiredAt = null;
                let subscriptionId = session.subscription;
                
                console.log("\nFetching Stripe Subscription Details...");
                if (subscriptionId) {
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        console.log("[Subscription Retrieved]");
                        console.log("  - ID:", subscription.id);
                        console.log("  - Status:", subscription.status);
                        console.log("  - Current Period End:", new Date(subscription.current_period_end * 1000));
                        
                        if (subscription.current_period_end) {
                            subscriptionExpiredAt = new Date(subscription.current_period_end * 1000);
                        }
                    } catch (stripeErr) {
                        console.error("[Stripe API Error]:", stripeErr.message);
                    }
                }
                
                if (!subscriptionExpiredAt) {
                    subscriptionExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    console.log("[Using Fallback] Set expiry to 30 days from now");
                }

                console.log("\nUpdating Organization in Database...");
                console.log("  - organizationId:", organizationId);
                console.log("  - plan:", targetPlan);
                console.log("  - subscriptionStatus: ACTIVE");
                console.log("  - subscriptionExpiredAt:", subscriptionExpiredAt);

                const updatedOrg = await Organization.findByIdAndUpdate(organizationId, { 
                    plan: targetPlan,
                    subscriptionStatus: "ACTIVE",  
                    subscriptionId: subscriptionId,
                    subscriptionExpiredAt: subscriptionExpiredAt,
                    updatedAt: new Date()
                }, { new: true });

                console.log("✓ Organization Updated:", {
                    plan: updatedOrg?.plan,
                    subscriptionStatus: updatedOrg?.subscriptionStatus,
                    subscriptionExpiredAt: updatedOrg?.subscriptionExpiredAt
                });

                if (userId) {
                    await User.findByIdAndUpdate(userId, { role: 'Admin' });
                    console.log("✓ User Role Updated to Admin");

                    await createNotification({
                        userId: userId,
                        title: "Upgrade Successful",
                        message: `Your organization has been upgraded to ${targetPlan}.`,
                        type: "SUCCESS"
                     });
                    console.log("✓ Notification Created");
                }
            } catch (err) {
                console.error("✗ Database Error:", err.message);
                console.error("Stack:", err.stack);
            }
        } else {
             console.error("✗ [CRITICAL] Missing organizationId in metadata!");
        }
        console.log("--- [END CHECKOUT SESSION] ---\n");
        break;
    }

    case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log("\n--- [INVOICE PAYMENT SUCCEEDED] ---");
        console.log("Invoice ID:", invoice.id);
        console.log("Subscription ID:", subscriptionId);
        console.log("Amount Paid:", invoice.amount_paid / 100, invoice.currency.toUpperCase());
        console.log("Billing Reason:", invoice.billing_reason);

        if (subscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const expiredAt = new Date(subscription.current_period_end * 1000);
                
                console.log("Subscription Period End:", expiredAt);

                let org = await Organization.findOne({ subscriptionId: subscriptionId });
                
                if (!org && subscription.metadata?.organizationId) {
                    org = await Organization.findById(subscription.metadata.organizationId);
                    console.log("✓ Found org via subscription metadata");
                }

                if (org) {
                    await Organization.findByIdAndUpdate(org._id, { 
                        subscriptionStatus: "ACTIVE",
                        subscriptionExpiredAt: expiredAt,
                        subscriptionId: subscriptionId
                    });
                    console.log(" Organization Renewal Updated:", org._id);
                } else {
                    console.error("No organization found for subscriptionId:", subscriptionId);
                }
            } catch (err) {
                console.error("Invoice Update Error:", err.message);
            }
        }
        console.log("--- [END INVOICE PAYMENT] ---\n");
        break;
    }

    case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log("\n--- [INVOICE PAYMENT FAILED] ---");
        console.log("Invoice ID:", invoice.id);
        console.log("Subscription ID:", subscriptionId);
        console.log("Failure Reason:", invoice.last_finalization_error?.message);

        if (subscriptionId) {
            try {
                const org = await Organization.findOneAndUpdate(
                    { subscriptionId: subscriptionId },
                    { subscriptionStatus: "PAST_DUE" },
                    { new: true }
                );

                if (org) {
                    console.log("✓ Organization Marked as PAST_DUE");
                    await createNotification({
                        userId: org.ownerId,
                        title: "Payment Failed",
                        message: "Renewal payment failed. Please check your payment method.",
                        type: "WARNING"
                    });
                }
            } catch (err) {
                console.error("✗ Error updating organization:", err.message);
            }
        }
        console.log("--- [END PAYMENT FAILED] ---\n");
        break;
    }

    case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        console.log("\n--- [SUBSCRIPTION DELETED] ---");
        console.log("Subscription ID:", subscriptionId);
        console.log("Cancellation Reason:", subscription.cancellation_details?.reason);

        if (subscriptionId) {
            try {
                const org = await Organization.findOneAndUpdate(
                    { subscriptionId: subscriptionId },
                    { 
                        plan: "FREE",              
                        subscriptionStatus: "INACTIVE", 
                        subscriptionId: null,      
                        subscriptionExpiredAt: null
                    },
                    { new: true }
                );

                if (org) {
                    console.log("✓ Organization Downgraded to FREE");
                    await createNotification({
                        userId: org.ownerId,
                        title: "Premium Expired",
                        message: "Your Premium plan has expired. Account downgraded to Free.",
                        type: "ERROR"
                    });
                }
            } catch (err) {
                console.error("✗ Subscription deletion error:", err.message);
            }
        }
        console.log("--- [END SUBSCRIPTION DELETED] ---\n");
        break;
    }

    default:
      console.log("\n[INFO] Unhandled event type:", event.type);
  }

  res.status(200).json({ received: true });
};

export const cancelSubscription = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    const organization = await Organization.findById(currentOrganizationId);

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    if (!organization.subscriptionId) {
      organization.plan = "FREE";
      organization.subscriptionStatus = "INACTIVE";
      await organization.save();
      
      return res.status(200).json({ 
        success: true, 
        message: "Plan reset to FREE (No active Stripe subscription found)." 
      });
    }

    try {
      await stripe.subscriptions.update(organization.subscriptionId, {
        cancel_at_period_end: true
      });
    } catch (stripeError) {
      console.error("Stripe Cancel Error:", stripeError);
      if (stripeError.code !== 'resource_missing') {
          return res.status(500).json({ success: false, message: "Failed to cancel with payment provider" });
      }
    }

    organization.subscriptionStatus = "CANCELLED";
    organization.updatedAt = new Date();
    
    await organization.save();

    const expiredDate = organization.subscriptionExpiredAt 
        ? new Date(organization.subscriptionExpiredAt).toLocaleDateString() 
        : "end of period";

    await createNotification({
        userId: organization.ownerId,
        title: "Cancellation Scheduled",
        message: `Premium cancellation scheduled. You can use Premium features until ${expiredDate}.`,
        type: "WARNING"
    });

    return res.status(200).json({
      success: true,
      message: "Subscription scheduled for cancellation at the end of the billing period.",
      data: { 
          plan: organization.plan,
          status: "CANCELLED",
          expiredAt: organization.subscriptionExpiredAt
      }
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;

    const organization = await Organization.findById(currentOrganizationId);
    if (!organization || !organization.subscriptionId) {
        return res.status(404).json({ success: false, message: "No active subscription found" });
    }

    await stripe.subscriptions.update(organization.subscriptionId, {
        cancel_at_period_end: false
    });

    organization.subscriptionStatus = "ACTIVE";
    organization.updatedAt = new Date();
    await organization.save();

    await createNotification({
        userId: organization.ownerId,
        title: "Subscription Resumed",
        message: "Your Premium plan has been reactivated successfully. Auto-renewal is now enabled.",
        type: "SUCCESS"
    });

    return res.status(200).json({ 
        success: true, 
        message: "Subscription resumed successfully",
        data: {
            status: "ACTIVE",
            plan: organization.plan
        }
    });

  } catch (error) {
    console.error("Resume Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const { currentOrganizationId } = req.user;
    const organization = await Organization.findById(currentOrganizationId);

    if (!organization || !organization.subscriptionId) {
         return res.status(400).json({ success: false, message: "No active subscription found to manage." });
    }

    const subscription = await stripe.subscriptions.retrieve(organization.subscriptionId);
    const customerId = subscription.customer;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/settings`, 
    });

    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Portal Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};