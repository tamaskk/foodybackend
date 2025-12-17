# Deploy Backend to Vercel

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- All your environment variables ready

## Method 1: Deploy via Vercel Dashboard (Recommended for first deployment)

### Step 1: Push to Git
1. Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Commit all changes:
   ```bash
   git add .
   git commit -m "Prepare backend for Vercel deployment"
   git push
   ```

### Step 2: Import to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `apps/backend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

### Step 3: Add Environment Variables
In the Vercel project settings, add these environment variables:

**Database:**
- `MONGODB_URI` - Your MongoDB connection string (from MongoDB Atlas)

**JWT:**
- `JWT_SECRET` - Any random secure string (e.g., generate with `openssl rand -base64 32`)

**OpenAI:**
- `OPENAI_API_KEY` - Your OpenAI API key

**Firebase (for image uploads):**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

**Stripe:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_test_... for test mode)
- `STRIPE_PRICE_PRO` - Your Stripe Price ID (price_...)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (whsec_...)

**Admin:**
- `ADMIN_EMAIL` - Email for admin login
- `ADMIN_PASSWORD` - Password for admin login

**App URL:**
- `APP_URL` - Your Vercel deployment URL (e.g., https://your-app.vercel.app)

### Step 4: Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your backend will be live at `https://your-project-name.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Navigate to Backend Directory
```bash
cd apps/backend
```

### Step 4: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Choose your account)
- Link to existing project? **N** (for first deployment)
- Project name? (Accept default or enter custom name)
- Which directory? `./` (current directory)
- Override settings? **N**

### Step 5: Add Environment Variables
```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add FIREBASE_API_KEY production
vercel env add FIREBASE_AUTH_DOMAIN production
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_STORAGE_BUCKET production
vercel env add FIREBASE_MESSAGING_SENDER_ID production
vercel env add FIREBASE_APP_ID production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PRICE_PRO production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add APP_URL production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
```

### Step 6: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## Post-Deployment Steps

### 1. Update Stripe Webhook URL
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the webhook secret and update `STRIPE_WEBHOOK_SECRET` in Vercel

### 2. Update Frontend Backend URL
Update your Flutter app's backend URL:
```bash
flutter run --dart-define=BACKEND_URL=https://your-app.vercel.app
```

Or for production build:
```bash
flutter build apk --dart-define=BACKEND_URL=https://your-app.vercel.app
```

### 3. Update Firebase Rules (if needed)
If using Firebase Storage, update CORS settings to allow your Vercel domain.

### 4. Update MongoDB Atlas Network Access
1. Go to MongoDB Atlas → Network Access
2. Add Vercel's IP addresses or allow access from anywhere: `0.0.0.0/0` (less secure but works)

### 5. Test the Deployment
```bash
curl https://your-app.vercel.app/api/health
```

Should return: `{"status":"ok","message":"Backend is healthy"}`

---

## Updating Your Deployment

### Via Git (Automatic)
Once linked to Git, every push to your main branch auto-deploys:
```bash
git add .
git commit -m "Update backend"
git push
```

### Via CLI
```bash
cd apps/backend
vercel --prod
```

---

## Common Issues & Solutions

### Issue: "Module not found" errors
**Solution**: Make sure all dependencies are in `package.json` and committed to Git

### Issue: MongoDB connection fails
**Solution**: 
- Check `MONGODB_URI` is set correctly
- Allow Vercel IPs in MongoDB Atlas Network Access (or use `0.0.0.0/0`)

### Issue: Stripe webhook not working
**Solution**: 
- Update webhook URL to production URL
- Ensure `STRIPE_WEBHOOK_SECRET` matches the production webhook

### Issue: Build fails
**Solution**: 
- Check build logs in Vercel dashboard
- Make sure `next.config.ts` doesn't have local-only settings

---

## Environment Variables Quick Reference

Copy this to your `.env.local` for local development, then add each to Vercel:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://your-app.vercel.app
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `api.yourapp.com`)
3. Update DNS records as instructed
4. Update `APP_URL` environment variable to your custom domain
5. Update Stripe webhook URL to use custom domain

---

## Monitoring

- View logs: Vercel Dashboard → Your Project → Deployments → [Latest] → Runtime Logs
- Monitor performance: Vercel Dashboard → Analytics
- Set up alerts: Vercel Dashboard → Settings → Notifications

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Stripe Webhooks: https://stripe.com/docs/webhooks

