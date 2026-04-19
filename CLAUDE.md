# AcreLog — Claude Instructions

## Design Context

### Users

Working farmers who are simultaneously owner, manager, and operator. Two contexts:

- **In the field / shop**: Dirty hands, bright sunlight, time pressure — quick logging, breakdown reporting, checking what's due. Needs to be fast and forgiving.
- **In the office / evening**: Full fleet review, scheduling, history review. Can be more information-dense.

Multi-user farms have Workers, Mechanics, and Auditors — but the working farmer-owner is the primary audience. They trust tools that feel built for their world, not retrofitted SaaS templates.

### Brand Personality

**Rugged. Reliable. No-nonsense.** Like a good truck — built tough, no wasted chrome, gets the job done. Not flashy, not corporate, not cute. Should feel worthy of trust over equipment worth hundreds of thousands of dollars.

### Aesthetic Direction

Material Design 3 (react-native-paper) pushed toward ag-industrial. References: John Deere Operations Center (clean, professional, green), Carfax/AutoTrader (practical, data-dense, utilitarian).

- **Primary**: `#2e7d32` forest green — use boldly and intentionally, not cautiously
- **Background**: `#f5f2ee` warm off-white (not cold `#f5f5f5`)
- **Cards**: `#ffffff` on warm background — natural separation without heavy shadows
- **Secondary accent**: `#d4870a` amber/gold — for callouts, warnings, highlights
- **Typography**: `Barlow Condensed` (bold) for headlines, `Barlow` for body — confident, slightly industrial
- **Borders**: `1px #e8e4df` warm-gray dividers instead of shadows everywhere
- **Status colors**: green=ok, orange=due_soon, red=overdue, purple=broken — keep as-is

Anti-references: No glassmorphism, no gradient cards, no neon, no hero-metric tiles, no generic blue CTAs.

### Design Principles

1. **Field-first sizing** — 48px minimum touch targets, high contrast for sunlight readability.
2. **Information earns its place** — Show status, hours, category at a glance. Data-density is a feature.
3. **The equipment is the hero** — Equipment name, status, and hours dominate. Chrome recedes.
4. **Reliability signals trust** — Consistent patterns, clear feedback, plain-language errors.
5. **Green means go** — Green = primary actions + healthy status. Amber = attention. Red = genuine problems only.
