import { GObject, Gtk, Gio, GLib } from imports.gi;
import ExtensionUtils from imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
  ExtensionUtils.initTranslations();
}

var IconHiderPrefsWidget = GObject.registerClass(
  {
    GTypeName: "IconHiderPrefsWidget",
  },
  class IconHiderPrefsWidget extends Gtk.Box {
    _init(params) {
      super._init(params);
      this._setupUI();
    }

    _setupUI() {
      this._configureProperties();
      this._initializeSettings();
      this._createGrid();
      this._addCheckBox("hide-indicator-icon", "Hide Indicator Icon");
      this._loadIconSwitches();
      this._addGitHubLink();
    }

    _configureProperties() {
      this.orientation = Gtk.Orientation.VERTICAL;
      this.margin_top =
        this.margin_bottom =
        this.margin_start =
        this.margin_end =
          20;
      this.spacing = 10;
    }

    _initializeSettings() {
      this._settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.icon-hider-updated"
      );
    }

    _createGrid() {
      this._grid = new Gtk.Grid({
        column_spacing: 20,
        row_spacing: 10,
        column_homogeneous: false,
      });
      this.append(this._grid);
    }

    _addCheckBox(key, label) {
      let checkBox = new Gtk.CheckButton({ label: label });
      this._settings.bind(
        key,
        checkBox,
        "active",
        Gio.SettingsBindFlags.DEFAULT
      );
      this._grid.attach(checkBox, 0, 0, 2, 1);
    }

    _loadIconSwitches() {
      let knownIcons = this._settings.get_strv("known-icons");
      knownIcons.forEach((icon, index) => {
        if (icon !== "iconHiderUpdated") {
          this._addIconSwitch(icon, index + 1);
        }
      });
    }

    _addIconSwitch(icon, row) {
      let switchLabel = `Show ${icon}`;
      let iconSwitch = new Gtk.Switch({ halign: Gtk.Align.END });
      let label = new Gtk.Label({ label: switchLabel, xalign: 0 });

      this._grid.attach(label, 0, row, 1, 1);
      this._grid.attach_next_to(
        iconSwitch,
        label,
        Gtk.PositionType.RIGHT,
        1,
        1
      );

      this._initializeSwitchState(iconSwitch, icon);
      this._bindSwitchToSettings(iconSwitch, icon);
    }

    _initializeSwitchState(iconSwitch, icon) {
      let hiddenIcons = this._settings.get_strv("hidden-icons");
      iconSwitch.set_active(!hiddenIcons.includes(icon));
    }

    _bindSwitchToSettings(iconSwitch, icon) {
      iconSwitch.connect("state-set", (_, state) => {
        let hiddenIcons = new Set(this._settings.get_strv("hidden-icons"));
        if (state) {
          hiddenIcons.delete(icon);
        } else {
          hiddenIcons.add(icon);
        }
        this._settings.set_strv("hidden-icons", Array.from(hiddenIcons));
      });
    }
    _addGitHubLink() {
      let label = new Gtk.Label({
        label:
          "<a href='https://github.com/lx358hcl/linuxiconhiderupdated' title='Visit GitHub Repository'>Contribute on GitHub</a>",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      label.connect(
        "activate-link",
        GLib.spawn_command_line_async.bind(
          null,
          "xdg-open https://github.com/lx358hcl/linuxiconhiderupdated"
        )
      );
      this.append(label);
    }
  }
);

function buildPrefsWidget() {
  return new IconHiderPrefsWidget();
}
