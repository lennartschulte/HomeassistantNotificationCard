# Persistent Notification Feed Card

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lennartschulte&repository=HomeassistantNotification&category=plugin)

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

- Zeigt Titel, Nachricht und Erstellungszeitpunkt jeder aktiven Notification.
- Dismiss-Button (×) pro Eintrag → ruft `persistent_notification.dismiss` auf.
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
   `/hacsfiles/HomeassistantNotification/persistent-notification-card.js`,
   Typ **JavaScript-Modul**.
5. Browser-Cache leeren / Frontend neu laden.

### Manuell

1. `persistent-notification-card.js` in `www/` deiner Home-Assistant-Config
   ablegen (z. B. `www/persistent-notification-card.js`).
2. **Einstellungen → Dashboards → Ressourcen** → neue Ressource:
   Pfad `/local/persistent-notification-card.js`, Typ **JavaScript-Modul**.

## Verwendung im UI-Editor

Auch wenn dein Dashboard im UI-Editor (Storage-Modus) läuft, wird eine
Custom Card immer über die **manuelle** YAML-Eingabe der einzelnen Karte
hinzugefügt (das betrifft nur diese eine Karte, nicht das gesamte Dashboard):

1. Dashboard bearbeiten → **Karte hinzufügen** → ganz unten **Manuell**
   auswählen.
2. Folgendes einfügen:

   ```yaml
   type: custom:persistent-notification-card
   title: Benachrichtigungen
   ```

### Konfigurationsoptionen

| Option  | Pflicht | Beschreibung                                      |
| ------- | ------- | -------------------------------------------------- |
| `title` | nein    | Überschrift der Karte (Standard: „Benachrichtigungen“) |
| `max`   | nein    | Maximale Anzahl angezeigter Einträge                |

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

> **Hinweis:** Verwende für `notification_id` möglichst slug-artige Werte
> (Buchstaben, Zahlen, Unterstriche, keine Leerzeichen/Sonderzeichen), da die
> ID unverändert als Entity-ID-Suffix (`persistent_notification.<id>`)
> verwendet und für den Dismiss-Button in dieser Karte 1:1 zurückgegeben wird.
