# NexaConnect — Business Plan
## NDIS Provider Discovery & Connection Platform
### Newcastle, NSW | February 2026

---

## Executive Summary

NexaConnect is a digital marketplace connecting NDIS participants with disability service providers in the Hunter New England region of NSW. The platform addresses a critical gap: participants struggle to find, compare, and connect with quality providers, while providers lack affordable digital tools to attract and manage clients.

Unlike generic directories, NexaConnect uses a **lead-connection model** — participants submit support requests, matched providers pay a small fee ($25) to unlock contact details — creating a performance-based revenue stream that aligns incentives for all parties.

**Key metrics target (Year 1):**
- 200 registered providers on the platform
- 1,500 active participants
- $180K annual recurring revenue
- Break-even by Month 9

---

## Market Opportunity

### The NDIS Market

| Metric | Value |
|--------|-------|
| Total NDIS market size (2025) | **$44.7 billion** |
| Active NDIS participants nationally | ~646,000 |
| Registered NDIS providers nationally | ~21,734 |
| Hunter New England participants | ~35,000 (est.) |
| Hunter New England plan utilisation | **57–75%** |

The **25–43% of unspent plan funding** in the Hunter region represents a massive opportunity. Participants aren't spending their plans because they can't find the right providers — NexaConnect solves this.

### Why Newcastle?

1. **NDIS Trial Site**: Newcastle was one of the original NDIS launch locations (2013). The region has deep NDIS infrastructure and awareness.
2. **Underserved Market**: Despite early adoption, no dominant local platform exists for provider discovery. National platforms (Hireup, Mable, Clickability) have limited Hunter penetration.
3. **Regional Density**: The Hunter region has ~35,000 NDIS participants concentrated in a metro-accessible area — large enough to build critical mass, small enough to dominate.
4. **Plan Utilisation Gap**: At 57–75% utilisation, billions in approved funding goes unspent. Connecting participants to providers directly increases plan spend.

### Competitive Landscape

| Platform | Model | Weakness |
|----------|-------|----------|
| **Hireup** | Employment marketplace (support workers) | Focused on direct-hire workers, not service providers |
| **Mable** | Marketplace with commission | High commission (10-15%) makes providers reluctant |
| **Clickability** | Directory + reviews | Limited functionality, no lead generation |
| **Provider Choice** | NDIA official directory | Poor UX, no ratings, no engagement tools |
| **NexaConnect** | Lead connection + tiered tools | Low-cost leads, provider tools, local focus |

---

## Business Model

### Revenue Streams

#### 1. Lead Connection Fees (Primary — 60% of revenue)
- Providers pay **$25 per lead** to unlock participant contact details
- Participants submit support requests matched to relevant providers
- Providers only pay for leads they choose to unlock
- Target: 400 leads/month by Month 12 = **$10,000/month**

#### 2. Provider Subscriptions (Secondary — 30% of revenue)
| Tier | Price/month | Features |
|------|-------------|----------|
| **Starter** | Free | Basic listing, 3 leads/month |
| **Professional** | $49/month | Enhanced profile, 15 leads/month, analytics |
| **Premium** | $99/month | Custom branding, unlimited leads, promoted listing |
| **Elite** | $199/month | All features + advanced analytics + priority support |

Target by Month 12:
- 120 Starter (free)
- 50 Professional = $2,450/month
- 25 Premium = $2,475/month
- 5 Elite = $995/month
- **Total subscriptions: $5,920/month**

#### 3. Sponsored Placements (Tertiary — 10% of revenue)
- Featured Provider carousel on landing page
- "Provider of the Week" spotlight
- Category-specific promoted listings
- Target: $1,500/month by Month 12

### Unit Economics

| Metric | Value |
|--------|-------|
| Customer Acquisition Cost (Provider) | $50 (est.) |
| Average Revenue Per Provider/month | $45 |
| Provider Lifetime Value (18 months) | $810 |
| LTV:CAC Ratio | **16.2x** |
| Gross Margin | ~85% (SaaS) |

---

## Product Overview

### For Participants (Free)
- Search and filter providers by category, location, rating, availability
- Read verified reviews from other participants
- Submit support requests matched to relevant providers
- Save favourite providers
- Book appointments directly
- Message providers through the platform

### For Providers (Freemium)
- Create a detailed provider profile with photos, services, availability
- Receive and respond to lead requests
- Manage bookings and enquiries
- Track analytics (profile views, enquiry rates, conversion)
- Customise profile with branding (Professional+)
- Get promoted in search results (Premium+)
- Advanced analytics and competitor benchmarking (Elite)

