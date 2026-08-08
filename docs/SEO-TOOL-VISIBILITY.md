# SEO: show up when people search for tools

**Purpose:** When someone googles things like “free ATS resume checker”, “sitemap validator”, “latex resume”, “online scientific calculator”, **Plethora tool pages** should rank.

**Domain:** Now on Vercel at **https://plethora-ten.vercel.app** (temporary product URL).  
Later attach **plethora.com** the same way — only change DNS + `PLETHORA_SITE_URL`.

### Current production
| Item | Value |
|------|--------|
| Live site | https://plethora-ten.vercel.app |
| Sitemap | https://plethora-ten.vercel.app/sitemap.xml |
| Robots | https://plethora-ten.vercel.app/robots.txt |
| Repo | https://github.com/gralin2180/plethora-web |

**Required Vercel env (Project → Settings → Environment Variables):**

```
PLETHORA_SITE_URL=https://plethora-ten.vercel.app
```

Also set Supabase + OpenRouter keys (same names as `.env.local`). Never commit secrets.  
After changing env: **Redeploy**.

When domain is plenty.com/plethora.com ready, replace with `https://plethora.com` and re-submit Search Console.

**Mindset:** Ranking is product engineering, not a homepage slogan. Users never need to see this playbook on the site. This file is the operator guide.

---

## 1. How Google finds us

| Layer | What we ship | Job |
|--------|----------------|-----|
| One URL per tool | `/tools/{slug}` | Ranks for that intent |
| Site map | `/sitemap.xml` | Lists every public tool + core pages |
| Robots | `/robots.txt` | Allow crawl; point to sitemap |
| Titles & descriptions | `generateMetadata` per tool | Match search phrases |
| Real utility | Free tool that works | Rank + convert |

Do **not** put SEO strategy boards on product UIs.

---

## 2. Keyword → page map (extend when shipping tools)

Target **long-tail, low competition** first (volume floor when possible, KD often “easy” for niche free tools).

| Search intents (examples) | Plethora page |
|---------------------------|---------------|
| latex resume, resume latex free | `/tools/latex-resume` |
| ats resume checker, applicant tracking resume | `/tools/ats-resume` |
| sitemap checker / finder | `/tools/sitemap-finder` |
| sitemap validator | `/tools/sitemap-validator` |
| robots.txt generator | `/tools/robots-txt` |
| image to pdf free | `/tools/image-to-pdf` |
| pdf merge online | `/tools/pdf-merge` |
| multi timer online, stopwatch online | `/tools/multi-clock` |
| scientific calculator online | `/tools/advanced-calculator` |
| daily planner free | `/tools/life-planner` |
| calendar generator ics | `/tools/calendar-generator` |
| learn how to use AI India | `/learn` |
| free AI tools one place | `/tools`, `/` |

When buying **plethora.com**, every row above becomes `https://plethora.com/tools/...`.

---

## 3. Checklist before launch on plethora.com

### DNS
1. Buy domain at registrar.
2. Vercel → Project → Settings → Domains → add `plethora.com` + `www`.
3. Set DNS records Vercel shows (usually A/`www` CNAME).
4. Wait for HTTPS.

### Env
Production must set (Vercel project env):

- `PLETHORA_SITE_URL=https://plethora.com` (used by sitemap/robots)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` (or other free chat keys)
- Any Cobalt / other keys as used

### Search Console (after domain is live)
1. [Google Search Console](https://search.google.com/search-console) → property for `https://plethora.com`
2. Verify via DNS or Vercel HTML
3. Submit **sitemaps** → `https://plethora.com/sitemap.xml`
4. Confirm index coverage for sample tool URLs

Optional: Bing Webmaster Tools same sitemap.

### Content hygiene
- Each tool title pattern: `{Tool name} — free online | Plethora`
- Description = what it does + free/online + primary keyword once
- H1 on page = tool name
- No thin duplicate pages (one slug per intent)
- Keep `/growth` noindex (internal only)

---

## 4. Free-tool SEO engine (operator workflow)

Same style SiteGPT used **in private** — never displayed on the product:

1. **Seed keywords** — Ahrefs / Google KW Planner / free tools: “X checker”, “X generator”, “free X online”
2. **Filter** to niches we can ship in hours (PDF, resume, SEO utils, calculators)
3. Prefer **KD ≲ 10** early; raise bar later
4. **Volume floor** (~1k+/mo US when possible)
5. **Spreadsheet:** keyword | volume | KD | parent topic | slug | shipped?
6. **Ship tool** with unique page + CTA into Chat / Pro quietly (soft upsell after value)
7. **Request indexing** → Search Console URL inspection after deploy

Repeat. Traffic compounds.

---

## 5. Page SEO rules (engineering)

### Required for every new free tool
1. Register in `src/lib/free-utilities.ts` or `tools-registry.ts` with:
   - `name`, `description`
   - `taskKeywords` that include natural search phrases
   - `tags`
2. Ensure route `/tools/[slug]` works (free runners set)
3. Metadata uses name/description/keywords (see `generateMetadata`)
4. Sitemap picks up new slugs automatically from `PLATFORM_TOOLS`
5. Soft CTA under tool is **product** (“Need more?” → tools/chat), not SEO strategy talk

### Core pages (always in sitemap)
- `/`, `/tools`, `/learn`, `/chat`, `/ai-finder`, `/prompt-assistant`, `/pricing`, `/install`, `/mcp`

### Noindex / private
- Auth, dashboard, settings if needed
- `/growth` internal playbook

---

## 6. On-page / structured data (later pass)

When domain is set:

- [ ] JSON-LD `SoftwareApplication` or `WebApplication` on each free tool
- [ ] FAQ block only when real FAQ content exists
- [ ] Internally link related tools (“Also try ATS after LaTeX resume”)
- [ ] Performance: LCP fast (no random Google-font hangs in prod layout)
- [ ] Open Graph images per tool (shared brand OG is fine at first)

---

## 7. Off-page (later stage)

- Helpful Reddit / forums replies **with product only when genuinely useful** (no spam)
- Product Hunt / IndieHackers when product feels solid
- Share high-intent free tools in communities that search for them

Strategy docs: `src/lib/marketing-playbook.ts`, `src/lib/campaign-playbook.ts` — **code/docs only**, not public UI.

---

## 8. Go-live day for plethora.com

```text
[ ] Domain on Vercel + HTTPS green
[ ] PLETHORA_SITE_URL=https://plethora.com
[ ] Open graph / title “Plethora”
[ ] Search Console property + sitemap submitted
[ ] Spot-check 5 money pages indexable (view-source: no noindex)
[ ] GSC “URL inspection” on /tools/ats-resume (example)
[ ] Confirm /growth is noindex
[ ] Analytics optional (Plausible / Vercel Analytics)
```

---

## 9. Vercel + this repo

App root: **`web/`** (Next.js).

Deploy:

1. Push this repo to GitHub
2. Vercel → New Project → import repo
3. **Root Directory:** `web` if monorepo root is parent; if the remote **is** only `web`, leave blank
4. Framework: Next.js (auto)
5. Env vars from `.env.example`
6. Deploy

Production SEO starts working only after **public URL + Search Console**. Localhost does not rank.

---

## 10. Quarterly review

- Which tool pages got impressions? (GSC)
- Which keywords converted (tool used → signup)?
- Ship next free tool for best “volume / KD” gap left open

Keep shipping utilities people already type into Google. The brand (plethora.com) becomes the roof they land under.
