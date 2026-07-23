class PersistentNotificationCard extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._notificationsById = {};
    this._notifications = [];
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._unsubscribe) {
      this._subscribe();
    }
  }

  connectedCallback() {
    if (this._hass && !this._unsubscribe) {
      this._subscribe();
    }
    if (!this._tickInterval) {
      // Keeps relative timestamps ("vor 5 Minuten") fresh even without
      // new notification events.
      this._tickInterval = setInterval(() => this._render(), 60000);
    }
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe.then((unsub) => unsub());
      this._unsubscribe = undefined;
    }
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = undefined;
    }
  }

  _subscribe() {
    // persistent_notification entries are not exposed as regular entities
    // in hass.states — they only exist via this dedicated WebSocket API,
    // the same one the built-in notification bell uses. Each event carries
    // { type: current|added|removed|updated, notifications: {id: {...}} },
    // a dict keyed by notification_id, not an array.
    this._unsubscribe = this._hass.connection.subscribeMessage(
      (msg) => {
        if (msg.type === "current") {
          this._notificationsById = { ...msg.notifications };
        } else if (msg.type === "removed") {
          for (const id of Object.keys(msg.notifications)) {
            delete this._notificationsById[id];
          }
        } else {
          Object.assign(this._notificationsById, msg.notifications);
        }

        this._notifications = Object.values(this._notificationsById).sort(
          (a, b) => (b.created_at || "").localeCompare(a.created_at || "")
        );
        if (this._config.max) {
          this._notifications = this._notifications.slice(
            0,
            this._config.max
          );
        }
        this._render();
      },
      { type: "persistent_notification/subscribe" }
    );
  }

  _dismiss(notificationId) {
    this._hass.callService("persistent_notification", "dismiss", {
      notification_id: notificationId,
    });
  }

  _relativeTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;

    const divisions = [
      { amount: 60, unit: "second" },
      { amount: 60, unit: "minute" },
      { amount: 24, unit: "hour" },
      { amount: 7, unit: "day" },
      { amount: 4.34524, unit: "week" },
      { amount: 12, unit: "month" },
      { amount: Infinity, unit: "year" },
    ];
    const lang =
      (this._hass && this._hass.locale && this._hass.locale.language) ||
      navigator.language;
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

    let duration = (date.getTime() - Date.now()) / 1000;
    for (const division of divisions) {
      if (Math.abs(duration) < division.amount) {
        return rtf.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }
    return "";
  }

  _render() {
    if (!this.shadowRoot) return;

    const notifications = this._notifications || [];

    if (this._config.hide_if_empty && notifications.length === 0) {
      this.style.display = "none";
      this.shadowRoot.innerHTML = "";
      return;
    }
    this.style.display = "";

    const title = this._config.title || "Benachrichtigungen";

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
        }
        .header {
          font-size: 1.2em;
          font-weight: 500;
          color: var(--primary-text-color);
          margin-bottom: 12px;
        }
        .empty {
          color: var(--secondary-text-color);
          font-style: italic;
        }
        .notification {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 0;
          border-top: 1px solid var(--divider-color);
        }
        .notification:first-of-type {
          border-top: none;
        }
        .content {
          flex: 1;
          min-width: 0;
        }
        .title {
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .message {
          color: var(--secondary-text-color);
          white-space: pre-line;
          word-wrap: break-word;
        }
        .timestamp {
          font-size: 0.8em;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
        .dismiss {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--secondary-text-color);
          font-size: 1.3em;
          line-height: 1;
          padding: 0 4px;
        }
        .dismiss:hover {
          color: var(--primary-text-color);
        }
      </style>
      <ha-card>
        <div class="header">${title}</div>
        ${
          notifications.length === 0
            ? `<div class="empty">Keine Benachrichtigungen</div>`
            : notifications
                .map(
                  (n) => `
              <div class="notification" data-id="${n.notification_id}">
                <div class="content">
                  ${n.title ? `<div class="title">${n.title}</div>` : ""}
                  <div class="message">${n.message || ""}</div>
                  ${
                    n.created_at
                      ? `<div class="timestamp">${this._relativeTime(
                          n.created_at
                        )}</div>`
                      : ""
                  }
                </div>
                <button class="dismiss" title="Ausblenden">&times;</button>
              </div>
            `
                )
                .join("")
        }
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".notification").forEach((el) => {
      const id = el.getAttribute("data-id");
      el.querySelector(".dismiss").addEventListener("click", () =>
        this._dismiss(id)
      );
    });
  }

  getCardSize() {
    const notifications = this._notifications || [];
    if (this._config.hide_if_empty && notifications.length === 0) {
      return 0;
    }
    return 1 + notifications.length;
  }

  static getConfigElement() {
    return document.createElement("persistent-notification-card-editor");
  }

  static getStubConfig() {
    return { title: "Benachrichtigungen", hide_if_empty: false };
  }
}

class PersistentNotificationCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        this._config = ev.detail.value;
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }

    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "max", selector: { number: { mode: "box", min: 0 } } },
      { name: "hide_if_empty", selector: { boolean: {} } },
    ];
    this._form.computeLabel = (schema) => {
      const labels = {
        title: "Title",
        max: "Max notifications shown",
        hide_if_empty: "Hide card when there are no notifications",
      };
      return labels[schema.name] || schema.name;
    };
  }
}

customElements.define("persistent-notification-card", PersistentNotificationCard);
customElements.define(
  "persistent-notification-card-editor",
  PersistentNotificationCardEditor
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "persistent-notification-card",
  name: "Persistent Notification Feed",
  description:
    "Zeigt alle aktiven persistent_notification-Einträge mit Dismiss-Button an.",
});
