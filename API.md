# API documentation

## Authentication

APi not actually implement authentication method. You must use cookies set by
frontend login.

## Workspaces

### List

    GET /api/workspaces/

Return list of workspaces acessible by current connected user.

#### Response

    {
       "value_list":[
          {
             "id":30,
             "label":"my calendar",
             "description":"blablabla",
             "has_calendar":"true"
          },
          {
             "id":230,
             "label":"my calendar other",
             "description":"blablabla 230",
             "has_calendar":"true"
          }
       ]
    }

## Calendars

### List

    GET /api/calendars/

Return list of calendars accessible by current connected user.

#### Response

    {
       "value_list":[
          {
             "id":30,
             "label":"my calendar",
             "description":"blablabla 230"
          },
          {
             "id":230,
             "label":"my other calendar",
             "description":"blablabla 230"
          },
          {
             "id":20,
             "label":"Name of the user",
             "description":"my personnal calendar"
          }
       ]
    }
