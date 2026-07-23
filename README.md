# Persistent Notification Feed Card

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lennartschulte&repository=HomeassistantNotificationCard&category=plugin)

Eine schlanke Lovelace-Custom-Card für Home Assistant, die alle aktiven
[`persistent_notification`](https://www.home-assistant.io/integrations/persistent_notification/)-Einträge
auf dem Dashboard anzeigt — inklusive Dismiss-Button pro Eintrag.

Gedacht als leichtgewichtiger Ersatz für die nicht mehr funktionierende Karte
[gadgetchnnel/lovelace-home-feed-card](https://github.com/gadgetchnnel/lovelace-home-feed-card).
Es wird bewusst kein neuer Benachrichtigungs-Mechanismus eingeführt — das
Backend bleibt zu 100 % Bordmittel (`persistent_notification.create` /
`persistent_notification.dismiss`). Diese Karte kümmert sich nur um die
Anzeige auf dem Dashboard.

## Funktionen

- Zeigt Titel, Nachricht und relativen Zeitpunkt (z. B. „vor 25 Minuten“)
  jeder aktiven Notification.
- Dismiss-Button (×) pro Eintrag → ruft `persistent_notification.dismiss` auf.
- Optional: Karte komplett ausblenden, wenn keine Benachrichtigungen da sind.
- Eigener visueller Editor — Konfiguration ganz ohne YAML möglich.
- Aktualisiert sich automatisch, sobald sich der Home-Assistant-State ändert.
- Kein Build-Step, keine Abhängigkeiten — ein einzelnes JS-File.

## Installation

### Über HACS (empfohlen)

Am schnellsten über den Badge oben: Klick öffnet direkt den „Repository
hinzufügen“-Dialog in deiner HA-Instanz (setzt eine verknüpfte
[My-Home-Assistant](https://www.home-assistant.io/integrations/my/)-Instanz
voraus, ist standardmäßig aktiv).

Alternativ manuell:

1. HACS öffnen → **Frontend** → Menü (⋮) → **Benutzerdefinierte Repositories**.
2. Dieses Repository als URL eintragen, Kategorie **Dashboard** (Plugin) wählen.
3. Karte installieren.
4. Falls die Ressource nicht automatisch eingetragen wird: **Einstellungen →
   Dashboards → Ressourcen** → neue Ressource hinzufügen, Pfad
   `/hacsfiles/HomeassistantNotificationCard/persistent-notification-card.js`,
   Typ **JavaScript-Modul**.
5. Browser-Cache leeren / Frontend neu laden.

### Manuell

1. `persistent-notification-card.js` in `www/` deiner Home-Assistant-Config
   ablegen (z. B. `www/persistent-notification-card.js`).
2. **Einstellungen → Dashboards → Ressourcen** → neue Ressource:
   Pfad `/local/persistent-notification-card.js`, Typ **JavaScript-Modul**.

## Verwendung im UI-Editor

Die Karte hat einen eigenen visuellen Editor — nach dem Hinzufügen einfach
über die normale Karten-Konfiguration (Zahnrad-Symbol) Titel, maximale
Anzahl und „Karte ausblenden, wenn leer“ einstellen, kein YAML nötig.

Alternativ manuell per YAML:

1. Dashboard bearbeiten → **Karte hinzufügen** → ganz unten **Manuell**
   auswählen (oder bei einer bestehenden Karte oben rechts auf **YAML
   bearbeiten** wechseln).
2. Folgendes einfügen:

   ```yaml
   type: custom:persistent-notification-card
   title: Benachrichtigungen
   hide_if_empty: true
   ```

### Konfigurationsoptionen

| Option          | Pflicht | Beschreibung                                                              |
| --------------- | ------- | -------------------------------------------------------------------------- |
| `title`         | nein    | Überschrift der Karte (Standard: „Benachrichtigungen“)                     |
| `max`           | nein    | Maximale Anzahl angezeigter Einträge                                       |
| `hide_if_empty` | nein    | Blendet die gesamte Karte aus, solange keine Benachrichtigungen vorhanden sind (Standard: `false`) |

Zeitstempel werden relativ angezeigt (z. B. „vor 25 Minuten“), passend zur
im Browser/HA eingestellten Sprache, und aktualisieren sich automatisch.

## Notifications erzeugen, aktualisieren, löschen

Alles läuft über die eingebauten Home-Assistant-Services — die Karte zeigt
nur an, was dort existiert.

```yaml
# Erstellen (oder aktualisieren, wenn die notification_id bereits existiert)
service: persistent_notification.create
data:
  notification_id: battery_low
  title: Batterie schwach
  message: "Sensor XY hat noch 8 % Batterie."

# Löschen / Ausblenden
service: persistent_notification.dismiss
data:
  notification_id: battery_low
```

Ein erneuter `create`-Aufruf mit derselben `notification_id` überschreibt den
bestehenden Eintrag (Titel, Nachricht, Zeitstempel) — das ist eingebautes
Verhalten von Home Assistant, dafür ist keine zusätzliche Logik nötig.

Die Karte liest die aktive Liste über dieselbe WebSocket-API
(`persistent_notification/subscribe`), die auch das eingebaute
Glocken-Symbol im HA-Frontend nutzt — `persistent_notification`-Einträge
existieren nicht als reguläre Entity in `hass.states`, daher greift die Karte
nicht auf State-Attribute zu, sondern direkt auf diese API. Die
`notification_id` wird dabei unverändert 1:1 durchgereicht (kein Slugify),
der Dismiss-Button funktioniert also unabhängig davon, welche Zeichen die ID
enthält.
