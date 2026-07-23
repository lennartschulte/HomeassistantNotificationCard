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
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe.then((unsub) => unsub());
      this._unsubscribe = undefined;
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

  _render() {
    if (!this.shadowRoot) return;

    const title = this._config.title || "Benachrichtigungen";
    const notifications = this._notifications || [];

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
                      ? `<div class="timestamp">${n.created_at}</div>`
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
    return 1 + (this._notifications ? this._notifications.length : 0);
  }

  static getStubConfig() {
    return { title: "Benachrichtigungen" };
  }
}

customElements.define("persistent-notification-card", PersistentNotificationCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "persistent-notification-card",
  name: "Persistent Notification Feed",
  description:
    "Zeigt alle aktiven persistent_notification-Einträge mit Dismiss-Button an.",
});
