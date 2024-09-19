# Customize Tracim's appearance to your brand

All editable files (with the exception of `development.ini`) are available in a `branding` folder which is located:

- in `frontend/dist/assets/branding` if you have installed Tracim directly on your computer
- in `/etc/tracim/branding` if you are using the official Docker image (which exposes `/etc/tracim` as a docker volume).

This folder will be named `<branding_folder>` in the following documentation.

## Title and description

The title and description of Tracim's page can be changed through `development.ini`:

```ini
website.title = My Tracim instance
website.description = For storing files and collaborating with people.
```

The title is displayed in the browser's page. The title and the description are used by search engines to display their results.

These parameters can also be changed with environment variables as described in [setting.md](/docs/administration/installation/setting.md).

## Main colors used by the user interface

You can change the default colors used in Tracim by editing the `color.json` file which you can find in the branding folder. See the [color.json sample](/frontend/dist/assets/branding.sample/color.json) for the default configuration file.

## Logos used in the user interface

### Website's favorite icons

Prepare 4 favorite icons and copy them in:

|Icon|Path|
|----|----|
|PNG, 16x16 pixels|`<branding_folder>/images/favicon/tracim-16x16.png`|
|PNG, 32x32 pixels|`<branding_folder>/images/favicon/tracim-32x32.png`|
|PNG, 64x64 pixels|`<branding_folder>/images/favicon/tracim-64x64.png`|
|ICO, 16x16 pixels|`<branding_folder>/images/favicon/favicon.ico`|

### Main logo displayed in the top-left of the header bar

Copy your image in `<branding_folder>/images/tracim-logo.png`. Its size should be between 150x30 and 150x50 pixels.

### Progressive webapp icons for Android and iOS devices

Prepare 10 images and copy them in:

|Icon|Path|
|----|----|
|PNG, 72x72 pixels|`<branding_folder>/images/wa-tracim-logo-72x72.png`|
|PNG, 96x96 pixels|`<branding_folder>/images/wa-tracim-logo-96x96.png`|
|PNG, 120x120 pixels|`<branding_folder>/images/wa-tracim-logo-120x120.png`|
|PNG, 128x128 pixels|`<branding_folder>/images/wa-tracim-logo-128x128.png`|
|PNG, 144x144 pixels|`<branding_folder>/images/wa-tracim-logo-144x144.png`|
|PNG, 152x152 pixels|`<branding_folder>/images/wa-tracim-logo-152x152.png`|
|PNG, 180x180 pixels|`<branding_folder>/images/wa-tracim-logo-180x180.png`|
|PNG, 192x192 pixels|`<branding_folder>/images/wa-tracim-logo-192x192.png`|
|PNG, 384x384 pixels|`<branding_folder>/images/wa-tracim-logo-384x384.png`|
|PNG, 512x512 pixels|`<branding_folder>/images/wa-tracim-logo-512x512.png`|

You can also tune the manifest file used by progressive web apps located in `<branding_folder>/manifest.json`

