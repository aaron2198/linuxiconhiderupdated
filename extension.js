const ExtensionUtils = imports.misc.extensionUtils;
const { St, Clutter, GObject, Gio } = imports.gi;
const { main: Main, popupMenu: PopupMenu, panelMenu: PanelMenu } = imports.ui;

var IconIndicator = GObject.registerClass(
  class IconIndicator extends PanelMenu.Button {
    _init(currentExtension) {
      super._init(0.0, `${currentExtension.metadata.name} Indicator`, false);
      this._buildUI();
    }

    _buildUI() {
      const box = new St.BoxLayout({ style_class: "panel-button" });
      const icon = new St.Icon({
        icon_name: "view-grid-symbolic",
        icon_size: 20,
      });

      box.add_child(icon);
      this.add_child(box);
    }
  }
);

class IconHiderExtension {
  _init() {
    this.statusArea = null;
    this.hiddenIcons = null;
    this.knownIcons = null;
    this.indicator = null;
    this._hideIndicatorIconChangedId = null;
    this._hiddenIconsChangedId = null;
    this.timeout = null;
    this.extension = null;
    this.settings = null;
  }

  _toggleIconVisibility(iconRole) {
    if (this.hiddenIcons.has(iconRole)) {
      this.hiddenIcons.delete(iconRole);
      this.statusArea[iconRole].show();
    } else {
      this.hiddenIcons.add(iconRole);
      this.statusArea[iconRole].hide();
    }
    this.settings.set_strv("hidden-icons", Array.from(this.hiddenIcons));
  }

  _createIndicator() {
    // Check if the indicator already exists in the status area
    if (!Main.panel.statusArea["iconHiderUpdated"]) {
      this.indicator = new IconIndicator(this.currentExtension);
      Main.panel.addToStatusArea(
        "iconHiderUpdated",
        this.indicator,
        1,
        "right"
      );
    } else {
      // If it exists, reference the existing indicator
      this.indicator = Main.panel.statusArea["iconHiderUpdated"];
    }
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

    // Add a separator
    const separator = new PopupMenu.PopupSeparatorMenuItem();
    this.indicator.menu.addMenuItem(separator);

    // Add "Open Settings" button
    const openSettingsItem = new PopupMenu.PopupMenuItem("Open Settings");
    openSettingsItem.connect("activate", () => {
      ExtensionUtils.openPrefs();
    });
    this.indicator.menu.addMenuItem(openSettingsItem);
  }

  _gatherStatusAreaElements() {
    Object.keys(this.statusArea).forEach((role) => {
      if (!this.statusArea[role].is_finalized) {
        if (role !== "iconHiderUpdated") {
          this.knownIcons.add(role);
        }
      }
    });
    this.settings.set_strv("known-icons", Array.from(this.knownIcons));
  }

  _applyHiddenIcons() {
    this.knownIcons.forEach((iconRole) => {
      if (this.hiddenIcons.has(iconRole)) {
        if (this.statusArea[iconRole]) this.statusArea[iconRole].hide();
      } else {
        if (this.statusArea[iconRole]) this.statusArea[iconRole].show();
      }
    });
  }

  _updateIndicatorVisibility() {
    if (this.indicator) {
      this.settings.get_boolean("hide-indicator-icon")
        ? this.indicator.hide()
        : this.indicator.show();
    }
  }

  enable() {
    this.timeout = setTimeout(() => {
      // Now instantiate complex objects
      this.currentExtension = ExtensionUtils.getCurrentExtension();
      this.settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.icon-hider-updated"
      );
      this.statusArea = Main.panel.statusArea;
      this.hiddenIcons = new Set(this.settings.get_strv("hidden-icons"));
      this.knownIcons = new Set(this.settings.get_strv("known-icons"));

      this._gatherStatusAreaElements();
      this._applyHiddenIcons();
      this._createIndicator();
      this._setupMenu();
      this._updateIndicatorVisibility();

      this._hideIndicatorIconChangedId = settings.connect(
        "changed::hide-indicator-icon",
        () => {
          this._updateIndicatorVisibility();
        }
      );

      this._hiddenIconsChangedId = this.settings.connect(
        "changed::hidden-icons",
        () => {
          this.hiddenIcons = new Set(this.settings.get_strv("hidden-icons"));
          this._applyHiddenIcons();
        }
      );
    }, 1000);
  }

  disable() {
    if (this._hideIndicatorIconChangedId) {
      this.settings.disconnect(this._hideIndicatorIconChangedId);
      this._hideIndicatorIconChangedId = null;
    }

    if (this._hiddenIconsChangedId) {
      this.settings.disconnect(this._hiddenIconsChangedId);
      this._hiddenIconsChangedId = null;
    }

    // Nullify properties
    this.statusArea = null;
    this.hiddenIcons = null;
    this.knownIcons = null;
    this.settings = null;
    this.extension = null;

    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }

    // Clear the timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

function init() {
  return new IconHiderExtension();
}
