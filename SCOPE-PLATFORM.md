# Scope Hoedt Coaching-platform — volledige functie-overzicht

_Voor: Pepijn (frontend-bouw) · Geschreven: 2026-07-19 · Backend-status: gevalideerd + groen_

Dit document beschrijft **elke functie die het platform heeft**, wat die doet, en de workflow eromheen. Sectie 6 is het belangrijkst voor de frontend-bouw: daar staat wat er nu **mist, dood of half** is — neem dat mee in de opdracht.

---

## 1. Architectuur in het kort

- **Backend:** Node.js + Express. **Data = JSON-bestanden** in `data/` (geen database). Productie draait op Railway met een persistent volume.
- **Klant-app:** één pagina, `public/dashboard.html`. De iOS-app is een **dunne Capacitor-webview** van diezelfde pagina — dus klant-frontend = deze HTML/JS.
- **Coach-portaal:** server-rendered pagina's (`routes/coach-*.js` + `views/coach-*.js`). **Desktop/browser-only** — bewust géén app.
- **Twee losse gebruikers:** klant (login → dashboard) en coach (login → portaal). Aparte sessies/cookies.

---

## 2. KLANT-APP

### 2.1 Onboarding (vóór het dashboard)
De klant komt binnen via een **betaallink van de coach** (Mollie). Na betaling wordt het account actief en krijgt de klant inloggegevens per mail. **Er is geen zelf-aanmelden.**

