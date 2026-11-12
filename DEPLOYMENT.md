# 🚀 Vercel Deployment Guide - Restocker

## Quick Deploy (Recommended)

### 1. Go to Vercel
Visit: **https://vercel.com/new**

### 2. Import Repository
- Sign in with GitHub
- Click "Import Git Repository"
- Select: `Sahil-2006/team-10-ps2`
- Click "Import"

### 3. Configure Project
- **Project Name:** `team-10-restocker` (or your choice)
- **Framework:** Next.js (auto-detected)
- Keep default build settings

### 4. Add Environment Variables

Click "Environment Variables" and add:

```env
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-2.0-flash-exp
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_SECRET_KEY=<your_supabase_service_role_key>
APP_PASSCODE=<your_team_passcode>
```

**Get your values from `.env` file in your local project!**

### 5. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Done! 🎉

---

## After Deployment

### 1. Test Your App
Your app will be live at: `https://your-project-name.vercel.app`

### 2. Test Login
- Visit your app URL
- Enter your `APP_PASSCODE`
- You should see the dashboard

### 3. Test Agent
Try these commands:
- "What do I need to reorder this week?"
- "Create purchase orders for all low-stock dairy items"
- "Which items will run out in the next 3 days?"

---

## Important Setup Steps

### ⚠️ Database Setup (If not done already)

1. Go to your Supabase project
2. Open SQL Editor
3. Run these files in order:
   - `seed/00_starter_example.sql`
   - `seed/ps2_inventory_restock.sql`

---

## Troubleshooting

### Build Fails
- Check environment variables are correct
- Verify all variables are added
- Check Vercel build logs

### Login Doesn't Work
- Verify `APP_PASSCODE` in Vercel matches your passcode
- Check browser console for errors

### Agent Errors
- Verify `GEMINI_API_KEY` is correct
- Check Gemini API quota
- Verify `SUPABASE_SECRET_KEY` is the service_role key (not anon key)

### Database Errors
- Verify SQL seed files were run in Supabase
- Check `SUPABASE_URL` is correct
- Verify `SUPABASE_SECRET_KEY` has proper permissions

---

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Team 10 Members

- Ziya Khan (RA2411033010095)
- Paridhi Babel (RA2411033010140)
- Sujal Patidar (RA2411033010142)
- Sahil Shabbirali Haryani (RA2411033010152)

---

**Need help?** Check Vercel docs: https://vercel.com/docs