### Technical Stack
- **Frontend**: React (Vite) — deployed on Vercel
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Payments**: Stripe (subscriptions + per-lead charges)
- **Hosting**: Vercel (frontend) + Supabase Cloud (backend)
- **Monthly infrastructure cost**: ~$50-100

---

## Go-To-Market Strategy

### Phase 1: Seed (Months 1-3)
**Goal: 50 providers, 200 participants**

1. **Direct Provider Outreach**
   - Personally visit 100 NDIS providers in Newcastle/Lake Macquarie
   - Offer free Starter accounts + 3-month Professional trial
   - Target: therapy practices, support coordination, allied health, plan managers

2. **Participant Acquisition**
   - Partner with 5 plan management companies to recommend NexaConnect
   - Flyers at NDIS Local Area Coordinator (LAC) offices
   - Facebook groups: "NDIS Hunter Valley", "Newcastle Disability Support"
   - Content: "How to Find the Right NDIS Provider" blog series

3. **Community Events**
   - Attend Newcastle Disability Expo (if scheduled)
   - Host a free "NDIS Provider Digital Marketing" workshop
   - Sponsor a local disability sports team

### Phase 2: Growth (Months 4-8)
**Goal: 150 providers, 800 participants**

4. **Referral Program**: Providers get 5 free lead unlocks for each provider they refer
5. **SEO Content**: Target "NDIS providers Newcastle", "disability services Hunter Valley"
6. **Google Ads**: $500/month targeting NDIS-related searches in Hunter region
7. **Provider Success Stories**: Video testimonials from early adopter providers

### Phase 3: Scale (Months 9-12)
**Goal: 200 providers, 1,500 participants**

8. **Expand to Central Coast** and Upper Hunter
9. **API integrations** with plan management software (Brevity, SupportAbility)
10. **Mobile app** development (React Native)
11. **Provider onboarding team** (1 part-time hire)

---

## Operations

### Team (Year 1)

| Role | Type | Cost/year |
|------|------|-----------|
| Founder/CEO | Full-time | $0 (equity) |
| Developer (contract) | Part-time | $20,000 |
| Sales/Partnerships | Part-time (Month 6+) | $15,000 |
| Customer Support | Part-time (Month 9+) | $10,000 |
| **Total** | | **$45,000** |

### Key Partnerships
- **Plan Management Companies**: Referral pipeline for participants
- **NDIS Local Area Coordinators**: Awareness and credibility
- **Hunter Business Chamber**: Networking and local credibility
- **University of Newcastle**: Disability research collaboration, student interns

### Key Milestones

| Month | Milestone |
|-------|-----------|
| 1 | Platform launch, 20 seed providers onboarded |
| 3 | 50 providers, first paid subscriptions |
| 5 | 100 providers, 500 participants, $3K MRR |
| 8 | 150 providers, lead system generating $8K/month |
| 9 | **Break-even** |
| 12 | 200 providers, 1,500 participants, $15K MRR |

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low provider adoption | Medium | High | Free tier + direct sales outreach |
| Participant trust/safety | Low | High | Provider verification, review moderation |
| NDIS policy changes | Medium | Medium | Diversify beyond NDIS-only services |
| Competitor entry | Medium | Medium | Local-first strategy, community moat |
| Low plan utilisation awareness | Low | Medium | Educational content, LAC partnerships |

---

## Funding Requirements

### Bootstrap Phase (Current)
- $0 external funding required
- Infrastructure costs: ~$100/month (Supabase + Vercel + Stripe fees)
- Funded from savings/personal income

### Growth Phase (Month 6+)
- Seeking **$50,000** (grant or angel investment)
- Allocation: Sales hire ($15K), marketing ($15K), mobile app ($15K), contingency ($5K)
- Target: NSW Government digital innovation grants, NDIS-related funding programs

### Potential Grant Sources
- **Minimum Viable Product (MVP) Grant** — NSW Government ($25K)
- **Boosting Business Tech Adoption** — Federal ($10-20K)
- **Newcastle Innovation Hub** — Various programs
- **NDIA Innovation Fund** — For tools improving participant outcomes

---

## Vision

**Year 1**: Dominant NDIS provider platform in Hunter New England
**Year 2**: Expand to Greater Sydney, Illawarra, Central Coast
**Year 3**: National platform covering all major NDIS regions
**Year 5**: Australia's go-to NDIS marketplace — the "Seek.com for disability services"

NexaConnect isn't just a directory. It's the infrastructure layer that makes the NDIS work better for everyone — participants find the right support, providers grow sustainable businesses, and more plan funding actually gets used.

---

*Prepared by NexaConnect | nexaconnect-alpha.vercel.app | February 2026*