More documentation about this manifest file is available on [W3C website](https://www.w3.org/TR/appmanifest/).

### Safari pinned tab icon

This icon can be changed by copying your image in `<branding_folder>/images/safari-pinned-tab-icon.svg`. Its color will automatically be the primary color setup in `color.json`.

Documentation about this feature in Safari is available on [Apple's website](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html).

## Customize the login page

The login page can be customized by creating/editing some simple HTML files.

### Simple customization

Copy the [welcome-simple-text.html sample](/frontend/dist/assets/branding.sample/welcome-simple-text.html) to `<branding_folder>/welcome-simple-text.html` then write your HTML text in it and write your background image to `<branding_folder>/welcome-simple-bg.jpg`.

You can use a markdown editor to generate your HTML text, for instance [CuteMarkEd](https://cloose.github.io/CuteMarkEd/) or the [web-based StackEdit](https://stackedit.io/app#).

### Advanced customization

Create your HTML page as you want, copy its CSS file(s) and image(s) in `<branding_folder>` and change the welcome page name in `development.ini`:

```ini
website.welcome_page = my-welcome-page.html
website.welcome_page_style = my-welcome-page.css
```

The paths of the files in `development.ini` are relative to `<branding_folder>`.

These parameters can also be changed with an environment variable as described in [setting.md](/docs/administration/installation/setting.md).

In case you use CSS styling, we recommend to use the `tracimBrandingWelcomePage` class name prefix to avoid collisions with Tracim's own class names.
The additional files/images added in `<branding_folder>` are available to the browser in `/assets/branding/`, so setup the source/link references in your HTML accordingly.

You can use the [welcome-simple.html sample](/frontend/dist/assets/branding.sample/welcome-simple.html) and [welcome.css sample](/frontend/dist/assets/branding.sample/welcome-simple.css) as a starting point.

### Structure of the welcome page files

Tracim loads the HTML from `website.welcome_page` in its index HTML page. The CSS file `website.welcome_page_style` is loaded as an external CSS link.

The default `welcome-simple.html` file loads the HTML from `welcome-simple-text.html` and renders it in a rectangle whose background is `welcome-simple-bg.jpg`.

### Add Registration Terms

Tracim allows showing documents that newly registered user should accept before using Tracim.
By default, there are none, but you can add any file you want.
To do so, you can set a list of files separated by `,` in `development.ini`, an empty list mean no conditions:

```ini
website.usage_conditions = Terms Of Service.pdf,Privacy Policy.pdf
```

The paths of the files in `development.ini` are relative to `<branding_folder>`.
These parameters can also be changed with an environment variable as described in [setting.md](/docs/administration/installation/setting.md).

NB: there are no restrictions on the type of file you can add, but we suggest using a format
supported by browsers. These files it will be accessible through links.

### Change Audio file

The original audio track used here for 'incoming-call.ogg' is 'data_sounds_ringtones_Solarium.ogg', from [Android's repository]( https://android.googlesource.com/platform/frameworks/base.git) which is licensed under Apache 2.0.
If you want to change it, choose another audio file and change it's name, or change the variable.

## Customize Note as pdf conversion rendering

Tracim convert Note as PDF using both pandoc and weasyprint tool.
This process is customizable through 2 files in branding:

- The css style : `rich_text_preview.css`.
- The html template : `rich_text_preview.template`.

The first one(`rich_text_preview.css`) is a simple css file. You can use advanced feature for pagination file conversion
like `@page`. Supported css features depending on weasyprint, see [here](https://doc.courtbouillon.org/weasyprint/v52.5/features.html#css).

The second one (`rich_text_preview.template`) is a templating file of html for pandoc, see [here](https://pandoc.org/MANUAL.html#template-syntax)
for specific template syntax.


## App Custom Action

App Custom Action allows to add submenu options with custom link on various existing dropdown.

### Create an App Custom Actions

Create the configuration file `frontend/dist/assets/branding/app_custom_actions.json` from its sample source:
```bash
cp frontend/dist/assets/branding.sample/app_custom_actions.json frontend/dist/assets/branding/app_custom_actions.json
```

Edit the file `frontend/dist/assets/branding/app_custom_actions.json`.

Complete example of `frontend/dist/asset/branding/app_custom_actions.json`:
```json
{
  "user_sidebar_dropdown": [],
  "user_sidebar_shortcuts": [],
  "content_in_list_dropdown": [],
  "content_app_dropdown": [{
    "icon_text": "fas fa-chess-queen",
    "icon_image": "",
    "content_type_filter": "file",
    "content_extension_filter": ".jpg,.png",
    "content_label_regex_filter": "",
    "workspace_id_filter": "",
    "user_role_filter": "workspace-manager,content-manager,contributor,reader",
    "user_profile_filter":"administrators,trusted-users,users",
    "label": {
      "fr": "Ouvrir l'image dans SomeSoftware",
      "en": "Open image in SomeSoftware"
    },
    "link": "https://some.software.com/open?content={content.content_id}"
  }],
  "space_dashboard_action_list": []
}
```

### Structure of the file

It is a json file containing an object.

Each property of the object correspond to a **location** for the custom actions.

Each location are a list of objects containing the definition of an App Custom Actions.

**Locations:**

- `user_sidebar_dropdown`
  - Not Yet Implemented
- `user_sidebar_shortcuts`
  - Not Yet Implemented
- `content_in_list_dropdown`
  - In workspace content list, the button "..." on each contents
- `content_app_dropdown`
  - In the header of content apps, the dropdown on the button "⋮"
  - Works for app Thread, Note, File, Kanban, Logbook, Folder advanced
- `space_dashboard_action_list`
  - Not Yet Implemented

**Custom actions:**
- `icon_text`:
  - The icon preceding the submenu option. Use it for icon from css library.
  - Tracim uses font awesome for css icon library.
  - Example: `"icon_text": "fas fa-wine-bottle"`
- `icon_image`:
  - The image preceding the submenu option. Use it for images from an online source.
  - If icon_text and icon_image are set, only icon_image will be displayed.
  - Example: `"icon_image": "https://raw.githubusercontent.com/tracim/tracim/develop/doc/logos/logo_tracim.png"`
- `content_type_filter`:
  - The content type on which the App Custom Action will be available.
  - Must be a list of comma separated content type
  - Available values are: 'html-document', 'file', 'thread', 'kanban', 'logbook'.
  - Example: `"content_type_filter": "file,thread,kanban"`
- `content_extension_filter`:
  - The content extension on which the App Custom Action will be available.
  - Must be a list of comma separated extension containing the dot '.'
  - Example: `"content_extension_filter": '.jpg,.png,.gif'`
- `content_label_regex_filter`:
  - The content label pattern on which the App Custom Action will be available.
  - Must be string that will be matched as a regex. Case-insensitive.
  - Example: `"content_label_regex_filter": "some"`
    - will match "some label", "another some label" but not "last label"
- `workspace_id_filter`:
  - The workspace id on which the App Custom Action will be available.
  - Must be a list of comma separated ids
  - Example: `"workspace_id_filter": "2,10,42"`
- `user_role_filter`:
  - The user's roles on whom the App Custom Action will be available.
  - Must be a list of comma separated roles
  - Available values are: workspace-manager, content-manager, contributor, reader
  - Example: `"user_role_filter": "workspace-manager,content-manager,contributor"`
- `user_profile_filter`:
  - The user's profiles on whom the App Custom Action will be available.
  - Must be a list of comma separated profiles
  - Available values are: administrators, trusted-users, users
  - Example: `"user_profile_filter": "administrators,trusted-users"`
- `link`:
  - The on click http(s) link the submenu option will redirect to.
  - Example: `"link": "https://some.software.com/open/some_tool"`
  - You can use variables to transfert data to the link destination. Place each of them inside braces.
  - Available variables are:
    - `content.label`: The label of the current content. Url encoded.
    - `content.content_id`: The id of the current content.
    - `content.workspace_id`: The workspace id of the current content.
    - `content.author_id`: The author id of the current content.
    - `content.author_name`: The author name of the current content. Url encoded.
    - `content.url`: The url to open the content in tracim. Url encoded.
    - `user.user_id`: The id of the currently connected user. The one that will click on the App Custom Action.
    - `user.public_name`: The public name of the currently connected user. The one that will click on the App Custom Action. Url encoded
  - Example:
    - `"link": "https://some.domaine.com/open?content_label={content.label}&content={content.content_id}&space_id={content.workspace_id}`
- `label`:
  - An object containing the translation keys of the submenu option. The keys are the language id and the
  values are the translated string.
  - Available key values are: en, fr, ar, de, eo, es, it, pt
  - Example:
  - ```json
    "label": {
      "en": "my english label",
      "fr": "mon label français"
    }
```
