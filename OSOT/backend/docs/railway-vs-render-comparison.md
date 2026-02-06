# Railway Pro vs Render Team (Professional) – Comparison

## What is Bandwidth?
- **Bandwidth** is the total volume of data transferred between your application and the internet (outbound traffic from the provider).
- It includes all outbound traffic: downloads, uploads, API responses, images, files users download, etc.
- **Example:** If a user downloads a 5MB file hosted on your app, it consumes 5MB from your bandwidth quota.
- The plan usually includes a monthly amount (e.g., 500GB/month). If you exceed this, extra charges may apply per GB.

---

## Comparison Table – Development/Deploy Phase

| Resource/Charge       | Railway Pro                  | Render Team (Professional)     |
|-----------------------|------------------------------|-------------------------------|
| **Build minutes**     | Unlimited*                   | 500 min/month per organization|
| **Monthly deploys**   | 500/month (max 50/day)       | Unlimited*                    |
| **Storage**           | 40GB included                | 100GB included                |
| **Bandwidth**         | 500GB/month included         | 100GB/month included          |
| **Base price**        | $20/month per user           | $19/month per user            |
| **Overages**          | Charged for extra usage      | Charged for extra usage       |

> *In development, bandwidth is usually low, as only your team uploads/downloads builds. Main limits to watch: build minutes (Render) and deploys (Railway).

---

## Comparison Table – Production Phase

| Resource/Charge        | Railway Pro                      | Render Team (Professional)            |
|------------------------|----------------------------------|---------------------------------------|
| **Execution hours**    | 400h/month per workspace*        | Unlimited** (charged per service)     |
| **Bandwidth**          | 500GB/month included             | 100GB/month included                  |
| **Storage**            | 40GB included                    | 100GB included                        |
| **Machines/resources** | $2/100h additional               | $7/month per standard web service***  |
| **Database**           | Included/limited (see docs)      | Paid separately (see docs)            |
| **Overages**           | Charged per additional GB/hour   | Charged per additional GB/hour        |

> *If you have just 1 app running 24/7 (720h/month), on Railway you will exceed the limit (400h), so extra charges apply.  
> **On Render, there is no fixed hour limit, but you pay monthly per service running (e.g., $7/month for a small web service).  
> ***Values for small instances; larger machines cost more.

---

## Important Notes

- **If storage is not an issue** (you use Dataverse and have your own data retention policy), focus on execution hours and bandwidth.
- **Bandwidth:** If outbound traffic is low (no large files, few downloads), you’ll rarely exceed the limit—just monitor if your user base grows.
- **Execution hours:** Railway is great for temporary/dev apps. For always-on apps, Render is simpler—flat monthly charge per running service, no hour tracking.
- **Database:** If you only use Dataverse, you can ignore provider-managed database limits/charges.

---

## Practical Summary

- **Railway:** Best for development/temporary apps. For always-on apps, exceeding 400h/month leads to extra charges.
- **Render:** Flat monthly charge per running service; easier to estimate if the app runs 24/7.
- **Both:** Bandwidth only matters if your outbound traffic is high.
