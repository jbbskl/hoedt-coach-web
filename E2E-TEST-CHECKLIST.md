# Manuele E2E-test-checklist — Hoedt Coaching

_Doel: het hele platform met de hand nalopen zodat er op de meeting niks onverwachts gebeurt._
_Draai lokaal (`localhost:3000`) of via de app (LAN-URL). Vink af per stap. Bij ❌ → noteer wat er misging._

**Testaccounts:** coach `info@danielhoedt.nl` / `hoedt2026`. Maak per testronde een verse klant aan (zie stap 1) zodat je de onboarding echt vanaf nul doorloopt.

---

## 0. Setup
- [ ] Server draait, `localhost:3000/coach/login` en `/login` geven allebei een pagina.
- [ ] Coach kan inloggen op `/coach/login`.

## 1. Klant aanmaken + onboarding (de belangrijkste flow)
- [ ] Coach maakt een nieuwe klant aan via **betaallink** (niet "direct"). Klant krijgt na (test)betaling een inlogmail met wachtwoord.
- [ ] Klant logt in op `/login` → belandt op de **onboarding**, niet meteen op het dashboard.
- [ ] **Gate werkt:** zolang intake + contract niet af zijn, kom je niet op het dashboard (probeer `/dashboard` → je wordt teruggestuurd naar onboarding).
- [ ] Welkomstvideo-stap: markeert zich als gezien.
- [ ] **Intake** invullen: alle verplichte velden. Na opslaan is de stap groen.
- [ ] **Contract** tekenen (telefoon + akkoord + handtekening). Na tekenen → onboarding klaar → **dashboard opent**.
- [ ] **Eerste dagelijkse check-in** (nieuw): de onboarding-stap "eerste check-in" linkt naar het **dashboard** (niet meer een aparte check-in-pagina). Doe een dagelijkse check-in in de app → de onboarding-stap "eerste check-in" wordt vanzelf groen.
- [ ] Oude e-mail-check-in-link (`/checkin/<iets>`) → stuurt door naar het dashboard (geen losse pagina meer).

## 2. Dagelijkse check-in (klant → coach)
- [ ] Klant vult dagelijkse check-in in (energie, gewicht, evt. slaap, hulp nodig).
- [ ] Klant vult 'm nogmaals in op dezelfde dag → **overschrijft** (geen dubbele), nieuwe waarde blijft staan.
- [ ] Bij "snel antwoord nodig" → coach krijgt een taak/mail-seintje.
- [ ] **Coach ziet 't:** op de klant-detailpagina staat de check-in met de juiste waarden.

