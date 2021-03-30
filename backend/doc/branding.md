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

### Simple customization

Copy [frontend/dist/assets/branding/welcome-simple-text.html.sample](../../frontend/dist/assets/branding/welcome-simple-text.html.sample) to `frontend/dist/assets/branding/welcome-simple-text.html` then write your HTML text in it and write your background image to `frontend/dist/assets/branding/welcome-simple-bg.jpg`.

In the offical docker image the `branding` directory is available in `/etc/tracim/branding`.

You can use a markdown editor to generate your HTML text, for instance [CuteMarkEd](https://cloose.github.io/CuteMarkEd/) or the [web-based StackEdit](https://stackedit.io/app#).

### Advanced customization

Create your HTML page as you want, put its CSS file(s) and image(s) in `frontend/dist/assets/branding/` and change the welcome page name in `development.ini`:

```
website.welcome_page = my-welcome-page.html
website.welcome_page_style = my-welcome-page.css
```

This parameter can also be changed with an environment variable as described in [setting.md](setting.md).

In case you use CSS styling, we recommend to use the `tracimBrandingWelcomePage` class name prefix to avoid collisions with Tracim's own class names.
You can use `welcome-simple.html` and `welcome.css` as a starting point.

### Structure of the welcome page files

Tracim loads the HTML from `website.welcome_page` in its index HTML page. The CSS file `website.welcome_page_style` is loaded as an external CSS link.

The default `welcome-simple.html` file loads the HTML from `welcome-simple-text.html` and renders it it a rectangle whose background is `welcome-simple-bg.jpg`.
