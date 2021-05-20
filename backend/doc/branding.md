# Customize Tracim's appearance to your brand

All editable files (with the exception of `development.ini`) are available in a `branding` folder which is located:
- in `frontend/dist/assets/branding` if you have installed Tracim directly on your computer
- in `/etc/tracim/branding` if you are using the official Docker image (which exposes `/etc/tracim` as a docker volume).

This folder will be named `<branding_folder>` in the following documentation.

## Title and description

The title and description of Tracim's page can be changed through `development.ini`:

```
website.title = My Tracim instance
website.description = For storing files and collaborating with people.
```

The title is displayed in the browser's page. The title and the description are used by search engines to display their results.

These parameters can also be changed with environment variables as described in [setting.md](setting.md).

## Main colors used by the user interface

You can change the default colors used in Tracim by editing the `color.json` file which you can find in the branding folder. See the [color.json sample](../../frontend/dist/assets/branding.sample/color.json) for the default configuration file.

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

Copy your image in `<branding_folder>/images/tracim-logo.png`. Its size should be 150x38 pixels.

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

Copy the [welcome-simple-text.html sample](../../frontend/dist/assets/branding.sample/welcome-simple-text.html) to `<branding_folder>/welcome-simple-text.html` then write your HTML text in it and write your background image to `<branding_folder>/welcome-simple-bg.jpg`.

You can use a markdown editor to generate your HTML text, for instance [CuteMarkEd](https://cloose.github.io/CuteMarkEd/) or the [web-based StackEdit](https://stackedit.io/app#).

### Advanced customization

Create your HTML page as you want, copy its CSS file(s) and image(s) in `<branding_folder>` and change the welcome page name in `development.ini`:

```
website.welcome_page = my-welcome-page.html
website.welcome_page_style = my-welcome-page.css
```
The paths of the files in `development.ini` are relative to `<branding_folder>`.

These parameters can also be changed with an environment variable as described in [setting.md](setting.md).

In case you use CSS styling, we recommend to use the `tracimBrandingWelcomePage` class name prefix to avoid collisions with Tracim's own class names.
The additional files/images added in `<branding_folder>` are available to the browser in `/assets/branding/`, so setup the source/link references in your HTML accordingly.

You can use the [welcome-simple.html sample](../../frontend/dist/assets/branding.sample/welcome-simple.html) and [welcome.css sample](../../frontend/dist/assets/branding.sample/welcome-simple.css) as a starting point.

### Structure of the welcome page files

Tracim loads the HTML from `website.welcome_page` in its index HTML page. The CSS file `website.welcome_page_style` is loaded as an external CSS link.

The default `welcome-simple.html` file loads the HTML from `welcome-simple-text.html` and renders it in a rectangle whose background is `welcome-simple-bg.jpg`.

### Add Registration Terms

Tracim allows showing documents that newly registered user should accept before using Tracim.
By default, there are none, but you can add any file you want.
To do so, you can set a list of files separated by `,` in `development.ini`, an empty list mean no conditions:

```
website.usage_conditions = Terms Of Service.pdf,Privacy Policy.pdf
```

The paths of the files in `development.ini` are relative to `<branding_folder>`.
These parameters can also be changed with an environment variable as described in [setting.md](setting.md).

NB: there are no restrictions on the type of file you can add, but we suggest using a format
supported by browsers. These files it will be accessible through links.
