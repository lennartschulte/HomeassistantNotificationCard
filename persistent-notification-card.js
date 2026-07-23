class PersistentNotificationCard extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._notifications = Object.keys(hass.states)
      .filter((entityId) => entityId.startsWith("persistent_notification."))
      .map((entityId) => {
        const state = hass.states[entityId];
        return {
          notificationId: entityId.slice("persistent_notification.".length),
          title: state.attributes.title,
          message: state.attributes.message || "",
          createdAt: state.attributes.created_at,
        };
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    if (this._config.max) {
      this._notifications = this._notifications.slice(0, this._config.max);
    }

    this._render();
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
              <div class="notification" data-id="${n.notificationId}">
                <div class="content">
                  ${n.title ? `<div class="title">${n.title}</div>` : ""}
                  <div class="message">${n.message}</div>
                  ${
                    n.createdAt
                      ? `<div class="timestamp">${n.createdAt}</div>`
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
