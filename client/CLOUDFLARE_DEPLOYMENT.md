# Cloudflare Pages Deployment Guide

## 📋 Option 1: Deploy via Cloudflare Pages (Recommended)

### Prerequisites
- GitHub account with your code repository
- Cloudflare account (free tier works)

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/daily-task-manager.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to https://dash.cloudflare.com/
2. Click **Pages** in the left sidebar
3. Click **Connect to Git**
4. Authorize GitHub and select your repository
5. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm install && npm run build`
   - **Build output directory:** `client/dist`
   - **Root directory:** `client`

### Step 3: Add Environment Variables
In Cloudflare Pages dashboard:
1. Go to your project → **Settings** → **Environment variables**
2. Add these variables:
```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_KEY = your_supabase_anon_key
```

### Step 4: Deploy
- Click **Save and Deploy**
- Cloudflare will automatically build and deploy on every GitHub push

---

## 🐳 Option 2: Deploy via Wrangler CLI

### Prerequisites
- Node.js installed
- Cloudflare account

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login
```bash
wrangler login
```

### Step 3: Build
```bash
cd client
npm run build
```

### Step 4: Deploy
```bash
wrangler pages deploy dist
```

---

## ⚙️ Configuration Files

### `wrangler.toml`
Cloudflare Workers configuration. Update these values:
```toml
account_id = "YOUR_ACCOUNT_ID"        # From Cloudflare dashboard
```

### `_redirects` (in public folder)
Handles SPA routing - redirects all routes to index.html for React Router

---

## 📝 Important Notes

1. **Environment Variables**: Never commit `.env` files
2. **Supabase Keys**: Use your ANON key (safe to expose)
3. **Build Output**: Cloudflare will look for files in `dist/`
4. **Node Version**: Cloudflare supports Node 18+

---

## 🔍 Troubleshooting

### Build fails with "Cannot find module"
- Make sure `client/package.json` exists
- Check that build command is: `npm install && npm run build`

### Routes not working
- Verify `_redirects` exists in `public/` folder
- Check that build output directory is `client/dist`

### Environment variables not loading
- Restart the build after adding variables
- Use `VITE_` prefix for frontend variables
- Check Cloudflare Pages settings

---

## 🚀 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] GitHub repository connected to Cloudflare Pages
- [ ] Build command configured: `npm install && npm run build`
- [ ] Build output directory: `client/dist`
- [ ] Environment variables added (VITE_SUPABASE_URL, VITE_SUPABASE_KEY)
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic)
- [ ] Test all routes working
- [ ] Test Supabase connection

---

## 📞 Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
