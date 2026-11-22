// Fichier : widget/wy-chat.js
// Widget Chat Public Intégrable With You (Cerveau Hybride + Capture de Leads + Prise de RDV + Pilotage DOM 3D + AI Act Art. 50)
(function () {
  "use strict";

  if (window.__WY_CHAT_WIDGET_LOADED__) return;
  window.__WY_CHAT_WIDGET_LOADED__ = true;

  const DEFAULT_API_ENDPOINT = "https://xlumemoczjcqhisqgncz.supabase.co/functions/v1/smooth-service";

  function findWidgetScript() {
    if (document.currentScript && document.currentScript.getAttribute("data-widget-key")) {
      return document.currentScript;
    }
    return document.querySelector("script[data-widget-key]");
  }

  const scriptEl = findWidgetScript();
  if (!scriptEl) return;

  const WIDGET_KEY = (scriptEl.getAttribute("data-widget-key") || "").trim();
  const API_ENDPOINT = (scriptEl.getAttribute("data-api-url") || DEFAULT_API_ENDPOINT).trim();
  const POSITION = (scriptEl.getAttribute("data-position") || "right").toLowerCase() === "left" ? "left" : "right";

  if (!WIDGET_KEY.startsWith("wy_pub_")) return;

  const STORAGE_CONV_KEY = `wy_chat_conv_${WIDGET_KEY}`;
  const STORAGE_HISTORY_KEY = `wy_chat_hist_${WIDGET_KEY}`;

  let conversationId = null;
  let messageHistory = [];
  let isOpen = false;
  let isBusy = false;
  let isInitialized = false;
  let bookingEnabled = true;
  let externalBookingUrl = null;
  let bookingDurationMinutes = 30;

  try {
    conversationId = sessionStorage.getItem(STORAGE_CONV_KEY) || null;
    const rawHist = sessionStorage.getItem(STORAGE_HISTORY_KEY);
    if (rawHist) {
      const parsed = JSON.parse(rawHist);
      if (Array.isArray(parsed)) messageHistory = parsed.slice(-20);
    }
  } catch (_) {}

  function saveSessionState() {
    try {
      if (conversationId) sessionStorage.setItem(STORAGE_CONV_KEY, conversationId);
      else sessionStorage.removeItem(STORAGE_CONV_KEY);
      sessionStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(messageHistory.slice(-20)));
    } catch (_) {}
  }

  // ==========================================================================
  // 1. MOTEUR D'ACTION DOM SUR LE SITE (SCROLL 3D, TARIFS, FAQ, FORMULAIRE)
  // ==========================================================================
  const SLIDE_RATIOS = {
    "#slide-1": 0.02,
    "#slide-2": 0.33,
    "#slide-3": 0.60,
    "#slide-4": 0.86
  };

  const ACTION_LABELS = {
    "#slide-1": "Aller à l'accueil ↑",
    "#slide-2": "Voir notre méthode →",
    "#slide-3": "Voir nos 4 services →",
    "#slide-4": "Voir nos engagements & chiffres →",
    "#tarifs": "Voir la grille des tarifs ↓",
    "#demande": "Aller au formulaire de demande ↓",
    "#faq": "Consulter la FAQ ↓",
    "/creation-site-web": "Ouvrir la page Création de Sites Web ↗",
    "/automatisation-ia": "Ouvrir la page Automatisation & IA ↗",
    "connexion.html": "Ouvrir l'Espace Client ↗"
  };

  function highlightElement(el) {
    if (!el) return;
    el.style.transition = "box-shadow 0.4s ease";
    el.style.boxShadow = "0 0 0 3px #4ADE80, 0 0 36px rgba(74, 222, 128, 0.4)";
    setTimeout(() => { el.style.boxShadow = ""; }, 2800);
  }

  function scrollToSiteSection(selector) {
    if (selector === "#tarifs" && !document.getElementById("tarifs") && window.WY_PRICING?.injectPricingSectionOnSite) {
      window.WY_PRICING.injectPricingSectionOnSite();
    }

    const stageEl = document.getElementById("scroll-stage");
    if (stageEl && SLIDE_RATIOS[selector] !== undefined) {
      const link = document.querySelector(`[data-scroll-to][href="${selector}"]`);
      if (link) {
        link.click();
      } else {
        const stageScrollable = Math.max(1, stageEl.offsetHeight - window.innerHeight);
        window.scrollTo({ top: SLIDE_RATIOS[selector] * stageScrollable, behavior: "smooth" });
      }
      setTimeout(() => {
        const card = document.querySelector(`${selector} .slide-card`);
        highlightElement(card);
      }, 500);
      return true;
    }

    const id = selector.replace(/^#/, "");
    const targetEl = document.getElementById(id);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      highlightElement(targetEl.firstElementChild || targetEl);
      return true;
    }

    if (selector.startsWith("#")) {
      window.location.href = "/index.html" + selector;
      return true;
    }
    return false;
  }

  function openSiteFaq(triggerId) {
    const cleanId = triggerId.replace(/^#/, "");
    const btn = document.getElementById(cleanId);
    const faqSection = document.getElementById("faq") || document.getElementById("faq-web");
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (btn) {
      setTimeout(() => {
        if (btn.getAttribute("aria-expanded") !== "true") {
          btn.click();
        }
        highlightElement(btn.closest(".faq-item") || btn);
      }, 400);
      return true;
    }
    return false;
  }

  function prefillContactForm(payloadStr) {
    const form = document.getElementById("request-form");
    const demandeSec = document.getElementById("demande");
    if (!form || !demandeSec) {
      openLeadDrawer(payloadStr);
      return {
        label: "📞 Laisser mes coordonnées ici",
        run: () => openLeadDrawer(payloadStr)
      };
    }

    const params = {};
    payloadStr.split("|").forEach((part) => {
      const eqIdx = part.indexOf("=");
      if (eqIdx > 0) {
        const k = part.slice(0, eqIdx).trim().toLowerCase();
        const v = part.slice(eqIdx + 1).trim();
        params[k] = v;
      }
    });

    const formCard = document.querySelector(".contact-card-slab") || demandeSec;
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });

    if (params.besoin) {
      const targetNeed = params.besoin.toLowerCase();
      form.querySelectorAll('input[name="besoin"]').forEach((cb) => {
        if (cb.value.toLowerCase().includes(targetNeed) || targetNeed.includes(cb.value.toLowerCase())) {
          cb.checked = true;
        }
      });
    }

    if (params.description) {
      const descEl = document.getElementById("description");
      if (descEl) {
        descEl.value = params.description;
        descEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    highlightElement(formCard);

    if (window.innerWidth < 640) {
      setTimeout(() => toggleWindow(false), 1100);
    }

    return {
      label: "✓ Formulaire pré-rempli — Compléter mes coordonnées ↓",
      run: () => {
        formCard.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("nom")?.focus();
      }
    };
  }

  // ==========================================================================
  // 2. CERVEAU LOCAL INSTANTANÉ (< 40 MS)
  // ==========================================================================
  function normalizeFr(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function resolveLocalSmartIntent(rawUserText) {
    const norm = normalizeFr(rawUserText);

    // Intention 1 : Prise de rendez-vous / Créneau / Agenda / Appel découverte
    if (/(rdv|rendez-vous|creneau|agenda|planifier|reserver|disponibilite|calendrier|appel decouverte)/.test(norm)) {
      if (bookingEnabled) {
        openBookingDrawer(rawUserText);
        return {
          text: `Avec plaisir ! Choisissez votre jour et votre horaire (${bookingDurationMinutes} min) directement dans le sélecteur ci-dessous pour réserver votre rendez-vous :`,
          actionButton: {
            label: "📅 Choisir mon créneau de RDV",
            run: () => openBookingDrawer(rawUserText)
          }
        };
      }
    }

    // Intention 2 : Rappel / Coordonnées / Parler à un humain
    if (/(rappel|recontact|laisser mes coordonnees|mon numero|mon telephone|parler a un humain|conseiller)/.test(norm)) {
      openLeadDrawer(rawUserText);
      return {
        text: "Bien sûr ! Remplissez vos coordonnées dans le bloc ci-dessous et notre équipe vous recontacte très rapidement :",
        actionButton: {
          label: "📞 Ouvrir le formulaire de rappel",
          run: () => openLeadDrawer(rawUserText)
        }
      };
    }

    const isWithYouOfficial =
      WIDGET_KEY === "wy_pub_withyou_official_vitrine_2026" ||
      window.location.hostname.includes("with-you.store") ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isWithYouOfficial) return null;

    const wantsNav = /(ramene|emmene|amene|montre|aller|va |voir|ou est|ou sont|dirige|guide|ouvre|affiche|section|page)/.test(norm);

    if (/(tarif|prix|cout|combien|formule|abonnement|offre|essentiel|croissance|mensuel|annuel|budget|59|149|349)/.test(norm)) {
      scrollToSiteSection("#tarifs");
      openSiteFaq("faq-trigger-price");
      return {
        text:
          "Je vous amène directement devant notre grille tarifaire !\n\n" +
          "Voici nos 3 formules d'accompagnement (HT, engagement 12 mois, 2 mois offerts en paiement annuel) :\n" +
          "• Essentiel (59 € HT/mois) : Portail client, rapport mensuel, 1 automatisation suivie, maintenance légère, support 48h.\n" +
          "• Pro (149 € HT/mois) : 3 automatisations suivies, Assistant IA sur votre site (500 conversations/mois), capture de contacts & RDV, 1h de modifications/mois, support 24h.\n" +
          "• Croissance (349 € HT/mois) : 8 automatisations, Assistant IA (1 500 conversations/mois) + Base de connaissances, canal Téléphone/WhatsApp, maintenance incluse (2h/mois).",
        actionButton: {
          label: "Voir la grille des tarifs sur la page ↓",
          run: () => scrollToSiteSection("#tarifs")
        }
      };
    }

    if (/(site web|site internet|creation de site|creer un site|vitrine|portfolio|landing page|refonte|3d)/.test(norm)) {
      if (/(je suis|mon entreprise|j'ai besoin|je voudrais|pour mon|pour ma|devis pour)/.test(norm) && rawUserText.length >= 25) {
        const cleanDesc = rawUserText.length >= 32
          ? rawUserText
          : `Projet de création/refonte de site web : ${rawUserText}`;
        const btn = prefillContactForm(`besoin=Création de site web|description=${cleanDesc}`);
        return {
          text:
            "C'est noté ! J'ai coché « Création de site web » et pré-rempli la description de votre projet directement dans le formulaire en bas de page.\n\n" +
            "Vous pouvez aussi réserver directement un créneau de rendez-vous dans ce chat.",
          actionButton: btn
        };
      }

      if (wantsNav && /(page|detail|style)/.test(norm) && !window.location.pathname.includes("creation-site-web")) {
        setTimeout(() => { window.location.href = "/creation-site-web"; }, 600);
        return {
          text: "Je vous ouvre la page dédiée à la Création de Sites Web sur mesure.",
          actionButton: {
            label: "Ouvrir la page Création de Sites Web ↗",
            run: () => { window.location.href = "/creation-site-web"; }
          }
        };
      }

      scrollToSiteSection("#slide-3");
      return {
        text:
          "Nous concevons des sites web 100 % sur mesure et propriétaires (sites vitrines métiers, expériences 3D en verre optique, portfolios, landing pages et portails clients), connectés à vos outils et à l'IA.",
        actionButton: {
          label: "Explorer tous les styles de sites web ↗",
          run: () => { window.location.href = "/creation-site-web"; }
        }
      };
    }

    if (/(automatisation|automatiser|tache|repetiti|make|n8n|webhook|crm|agent ia|assistant ia|facturation)/.test(norm)) {
      if (/(je suis|mon entreprise|j'ai besoin|je voudrais|perd|temps)/.test(norm) && rawUserText.length >= 25) {
        const cleanDesc = rawUserText.length >= 32
          ? rawUserText
          : `Besoin d'automatisation et d'assistant IA : ${rawUserText}`;
        const btn = prefillContactForm(`besoin=Automatiser des tâches répétitives|description=${cleanDesc}`);
        return {
          text:
            "J'ai préparé votre demande d'automatisation directement dans le formulaire de contact ci-dessous !",
          actionButton: btn
        };
      }

      scrollToSiteSection("#slide-3");
      return {
        text:
          "Je vous amène à la section Services (Chapitre 03) !\n\n" +
          "Nous automatisons vos tâches répétitives en reliant vos outils existants (e-mails, CRM, agenda, devis/factures, tableurs) et en déployant des assistants IA sur mesure supervisables 24h/24.",
        actionButton: {
          label: "Voir la page détaillée Automatisation & IA ↗",
          run: () => { window.location.href = "/automatisation-ia"; }
        }
      };
    }

    if (/(methode|comment ca marche|fonctionne|a propos|etape|garantie|proprietaire|processus)/.test(norm)) {
      scrollToSiteSection("#slide-2");
      return {
        text:
          "Je vous amène au Chapitre 02 (Notre Méthode) !\n" +
          "1. Étude gratuite sous 2 jours ouvrés.\n" +
          "2. Devis fixe et périmètre validés par écrit avant tout démarrage.\n" +
          "3. Vos outils et votre code restent 100 % les vôtres.\n" +
          "4. Suivi en direct 24/7 depuis votre Espace Client gratuit.",
        actionButton: {
          label: "Voir le Chapitre 02 (Méthode) →",
          run: () => scrollToSiteSection("#slide-2")
        }
      };
    }

    if (/(service|levier|que faites|proposez|prestation)/.test(norm)) {
      scrollToSiteSection("#slide-3");
      return {
        text:
          "Je vous amène au Chapitre 03 (Nos 4 leviers de services) :\n" +
          "1. Automatisation du tri, des relances et des documents.\n" +
          "2. Assistants IA dédiés à votre métier.\n" +
          "3. Création de sites web modernes reliés à votre CRM et agenda.\n" +
          "4. Tableaux de bord actualisés automatiquement.",
        actionButton: {
          label: "Voir nos 4 services →",
          run: () => scrollToSiteSection("#slide-3")
        }
      };
    }

    if (/(resultat|chiffre|delai|combien de temps|engagement)/.test(norm)) {
      scrollToSiteSection("#slide-4");
      return {
        text:
          "Je vous amène au Chapitre 04 (Engagements & Résultats) :\n" +
          "• 2 jours ouvrés maximum pour notre première réponse.\n" +
          "• 100 % des devis et périmètres validés par écrit.\n" +
          "• Espace client accessible 24h/24 et 7j/7.",
        actionButton: {
          label: "Voir le Chapitre 04 →",
          run: () => scrollToSiteSection("#slide-4")
        }
      };
    }

    if (/(faq|question|technique|faisable|realisable|donnee|rgpd|confidentialite)/.test(norm)) {
      scrollToSiteSection("#faq");
      return {
        text: "Je vous amène directement à notre Foire Aux Questions (FAQ) !",
        actionButton: { label: "Aller à la FAQ ↓", run: () => scrollToSiteSection("#faq") }
      };
    }

    if (/(espace client|connexion|connecter|mon compte|inscription|inscrire|login|portail)/.test(norm)) {
      return {
        text: "Cliquez ci-dessous pour accéder à votre Espace Client With You :",
        actionButton: {
          label: "Ouvrir l'Espace Client ↗",
          run: () => { window.location.href = "connexion.html"; }
        }
      };
    }

    if (/(contact|devis|formulaire|ecrire|besoin|demande|parler)/.test(norm)) {
      scrollToSiteSection("#demande");
      return {
        text:
          "Je vous amène devant notre formulaire « Décrire mon besoin » ! Vous pouvez aussi réserver un créneau de rendez-vous directement ici :",
        actionButton: {
          label: "📅 Réserver un créneau de RDV",
          run: () => openBookingDrawer()
        }
      };
    }

    if (/(accueil|debut|haut de page)/.test(norm) && wantsNav) {
      scrollToSiteSection("#slide-1");
      return {
        text: "Je vous ramène tout en haut de la page d'accueil !",
        actionButton: { label: "Haut de page ↑", run: () => scrollToSiteSection("#slide-1") }
      };
    }

    return null;
  }

  function parseAndExecuteActions(rawReply) {
    let cleanText = String(rawReply || "");
    let actionButton = null;

    const regex = /\[\[ACTION:([A-Z_]+)(?::([^\]]*))?\]\]/g;
    let match;
    while ((match = regex.exec(rawReply)) !== null) {
      const type = match[1].trim().toUpperCase();
      const target = (match[2] || "").trim();

      if (type === "SCROLL" || type === "SECTION") {
        scrollToSiteSection(target);
        actionButton = {
          label: ACTION_LABELS[target] || `Aller à la section ${target} →`,
          run: () => scrollToSiteSection(target)
        };
      } else if (type === "FAQ") {
        openSiteFaq(target);
        actionButton = {
          label: "Voir la réponse dans la FAQ ↓",
          run: () => openSiteFaq(target)
        };
      } else if (type === "PAGE" || type === "NAVIGATE") {
        actionButton = {
          label: ACTION_LABELS[target] || `Ouvrir la page ${target} ↗`,
          run: () => { window.location.href = target; }
        };
      } else if (type === "PREFILL") {
        actionButton = prefillContactForm(target);
      } else if (type === "CAPTURE_LEAD") {
        openLeadDrawer();
        actionButton = {
          label: target || "📞 Laisser mes coordonnées",
          run: () => openLeadDrawer()
        };
      } else if (type === "BOOK_APPOINTMENT") {
        openBookingDrawer();
        actionButton = {
          label: target || "📅 Choisir un créneau de RDV",
          run: () => openBookingDrawer()
        };
      }
    }

    cleanText = cleanText.replace(regex, "").trim();
    return { cleanText, actionButton };
  }

  // ==========================================================================
  // 3. INTERFACE GRAPHIQUE SHADOW DOM (CHAT + LEADS + PRISE DE RDV)
  // ==========================================================================
  const hostEl = document.createElement("div");
  hostEl.id = "withyou-ai-widget-host";
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = `
    :host {
      all: initial;
      font-family: 'Space Grotesk Local', 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #F0FDF4;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .wy-launcher {
      position: fixed;
      bottom: 20px;
      ${POSITION}: 20px;
      z-index: 2147483645;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 54px;
      padding: 12px 20px;
      border-radius: 999px;
      border: 1px solid rgba(134, 239, 172, 0.55);
      background: linear-gradient(135deg, #16A34A 0%, #052E16 100%);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 14px 36px rgba(3, 24, 12, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
    }
    .wy-launcher:hover {
      transform: translateY(-2px);
      filter: brightness(1.07);
      box-shadow: 0 18px 44px rgba(22, 163, 74, 0.52);
    }
    .wy-launcher:focus-visible {
      outline: 3px solid #4ADE80;
      outline-offset: 3px;
    }
    .wy-launcher-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #4ADE80;
      box-shadow: 0 0 10px #4ADE80;
    }
    .wy-launcher-ai-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(3, 24, 12, 0.65);
      color: #86EFAC;
      border: 1px solid rgba(134, 239, 172, 0.4);
    }

    .wy-window {
      position: fixed;
      bottom: 86px;
      ${POSITION}: 20px;
      z-index: 2147483646;
      width: min(410px, calc(100vw - 24px));
      height: min(620px, calc(100vh - 110px));
      display: flex;
      flex-direction: column;
      border-radius: 26px;
      background: rgba(3, 24, 12, 0.95);
      backdrop-filter: blur(26px) saturate(180%);
      -webkit-backdrop-filter: blur(26px) saturate(180%);
      border: 1px solid rgba(134, 239, 172, 0.42);
      box-shadow: 0 28px 68px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      overflow: hidden;
    }
    .wy-window[hidden], [hidden] {
      display: none !important;
    }

    .wy-header {
      padding: 13px 16px;
      background: rgba(5, 46, 22, 0.94);
      border-bottom: 1px solid rgba(134, 239, 172, 0.24);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .wy-header-info { min-width: 0; }
    .wy-header-title {
      font-size: 15px;
      font-weight: 700;
      color: #FFFFFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .wy-header-sub {
      font-size: 11px;
      color: #A7F3D0;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .wy-header-actions {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .wy-icon-btn {
      height: 30px;
      padding: 0 8px;
      border-radius: 9px;
      border: 1px solid rgba(134, 239, 172, 0.3);
      background: rgba(255, 255, 255, 0.06);
      color: #D1FAE5;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .wy-icon-btn:hover {
      background: rgba(134, 239, 172, 0.2);
      color: #FFFFFF;
    }
    .wy-icon-btn.is-accent {
      background: rgba(22, 163, 74, 0.3);
      border-color: rgba(134, 239, 172, 0.55);
      color: #86EFAC;
    }

    .wy-ai-act-banner {
      padding: 7px 14px;
      background: rgba(21, 128, 61, 0.26);
      border-bottom: 1px solid rgba(134, 239, 172, 0.25);
      font-size: 11px;
      line-height: 1.35;
      color: #D1FAE5;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .wy-ai-act-pill {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 999px;
      background: #16A34A;
      color: #FFFFFF;
    }

    .wy-messages {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .wy-msg-row {
      display: flex;
      flex-direction: column;
      max-width: 88%;
    }
    .wy-msg-row.is-ai { align-self: flex-start; }
    .wy-msg-row.is-user { align-self: flex-end; }
    .wy-msg-meta {
      font-size: 10px;
      color: #A7F3D0;
      margin-bottom: 3px;
      padding: 0 4px;
    }
    .wy-msg-row.is-user .wy-msg-meta { text-align: right; }
    .wy-bubble {
      padding: 10px 13px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .wy-msg-row.is-ai .wy-bubble {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(134, 239, 172, 0.28);
      color: #F0FDF4;
      border-bottom-left-radius: 4px;
    }
    .wy-msg-row.is-user .wy-bubble {
      background: linear-gradient(135deg, #16A34A, #15803D);
      border: 1px solid rgba(134, 239, 172, 0.5);
      color: #FFFFFF;
      border-bottom-right-radius: 4px;
    }

    .wy-action-cta {
      margin-top: 6px;
      align-self: flex-start;
      padding: 7px 13px;
      border-radius: 999px;
      border: 1px solid #4ADE80;
      background: rgba(22, 163, 74, 0.28);
      color: #86EFAC;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .wy-action-cta:hover {
      background: #16A34A;
      color: #FFFFFF;
    }

    /* Tiroirs Leads & Rendez-vous */
    .wy-lead-drawer {
      padding: 13px 14px;
      background: rgba(5, 42, 20, 0.98);
      border-top: 1px solid rgba(74, 222, 128, 0.45);
      border-bottom: 1px solid rgba(74, 222, 128, 0.3);
      display: flex;
      flex-direction: column;
      gap: 7px;
      max-height: 360px;
      overflow-y: auto;
    }
    .wy-lead-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: #86EFAC;
    }
    .wy-lead-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .wy-lead-input {
      width: 100%;
      min-height: 34px;
      padding: 7px 10px;
      border-radius: 10px;
      border: 1px solid rgba(134, 239, 172, 0.35);
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 12px;
    }
    .wy-lead-input option {
      background: #052E16;
      color: #F0FDF4;
    }
    .wy-lead-input::placeholder {
      color: rgba(209, 250, 229, 0.55);
    }
    .wy-lead-input:focus {
      outline: none;
      border-color: #4ADE80;
    }
    .wy-lead-consent {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      font-size: 10.5px;
      color: #D1FAE5;
      line-height: 1.35;
      cursor: pointer;
    }
    .wy-lead-consent input {
      margin-top: 2px;
      accent-color: #22C55E;
    }
    .wy-lead-submit {
      min-height: 36px;
      border-radius: 999px;
      border: 1px solid rgba(134, 239, 172, 0.6);
      background: linear-gradient(135deg, #16A34A, #15803D);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .wy-lead-submit:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .wy-ext-cal-link {
      display: block;
      text-align: center;
      padding: 6px 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(134, 239, 172, 0.35);
      color: #86EFAC;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
    }
    .wy-ext-cal-link:hover {
      background: rgba(22, 163, 74, 0.25);
      color: #FFFFFF;
    }

    .wy-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
    }
    .wy-chip {
      padding: 6px 11px;
      border-radius: 999px;
      border: 1px solid rgba(134, 239, 172, 0.35);
      background: rgba(255, 255, 255, 0.05);
      color: #D1FAE5;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease;
    }
    .wy-chip:hover {
      background: rgba(34, 197, 94, 0.22);
      border-color: #4ADE80;
      color: #FFFFFF;
    }

    .wy-form {
      padding: 10px 12px;
      background: rgba(4, 34, 17, 0.92);
      border-top: 1px solid rgba(134, 239, 172, 0.22);
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .wy-input {
      flex: 1;
      min-height: 40px;
      padding: 9px 12px;
      border-radius: 12px;
      border: 1px solid rgba(134, 239, 172, 0.35);
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 13px;
    }
    .wy-input::placeholder {
      color: rgba(209, 250, 229, 0.55);
    }
    .wy-input:focus {
      outline: none;
      border-color: #4ADE80;
      box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.25);
    }
    .wy-send-btn {
      min-height: 40px;
      padding: 0 15px;
      border-radius: 12px;
      border: 1px solid rgba(134, 239, 172, 0.55);
      background: linear-gradient(135deg, #16A34A, #15803D);
      color: #FFFFFF;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .wy-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .wy-footer-note {
      padding: 6px 12px 8px;
      background: rgba(3, 20, 10, 0.96);
      font-size: 10px;
      color: rgba(167, 243, 208, 0.75);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .wy-footer-note a {
      color: #86EFAC;
      text-decoration: none;
      font-weight: 600;
    }
  `;

  const container = document.createElement("div");
  container.innerHTML = `
    <button type="button" class="wy-launcher" id="wy-launcher" aria-expanded="false" aria-controls="wy-window" aria-label="Ouvrir l'assistant IA">
      <span class="wy-launcher-dot" aria-hidden="true"></span>
      <span id="wy-launcher-text">Besoin d'aide ?</span>
      <span class="wy-launcher-ai-tag">Assistant IA</span>
    </button>

    <section class="wy-window" id="wy-window" role="dialog" aria-modal="false" aria-labelledby="wy-title" hidden>
      <header class="wy-header">
        <div class="wy-header-info">
          <div class="wy-header-title" id="wy-title">Assistant With You</div>
          <div class="wy-header-sub">
            <span class="wy-launcher-dot" style="width:7px;height:7px;"></span>
            <span>Guide interactif instantané</span>
          </div>
        </div>
        <div class="wy-header-actions">
          <button type="button" class="wy-icon-btn is-accent" id="wy-open-booking-btn" title="Réserver un créneau de rendez-vous">
            📅 RDV
          </button>
          <button type="button" class="wy-icon-btn is-accent" id="wy-open-lead-btn" title="Être rappelé par l'équipe">
            📞 Rappel
          </button>
          <button type="button" class="wy-icon-btn" id="wy-reset-btn" title="Réinitialiser la conversation" aria-label="Réinitialiser la conversation">↺</button>
          <button type="button" class="wy-icon-btn" id="wy-close-btn" title="Fermer la fenêtre" aria-label="Fermer l'assistant IA">✕</button>
        </div>
      </header>

      <div class="wy-ai-act-banner" role="note">
        <span class="wy-ai-act-pill">IA</span>
        <span id="wy-ai-notice">Assistant IA — Il répond à vos questions, planifie vos rendez-vous et guide votre navigation.</span>
      </div>

      <div class="wy-messages" id="wy-messages" aria-live="polite"></div>

      <!-- TIROIR 1 : CAPTURE DE COORDONNÉES (LEADS) -->
      <form class="wy-lead-drawer" id="wy-lead-drawer" hidden>
        <div class="wy-lead-head">
          <span>📞 Être recontacté par notre équipe</span>
          <button type="button" class="wy-icon-btn" id="wy-close-lead-btn" style="height:24px;padding:0 7px;">✕</button>
        </div>
        <div class="wy-lead-grid">
          <input type="text" class="wy-lead-input" id="wy-lead-name" placeholder="Nom complet *" maxlength="120" required>
          <input type="text" class="wy-lead-input" id="wy-lead-company" placeholder="Entreprise (optionnel)" maxlength="120">
        </div>
        <div class="wy-lead-grid">
          <input type="email" class="wy-lead-input" id="wy-lead-email" placeholder="E-mail pro *" maxlength="200">
          <input type="tel" class="wy-lead-input" id="wy-lead-phone" placeholder="Téléphone" maxlength="40">
        </div>
        <input type="text" class="wy-lead-input" id="wy-lead-need" placeholder="Objet / Besoin en quelques mots *" maxlength="500" required>
        <label class="wy-lead-consent">
          <input type="checkbox" id="wy-lead-consent" required checked>
          <span>J'accepte que mes coordonnées soient transmises à l'entreprise pour me recontacter (RGPD). *</span>
        </label>
        <button type="submit" class="wy-lead-submit" id="wy-lead-submit">Envoyer mes coordonnées →</button>
      </form>

      <!-- TIROIR 2 : PRISE DE RENDEZ-VOUS AUTOMATIQUE (APPOINTMENTS) -->
      <form class="wy-lead-drawer" id="wy-booking-drawer" hidden>
        <div class="wy-lead-head">
          <span id="wy-booking-head-title">📅 Réserver un créneau (30 min)</span>
          <button type="button" class="wy-icon-btn" id="wy-close-booking-btn" style="height:24px;padding:0 7px;">✕</button>
        </div>
        <a id="wy-ext-cal-link" href="#" target="_blank" rel="noopener noreferrer" class="wy-ext-cal-link" hidden>
          Ouvrir directement l'agenda en ligne (Cal.com / Google) ↗
        </a>
        <div class="wy-lead-grid">
          <select class="wy-lead-input" id="wy-book-date" aria-label="Jour du rendez-vous" required></select>
          <select class="wy-lead-input" id="wy-book-time" aria-label="Heure du rendez-vous" required>
            <option value="09:00">09:00</option>
            <option value="09:30">09:30</option>
            <option value="10:00" selected>10:00</option>
            <option value="10:30">10:30</option>
            <option value="11:00">11:00</option>
            <option value="11:30">11:30</option>
            <option value="14:00">14:00</option>
            <option value="14:30">14:30</option>
            <option value="15:00">15:00</option>
            <option value="15:30">15:30</option>
            <option value="16:00">16:00</option>
            <option value="16:30">16:30</option>
            <option value="17:00">17:00</option>
          </select>
        </div>
        <div class="wy-lead-grid">
          <input type="text" class="wy-lead-input" id="wy-book-name" placeholder="Nom complet *" maxlength="120" required>
          <input type="text" class="wy-lead-input" id="wy-book-company" placeholder="Entreprise (optionnel)" maxlength="120">
        </div>
        <div class="wy-lead-grid">
          <input type="email" class="wy-lead-input" id="wy-book-email" placeholder="E-mail pro (invitation) *" maxlength="200" required>
          <input type="tel" class="wy-lead-input" id="wy-book-phone" placeholder="Téléphone" maxlength="40">
        </div>
        <input type="text" class="wy-lead-input" id="wy-book-topic" placeholder="Sujet du rendez-vous *" maxlength="400" required>
        <label class="wy-lead-consent">
          <input type="checkbox" id="wy-book-consent" required checked>
          <span>J'accepte le traitement de mes informations pour planifier ce rendez-vous (RGPD). *</span>
        </label>
        <button type="submit" class="wy-lead-submit" id="wy-book-submit">Confirmer mon rendez-vous →</button>
      </form>

      <div class="wy-chips" id="wy-chips" aria-label="Accès rapides">
        <button type="button" class="wy-chip" data-ask="Ramène-moi aux tarifs et formules">💶 Tarifs</button>
        <button type="button" class="wy-chip" data-ask="Montre-moi la création de sites web">🌐 Sites Web</button>
        <button type="button" class="wy-chip" data-ask="Comment automatiser mes tâches répétitives ?">⚡ Automatisations</button>
        <button type="button" class="wy-chip" id="wy-chip-booking">📅 Prendre RDV</button>
        <button type="button" class="wy-chip" id="wy-chip-lead">📞 Être rappelé</button>
      </div>

      <form class="wy-form" id="wy-form">
        <input type="text" class="wy-input" id="wy-input" maxlength="1500" autocomplete="off" placeholder="Posez votre question ou réservez un créneau..." aria-label="Votre message pour l'assistant IA" required>
        <button type="submit" class="wy-send-btn" id="wy-send-btn">Envoyer</button>
      </form>

      <div class="wy-footer-note">
        <span>Aucune donnée sensible ou bancaire.</span>
        <a href="https://with-you.store" target="_blank" rel="noopener noreferrer">With You</a>
      </div>
    </section>
  `;

  shadow.appendChild(styleEl);
  shadow.appendChild(container);

  const $ = (id) => shadow.getElementById(id);
  const launcherBtn = $("wy-launcher");
  const windowEl = $("wy-window");
  const messagesEl = $("wy-messages");
  const chipsEl = $("wy-chips");
  const formEl = $("wy-form");
  const inputEl = $("wy-input");
  const sendBtn = $("wy-send-btn");
  const titleEl = $("wy-title");
  const noticeEl = $("wy-ai-notice");
  const leadDrawerEl = $("wy-lead-drawer");
  const bookingDrawerEl = $("wy-booking-drawer");

  let welcomeMessage = "Bonjour ! Demandez-moi par exemple « Ramène-moi aux tarifs », « Montre-moi vos services », ou cliquez sur « 📅 Prendre RDV » pour réserver un créneau.";

  // Génère les 14 prochains jours ouvrés (Lundi à Vendredi)
  function populateUpcomingBusinessDays() {
    const dateSel = $("wy-book-date");
    if (!dateSel) return;
    const opts = [];
    const cur = new Date();
    cur.setDate(cur.getDate() + 1); // À partir de demain

    while (opts.length < 12) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isoDate = cur.toISOString().slice(0, 10);
        const label = cur.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "2-digit",
          month: "short"
        });
        opts.push(`<option value="${isoDate}">${label}</option>`);
      }
      cur.setDate(cur.getDate() + 1);
    }
    dateSel.innerHTML = opts.join("");
  }
  populateUpcomingBusinessDays();

  function openLeadDrawer(prefillNeed = "") {
    bookingDrawerEl.hidden = true;
    leadDrawerEl.hidden = false;
    const needInput = $("wy-lead-need");
    if (prefillNeed && typeof prefillNeed === "string" && !needInput.value) {
      needInput.value = prefillNeed.slice(0, 300);
    } else if (!needInput.value && messageHistory.length > 1) {
      const lastUserMsg = [...messageHistory].reverse().find((m) => m.role === "user");
      if (lastUserMsg) needInput.value = lastUserMsg.text.slice(0, 300);
    }
    setTimeout(() => $("wy-lead-name")?.focus(), 60);
  }

  function openBookingDrawer(prefillTopic = "") {
    leadDrawerEl.hidden = true;
    bookingDrawerEl.hidden = false;
    $("wy-booking-head-title").textContent = `📅 Réserver un créneau (${bookingDurationMinutes} min)`;

    const extLink = $("wy-ext-cal-link");
    if (externalBookingUrl && /^https:\/\//i.test(externalBookingUrl)) {
      extLink.href = externalBookingUrl;
      extLink.hidden = false;
    } else {
      extLink.hidden = true;
    }

    const topicInput = $("wy-book-topic");
    if (prefillTopic && typeof prefillTopic === "string" && !topicInput.value) {
      topicInput.value = prefillTopic.slice(0, 300);
    } else if (!topicInput.value) {
      topicInput.value = "Échange découverte sur mon projet";
    }
    setTimeout(() => $("wy-book-name")?.focus(), 60);
  }

  $("wy-open-lead-btn").addEventListener("click", () => {
    if (leadDrawerEl.hidden) openLeadDrawer();
    else leadDrawerEl.hidden = true;
  });
  $("wy-close-lead-btn").addEventListener("click", () => {
    leadDrawerEl.hidden = true;
  });
  $("wy-chip-lead").addEventListener("click", () => openLeadDrawer());

  $("wy-open-booking-btn").addEventListener("click", () => {
    if (bookingDrawerEl.hidden) openBookingDrawer();
    else bookingDrawerEl.hidden = true;
  });
  $("wy-close-booking-btn").addEventListener("click", () => {
    bookingDrawerEl.hidden = true;
  });
  $("wy-chip-booking").addEventListener("click", () => openBookingDrawer());

  // Soumission Tiroir 1 : Capture de Lead
  leadDrawerEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = $("wy-lead-name").value.trim();
    const company = $("wy-lead-company").value.trim();
    const email = $("wy-lead-email").value.trim();
    const phone = $("wy-lead-phone").value.trim();
    const needSummary = $("wy-lead-need").value.trim();
    const consent = $("wy-lead-consent").checked;

    if (!email && !phone) {
      appendMessageBubble("ai", "Veuillez renseigner au moins votre adresse e-mail ou votre numéro de téléphone.", false);
      return;
    }

    const submitBtn = $("wy-lead-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Transmission en cours...";

    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-withyou-widget-key": WIDGET_KEY
        },
        body: JSON.stringify({
          action: "capture_lead",
          widget_key: WIDGET_KEY,
          conversation_id: conversationId,
          full_name: fullName,
          company,
          email,
          phone,
          need_summary: needSummary,
          consent_rgpd: consent,
          page_url: window.location.pathname || "/"
        })
      });

      const data = await resp.json().catch(() => ({}));
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer mes coordonnées →";

      if (!resp.ok || !data.allowed) {
        appendMessageBubble("ai", data.error || "Impossible d'enregistrer vos coordonnées.", false);
        return;
      }

      if (data.conversation_id) conversationId = data.conversation_id;
      leadDrawerEl.reset();
      leadDrawerEl.hidden = true;
      appendMessageBubble("ai", data.reply || `Merci ${fullName} ! Vos coordonnées ont bien été transmises.`, true);
    } catch (_) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer mes coordonnées →";
      appendMessageBubble("ai", "Erreur réseau lors de l'envoi de vos coordonnées.", false);
    }
  });

  // Soumission Tiroir 2 : Prise de Rendez-vous
  bookingDrawerEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datePart = $("wy-book-date").value;
    const timePart = $("wy-book-time").value;
    const fullName = $("wy-book-name").value.trim();
    const company = $("wy-book-company").value.trim();
    const email = $("wy-book-email").value.trim();
    const phone = $("wy-book-phone").value.trim();
    const topic = $("wy-book-topic").value.trim();
    const consent = $("wy-book-consent").checked;

    const scheduledIso = new Date(`${datePart}T${timePart}:00`).toISOString();

    const submitBtn = $("wy-book-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Réservation du créneau...";

    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-withyou-widget-key": WIDGET_KEY
        },
        body: JSON.stringify({
          action: "book_appointment",
          widget_key: WIDGET_KEY,
          conversation_id: conversationId,
          full_name: fullName,
          company,
          email,
          phone,
          topic,
          scheduled_at: scheduledIso,
          consent_rgpd: consent,
          page_url: window.location.pathname || "/"
        })
      });

      const data = await resp.json().catch(() => ({}));
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer mon rendez-vous →";

      if (!resp.ok || !data.allowed) {
        appendMessageBubble("ai", data.error || "Impossible de réserver ce créneau. Veuillez choisir un autre horaire.", false);
        return;
      }

      if (data.conversation_id) conversationId = data.conversation_id;
      bookingDrawerEl.reset();
      populateUpcomingBusinessDays();
      bookingDrawerEl.hidden = true;
      appendMessageBubble("ai", data.reply || "Votre rendez-vous est confirmé !", true);
    } catch (_) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer mon rendez-vous →";
      appendMessageBubble("ai", "Erreur réseau lors de la réservation du rendez-vous.", false);
    }
  });

  function appendMessageBubble(role, text, save = true, actionButton = null) {
    const row = document.createElement("div");
    const isAi = role === "ai";
    row.className = `wy-msg-row ${isAi ? "is-ai" : "is-user"}`;

    const meta = document.createElement("div");
    meta.className = "wy-msg-meta";
    meta.textContent = isAi ? "🤖 Assistant IA" : "Vous";

    const bubble = document.createElement("div");
    bubble.className = "wy-bubble";
    bubble.textContent = text;

    row.appendChild(meta);
    row.appendChild(bubble);

    if (isAi && actionButton && typeof actionButton.run === "function") {
      const cta = document.createElement("button");
      cta.type = "button";
      cta.className = "wy-action-cta";
      cta.textContent = actionButton.label;
      cta.addEventListener("click", actionButton.run);
      row.appendChild(cta);
    }

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (save) {
      messageHistory.push({ role, text });
      saveSessionState();
    }
    return row;
  }

  function renderSavedHistoryOrWelcome() {
    messagesEl.innerHTML = "";
    if (messageHistory.length > 0) {
      messageHistory.forEach((m) => appendMessageBubble(m.role, m.text, false));
    } else {
      appendMessageBubble("ai", welcomeMessage, false);
    }
  }

  async function initWidgetConfig() {
    if (isInitialized) return;
    isInitialized = true;
    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-withyou-widget-key": WIDGET_KEY
        },
        body: JSON.stringify({
          action: "public_widget_init",
          widget_key: WIDGET_KEY
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.allowed && data.widget) {
        titleEl.textContent = data.widget.title || "Assistant With You";
        welcomeMessage = data.widget.welcome_message || welcomeMessage;
        if (data.widget.ai_act_notice) {
          noticeEl.textContent = data.widget.ai_act_notice;
        }
        bookingEnabled = data.widget.booking_enabled !== false;
        externalBookingUrl = data.widget.booking_url || null;
        bookingDurationMinutes = Number(data.widget.booking_duration_minutes) || 30;

        $("wy-open-booking-btn").hidden = !bookingEnabled;
        $("wy-chip-booking").hidden = !bookingEnabled;

        renderSavedHistoryOrWelcome();
      } else if (!resp.ok) {
        renderSavedHistoryOrWelcome();
      }
    } catch (_) {
      renderSavedHistoryOrWelcome();
    }
  }

  function toggleWindow(forceState) {
    isOpen = typeof forceState === "boolean" ? forceState : !isOpen;
    windowEl.hidden = !isOpen;
    launcherBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      initWidgetConfig();
      if (!messagesEl.children.length) renderSavedHistoryOrWelcome();
      setTimeout(() => inputEl.focus(), 60);
    }
  }

  launcherBtn.addEventListener("click", () => toggleWindow());
  $("wy-close-btn").addEventListener("click", () => toggleWindow(false));

  $("wy-reset-btn").addEventListener("click", () => {
    conversationId = null;
    messageHistory = [];
    saveSessionState();
    leadDrawerEl.hidden = true;
    bookingDrawerEl.hidden = true;
    renderSavedHistoryOrWelcome();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggleWindow(false);
      launcherBtn.focus();
    }
  });

  async function sendUserMessage(text) {
    if (isBusy || !text) return;

    inputEl.value = "";
    appendMessageBubble("user", text, true);

    const localMatch = resolveLocalSmartIntent(text);
    if (localMatch) {
      appendMessageBubble("ai", localMatch.text, true, localMatch.actionButton);
      inputEl.focus();
      return;
    }

    isBusy = true;
    sendBtn.disabled = true;
    const typingRow = appendMessageBubble("ai", "Réflexion en cours…", false);

    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-withyou-widget-key": WIDGET_KEY
        },
        body: JSON.stringify({
          action: "public_widget_chat",
          widget_key: WIDGET_KEY,
          conversation_id: conversationId,
          message_in: text,
          page_url: window.location.pathname || "/"
        })
      });

      const data = await resp.json().catch(() => ({}));
      typingRow.remove();

      if (!resp.ok || !data.allowed) {
        appendMessageBubble(
          "ai",
          "Je peux vous aider à réserver directement un créneau avec notre équipe ou transmettre vos coordonnées :",
          false,
          { label: "📅 Réserver un créneau de RDV", run: () => openBookingDrawer(text) }
        );
      } else {
        if (data.conversation_id) {
          conversationId = data.conversation_id;
        }
        const { cleanText, actionButton } = parseAndExecuteActions(data.reply);
        appendMessageBubble("ai", cleanText, true, actionButton);
      }
    } catch (_) {
      typingRow.remove();
      appendMessageBubble(
        "ai",
        "Connexion momentanément interrompue. Vous pouvez réserver un créneau ci-dessous :",
        false,
        { label: "📅 Réserver un créneau", run: () => openBookingDrawer(text) }
      );
    } finally {
      isBusy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  chipsEl.querySelectorAll("[data-ask]").forEach((chip) => {
    chip.addEventListener("click", () => {
      sendUserMessage(chip.getAttribute("data-ask"));
    });
  });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    sendUserMessage(inputEl.value.trim());
  });
})();