const Me = imports.misc.extensionUtils.getCurrentExtension();
const { St, Clutter, GObject, Gio } = imports.gi;
const { main: Main, popupMenu: PopupMenu, panelMenu: PanelMenu } = imports.ui;
const ExtensionUtils = imports.misc.extensionUtils;

let extension;

// Load GSettings
const settings = ExtensionUtils.getSettings(
  "org.gnome.shell.extensions.icon-hider-updated"
);

var Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, `${Me.metadata.name} Indicator`, false);
      this._buildUI();
    }

    _buildUI() {
      const box = new St.BoxLayout({ style_class: "panel-button" });
      const icon = new St.Icon({
        style_class: "system-status-icon",
        gicon: new Gio.ThemedIcon({ name: "view-grid-symbolic" }),
      });
      box.add_child(icon);
      this.add_child(box);
    }
  }
);

class Extension {
  constructor() {
    this.statusArea = Main.panel.statusArea;
    this.hiddenIcons = new Set(settings.get_strv("hidden-icons"));
    this.knownIcons = new Set(settings.get_strv("known-icons"));
    this.indicator = null;
  }

  _toggleIconVisibility(iconRole) {
    if (this.hiddenIcons.has(iconRole)) {
      this.hiddenIcons.delete(iconRole);
      this.statusArea[iconRole].show();
    } else {
      this.hiddenIcons.add(iconRole);
      this.statusArea[iconRole].hide();
    }
    settings.set_strv("hidden-icons", Array.from(this.hiddenIcons));
  }

  _createIndicator() {
    this.indicator = new Indicator();
    Main.panel.addToStatusArea("indicator", this.indicator, 1, "right");
  }

  _setupMenu() {
    this.knownIcons.forEach((iconRole) => {
      const menuItem = new PopupMenu.PopupSwitchMenuItem(
        iconRole,
        !this.hiddenIcons.has(iconRole)
      );
      menuItem.connect("toggled", () => {
        this._toggleIconVisibility(iconRole);
      });
      this.indicator.menu.addMenuItem(menuItem);
    });
  }

  gatherStatusAreaElements() {
    Object.keys(this.statusArea).forEach((role) => {
      if (!this.statusArea[role].is_finalized) {
        this.knownIcons.add(role);
      }
    });
    settings.set_strv("known-icons", Array.from(this.knownIcons));
  }

  applyHiddenIcons() {
    this.hiddenIcons.forEach((iconRole) => {
      if (this.statusArea[iconRole]) {
        this.statusArea[iconRole].hide();
      }
    });
  }

  _updateIndicatorVisibility() {
    if (this.indicator) {
      if (settings.get_boolean("hide-indicator-icon")) {
        this.indicator.hide();
      } else {
        this.indicator.show();
      }
    }
  }

  enable() {
    setTimeout(() => {
      this.gatherStatusAreaElements();
      this.applyHiddenIcons();
      this._createIndicator();
      this._setupMenu();
      this._updateIndicatorVisibility(); // Set initial visibility

      this._hideIndicatorIconChangedId = settings.connect(
        "changed::hide-indicator-icon",
        () => {
          this._updateIndicatorVisibility();
        }
      );
    }, 500);
  }

  disable() {
    if (this._hideIndicatorIconChangedId) {
      settings.disconnect(this._hideIndicatorIconChangedId);
      this._hideIndicatorIconChangedId = null;
    }

    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }
  }
}

function init() {
  extension = new Extension();
  return extension;
}