Workflow, in deze volgorde — de klant komt pas op het dashboard als intake én contract klaar zijn (de "gate"):
1. **Inloggen** (`/login`)
2. **Welkomstvideo** bekijken (`/onboarding/welkomstvideo`)
3. **Intake invullen** (`/intake`) — uitgebreide vragenlijst (doelen, werk, training, voeding, valkuilen). Verplichte velden + minimum-lengtes op de open vragen.
4. **Contract tekenen** (`/onboarding/contract`) — telefoon + akkoord + handtekening → genereert een PDF.
5. **Gate opent** → `/dashboard`
6. Later ontgrendelen nog twee stappen in het overzicht: **schema bekeken** en **eerste dagelijkse check-in** (die laatste wordt nu automatisch afgevinkt zodra de klant in de app z'n eerste dagelijkse check-in doet).

### 2.2 Dashboard-tab (home)
Het startscherm van de klant. Bevat:
- **Dagelijkse check-in** — energie, gewicht, slaap, "iets dat je week beïnvloedt", en "heb je hulp nodig". Eén per dag; opnieuw invullen overschrijft. Bij "snel antwoord nodig" krijgt de coach een taak + mailseintje.
- **Daglog** — stappen, water, kcal. ⚠ Dit werkt **pas nadat de coach het schema live heeft gezet**; daarvóór doet loggen niets (zie 6).
- **Streak / groene dagen** — een dag wordt groen als voeding, training, stappen én water gehaald zijn.
- **Actiepunten van de coach** — read-only lijstje per week.
- **Meldingen** — verplicht-te-lezen berichten van de coach (overlay), met "gezien"/"sluiten".

### 2.3 Voeding-tab
- Toont het **voedingsschema van vandaag**: de maaltijden met recept, macro's, bereidingstijd en coach-tip.
- **Maaltijd afvinken** (aan/uit) per maaltijd. Dit voedt de voeding-adherence die de coach ziet.
- **Maaltijd wisselen** — de klant kan een alternatief kiezen. Fase 1 = geen wissels, fase 2 = 1/dag, fase 3 = 2/dag. ⚠ Werkt alleen als de schema's maaltijd-categorieën hebben; Daniel gebruikt dit nu nog niet (zie 6).
- **"Buiten schema gegeten"** — logt een notitie voor de coach. Rekent bewust **geen** calorieën automatisch bij.

### 2.4 Training-tab
- Toont de **training van vandaag** met oefeningen, series, gewicht en reps.
- **Set loggen**: gewicht + reps invullen en afvinken. Waarden blijven staan bij herladen, ook als de set nog niet afgevinkt is.
- **Rust-timer** met +15 / −15 / overslaan.
- **Vorige sessie** als referentie per oefening (de laatste set van de vorige keer).
- **Oefening wisselen** naar een alternatief; training afronden / herstarten.
- ⚠ **Let op: er staan twee versies van deze tab in de code. Alleen de "Hevy"-versie is live.** Zie 6.1 — dit is het belangrijkste punt voor de frontend.

### 2.5 Progressie-tab
- **Gewichtsgrafiek** uit de dagelijkse check-ins.
- **Voortgangsfoto's** uploaden (voorkant / zijkant / achterkant) en terugkijken.
- **Kracht-progressie** per oefening en gemiddelden.

### 2.6 Chat-tab
Directe berichten tussen klant en coach, beide kanten op. Ongelezen-teller. De coach ziet dezelfde thread in het portaal.

### 2.7 Wekelijkse check-in (eigen flow, niet een tab)
Eén keer per week, met deze vragen: waar ben je trots op, wat was het moeilijkste moment, hoe voelde de training, honger (1-5), stress (1-5), mentaal vergeleken met vorige week, en optioneel een directe vraag aan de coach. Plus **lichaamsmaten** (taille/buik/heup/arm) en **foto's elke 2 weken**.

Belangrijke regels (recent gebouwd):
- **De week telt per klant vanaf zijn eigen startdatum** — niet vanaf maandag. Een klant die op woensdag start heeft z'n check-in-week woensdag→dinsdag.
- **Achteraf aanpassen mag**: opnieuw insturen werkt de bestaande in bij (maten en foto's blijven behouden als je ze niet opnieuw meestuurt).
- **Uitstellen** (een keer overslaan) kan.
- Wordt de week niet ingevuld, dan stuurt het systeem **automatisch één herinnering** (in-app melding + mail), max één per klant per week.

### 2.8 Profiel + uitloggen
Bewust minimaal: eigen intake-gegevens inzien en uitloggen. ⚠ Geen wachtwoord-wijzigen en geen account-verwijderen (zie 6).

---

## 3. COACH-PORTAAL

- **Dashboard** — begroeting met urgentie, "vandaag" (intakes + sales-calls uit Calendly), pipeline (leads/onboarding/actief/eindronde/voltooid), business-pulse (nieuw deze week, adherence, omzet, verlengingen), en het "aandacht nodig"-blok.
- **Aandacht nodig** — de signalen-motor (zie 4.3): welke klant aandacht nodig heeft, met een voorgesteld bericht dat de coach kan versturen, bewerken of wegklikken. Snoozen kan (24 uur, met bevestiging).
- **Taken** — takenlijst, o.a. automatisch aangemaakt bij "klant heeft snel antwoord nodig".
- **Klanten** — lijst + per klant een detailpagina met tegels: check-ins, gewicht, voeding, training, login, metingen, foto's, actiepunten, logboek, betalingen, supplementen. Vanuit hier koppelt de coach schema's, zet het schema live, stuurt herinneringen en berichten.
- **Intakes** — binnengekomen intakeformulieren, klikbaar naar het volledige antwoord-overzicht.
- **Check-ins** — twee tabbladen: dagelijks en wekelijks. Bij wekelijks ziet de coach alle antwoorden, de maten met verschil t.o.v. vorige week, de foto's en een automatisch **bijstuurvoorstel**.
- **Chat** — alle klantgesprekken met ongelezen-teller.
- **Eind-vragenlijsten** — afsluitende vragenlijsten per klant.
- **AI-feedback (statistieken)** — hoe vaak de coach voorgestelde berichten goedkeurt, afwijst of aanpast.
- **Instellingen** — account + wachtwoord wijzigen, e-mailtemplates (read-only), integratie-status (Mollie/Resend/Calendly), backup-log.
- **Schema-builders** — voeding (genereren, producten, recepten, voedingsschema's, koppelen) en training (genereren, oefeningen, trainingsschema's, koppelen).

---

## 4. Systemen achter de schermen

- **4.1 Betalingen (Mollie)** — coach maakt betaallink → klant betaalt → webhook → account actief + inloggegevens per mail. Gespreide trajecten: termijn 1 loopt, **termijn 2/3 automatisch incasseren moet nog gebouwd** (wacht op Mollie-key).
- **4.2 E-mail (Resend)** — welkomstmail na aanmelding + een serie op dag 1 / 7 / 14 + een "terug van weg"-mail. Draait via een dagelijkse scheduler. Lokaal altijd dry-run; alleen productie verstuurt echt.
- **4.3 Aandacht-motor** — kijkt dagelijks naar voeding, stappen, check-ins, inloggen en fase-/verlengingsmomenten en bepaalt wie aandacht nodig heeft, met urgentie 1-3. Drempels (door Daniel bevestigd): voeding na 2 dagen (dringend na 4), check-in na 2 (dringend na 3), niet-ingelogd na 2 (dringender na 5 en 10), stappen 3 dagen speling in fase 1. **Nieuwe klanten krijgen de eerste 2 weken geen signaal.** Training-als-signaal staat uit.
- **4.4 Streak / groene dagen** — start zodra de coach het schema live zet.
- **4.5 Adherence** — hoe goed klanten hun plan volgen (voeding/training/stappen), gemeten per klant over zijn eigen periode. Klanten die nog in onboarding zitten tellen niet mee.
- **4.6 Meldingen** — verplicht-te-lezen berichten naar de klant, in-app + optioneel mail. Wordt gebruikt door de coach, door "schema staat klaar" en door de weekcheck-herinnering.

---

## 5. Rollen en toegang
- **Klant**: eigen data, alles achter login + onboarding-gate.
- **Coach**: alles, achter coach-login. Eén coach-account (Daniel).
- **Testers**: via een geheime link zonder betaling; die accounts worden als test gemarkeerd zodat ze de cijfers niet vervuilen.

---

## 6. ⚠ Wat mist, dood of half is — MEENEMEN IN DE FRONTEND-SCOPE

### 6.1 Training-tab: twee versies, één is dood (belangrijkste punt)
In `public/dashboard.html` staan **twee complete training-implementaties**:
- **LIVE = de "Hevy"-versie** (± regel 9056-9940). Dit is wat de klant ziet.
- **DOOD = de oudere TR_STATE-versie** (± regel 5000-6400) — wordt nooit uitgevoerd.

Beide gebruiken "hv"/"Hevy" in hun naamgeving, dus het is makkelijk om per ongeluk de verkeerde te bewerken. **Bouw/verbouw altijd de Hevy-versie.** Het opruimen van de dode versie is een aparte opdracht (en scheelt ~1400 regels). Ook dood: het backend-endpoint `training/vorige-sessie` en een oude timer-implementatie.

### 6.2 Wekelijkse check-in moet bewerkbaar worden in de UI
De backend accepteert nu een **tweede inzending** als wijziging (upsert). De frontend behandelt "deze week gedaan" waarschijnlijk nog als eindstation. **Nodig:** een "aanpassen"-knop die het formulier opent met de bestaande antwoorden voorgevuld en opnieuw kan insturen.

### 6.3 Eerste check-in in de onboarding
De onboarding-stap "eerste dagelijkse check-in" verwijst nu naar het **dashboard** (de losse check-in-pagina is opgeheven). **Nodig:** zorg dat de klant daar de dagelijkse check-in duidelijk aangeboden krijgt, zodat die stap logisch afgerond wordt.

### 6.4 Daglog werkt pas na schema-activatie
Stappen/water/kcal loggen doet **niets** zolang de coach het schema niet live heeft gezet — de invoer verdwijnt stil. **Nodig:** die staat zichtbaar maken ("je schema wordt klaargezet") in plaats van invoervelden die niets doen.

### 6.5 Maaltijd wisselen levert nu niets op
De wissel-knop werkt technisch, maar de schema's hebben nog geen maaltijd-categorieën, dus er komen 0 alternatieven terug. Daniel gebruikt de functie nog niet. **Nodig:** nette lege staat, of de functie verbergen tot Daniel 'm gebruikt.

### 6.6 Rust-timer overleeft geen herladen
De timer loopt goed en corrigeert zichzelf, maar verdwijnt bij herladen of wegnavigeren (staat alleen in het geheugen). Nice-to-have voor mobiel.

### 6.7 Ontbrekende klant-functies
- **Account verwijderen in de app** bestaat niet (backend noch UI). **Dit is verplicht voor de App Store.**
- **Wachtwoord wijzigen** kan de klant niet zelf.
- **Push-notificaties** zijn niet gebouwd (native). In-app meldingen werken wel.

### 6.8 App/native-punten (Xcode)
Camera-toestemmingsteksten ontbreken in de iOS-config (**zonder deze wordt de app automatisch afgekeurd**), deep links en het definitieve domein staan nog open. Details staan in `XCODE-BUILD-TODO.md`.

### 6.9 Kleinere dingen
- Twee welkomstmails linken naar `?tab=checkin` en `?tab=gewicht` — die tabs bestaan niet (de app kent alleen dashboard/voeding/training/progressie/chat). Landen nu op de standaardtab.
- De oude coach-klantpagina (`/coach/klant/:id/oud`) is alleen nog een terugvaloptie en wordt uitgefaseerd — **niet op doorbouwen**.
- Op het coach-dashboard wordt een check-in-teaser wél berekend maar nergens getoond.
- Een oude uitleg-pagina in de onboarding staat nog los (met verouderde "Fit Society"-teksten) en is nergens gelinkt.

---

## 7. Nog te bouwen — wacht op Daniel
| Onderwerp | Wat ontbreekt |
|---|---|
| Automatische termijn-incasso (2/3) | Mollie-testsleutel van Daniel |
| Overzetten ~20 bestaande klanten | Export uit Fit Society |
| Grotere receptenset | Keuze welke recepten-bron |
| Lerende aandacht-motor | Hoe agressief leren + omgaan met wisselende getallen in berichten |
| Laatste-week-randgeval | Wat er in de laatste week anders moet |

Geen van deze blokkeert de frontend-bouw.

---

## 8. Testen
`E2E-TEST-CHECKLIST.md` bevat een vinkbare doorloop van alle klant- en coachfuncties. Gebruik die na de frontend-koppeling, op desktop én telefoon.
