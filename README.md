# Persistent Notification Feed Card

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lennartschulte&repository=HomeassistantNotificationCard&category=plugin)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/v/release/lennartschulte/HomeassistantNotificationCard)](https://github.com/lennartschulte/HomeassistantNotificationCard/releases)

A lightweight Lovelace custom card for Home Assistant that shows all active
[`persistent_notification`](https://www.home-assistant.io/integrations/persistent_notification/)
entries on your dashboard — including a per-item dismiss button.

Built as a minimal replacement for the no-longer-working
[gadgetchnnel/lovelace-home-feed-card](https://github.com/gadgetchnnel/lovelace-home-feed-card).
No new notification mechanism is introduced — the backend stays 100% built-in
Home Assistant (`persistent_notification.create` /
`persistent_notification.dismiss`). This card only handles the dashboard
display.

## Features

- Shows title, message, and relative time (e.g. "25 minutes ago") for every
  active notification.
- Dismiss button (×) per entry → calls `persistent_notification.dismiss`.
- Optional: hide the whole card when there are no notifications.
- Own visual editor — configure it entirely without YAML.
- Updates automatically as the Home Assistant state changes.
- No build step, no dependencies — a single JS file.

## Installation

### Via HACS (recommended)

Fastest via the badge above: clicking it opens the "Add repository" dialog
directly in your HA instance (requires a linked
[My Home Assistant](https://www.home-assistant.io/integrations/my/)
instance, which is enabled by default).

Manual alternative:

1. Open HACS → **Frontend** → menu (⋮) → **Custom repositories**.
2. Add this repository's URL, category **Dashboard** (plugin).
3. Install the card.
4. If the resource isn't added automatically: **Settings → Dashboards →
   Resources** → add a new resource, URL
   `/hacsfiles/HomeassistantNotificationCard/persistent-notification-card.js`,
   type **JavaScript Module**.
5. Clear your browser cache / reload the frontend.

### Manual

1. Copy `persistent-notification-card.js` into `www/` in your Home Assistant
   config (e.g. `www/persistent-notification-card.js`).
2. **Settings → Dashboards → Resources** → add a new resource: URL
   `/local/persistent-notification-card.js`, type **JavaScript Module**.

## Using the UI editor

The card ships with its own visual editor — after adding it, just open the
regular card configuration (gear icon) to set title, max entries, and "Hide
card when there are no notifications", no YAML required.

Manual YAML alternative:

1. Edit dashboard → **Add card** → scroll down and choose **Manual** (or, on
   an existing card, switch to **Edit in YAML** in the top-right menu).
2. Paste the following:

   ```yaml
   type: custom:persistent-notification-card
   title: Notifications
   hide_if_empty: true
   ```

### Configuration options

| Option          | Required | Description                                                                     |
| --------------- | -------- | --------------------------------------------------------------------------------- |
| `title`         | no       | Card heading (default: "Notifications")                                          |
| `empty_text`    | no       | Text shown when there are no notifications (default: "No notifications") — set this to translate the card into your own language |
| `dismiss_text`  | no       | Tooltip text on the dismiss (×) button (default: "Dismiss")                       |
| `max`           | no       | Maximum number of entries shown                                                  |
| `hide_if_empty` | no       | Hides the entire card while there are no active notifications (default: `false`) |

Timestamps are shown as relative time (e.g. "25 minutes ago"), matching the
language configured in your browser/HA, and refresh automatically.

## Creating, updating, and dismissing notifications

Everything runs through the built-in Home Assistant services — the card
only displays what already exists.

```yaml
# Create (or update, if the notification_id already exists)
service: persistent_notification.create
data:
  notification_id: battery_low
  title: Battery low
  message: "Sensor XY is at 8% battery."

# Dismiss / remove
service: persistent_notification.dismiss
data:
  notification_id: battery_low
```

Calling `create` again with the same `notification_id` overwrites the
existing entry (title, message, timestamp) — this is built-in Home Assistant
behavior, no extra logic is needed for it.

The card reads the active list via the same WebSocket API
(`persistent_notification/subscribe`) that the built-in notification bell in
the HA frontend uses — `persistent_notification` entries don't exist as
regular entities in `hass.states`, so the card doesn't read state
attributes, it talks to this API directly. The `notification_id` is passed
through unchanged (no slugifying), so the dismiss button works regardless of
which characters the ID contains.
