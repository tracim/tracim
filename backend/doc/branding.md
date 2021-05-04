# Customize Tracim's appearance to your brand

## Title and description

The title and description of Tracim's page can be changed through `development.ini`:

```
website.title = My Tracim instance
website.description = For storing files and collaborating with people.
```

The title is displayed in the browser's page. The title and the description are used by search engines to display their results.

These parameters can also be changed with environment variables as described in [setting.md](setting.md).

## Custom login page

The login page can be customized by creating/editing some simple HTML files.

All editable files are available in a "branding" folder which is located:
- in `frontend/dist/assets/branding` if you have installed Tracim directly on your computer
- in `/etc/tracim/branding` if you are using the official Docker image.

This folder will be named `<branding_folder>` in the following documentation.

### Simple customization

Copy [welcome-simple-text.html.sample](../../frontend/dist/assets/branding/welcome-simple-text.html.sample) to `<branding_folder>/welcome-simple-text.html` then write your HTML text in it and write your background image to `<branding_folder>/welcome-simple-bg.jpg`.

You can use a markdown editor to generate your HTML text, for instance [CuteMarkEd](https://cloose.github.io/CuteMarkEd/) or the [web-based StackEdit](https://stackedit.io/app#).

### Advanced customization

Create your HTML page as you want, put its CSS file(s) and image(s) in `<branding_folder>` and change the welcome page name in `development.ini`:

```
website.welcome_page = my-welcome-page.html
website.welcome_page_style = my-welcome-page.css
```
The paths of the files in `development.ini` are relative to `<branding_folder>`.

These parameters can also be changed with an environment variable as described in [setting.md](setting.md).

In case you use CSS styling, we recommend to use the `tracimBrandingWelcomePage` class name prefix to avoid collisions with Tracim's own class names.
The additional files/images added in `<branding_folder>` are available to the browser in `/assets/branding/`, so setup the source/link references in your HTML accordingly.

You can use [welcome-simple.html.sample](../../frontend/dist/assets/branding/welcome-simple.html.sample) and [welcome.css.sample](../../frontend/dist/assets/branding/welcome-simple.css.sample) as a starting point.

### Structure of the welcome page files

Tracim loads the HTML from `website.welcome_page` in its index HTML page. The CSS file `website.welcome_page_style` is loaded as an external CSS link.

The default `welcome-simple.html` file loads the HTML from `welcome-simple-text.html` and renders it in a rectangle whose background is `welcome-simple-bg.jpg`.

### Add Registrations Terms

Tracim permit to configure some files thats newly registered user should accept before using tracim.
By default, there is none, but you can add any files you want.
To do so, you can set a list of files separated by `,` in `development.ini`, an empty list mean no conditions:

```
website.usage_conditions = Terms Of Service.pdf,Privacy Policy.pdf
```

The paths of the files in `development.ini` are relative to `<branding_folder>`.
These parameters can also be changed with an environment variable as described in [setting.md](setting.md).

NB: there is no restriction on the type of file, but we can suggest a format that can been viewed
directly from the browser, has it will be accessible through link.
