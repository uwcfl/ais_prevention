# AIS Smart Prevention Tool 2.0

An interactive web-based mapping and decision-support tool developed to help lake managers, stakeholders, and citizens understand and prioritize prevention of Aquatic Invasive Species (AIS) across Wisconsin's freshwater ecosystems.

Originally developed at the [UW–Madison Center for Limnology](https://limnology.wisc.edu/) in partnership with the [Wisconsin Department of Natural Resources](https://dnr.wisconsin.gov/), this application visualizes statistical predictions of lake and stream vulnerability and habitat suitability for six major aquatic invasive species.

---

## Table of Contents

- [About the Tool](#about-the-tool)
  - [The "Smart Prevention" Approach](#the-smart-prevention-approach)
  - [Project History & Version 2.0](#project-history--version-20)
  - [Disclaimer & Usage Guidelines](#disclaimer--usage-guidelines)
  - [Acknowledgments & Credits](#acknowledgments--credits)
- [Monitored Species](#monitored-species)
- [Repository Structure](#repository-structure)
- [Getting Started / Running Locally](#getting-started--running-locally)

---

## About the Tool

Wisconsin is home to approximately 15,000 lakes and 45,000 miles of streams that form the cornerstone of the state's multi-billion-dollar tourism industry and provide critical ecosystem services, recreational opportunities, and aesthetic value. However, nuisance exotic species—having already caused severe ecological and economic damage in the Great Lakes—continue to spread inland via recreational boating, angling, and interconnected waterways.

### The "Smart Prevention" Approach

Because aquatic invasive species typically cannot be eradicated once established, prevention of introduction and spread is the most cost-effective and ecologically sound management strategy. With 15,000 lakes statewide, management resources must be prioritized strategically.

The central concept of **Smart Prevention** is identifying waterbodies that are most **vulnerable** to invasion—specifically where invasive species are:
1. **Likely to be introduced** (propagule pressure / boater movement).
2. **Physiologically capable of surviving** (suitable water chemistry, temperature, depth, or habitat).
3. **Likely to cause negative ecological or economic impacts**.

Targeting prevention, public outreach, boat inspections, monitoring, and rapid-response resources to these high-vulnerability lakes maximizes the effectiveness of limited management resources.

### Project History & Version 2.0

- **Original Version:** Development of the original AIS Smart Prevention tool was led by Mona Papes with contributions from Jeff Maxted, and originally hosted by the UW–Madison Applied Population Laboratory.
- **Version 2.0:** Launched in March 2019, adding the original models plus two additional species (Spiny Water Flea and Eurasian Watermilfoil). Developed with R Shiny.
- **Current Architecture:** Client-side single-page application using HTML5, CSS, and JavaScript, with [Leaflet](https://leafletjs.com/) for mapping and GeoJSON rendering.

### Disclaimer & Usage Guidelines

> **Important:** The suitability maps presented in this tool are based on **statistical models** and have not all been ground-truthed or tested in the field. 
> 
> By using this tool, users agree to use this information **only in addition to other sources of invasive species data**, and **NOT as maps of the actual distribution or presence** of invasive species.

### Acknowledgments & Credits

**Funding and Institutional Support:**
- Wisconsin Department of Natural Resources (WDNR)
- National Science Foundation (North-Temperate Lakes Long-Term Ecological Research Site [NTL-LTER] & the Bioeconomics of AIS project)
- Baldwin Wisconsin Idea Endowment

**Development Team & Contributors:**
Michael Spear, Jake Vander Zanden, Hilary Dugan, Jake Walsh, Mona Papes, Jeff Maxted, Thomas Shannon, and Daniel Haryanto.

---

## Monitored Species

The application provides suitability predictions and ecological background for six invasive species:

1. **Zebra Mussel** (*Dreissena polymorpha*) – Classified into suitability tiers (suitable, borderline, unsuitable) based on dissolved calcium concentration thresholds (derived from empirical water chemistry and conductivity regressions).
2. **Rainbow Smelt** (*Osmerus mordax*) – Habitat suitability modeled based on depth, surface area, and thermal conditions drawn from native-range studies.
3. **Round Goby** (*Neogobius melanostomus*) – Riverine and stream suitability modeled based on stream size, gradient, and connectivity.
4. **Rusty Crayfish** (*Faxonius rusticus*) – Lake and stream habitat suitability models addressing dispersion and water quality parameters.
5. **Spiny Water Flea** (*Bythotrephes longimanus*) – Lake vulnerability predictions based on lake surface area, depth, and trophic state.
6. **Eurasian Water Milfoil** (*Myriophyllum spicatum*) – Lake suitability based on depth, water clarity, and alkalinity.

---

## Repository Structure

```text
ais_prevention/
├── index.html          # Main HTML document containing application markup, SPA views,
│                       # interactive map interface, and prose content for all species
├── app.js              # Client-side JavaScript: SPA hash router (#/map, #/about, #/species/*),
│                       # Leaflet map controller, GeoJSON layer loading, styling, and popups
├── style.css           # Application stylesheet (responsive layout, header, typography,
│                       # Leaflet control overrides, draggable floating panels)
├── data/               # GeoJSON datasets containing lake/stream geometries and model predictions
│   ├── eurasian_water_milfoil.json
│   ├── rainbow_smelt.json
│   ├── round_goby.json
│   ├── rusty_crayfish_lakes.json
│   ├── rusty_crayfish_streams.json
│   ├── spiny_water_flea.json
│   └── zebra_mussel.json
└── images/             # Scientific figures, publication diagrams, and institutional logos
    ├── About_Fig1.png          # Smart prevention framework diagram (vulnerability components)
    ├── RainbowSmelt_Fig1.png   # Rainbow smelt figures and distribution
    ├── RoundGoby_Fig1.png      # Round goby figures
    ├── RustyCrayfish_Fig1.png  # Rusty crayfish figures
    ├── RustyCrayfish_Fig2.png
    ├── SWF_Fig1.png            # Spiny water flea figures and data tables
    ├── SWF_Table1.png
    ├── SWF_Table2.png
    ├── cfl.png / cfl-circle.png # UW-Madison Center for Limnology logos
    ├── uw.png                  # University of Wisconsin crest
    └── wdnr.png / wdnr.jpg     # Wisconsin DNR logos
```

### Key Components

- **`index.html`**: Defines the site layout and all view sections (`#view-map`, `#view-about`, and `#view-<species-slug>`). Full background information and citation lists for each species model are maintained directly within each view's `<article class="prose">`.
- **`app.js`**: Handles client-side navigation using hash change events, dynamically initializes the Leaflet map upon first viewing, asynchronously fetches corresponding GeoJSON layers from `data/`, applies species-specific layer styles (polygons or lines), and formats feature attributes into interactive lake popups.
- **`data/*.json`**: Pre-computed GeoJSON feature collections containing waterbody polygons and stream segments with attributes indicating lake identifier (WBIC), name, county, and suitability/vulnerability score.