## 3. Wekelijkse check-in (klant → coach) — LET OP: nieuwe week-telling
- [ ] Klant vult de wekelijkse check-in in (trots-moment, moeilijkste moment, training-gevoel, honger, stress, mentaal, evt. vraag). Maten (taille/buik/heup/arm) + foto's waar gevraagd.
- [ ] **Week telt vanaf de startdatum van de klant**, niet vanaf maandag. (Een klant die op een woensdag start, heeft z'n check-in-week woensdag→dinsdag.)
- [ ] Na invullen: de klant ziet "deze week gedaan".
- [ ] **Uitstellen** ("een keer overslaan") werkt.
- [ ] **Achteraf aanpassen** werkt (na de D8-editable-fix): klant kan een al ingevulde week nog bijwerken. _(nog te bouwen — 20c)_
- [ ] **Coach ziet 't** op de klant-detailpagina (check-in-tegel: "Ingevuld op …") én in de wekelijkse-check-in-tab. De weeknummers in de 12-weken-historie kloppen met de startdatum.
- [ ] Klant die z'n week **niet** invult → coach ziet 'm als aandachtssignaal (zie stap 12).

## 4. Voeding (klant)
- [ ] Klant heeft een gekoppeld voedingsschema (coach koppelt via de builder). Dag-schema toont de maaltijden.
- [ ] Maaltijd **afvinken** werkt (aan/uit). Blijft staan na herladen.
- [ ] "Buiten schema gegeten" logt een coach-notitie (geen automatische kcal — dat is bewust zo).
- [ ] **Coach ziet** de voeding-adherence terug op het dashboard/analytics.

## 5. Training (klant)
- [ ] Trainingsschema toont de oefeningen van vandaag.
- [ ] Set loggen (gewicht + reps + vinkje) werkt; waarden overleven herladen.
- [ ] Rust-timer telt af, +15/−15/skip werken.
- [ ] Vorige-sessie-referentie toont de laatste keer (of leeg bij nieuwe oefening).

## 6. Daglog + streak/groene dagen (klant)
- [ ] Stappen / water / kcal loggen werkt — **maar pas nadat de coach het schema "live" heeft gezet** (daarvoor doet loggen niks; dat is by-design).
- [ ] Groene dag wordt groen als voeding + training + stappen + water allemaal gehaald zijn.
- [ ] **Coach ziet** de stappen-adherence + groene dagen.

## 7. Progressie (klant → coach)
- [ ] Gewicht-grafiek toont de check-in-gewichten.
- [ ] Voortgangsfoto uploaden (voor/zij/achter) werkt.
- [ ] **Coach ziet** de foto's + gewichtsverloop op de klant-detailpagina.

## 8. Chat (klant ↔ coach)
- [ ] Klant stuurt bericht → coach ziet 't in het overzicht (ongelezen-teller) + in de thread.
- [ ] Coach antwoordt → klant ziet het antwoord.

## 9. Meldingen (coach → klant)
- [ ] Coach stuurt een melding → klant ziet 'm in de app (pop-up/melding).
- [ ] Klant markeert gezien / sluit 'm → melding komt niet terug.

## 10. Instellingen / profiel (klant)
- [ ] Profiel toont de eigen intake-gegevens.
- [ ] Uitloggen werkt (terug naar login, sessie dood).

---

## COACH-PORTAAL

## 11. Klantenlijst + intakes
- [ ] Klantenlijst laadt, klanten klikbaar naar detail.
- [ ] **Intakes-lijst toont de naam die de klant zélf in het formulier invulde** (Daniel-keuze), niet de coach-naam.
- [ ] De "deel deze intakelink"-knop is **weg** van het intakes-scherm.

## 12. Aandacht nodig (nieuwe drempels + grace)
- [ ] Een klant die 2 dagen geen dagelijkse check-in deed → verschijnt (dringend na 3).
- [ ] Een klant die 2 dagen niet inlogde → verschijnt (dringender na 5 en 10).
- [ ] **Net-gestarte klant (eerste 2 weken) verschijnt NIET** als aandachtssignaal — alleen onder "nieuw deze week".
- [ ] **Geen "training overgeslagen"-signaal meer** (Daniel wil dat er nu uit).
- [ ] Snooze (24u) vraagt eerst een bevestiging.

## 13. Analytics
- [ ] Adherence-cijfer = **"over actieve klanten na onboarding"** (net-gestarte klanten tellen niet mee).
- [ ] Retentie, omzet, funnel laden zonder fouten (lege waarden → "—", geen NaN).

## 14. Schema-builder
- [ ] `/coach/schema-builder/voeding` en `/training` werken (de live builder).
- [ ] De **oude schema-bouw-hub** (`/coach/schema-builder`) stuurt door naar de live builder — dagvarianten/weektemplates zijn weg.

## 15. Instellingen (coach)
- [ ] Wachtwoord wijzigen werkt (oud wachtwoord weigert daarna, nieuw logt in).
- [ ] Integraties-status (Mollie/Resend/Calendly) toont correct verbonden/niet-verbonden.

---

## 16. Betaling (zodra Mollie-testkey er is)
- [ ] Coach maakt betaallink → Mollie-testcheckout → "betaald" kiezen → webhook → account actief → inlogmail. **Geen echt geld.**
- [ ] Gespreide betaling: termijn 2/3 worden ingepland _(recurring — nog te bouwen)_.

---

## Nog te bouwen (staat hier zodat je weet wat nog niet af is)
- Wekelijkse check-in achteraf aanpassen (20c) · reminder bij gemiste week (20d) · laatste-week-randgeval (20e)
- Lerende aandacht-motor (minder-vaak-tonen + herschrijvingen overnemen)
- Grotere receptenset · automatische termijn-incasso (Mollie) · migratie ~20 Fit Society-klanten
