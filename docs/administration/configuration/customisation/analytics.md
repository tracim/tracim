# Add analytics to tracim

Analytics Software can be embedded inside Tracim to log page views.

This helps to create statistics like most viewed pages.

## Description

By default, analytics software use the first page load to send the analytics data.

Since Tracim is a Single Page App (SPA), it must be done on each location change.

There is a custom js event fired by Tracim to do so: `newPageViewed`.

Listen to this event and send your data in the listener.

See `frontend/dist/assets/branding.sample/analytics.js` for a usage example.

## Embed analytics software script in Tracim

Analytics software official documentation provide the script to add.

Put it in:
```
frontend/dist/assets/branding/analytics.js
```

Alternatively, if using docker container:
```
/{docker-volume}/etc/branding/analytics.js
```

## Required CSP config

Check if CSP is activated:

development.ini
```js
content_security_policy.enabled = True
```

If False, nothing to do. If True, follow the next part:

Usually, analytics software requires 3 elements:
1. A script to hard code in the web page. This script is given by the official documentation
2. An external library that will be downloaded by 1. and added to the web page
3. A http request to send the data to the analytic server sent by the library downloaded by 2.

You need to allow the CSP for the 3 elements.

### 1. Hard coded script
The CSP authorization is handled automatically if you put the hard coded script in `branding/analytics.js`

### 2. External library
Add the source of the downloaded script to the allowed `script-src` CSP directive:
development.ini:
```ini
content_security_policy.additional_directives = script-src <analytic_lib_url>;
```

Example:
```ini
content_security_policy.additional_directives = script-src https://matomo.org/matomo.js;
```

Check the official documentation of the analytics software or check the code of `frontend/dist/assets/analytics.js` to
know the url to add.

### 3. Data sending request
Add analytics backend destination to the allowed `connect-src` CSP directive:

development.ini:
```ini
content_security_policy.additional_directives = script-src <analytic_lib_url>; connect-src <analytic_server_tracker_url>
```

example:
```ini
content_security_policy.additional_directives = script-src https://matomo.org/matomo.js; connect-src https://matomo.org/matomo.php
```

Check the official documentation of the analytics software or check the code added to analytics.js to
know the url to add.
