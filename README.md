# Wobbly Guide — English

Unofficial Wobbly Life companion. Existing public site: https://wobbly-guide.pages.dev/ . This local revision has not been deployed there.

## Start

Double-click `START.cmd` (Node.js 20+ required). It opens http://127.0.0.1:4173 in your browser. Alternatively: `npm run build`, then `npm run preview`. Do not open index.html directly using file://.

## Usable now

- German/English, browser-language detection and saved preference.
- Dashboard, 29 catalog entries with detailed bilingual walkthrough sections, search, combined filters and progress.
- Persistent unlock checkmarks, guide steps, manual in-game positions and active targets.
- Original in-game map screenshots with pan, zoom, position placement, approximate distance, direction and a destination list. Space currently uses a **partial screenshot**, not a complete map.
- Detailed UFO guide, original game images and source credits in `ASSETS.md`.
- Guest mode, JSON export/import, settings and offline caching after the production build is fully loaded.
- Responsive browser layout; no real-world location requests.

## Remaining work

This is a usable interim release, not the completed full catalog. More game content, a current complete map, precise landmark verification remain. Some coordinates are approximate. Progress percentages cover the included catalog only. Previous schematic-map positions are archived locally under `wobbly-guide-v2-before-original-maps`; set your position again on the original map.

Firebase Google login/Firestore integration is prepared but **not configured or tested against a real project**. Copy `.env.example` to `.env.local`, enter all four public web configuration values, enable Google authentication, authorize the site domain, publish `firestore.rules`, then rebuild. Never include service-account keys. Sync uses per-field timestamps; position sync is opt-in. Browser and future desktop share the data model.

Tauri source is prepared in `src-tauri/`. No EXE exists yet. Before building, install Rust, MSVC build tools, WebView2 and Tauri CLI; supply an ICO icon at `src-tauri/icons/icon.ico`. Desktop Google sign-in still needs a system-browser OAuth adapter. Export/import works independently.

## Development and hosting

Vanilla HTML/CSS/JavaScript modules, localStorage, JSON data and a service worker; no runtime framework. `npm test` runs core tests. `npm run build` produces `dist/`. Cloudflare Pages: build command `npm run build`, output directory `dist`, Node 20+. Hash-based routing needs no SPA fallback. Only upload `dist`, never the project root, `.env` or `prompt`.

Game images must be original Wobbly Life material; no invented maps. See `AGENTS.md` and `ASSETS.md`. Wobbly Guide is an unofficial fan project and is not affiliated with RubberBandGames. Original game imagery © RubberBandGames.

---

# Wobbly Guide — Deutsch

Inoffizieller Begleiter für Wobbly Life. Bestehende öffentliche Seite: https://wobbly-guide.pages.dev/ . Dieser lokale Stand wurde dort noch nicht veröffentlicht.

## Start

`START.cmd` doppelt anklicken (Node.js 20+ erforderlich). Die App öffnet sich unter http://127.0.0.1:4173 im Browser. Alternativ: `npm run build`, danach `npm run preview`. index.html nicht direkt über file:// öffnen.

## Jetzt nutzbar

- Deutsch/Englisch, automatische Browser-Spracherkennung und gespeicherte Auswahl.
- Dashboard, 29 Katalogeinträge mit ausführlichen zweisprachigen Anleitungen, Suche, kombinierte Filter und Fortschritt.
- Gespeicherte Unlock-Häkchen, Guide-Schritte, manuelle Ingame-Positionen und aktive Ziele.
- Original-Spielkarten als Screenshots mit Verschieben, Zoom, Positionsmarkierung, ungefährer Entfernung, Richtung und Zielliste. Space verwendet derzeit einen **Kartenausschnitt**, keine vollständige Karte.
- Ausführlicher UFO-Guide, Original-Spielbilder und Quellen in `ASSETS.md`.
- Gastmodus, JSON-Export/Import, Einstellungen und Offline-Cache nach vollständigem Laden des Produktionsbuilds.
- Responsive Browseroberfläche; keine Abfrage des echten Standorts.

## Noch offen

