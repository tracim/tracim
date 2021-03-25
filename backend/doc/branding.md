# Customize Tracim's appearance to your brand

Blabla…

## Title and description

The title and description of Tracim's page can be changed through `development.ini`:

```
website.title = My Tracim instance
website.description = For storing files and collaborating with people.
```

These parameters can also be changed with environment variables as described in [setting.md](setting.md).

## Custom login page

Two levels:

- simple: only copy `welcome-simple-text.html.sample` to `welcome-simple-text.html`, write your text in it and put your background image in `assets/branding/welcome-simple-bg.jpg`
- advanced: create your HTML page as you want, put its + its CSS+images in `assets/branding/` and change the welcome page name in `development.ini`:

```
website.welcome_page = my-welcome-page.html
```

This parameter can also be changed with an environment variable as described in [setting.md](setting.md).

In this case we recommend to use the `tracimBrandingWelcomePage` CSS class name prefix to avoid collisions with Tracim's own class names.
You can use `welcome-simple.html` and `welcome-simple.css` as a starting point.
