App Agenda for Tracim
===================

This folder is a fullscreen app loaded by Tracim.

The app wrap OpenCalendar which is a full js implementation of the protocol caldav.

It allows to create events and to connect to it through any tool that implements caldav protocol (eg. thunderbird)

### Build the app

see [FrontEnd dev setup doc](/docs/developer/setup_env/setup_frontend.md)

### Specific `debug.js` configuration

none

### Working on the OpenCalendar app using Tracim's radical server

#### Open CORS for OpenCalendar dev server

OpenCalendar dev server address: http://localhost:5173/

Update backend/development.ini
```ini
cors.access-control-allowed-origin = http://localhost:5173
caldav.radicale.headers.Access-Control-Allow-Origin = http://localhost:5173/
```

#### Start Tracim radical server

```bash
tracimcli caldav start
```

See [Running Tracim components locally](/docs.legacy/administration/installation/running_tracim_components_locally.md)

#### Update OpenCalendar index.html

On OpenCalendar repo, in index.html, update call to `createCalendar()` parameters:
```js
const username = 'admin@admin.admin'
const password = 'admin@admin.admin'
createCalendar(
  [
    // Fetch all available agenda for user admin@admin.admin
    {
      serverUrl: 'http://localhost:7999/dav/',
      headers: getBasicAuthHeaders({ username, password })
    },
    // Alternatively, you can pass each agenda manually
    // {
    //   calendarUrl: "http://localhost:7999/dav/agenda/workspace/1/",
    //   headers: getBasicAuthHeaders({ username, password })
    // },
  ],
  [
    // Fetch all available address book for user admin@admin.admin
    {
      serverUrl: 'http://localhost:7999/dav/',
      headers: getBasicAuthHeaders({ username, password })
    },
    // Alternatively, you can pass each address book manually
    // {
    //   addressBookUrl: "http://localhost:7999/dav/addressbook/workspace/1/",
    //   headers: getBasicAuthHeaders({ username, password })
    // },
  ],
  document.getElementById('open-calendar'),
  {
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    userContact: {
      email: username
    },
  }
)
```

#### Start OpenCalendar dev server

```bash
yarn run dev
```

### Other available yarn scripts

see [Yarn scripts doc](/docs.legacy/development/frontend/scripts.md)

### Before pushing changes to this app, you must

see [Before Push doc](/docs/contribution/code/before_push.md)
