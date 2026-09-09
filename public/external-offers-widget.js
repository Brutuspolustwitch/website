(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var scriptUrl = new URL(currentScript.src, window.location.href);
  var apiOrigin = (
    currentScript.getAttribute("data-api-origin") ||
    scriptUrl.origin
  ).replace(/\/$/, "");
  var site =
    currentScript.getAttribute("data-site") ||
    scriptUrl.searchParams.get("site") ||
    "arena-dos-bonus";
  var targetName =
    currentScript.getAttribute("data-target") ||
    currentScript.getAttribute("data-container") ||
    "brutuspolus-offers";
  var targetSelector = targetName.charAt(0) === "#" ? targetName : "#" + targetName;
  var mount = document.querySelector(targetSelector);

  if (!mount) {
    mount = document.createElement("div");
    mount.id = targetSelector.slice(1);
    currentScript.parentNode.insertBefore(mount, currentScript);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stars(rating) {
    var rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return Array.from({ length: 5 }, function (_, index) {
      return index < rounded ? "★" : "☆";
    }).join("");
  }

  function safeColor(value) {
    var color = String(value || "").trim();
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color) ? color : "#2b2117";
  }

  function renderOffer(offer) {
    var hasBanner = Boolean(offer.bannerUrl);
    var media = hasBanner ? offer.bannerUrl : offer.logoUrl || "";
    var mediaClass = hasBanner ? " bp-offer-media--banner" : " bp-offer-media--logo";
    var mediaBg = safeColor(offer.logoBg);
    var tags = Array.isArray(offer.tags) ? offer.tags.slice(0, 3) : [];
    var notes = Array.isArray(offer.notes) ? offer.notes.slice(0, 3) : [];
    var code = offer.code && offer.code !== "—" ? offer.code : "";
    var logoScale = Math.max(0.5, Math.min(2, Number(offer.logoScale) || 1));
    var hoverScale = Math.min(2.1, Math.round(logoScale * 1.05 * 100) / 100);
    var details = [
      offer.freeSpins ? escapeHtml(offer.freeSpins) + " Free Spins" : "",
      offer.cashback ? escapeHtml(offer.cashback) + " Cashback" : "",
      offer.minDeposit ? "Min. " + escapeHtml(offer.minDeposit) : "",
    ].filter(Boolean);

    return (
      '<article class="bp-offer-card' +
      (offer.featured ? " bp-offer-card--featured" : "") +
      '">' +
      '<a class="bp-offer-link" href="' +
      escapeHtml(offer.url) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<div class="bp-offer-media' +
      mediaClass +
      '" style="background:' +
      mediaBg +
      '">' +
      (media
        ? '<img src="' +
          escapeHtml(media) +
          '" alt="' +
          escapeHtml(offer.name) +
          '" loading="lazy" decoding="async" style="--bp-media-scale:' +
          logoScale +
          ";--bp-media-hover-scale:" +
          hoverScale +
          '">'
        : '<div class="bp-offer-initial" style="background:' +
          mediaBg +
          '">' +
          escapeHtml(String(offer.name || "?").charAt(0)) +
          "</div>") +
      (offer.badge ? '<span class="bp-offer-badge">' + escapeHtml(offer.badge) + "</span>" : "") +
      "</div>" +
      '<div class="bp-offer-body">' +
      '<div class="bp-offer-topline"><span>' +
      escapeHtml(offer.name) +
      '</span><span class="bp-offer-rating">' +
      stars(offer.rating) +
      "</span></div>" +
      '<h3 class="bp-offer-title">' +
      escapeHtml(offer.headline) +
      '<strong>' +
      escapeHtml(offer.bonusValue) +
      "</strong></h3>" +
      (details.length ? '<p class="bp-offer-detail">' + details.join(" · ") + "</p>" : "") +
      (tags.length
        ? '<div class="bp-offer-tags">' +
          tags.map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
          }).join("") +
          "</div>"
        : "") +
      (code
        ? '<button type="button" class="bp-offer-code" data-code="' +
          escapeHtml(code) +
          '"><span>Codigo</span><strong>' +
          escapeHtml(code) +
          "</strong></button>"
        : "") +
      (notes.length
        ? '<ul class="bp-offer-notes">' +
          notes.map(function (note) {
            return "<li>" + escapeHtml(note) + "</li>";
          }).join("") +
          "</ul>"
        : "") +
      '<span class="bp-offer-cta">' +
      escapeHtml(offer.ctaLabel || "Apostar Agora") +
      "</span>" +
      '<p class="bp-offer-legal">18+ · T&amp;Cs aplicaveis · Joga com responsabilidade</p>' +
      "</div>" +
      "</a>" +
      "</article>"
    );
  }

  function render(data) {
    var siteData = data.site || {};
    var offers = Array.isArray(data.offers) ? data.offers : [];
    if (!offers.length) {
      mount.innerHTML = "";
      return;
    }

    var root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;
    root.innerHTML =
      "<style>" +
      ":host{display:block;color:#f6ead1;font-family:Inter,Arial,sans-serif}" +
      ".bp-widget{width:100%;box-sizing:border-box;padding:48px 16px;background:radial-gradient(circle at 50% 0%,rgba(214,164,65,.22),transparent 34%),linear-gradient(180deg,#120b06,#050302);}" +
      ".bp-inner{max-width:1180px;margin:0 auto}" +
      ".bp-heading{text-align:center;margin:0 0 28px}" +
      ".bp-heading h2{margin:0;color:#f0d78c;font:800 30px/1.05 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 0 18px rgba(255,180,71,.34)}" +
      ".bp-heading p{max-width:640px;margin:10px auto 0;color:rgba(246,234,209,.68);font-size:14px;line-height:1.6}" +
      ".bp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:16px}" +
      ".bp-offer-card{position:relative;overflow:hidden;border:1px solid rgba(212,168,67,.28);border-radius:12px;background:linear-gradient(180deg,rgba(32,21,12,.94),rgba(12,8,5,.98));box-shadow:0 12px 32px rgba(0,0,0,.42)}" +
      ".bp-offer-card--featured{border-color:rgba(240,215,140,.68);box-shadow:0 0 0 1px rgba(240,215,140,.18),0 18px 44px rgba(0,0,0,.52)}" +
      ".bp-offer-link{display:flex;flex-direction:column;min-height:100%;color:inherit;text-decoration:none}" +
      ".bp-offer-media{position:relative;aspect-ratio:16/9;background:#120d08;overflow:hidden}" +
      ".bp-offer-media img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(var(--bp-media-scale,1.01));transition:transform .25s ease}" +
      ".bp-offer-media--logo img{object-fit:contain;padding:16px;box-sizing:border-box}" +
      ".bp-offer-card:hover img{transform:scale(var(--bp-media-hover-scale,1.05))}" +
      ".bp-offer-initial{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:48px;font-weight:900}" +
      ".bp-offer-media:after{content:'';position:absolute;inset:auto 0 0;height:55%;background:linear-gradient(to top,rgba(0,0,0,.78),transparent);pointer-events:none}" +
      ".bp-offer-badge{position:absolute;top:10px;right:10px;z-index:1;border-radius:999px;background:#9e1f1f;color:#fff1d6;border:1px solid rgba(240,215,140,.4);font-size:11px;font-weight:900;padding:5px 9px;letter-spacing:.08em}" +
      ".bp-offer-body{display:flex;flex-direction:column;gap:11px;padding:16px;flex:1}" +
      ".bp-offer-topline{display:flex;align-items:center;justify-content:space-between;gap:10px;color:rgba(246,234,209,.68);font-size:12px;text-transform:uppercase;letter-spacing:.12em}" +
      ".bp-offer-rating{color:#d4a843;letter-spacing:.03em;white-space:nowrap}" +
      ".bp-offer-title{margin:0;color:#fff7df;font:800 22px/1.08 Georgia,serif;letter-spacing:.02em}" +
      ".bp-offer-title strong{display:block;color:#f0d78c;font-size:1.25em}" +
      ".bp-offer-detail{margin:0;color:#d9b85b;font-size:13px;font-weight:700}" +
      ".bp-offer-tags{display:flex;flex-wrap:wrap;gap:6px}" +
      ".bp-offer-tags span{font-size:11px;color:#f6ead1;border:1px solid rgba(212,168,67,.22);background:rgba(212,168,67,.08);border-radius:999px;padding:4px 8px}" +
      ".bp-offer-code{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px dashed rgba(240,215,140,.45);border-radius:9px;background:rgba(212,168,67,.08);color:#f0d78c;padding:9px 11px;cursor:pointer}" +
      ".bp-offer-code span{font-size:11px;text-transform:uppercase;color:rgba(246,234,209,.55)}" +
      ".bp-offer-code strong{font-size:14px;letter-spacing:.1em}" +
      ".bp-offer-notes{margin:0;padding-left:18px;color:rgba(246,234,209,.6);font-size:12px;line-height:1.45}" +
      ".bp-offer-cta{margin-top:auto;display:flex;align-items:center;justify-content:center;border-radius:9px;background:linear-gradient(180deg,#d4a843,#9d7020);color:#130b04;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:12px 14px}" +
      ".bp-offer-legal{margin:0;text-align:center;color:rgba(246,234,209,.45);font-size:11px}" +
      "@media(max-width:520px){.bp-widget{padding:34px 10px}.bp-heading h2{font-size:24px}.bp-grid{grid-template-columns:1fr}}" +
      "</style>" +
      '<section class="bp-widget"><div class="bp-inner"><header class="bp-heading"><h2>' +
      escapeHtml(siteData.title || "Ofertas") +
      "</h2>" +
      (siteData.description ? "<p>" + escapeHtml(siteData.description) + "</p>" : "") +
      '</header><div class="bp-grid">' +
      offers.map(renderOffer).join("") +
      "</div></div></section>";

    root.addEventListener("click", function (event) {
      var target = event.target;
      var button = target && target.closest ? target.closest("[data-code]") : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      var code = button.getAttribute("data-code") || "";
      if (!code || !navigator.clipboard) return;
      navigator.clipboard.writeText(code).then(function () {
        var previous = button.querySelector("span").textContent;
        button.querySelector("span").textContent = "Copiado";
        window.setTimeout(function () {
          button.querySelector("span").textContent = previous;
        }, 1400);
      });
    });
  }

  mount.innerHTML =
    '<div style="padding:32px;text-align:center;color:#d4a843;background:#090604">A carregar ofertas...</div>';

  fetch(apiOrigin + "/api/external-offers?site=" + encodeURIComponent(site), {
    cache: "no-store",
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed");
      return response.json();
    })
    .then(render)
    .catch(function () {
      mount.innerHTML =
        '<div style="padding:32px;text-align:center;color:#d4a843;background:#090604">Ofertas indisponiveis de momento.</div>';
    });
})();
