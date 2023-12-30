const { GObject, Gtk } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

function init() {
  ExtensionUtils.initTranslations();
}

var IconHiderPrefsWidget = GObject.registerClass(
  class IconHiderPrefsWidget extends Gtk.Box {
    _init(params) {
      super._init(params);
      this.orientation = Gtk.Orientation.VERTICAL;
      this.margin_top = 20;
      this.margin_bottom = 20;
      this.margin_start = 20;
      this.margin_end = 20;
      this.spacing = 10;

      this._settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.icon-hider-updated"
      );

      this._addCheckBox("hide-indicator-icon", "Hide Indicator Icon");
      // Additional UI components for 'hidden-icons' and 'known-icons' can be added here
    }

    _addCheckBox(key, label) {
      let checkBox = new Gtk.CheckButton({ label: label });
      this._settings.bind(
        key,
        checkBox,
        "active",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.append(checkBox); // Use append() for GTK 4 or pack_start() for GTK 3
    }

    // You can add more methods to create other UI components for 'hidden-icons' and 'known-icons'
  }
);

function buildPrefsWidget() {
  let widget = new IconHiderPrefsWidget();
  return widget;
}
