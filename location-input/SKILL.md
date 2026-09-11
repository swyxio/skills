---
name: location-input
description: Build or improve city/country form inputs with accessible autocomplete, abbreviation matching, and optional browser-location suggestions. Use for applicant, profile, or registration location fields; street-address validation and exact geofencing require a different approach.
---

# Location input

Make a location field easy to complete while preserving the person's intended answer. Infer the required precision from the product: “Where are you based?” normally needs a city or country, and current device location may differ from home. Implement only the requested controls; this skill does not authorize deployment or changes to unrelated forms.

## Choose data and controls

- Prefer an editable combobox with manual selection. Keep custom text valid unless the product explicitly requires a canonical place. Do not silently expand an abbreviation or replace text on blur.
- Reuse the project's accessible combobox when suitable. Inspect its current documentation and types before introducing another dependency. React Aria supports `allowsCustomValue`; its async collections can need `allowsEmptyCollection` and an empty/loading renderer so typing before data arrives still opens suggestions.
- For broad city coverage without per-query costs, consider a lazy-loaded local index from GeoNames cities15000 plus countryInfo and administrative-region names. Measure payload size and search responsiveness; avoid bundling the full dataset into initial application JavaScript. A remote service is appropriate when coverage, localization, or geographic precision justifies it.
- Keep the dataset reproducible and attributed under its actual license. A population-filtered list omits small towns and is not a complete geography database. Retain free text for missing locations.
- Build a small explicit alias layer against stable place IDs: SF → San Francisco, NYC → New York City, Bangalore → Bengaluru, UK → United Kingdom. Do not infer arbitrary acronyms or silently map a metro area to its central city. Add alternate names/local scripts when required by the audience.

## Search and selection

Show city, relevant region, and country together to distinguish repeated names. Support country-only answers when the field permits them. Normalize case, accents, and separators for matching while preserving display names. Rank exact names and curated aliases above prefixes, then broader word matches; population can break ties rather than override a stronger match.

Start with about five suggestions, adapted to available mobile space. Preserve Arrow Up/Down, Enter selection, Escape dismissal, Tab navigation, visible focus, and screen-reader labels. Ensure selecting a result does not also advance or submit the form. Allow a no-match answer to remain unchanged.

Represent loading, no matches, and fetch failure separately. A failed dataset fetch must not leave a perpetual “Loading…” message or block ordinary typing. If filtering is already performed externally, check that the component does not filter aliases out again using its own label-only matching.

Store the chosen display label or custom text through the existing form state, draft, validation, and submission path. Add canonical IDs or country codes only when needed by the product; preserve the distinction between selected and unverified free text. Do not expand the schema solely to anticipate future analytics.

## Optional “Use current location”

Request geolocation only after the person activates the button. Use a one-shot browser request with visible pending/error feedback; HTTPS, browser support, and user permission are prerequisites. Prefer ordinary accuracy for city-level input. A request timeout may exclude time spent waiting for permission, so don't promise a fixed total duration.

Coordinates are not a city name. Choose one of these deliberately:

- **Nearby-city suggestion:** calculate locally against city coordinates and explicitly ask the user to confirm it. Nearest-city matching does not establish municipal boundaries or the correct side of a border. Bound accepted distance and reported device uncertainty for the product; the example application used 50 km and 25 km respectively, not universal defaults.
- **Reverse geocoding:** use an appropriate provider when accurate administrative labels are required. Verify current terms, coverage, and costs. Disclose coordinate transmission where applicable; do not claim location stays local when calling an external geocoder.

Keep the result editable and avoid overwriting typed text while a request is pending. Invalidate stale results when the input changes, a newer request starts, or the field unmounts. Recover from denial, timeout, unsupported browsers, poor accuracy, and missing city data with a usable manual entry. Retain only the location information the form needs; city-level forms ordinarily do not need precise coordinates saved or logged.

## Verify the interaction

Test representative aliases, accented names, repeated city names with region/country qualifiers, country-only matches, and a town absent from the dataset. Test typing before the data finishes loading, keyboard and pointer selection, Escape, blur, and persistence through the existing form path.

Use a simulated geolocation for success and an explicit denied-permission result for failure. Merely clearing a browser test context's permissions can leave a prompt pending rather than simulate denial. Verify that a detected suggestion requires confirmation and that late results cannot overwrite edits. Block the dataset request once and confirm that free text still works.

Inspect desktop and mobile dropdowns for width, wrapping, contrast, overflow, and touch targets. Scope test locators to this field or its listbox: unrelated native selects also expose combobox and option roles. Do not submit real applications as part of a UI-only check.

## Primary references

Consult current documentation when selecting an implementation or diagnosing library behavior:

- [W3C editable combobox patterns](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [React Aria ComboBox](https://react-aria.adobe.com/ComboBox)
- [GeoNames downloads and attribution](https://www.geonames.org/export/)
- [Browser Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Baymard autocomplete research](https://baymard.com/blog/autocomplete-design) — adapt its ecommerce findings to form entry rather than importing every search behavior.
