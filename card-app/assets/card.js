/*
 * Way2tech.au — Cartes de visite numériques
 * Module partagé (éditeur + page publique).
 * Aucune dépendance serveur : tout est calculé dans le navigateur.
 */
(function (global) {
  "use strict";

  /* ----------------------------------------------------------------------
   * Encodage / décodage des données de la carte dans l'URL.
   * On stocke un JSON compact en base64url, dans le fragment (#) de l'URL,
   * pour ne dépendre d'aucune base de données.
   * -------------------------------------------------------------------- */

  function encode(data) {
    var json = JSON.stringify(data);
    // btoa ne gère pas l'UTF-8 directement : on passe par encodeURIComponent.
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(str) {
    if (!str) return null;
    try {
      var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  /* ----------------------------------------------------------------------
   * Cartes signées — badge « Membre vérifié ».
   * Le fragment d'URL peut contenir : <données> ou <données>.<signature>.
   * La signature (ECDSA P-256) est produite par la console admin avec la clé
   * privée Way2tech ; ici on ne fait que la VÉRIFIER avec la clé publique
   * intégrée dans assets/trust.js. Sans clé privée, impossible de forger un
   * badge valide.
   * -------------------------------------------------------------------- */

  var SIG_SEP = ".";

  function parseLink(hash) {
    if (!hash) return { d: "", s: "" };
    var raw = hash.charAt(0) === "#" ? hash.slice(1) : hash;
    var i = raw.indexOf(SIG_SEP);
    if (i === -1) return { d: raw, s: "" };
    return { d: raw.slice(0, i), s: raw.slice(i + 1) };
  }

  function buildFragment(dataB64, sigB64) {
    return sigB64 ? dataB64 + SIG_SEP + sigB64 : dataB64;
  }

  function b64urlToBytes(s) {
    s = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToB64url(bytes) {
    var bin = "";
    var arr = new Uint8Array(bytes);
    for (var i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function getTrust() {
    return global.W2T_TRUST || { pubKey: "", org: "Way2tech.au" };
  }

  function trustConfigured() {
    return !!(getTrust().pubKey);
  }

  var _pubKeyPromise = null;
  function importPubKey() {
    var trust = getTrust();
    if (!trust.pubKey || !global.crypto || !global.crypto.subtle) {
      return Promise.resolve(null);
    }
    if (!_pubKeyPromise) {
      _pubKeyPromise = global.crypto.subtle
        .importKey("spki", b64urlToBytes(trust.pubKey),
          { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
        .catch(function () { return null; });
    }
    return _pubKeyPromise;
  }

  // Renvoie une promesse booléenne : la carte est-elle authentiquement signée ?
  function verify(dataB64, sigB64) {
    if (!sigB64 || !global.crypto || !global.crypto.subtle) return Promise.resolve(false);
    return importPubKey().then(function (key) {
      if (!key) return false;
      return global.crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" }, key,
        b64urlToBytes(sigB64), new TextEncoder().encode(dataB64)
      ).catch(function () { return false; });
    });
  }

  /* ----------------------------------------------------------------------
   * Génération du fichier vCard (.vcf) — standard des carnets d'adresses.
   * Format vCard 3.0 : compatible iOS, Android, Outlook, Google Contacts.
   * -------------------------------------------------------------------- */

  function esc(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function toVCard(d) {
    d = d || {};
    var lines = ["BEGIN:VCARD", "VERSION:3.0"];

    var first = d.firstName || "";
    var last = d.lastName || "";
    lines.push("N:" + esc(last) + ";" + esc(first) + ";;;");
    lines.push("FN:" + esc(((first + " " + last).trim()) || d.org || "Contact"));

    if (d.org) lines.push("ORG:" + esc(d.org));
    if (d.title) lines.push("TITLE:" + esc(d.title));
    if (d.mobile) lines.push("TEL;TYPE=CELL:" + esc(d.mobile));
    if (d.phone) lines.push("TEL;TYPE=WORK,VOICE:" + esc(d.phone));
    if (d.email) lines.push("EMAIL;TYPE=INTERNET,WORK:" + esc(d.email));
    if (d.website) lines.push("URL:" + esc(normalizeUrl(d.website)));
    if (d.linkedin) lines.push("URL;TYPE=LinkedIn:" + esc(normalizeUrl(d.linkedin)));
    if (d.address) {
      // ADR : ;;rue;ville;région;code;pays — on met le tout dans "rue".
      lines.push("ADR;TYPE=WORK:;;" + esc(d.address) + ";;;;");
    }
    if (d.note) lines.push("NOTE:" + esc(d.note));

    lines.push("REV:" + new Date().toISOString());
    lines.push("END:VCARD");
    return lines.join("\r\n");
  }

  function vcardFilename(d) {
    var base = ((d.firstName || "") + "_" + (d.lastName || "")).trim();
    base = base.replace(/^_|_$/g, "");
    base = base.replace(/[^a-zA-Z0-9_-]/g, "") || "contact";
    return base + ".vcf";
  }

  /* ----------------------------------------------------------------------
   * Utilitaires d'affichage
   * -------------------------------------------------------------------- */

  function normalizeUrl(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) return "https://" + url;
    return url;
  }

  function initials(d) {
    var f = (d.firstName || "").trim();
    var l = (d.lastName || "").trim();
    var res = (f[0] || "") + (l[0] || "");
    if (!res) res = (d.org || "?").trim()[0] || "?";
    return res.toUpperCase();
  }

  // Couleur déterministe à partir du nom (pour l'avatar par initiales).
  function avatarColor(d) {
    var str = (d.firstName || "") + (d.lastName || "") + (d.org || "");
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var palette = ["#16A34A", "#0EA5E9", "#7C3AED", "#DB2777", "#EA580C", "#0891B2", "#4F46E5"];
    return palette[Math.abs(hash) % palette.length];
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ----------------------------------------------------------------------
   * Rendu visuel de la carte (utilisé en aperçu et sur la page publique).
   * -------------------------------------------------------------------- */

  function render(el, d, opts) {
    d = d || {};
    opts = opts || {};
    var fullName = ((d.firstName || "") + " " + (d.lastName || "")).trim() || "Votre nom";
    var color = avatarColor(d);
    var badge = opts.verified
      ? '<div class="w2t-badge">✓ Membre vérifié ' + escapeHtml(getTrust().org || "Way2tech.au") + "</div>"
      : "";

    function row(icon, label, value, href) {
      if (!value) return "";
      var content = href
        ? '<a href="' + escapeHtml(href) + '"' +
          (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "") +
          ">" + escapeHtml(value) + "</a>"
        : escapeHtml(value);
      return (
        '<li class="w2t-row"><span class="w2t-ic">' + icon + "</span>" +
        '<span class="w2t-rowtext"><span class="w2t-label">' + escapeHtml(label) +
        '</span><span class="w2t-value">' + content + "</span></span></li>"
      );
    }

    var html =
      '<div class="w2t-card">' +
      '<div class="w2t-banner"></div>' +
      '<div class="w2t-avatar" style="background:' + color + '">' + escapeHtml(initials(d)) + "</div>" +
      '<div class="w2t-head">' +
      '<h1 class="w2t-name">' + escapeHtml(fullName) + "</h1>" +
      (d.title ? '<p class="w2t-title">' + escapeHtml(d.title) + "</p>" : "") +
      (d.org ? '<p class="w2t-org">' + escapeHtml(d.org) + "</p>" : "") +
      badge +
      "</div>" +
      '<ul class="w2t-list">' +
      row("📱", "Mobile", d.mobile, d.mobile ? "tel:" + d.mobile : "") +
      row("☎️", "Téléphone", d.phone, d.phone ? "tel:" + d.phone : "") +
      row("✉️", "Email", d.email, d.email ? "mailto:" + d.email : "") +
      row("🌐", "Site web", stripScheme(d.website), d.website ? normalizeUrl(d.website) : "") +
      row("in", "LinkedIn", stripScheme(d.linkedin), d.linkedin ? normalizeUrl(d.linkedin) : "") +
      row("📍", "Adresse", d.address, "") +
      row("📝", "Note", d.note, "") +
      "</ul>" +
      "</div>";
    el.innerHTML = html;
  }

  function stripScheme(url) {
    return String(url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }

  /* ----------------------------------------------------------------------
   * Génération du QR code.
   * 1) Si la librairie "qrcode-generator" est chargée -> rendu canvas net.
   * 2) Sinon repli automatique sur une API image (api.qrserver.com).
   * Retourne une fonction toPNG() pour le téléchargement.
   * -------------------------------------------------------------------- */

  function makeQR(container, text, opts) {
    opts = opts || {};
    var size = opts.size || 260;
    container.innerHTML = "";

    if (global.qrcode) {
      try {
        var qr = global.qrcode(0, "M"); // version auto, correction "M"
        qr.addData(text);
        qr.make();
        var count = qr.getModuleCount();
        var margin = 4;
        var cell = Math.max(2, Math.floor(size / (count + margin * 2)));
        var dim = (count + margin * 2) * cell;

        var canvas = document.createElement("canvas");
        canvas.width = dim;
        canvas.height = dim;
        canvas.style.width = "100%";
        canvas.style.maxWidth = size + "px";
        canvas.style.height = "auto";
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, dim, dim);
        ctx.fillStyle = "#0b1f17";
        for (var r = 0; r < count; r++) {
          for (var c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
              ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
            }
          }
        }
        container.appendChild(canvas);
        return { toPNG: function () { return canvas.toDataURL("image/png"); } };
      } catch (e) {
        /* tombe dans le repli ci-dessous */
      }
    }

    // Repli : image générée par un service gratuit (le prospect a Internet).
    var img = document.createElement("img");
    var apiUrl =
      "https://api.qrserver.com/v1/create-qr-code/?size=" +
      size + "x" + size + "&margin=10&data=" + encodeURIComponent(text);
    img.src = apiUrl;
    img.alt = "QR code";
    img.width = size;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    container.appendChild(img);
    return { toPNG: function () { return apiUrl; } };
  }

  global.W2T = {
    encode: encode,
    decode: decode,
    toVCard: toVCard,
    vcardFilename: vcardFilename,
    normalizeUrl: normalizeUrl,
    render: render,
    makeQR: makeQR,
    // Cartes signées / badge vérifié
    parseLink: parseLink,
    buildFragment: buildFragment,
    verify: verify,
    trustConfigured: trustConfigured,
    getTrust: getTrust,
    b64urlToBytes: b64urlToBytes,
    bytesToB64url: bytesToB64url
  };
})(window);
