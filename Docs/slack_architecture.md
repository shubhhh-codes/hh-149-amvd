# 🚀 Humours Hub: Complete Slack Architecture

Here is the complete mapping of every single automated Slack notification we've built, the `.env.local` variable it uses, the recommended channel, and exactly when it triggers.

## 1. 🎟️ Bookings & Core Operations
| Trigger | Alert Type | Environment Variable | Recommended Channel | Source File |
| :--- | :--- | :--- | :--- | :--- |
| User pays successfully | **🎉 New Online Booking** | `SLACK_WEBHOOK_URL` | `#bookings` | `verify.ts` |
| After every booking | **📊 Live Conversion Stats** | `SLACK_WEBHOOK_URL` | `#bookings` | `verify.ts` |
| Admin clicks button | **🌙 Daily Operations Digest** | `SLACK_DIGEST_WEBHOOK_URL` | `#daily-digest` | `daily-digest.ts` |
| Capacity hits 80%+ | **🚨 Almost Sold Out Alert** | `SLACK_CAPACITY_WEBHOOK_URL` | `#capacity-alerts` | `verify.ts` |

## 2. 🚫 Funnel & Sales Recovery
| Trigger | Alert Type | Environment Variable | Recommended Channel | Source File |
| :--- | :--- | :--- | :--- | :--- |
| User cancels Razorpay | **🚫 Payment Cancelled** | `SLACK_LOST_SALES_WEBHOOK_URL` | `#lost-sales` | `log-dismiss.ts` |
| Cancels 2+ times | **🔥 HOT LEAD (Repeat Attempter)** | `SLACK_LOST_SALES_WEBHOOK_URL` | `#lost-sales` | `log-dismiss.ts` |
| User enters checkout | **⚠️ Cart Abandonment** | `SLACK_ABANDONMENT_WEBHOOK_URL` | `#abandoned-carts` | `track.ts` |

## 3. 🌐 Website Traffic & Analytics
| Trigger | Alert Type | Environment Variable | Recommended Channel | Source File |
| :--- | :--- | :--- | :--- | :--- |
| User opens website | **👀 New Active Visitor** | `SLACK_TRAFFIC_WEBHOOK_URL` | `#website-traffic` | `visit.ts` |
| User closes tab | **🧭 Full Session Journey** | `SLACK_JOURNEY_WEBHOOK_URL` | `#user-journey` | `track.ts` |

## 4. ✉️ User Interactions
| Trigger | Alert Type | Environment Variable | Recommended Channel | Source File |
| :--- | :--- | :--- | :--- | :--- |
| User submits contact form | **📬 New Contact Form** | `SLACK_CONTACT_WEBHOOK_URL` | `#contact-messages` | `contact/submit.ts` |
| User submits feedback | **💬 New User Feedback** | `SLACK_FEEDBACK_WEBHOOK_URL` | `#user-feedback` | `feedback/index.ts` |

---

### Security Variables
| Variable | Purpose | Location |
| :--- | :--- | :--- |
| `CRON_SECRET` | Security password for Daily Digest if triggered via URL | `daily-digest.ts` |

---

> [!TIP]
> **Graceful Fallbacks**
> If you ever delete or forget to add an environment variable, the system is designed to gracefully fall back! For example, if you don't define `SLACK_LOST_SALES_WEBHOOK_URL`, it will automatically send the lost sales alerts to your main `SLACK_WEBHOOK_URL`. Nothing will ever crash.
