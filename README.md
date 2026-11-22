# With You — Open-Source AI Chat Widget & EU-Compliant Edge Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E.svg)](LICENSE)
[![EU AI Act](https://img.shields.io/badge/EU_AI_Act-Article_50_Compliant-16A34A.svg)](#eu-ai-act--gdpr-compliance)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero-4ADE80.svg)](#features)

A lightweight, zero-dependency **Shadow DOM AI Assistant Widget** (`wy-chat.js`) and **Supabase / Deno Edge Functions** router built for European small businesses (SMBs) and web developers.

Built and maintained by **[With You](https://with-you.store)**.

---

## Why this project exists

Most AI chat widgets today require heavy frontend frameworks (React/Next.js bundles), expose configuration logic on the client side, or ignore European regulatory requirements. 

This project provides a clean, privacy-first alternative:
1. **Zero-Dependency Shadow DOM Component:** Embeds into any website (HTML, WordPress, Shopify, Webflow) via a single `<script>` tag with zero CSS collisions.
2. **Interactive DOM Piloting:** Beyond answering questions, the assistant can scroll to specific page or 3D sections, open FAQ accordions, and pre-fill contact forms on the host page.
3. **Built-in Lead Capture & Appointment Booking:** Native drawers inside the chat window to capture qualified leads and book time slots with anti-overlap protection and `.ics` calendar export.
4. **Native EU AI Act (Article 50) & GDPR Compliance:** Mandatory AI disclosure banners, system-level transparency guardrails, SHA-256 IP hashing for rate-limiting, strict CORS domain whitelisting, and automated 12-month data retention cleanups.

---

## Quick Start (Frontend Integration)

Add a single script tag before the closing `</body>` tag of any website:

```html
<script 
  src="[https://your-domain.com/widget/wy-chat.js](https://your-domain.com/widget/wy-chat.js)" 
  data-widget-key="wy_pub_your_agent_public_key" 
  data-position="right"
  defer>
</script>
