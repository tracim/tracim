# Customize Tracim's appearance to your brand

Blabla…

## Title and description

The title and description of Tracim's page can be changed through `development.ini`:

```
website.title = My Tracim instance
website.description = For storing files and collaborating with people.
```

The title is displayed in the browser's page and is also used by search engine to display their results. The description is used by search engines to display their results.

These parameters can also be changed with environment variables as described in [setting.md](setting.md).

## Custom login page

### Simple customization

Copy `frontend/dist/assets/branding/welcome-simple-text.html.sample` to `frontend/dist/assets/branding/welcome-simple-text.html` then write your HTML text in it and write your background image to `frontend/dist/assets/branding/welcome-simple-bg.jpg`.

You can use a markdown editor to generate your HTML text, for instance [CuteMarkEd](https://cloose.github.io/CuteMarkEd/) or the [web-based xxx]().

### Advanced customization

Create your HTML page as you want, put its + its CSS+images in `assets/branding/` and change the welcome page name in `development.ini`:

```
website.welcome_page = my-welcome-page.html
```

This parameter can also be changed with an environment variable as described in [setting.md](setting.md).

In case you use CSS styling, we recommend to use the `tracimBrandingWelcomePage` class name prefix to avoid collisions with Tracim's own class names.
You can use `welcome-simple.html` and `welcome.css` as a starting point.
