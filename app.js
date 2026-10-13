/* AIS Smart Prevention Tool 2.0 — plain JS (Leaflet) replacement for the Shiny app */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Configuration
     ------------------------------------------------------------------ */
  var DATA_DIR = "data/";
  var FILL_OPACITY = 0.35;      // same as `opacity <- 0.35` in server.R
  var LINE_WEIGHT = 1;
  var DRAW_POLYGON_OUTLINES = false;   // server.R passes stroke = NULL; see README

  var COLORS = { suitable: "red", borderline: "gold", unsuitable: "blue", nodata: "#D5DADC" };

  // `layers` are drawn in order. type: "polygon" (filled lakes) or "line" (outlines/streams)
  var SPECIES = [
    {
      name: "Zebra Mussel", slug: "zebra-mussel",
      layers: [{ file: "zebra_mussel.json", type: "polygon" }]
    },
    {
      name: "Rainbow Smelt", slug: "rainbow-smelt",
      layers: [{ file: "rainbow_smelt.json", type: "polygon" }]
    },
    {
      name: "Round Goby", slug: "round-goby",
      layers: [{ file: "round_goby.json", type: "line" }]
    },
    {
      name: "Rusty Crayfish", slug: "rusty-crayfish",
      layers: [{ file: "rusty_crayfish_lakes.json", type: "polygon" },
      { file: "rusty_crayfish_streams.json", type: "line" }]
    },
    {
      name: "Spiny Water Flea", slug: "spiny-water-flea",
      layers: [{ file: "spiny_water_flea.json", type: "polygon" }]
    },
    {
      name: "Eurasian Water Milfoil", slug: "eurasian-water-milfoil",
      layers: [{ file: "eurasian_water_milfoil.json", type: "polygon" }]
    }
  ];

  /* ------------------------------------------------------------------
     Routing  (#/map, #/map/<species>, #/about, #/species/<slug>)
     ------------------------------------------------------------------ */
  var views = document.querySelectorAll(".view");
  var menuToggle = document.getElementById("species-menu-toggle");
  var menuList = document.getElementById("species-menu-list");
  var mapStarted = false;

  function setMenu(open) {
    menuList.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
  }
  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    setMenu(menuList.hidden);
  });
  document.addEventListener("click", function (e) {
    if (!menuList.hidden && !menuList.contains(e.target)) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menuList.hidden) { setMenu(false); menuToggle.focus(); }
  });

  function route() {
    var parts = (location.hash.replace(/^#\/?/, "") || "map").split("/");
    var viewId, title;

    if (parts[0] === "about") {
      viewId = "view-about";
    } else if (parts[0] === "species" && document.getElementById("view-" + parts[1])) {
      viewId = "view-" + parts[1];
    } else {
      viewId = "view-map";
    }

    views.forEach(function (v) { v.hidden = v.id !== viewId; });
    var active = document.getElementById(viewId);
    title = active.getAttribute("data-title");
    document.title = title + " \u2013 AIS Smart Prevention Tool 2.0";

    document.querySelectorAll(".site-nav a").forEach(function (a) {
      var on = a.getAttribute("href") === "#/" + (viewId === "view-map" ? "map" :
        viewId === "view-about" ? "about" : "species/" + viewId.slice(5));
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    menuToggle.classList.toggle("is-current", viewId !== "view-map" && viewId !== "view-about");
    setMenu(false);

    if (viewId === "view-map") {
      startMap();
      map.invalidateSize();
      var wanted = SPECIES.filter(function (s) { return s.slug === parts[1]; })[0];
      selectSpecies(wanted ? wanted.slug : (parts[1] ? "" : currentSlug()));
    } else {
      active.scrollTop = 0;
    }
  }

  /* ------------------------------------------------------------------
     Map
     ------------------------------------------------------------------ */
  var map, canvas, legend, layerGroup, requestId = 0;
  var cache = {};                      // slug -> { group, categories }
  var select = document.getElementById("species-select");
  var statusEl = document.getElementById("map-status");
  var statusText = document.getElementById("map-status-text");

  function startMap() {
    if (mapStarted) return;
    mapStarted = true;

    canvas = L.canvas({ padding: 0.5 });
    map = L.map("map", { preferCanvas: true, renderer: canvas }).setView([44.6, -88.92], 7);

    const CARTO_KEY = 'cb1_3wqa_1_6f3001c57c17b099e5eb7da1';

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=" + CARTO_KEY, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd", maxZoom: 19
    }).addTo(map);

    layerGroup = L.layerGroup().addTo(map);

    legend = L.control({ position: "topright" });
    legend.onAdd = function () {
      this._div = L.DomUtil.create("div", "legend");
      this._div.hidden = true;
      return this._div;
    };
    legend.addTo(map);

    makeDraggable(document.getElementById("map-panel"));
  }

  function currentSlug() { return select.value; }

  function colorFor(feature) {
    var s = feature.properties && feature.properties.sutblty;
    if (s === "suitable") return COLORS.suitable;
    if (s === "borderline suitable") return COLORS.borderline;
    return COLORS.unsuitable;          // same fallback as getZMColor() in server.R
  }

  function styleFor(type) {
    return function (feature) {
      var c = colorFor(feature);
      if (type === "line") {
        return { color: c, weight: LINE_WEIGHT, opacity: FILL_OPACITY, fill: false };
      }
      return {
        fill: true, fillColor: c, fillOpacity: FILL_OPACITY,
        stroke: DRAW_POLYGON_OUTLINES, color: c, weight: 1, opacity: FILL_OPACITY
      };
    };
  }

  function showStatus(text, isError) {
    statusText.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.hidden = false;
  }
  function hideStatus() { statusEl.hidden = true; }

  function renderLegend(categories) {
    var rows = [["suitable", COLORS.suitable]];
    if (categories.borderline) rows.push(["borderline suitable", COLORS.borderline]);
    rows.push(["unsuitable", COLORS.unsuitable], ["no data", COLORS.nodata]);
    legend._div.innerHTML = rows.map(function (r) {
      return '<div class="row"><i style="background:' + r[1] + '"></i><span>' + r[0] + "</span></div>";
    }).join("");
    legend._div.hidden = false;
  }

  function clearMap() {
    layerGroup.clearLayers();
    layerGroup._slug = null;
    if (legend._div) legend._div.hidden = true;
  }

  function loadSpecies(sp) {
    if (cache[sp.slug]) return Promise.resolve(cache[sp.slug]);

    return Promise.all(sp.layers.map(function (l) {
      return fetch(DATA_DIR + l.file).then(function (res) {
        if (!res.ok) throw new Error(l.file + " (HTTP " + res.status + ")");
        return res.json();
      }).then(function (gj) { return { spec: l, geojson: gj }; });
    })).then(function (results) {
      var group = L.layerGroup();
      var categories = { borderline: false };
      results.forEach(function (r) {
        r.geojson.features.forEach(function (f) {
          if (f.properties && f.properties.sutblty === "borderline suitable") categories.borderline = true;
        });
        group.addLayer(L.geoJSON(r.geojson, {
          renderer: canvas, interactive: false, style: styleFor(r.spec.type)
        }));
      });
      cache[sp.slug] = { group: group, categories: categories };
      return cache[sp.slug];
    });
  }

  function selectSpecies(slug) {
    if (select.value !== slug) select.value = slug;
    var sp = SPECIES.filter(function (s) { return s.slug === slug; })[0];
    var id = ++requestId;

    // keep the URL shareable without re-triggering the router
    var hash = "#/map" + (sp ? "/" + sp.slug : "");
    if (location.hash !== hash) history.replaceState(null, "", hash);

    if (!sp) { clearMap(); hideStatus(); return; }
    if (layerGroup.getLayers().length && layerGroup._slug === sp.slug) return;

    clearMap();
    showStatus("Loading " + sp.name + " map\u2026 large files can take a minute.");
    loadSpecies(sp).then(function (entry) {
      if (id !== requestId) return;            // user picked something else meanwhile
      clearMap();
      layerGroup._slug = sp.slug;
      entry.group.eachLayer(function (l) { layerGroup.addLayer(l); });
      renderLegend(entry.categories);
      hideStatus();
    }).catch(function (err) {
      if (id !== requestId) return;
      layerGroup._slug = null;
      showStatus("Couldn\u2019t load the " + sp.name + " data: " + err.message +
        ". Check that the file exists in the data/ folder.", true);
    });
  }

  select.addEventListener("change", function () { selectSpecies(select.value); });

  /* ------------------------------------------------------------------
     Draggable species panel (the Shiny absolutePanel was draggable)
     ------------------------------------------------------------------ */
  function makeDraggable(panel) {
    var grip = panel.querySelector(".grip");
    var startX, startY, startLeft, startTop;

    grip.addEventListener("pointerdown", function (e) {
      startX = e.clientX; startY = e.clientY;
      startLeft = panel.offsetLeft; startTop = panel.offsetTop;
      grip.setPointerCapture(e.pointerId);
      grip.addEventListener("pointermove", move);
    });
    function move(e) {
      var wrap = panel.parentElement;
      var left = Math.min(Math.max(0, startLeft + e.clientX - startX), wrap.clientWidth - panel.offsetWidth);
      var top = Math.min(Math.max(0, startTop + e.clientY - startY), wrap.clientHeight - panel.offsetHeight);
      panel.style.left = left + "px";
      panel.style.top = top + "px";
    }
    function end(e) {
      grip.removeEventListener("pointermove", move);
      if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
    }
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  }

  /* ------------------------------------------------------------------ */
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", function () { if (map) map.invalidateSize(); });
  route();
})();
