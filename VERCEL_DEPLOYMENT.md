# Restocker - Vercel Deployment Guide

## 🚀 Complete Deployment Instructions

### Prerequisites
- Supabase project with `ps2_inventory_restock.sql` seed data loaded
- Gemini API key from Google AI Studio
- GitHub repository: https://github.com/Sahil-2006/team-10-ps2

---

## Step 1: Prepare Environment Variables

You'll need these 4 environment variables in Vercel:

```env
GEMINI_API_KEY=AIzaSyDZLvsuuUFpzgddiwIDi2v7guzxx_yJv0c
GEMINI_MODEL=gemini-1.5-flash
SUPABASE_URL=https://gjqcwwlksgtwksilxskm.supabase.co
SUPABASE_SECRET_KEY=<your-supabase-secret-key>
APP_PASSCODE=PS2Z
DEMO_MODE=false
```

**Note:** Get your `SUPABASE_SECRET_KEY` from:
- Supabase Dashboard → Project Settings → API → `service_role` key (secret)

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/
2. **Click "Add New..."** → "Project"
3. **Import Git Repository**:
   - Select GitHub
   - Choose repository: `Sahil-2006/team-10-ps2`
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables** (click "Environment Variables"):
   ```
   GEMINI_API_KEY = AIzaSyDZLvsuuUFpzgddiwIDi2v7guzxx_yJv0c
   GEMINI_MODEL = gemini-1.5-flash
   SUPABASE_URL = https://gjqcwwlksgtwksilxskm.supabase.co
   SUPABASE_SECRET_KEY = <paste-your-secret-key-here>
   APP_PASSCODE = PS2Z
   DEMO_MODE = false
   ```

6. **Click "Deploy"** and wait 2-3 minutes

---

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables when prompted:
# - GEMINI_API_KEY
# - GEMINI_MODEL
# - SUPABASE_URL
# - SUPABASE_SECRET_KEY
# - APP_PASSCODE
# - DEMO_MODE
```

---

## Step 3: Verify Deployment

1. **Get your deployment URL** (e.g., `https://team-10-ps2.vercel.app`)
2. **Test the health endpoint**:
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return: `{"ok":true}`

3. **Login with passcode**: `PS2Z`
4. **Test AI agent**: Try asking "What do I need to reorder this week?"

---

## Step 4: Update README with Live Link

After successful deployment, add the live link to `README.md`:

```markdown
## 🌐 Live Demo
**Live App**: https://your-app.vercel.app
**Passcode**: PS2Z
```

---

## 🎨 UI Theme

Restocker uses an elegant cream/beige color scheme:
- Background: `#F5F1ED` (warm cream)
- Cards: White with subtle shadows
- Text: Slate-900 (near black)
- Accents: Brown `#8B7355`
- Headers: Slate-900 with white text

---

## 🧪 Testing the Deployed App

### Test Scenarios:

1. **View Dashboard Stats**
   - Should show: 18 low items, Rs 8.6L reorder value
   
2. **AI Agent Commands**:
   ```
   "What do I need to reorder this week?"
   "Create purchase orders for all low-stock items"
   "Which items will run out in 3 days?"
   "Show me low-stock dairy products"
   ```

3. **View Purchase Orders**
   - Navigate to Purchase Orders page
   - Should see draft POs grouped by supplier

4. **View Products**
   - Navigate to Products page
   - Search and filter by category

---

## 🔧 Troubleshooting

### Issue: "Models/gemini-1.5-flash is not found"
**Solution**: Verify `GEMINI_MODEL=gemini-1.5-flash` in environment variables

### Issue: "Wrong passcode"
**Solution**: Ensure `APP_PASSCODE=PS2Z` is set correctly

### Issue: "Database connection failed"
**Solution**: 
1. Check `SUPABASE_URL` is correct
2. Verify `SUPABASE_SECRET_KEY` (service_role key, not anon key)
3. Ensure seed data is loaded in Supabase SQL Editor

### Issue: Build fails
**Solution**: 
1. Check Vercel build logs
2. Run `npm run build` locally to test
3. Ensure all dependencies are in `package.json`

---

## 📊 Expected Performance

- **First Load**: ~2-3 seconds
- **API Response**: ~500ms - 2s (depending on Gemini API)
- **Database Queries**: ~100-300ms

---

## 🔒 Security Notes

- Never commit `.env` files to GitHub (already in `.gitignore`)
- Supabase secret key should only be in Vercel environment variables
- Gemini API key should only be in Vercel environment variables
- `APP_PASSCODE` provides basic access control

---

## 📝 Team Members

- **Ziya Khan** - RA2411033010095
- **Paridhi Babel** - RA2411033010140
- **Sujal Patidar** - RA2411033010142
- **Sahil Shabbirali Haryani** - RA2411033010152

---

## 🎯 Next Steps After Deployment

1. ✅ Test all features on production URL
2. ✅ Share live link with team
3. ✅ Prepare demo presentation
4. ✅ Document any edge cases
5. ✅ Take screenshots for presentation slides

---

## 📞 Support

For deployment issues:
- Check Vercel build logs
- Verify environment variables
- Test database connection in Supabase
- Ensure seed data is loaded

**Repository**: https://github.com/Sahil-2006/team-10-ps2