Dies ist ein nutzbarer Zwischenstand, kein vollständiger Gesamtkatalog. Weitere Spielinhalte, eine aktuelle vollständige Karte, genaue Ortsprüfung fehlen noch. Manche Koordinaten sind ungefähr. Prozentwerte beziehen sich nur auf den enthaltenen Katalog. Frühere Positionen auf den gezeichneten Karten werden lokal unter `wobbly-guide-v2-before-original-maps` gesichert; Position auf der Originalkarte neu setzen.

Firebase-Google-Login/Firestore ist vorbereitet, aber **noch nicht konfiguriert oder an einem echten Projekt getestet**. `.env.example` nach `.env.local` kopieren, alle vier öffentlichen Web-Konfigurationswerte eintragen, Google-Anmeldung aktivieren, Domain freigeben, `firestore.rules` veröffentlichen und neu bauen. Keine Service-Account-Schlüssel hinterlegen. Sync nutzt Zeitstempel pro Feld; Positionssync ist optional. Browser und spätere Desktop-App teilen das Datenmodell.

Tauri-Quellcode liegt in `src-tauri/`. Es gibt noch keine EXE. Vor dem Build Rust, MSVC-Buildtools, WebView2 und Tauri-CLI installieren; ein ICO unter `src-tauri/icons/icon.ico` bereitstellen. Google-Anmeldung unter Windows benötigt noch einen OAuth-Adapter für den Systembrowser. Export/Import funktioniert unabhängig davon.

## Entwicklung und Hosting

Vanilla-HTML/CSS/JavaScript-Module, localStorage, JSON-Daten und Service Worker; kein Laufzeit-Framework. `npm test` führt Kerntests aus. `npm run build` erstellt `dist/`. Cloudflare Pages: Buildbefehl `npm run build`, Ausgabeverzeichnis `dist`, Node 20+. Hash-Routing benötigt keinen SPA-Fallback. Nur `dist` hochladen, niemals Projektwurzel, `.env` oder `prompt`.

Spielbilder müssen Originalmaterial aus Wobbly Life sein; keine erfundenen Karten. Siehe `AGENTS.md` und `ASSETS.md`. Wobbly Guide ist ein inoffizielles Fan-Projekt und nicht mit RubberBandGames verbunden. Original-Spielgrafiken © RubberBandGames.


## October 17 guide and map revision / Guide- und Kartenstand

All 29 current guides now have preparation, detailed procedure and completion checks in DE/EN. This is not every guide or item in the game; some individual artifact routes remain incomplete. Space presents are a single 50-location checklist; the island collection currently documents 9 of 120 locations. Old per-present progress is retained and migrated into the collection. Legacy links still resolve.

Alle 29 vorhandenen Guides enthalten Vorbereitung, Ablauf und Abschlusskontrolle auf DE/EN. Das ist noch nicht jeder Guide des gesamten Spiels; einzelne Artefaktrouten fehlen. Space-Geschenke bilden eine gemeinsame 50er-Checkliste, die Inselliste enthält bisher 9 von 120 Orten. Alte Häkchen und Links werden übernommen.

Zoom now permits 12× magnification, rendered at actual layout size without scaling a low-resolution GPU surface. Detail beyond the source resolution cannot be recovered; the map indicates that threshold. The requested Wiki map could not be downloaded because the site returns a Cloudflare challenge (403); a direct map link is available and the existing local screenshots are unchanged. Space remains a partial map.

Zoom erlaubt jetzt 12-fache Vergrößerung. Zusätzliche Details jenseits der Originalauflösung können nicht erzeugt werden; die Anzeige kennzeichnet diese Grenze. Die gewünschte Wiki-Karte blockiert den Download mit Cloudflare/403. Ein direkter Kartenlink ist eingebaut; die lokalen Screenshots bleiben unverändert. Space bleibt ein Kartenausschnitt.

Validation: 15 responsive viewport sizes including phone/tablet landscape were checked for the reference design. The latest guide/collection revision is additionally checked for 50 checklist entries, state migration, 12× zoom, DE/EN and reload persistence.
