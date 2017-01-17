# API documentation

## Authentication

APi not actually implement authentication method. You must use cookies set by
frontend login.

## Timezone

### List

    GET /api/timezone/

Return list of all timezone available when creating a user

#### Response

    {
      "value_list": [
        "Africa/Abidjan",
        "Africa/Accra",
        "Africa/Addis_Ababa",
        "Africa/Algiers",
        "Africa/Asmara",
        ...
      ]
    }


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

## Users

### List

    GET /api/users/

Return list of all users of the tracim instance

#### Response

    {
      "value_list": [
        {
          "id": 0,
          "name": "Georges Abitbol",
          "email": "g.abitbol@laclasse.com",
          "canCreateWs": true,
          "isAdmin": true,
          "config": {
            "sendEmailNotif": true
          }
        }, {
          "id": 145,
          "name": "Peter",
          "email": "peter@laclasse.com",
          "canCreateWs": false,
          "isAdmin": false,
          "config": {
            "sendEmailNotif": false
        }
      ]
    }

## Users_Workspace (Role)

### List

    GET /api/users_workspace/

Return list of all roles of all workspaces the connected user has access to

#### Response

    {
      "value_list": [
        {
          "userId": 0,
          "workspaceId": 1,
          "roleId": 8,
          "subscribedNotif": true
        }, {
          "userId": 2,
          "workspaceId": 2,
          "roleId": 2,
          "subscribedNotif": true
        }, {
          "userId": 5,
          "workspaceId": 3,
          "roleId": 4,
          "subscribedNotif": false
        }
      ]
    }

## Timezone

### List

    GET /api/timezone/

Return list of all timezone available when creating a user

#### Response

    {
      "value_list": [
        "Africa/Abidjan",
        "Africa/Accra",
        "Africa/Addis_Ababa",
        "Africa/Algiers",
        "Africa/Asmara",
        ...
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
             "description":"blablabla 230",
             "type": "workspace"
          },
          {
             "id":230,
             "label":"my other calendar",
             "description":"blablabla 230",
             "type": "workspace"
          },
          {
             "id":20,
             "label":"Name of the user",
             "description":"my personnal calendar",
             "type": "user"
          }
       ]
    }
