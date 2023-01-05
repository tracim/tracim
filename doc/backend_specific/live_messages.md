# Tracim Live Messages

Tracim Live Messages are events sent from the Tracim server to the browser client
using Server-Sent-Events (SSE) on the `/api/users/<user_id>/live_messages` endpoint.

The idea is that the browser client opens an HTTP connection and keep it opened to allow
the server to keep the user informed about changes that happened in Tracim.

## TLM Example

TLM are returned as json, for example:

```json
{
  "event_id": 42,
  "event_type": "user.created", // hierarchy in the naming: entity_type.core_event_type.optional_sub_type
  "created": "2012-04-23T18:25:43.511Z",
  "read_date": null,
  "fields": { // list of fields is different depending on the event_type
    "author": {
      "user_id": 54,
      "public_name": "John Doe",
      "username": "jdoe",
    },
    "user": {
      "user_id": 72,
      "public_name": "Spam & Eggs"
    }
  }
}
```

## TLM Types

### Core events types

Possible core event types:

- copied (__CO__ below)
- created (__CR__ below)
- deleted (__D__ below)
- modified (__MD__ below)
- moved (__MV__ below)
- undeleted (__U__ below)

### Tracim Content types

content type handled in tlm are:

- thread (topic in ui)
- html-document (note in ui)
- folder
- comment
- kanban
- todo

There are used as sub_type for the event type "content" (see section Entities below).

### Entities

Possible entity types of TLM (plus their needed fields):

|       Entity type      | Core event types |    sub_types   |                 Fields                 |                                            Comment                                           |                                     Received by                                     |
|:----------------------:|:----------------:|:-------------:|:--------------------------------------:|:--------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------:|
| user | CR/D/MD/U |  | author,user | author can be null (tracimcli), user account modification, user creation/disabling/etc | administrators, user itself, user in at least one same space |
| workspace | CR/D/MD/U |  | author,workspace | Space creation/deletion but also description/name update | same as workspace_members if confidential, all users if not (open/on_request space) |
| workspace_member | CR/D/MD |  | author,user,workspace,member | add/remove members in space but also role change | administrators, user themself (if one), space members |
| content | CO/CR/D/MD/U | any content type, e.g. "thread" | author,workspace,content | any content modification(create/update/deletion,etc) | space members |
| mention | CR |  | author,workspace,content,mention | mention with "@" in note/comment | mentioned users (all space members if @all) |
| reaction | CR/D |  | author,workspace,content,reaction,user | emoji reaction on content/comment | space members |
| workspace_subscription | CR/D/MD |  | author, workspace, subscription, user  | subscription for on request space (with validation mecanism) | administrator, subscription author, workspace managers |
| tag | CR/D/MD |  | author,workspace,tag | tag usable in space | same as workspace |
| content_tag | CR/D |  | author,workspace,tag,content | tag associated to a content | space members |
| user_call | CR/D/MD |  | author,user_call,user | call feature, user is always the callee | caller and callee users |

## Fields

Each entry in fields is a subset of the corresponding HTTP API structure.

:warning: "content" field structure vary depending on the type of content (see below).

### user and author (same as UserSchema in API)

```json
{
  "user_id": 23,
  "username": "jdoe",
  "public_name": "John Doe",
  "is_active": true,
  "is_deleted": false,
}
```

### workspace (same as WorkspaceSchema in API)

```json
{
  "workspace_id":  42,
  "label": "Tracim",
  "is_deleted": false
}
```

### content/thread, content/html-document, content/folder (same as ContentSchema in API)

```json
{
  "content_id": 6,
  "content_namespace": "",
  "slug": "helloworld",
  "label": "Hello world",
  "parent_id": 5,
  "sub_content_types": [],
  "status": "open",
  "is_archived": false,
  "is_deleted": false,
  "is_editable": true,
  "show_in_ui": true,
  "file_extension": ".html",
  "filename": "helloworld.html",
  "modified": "2012-04-23T18:28:43.511Z",
  "created": "2012-02-23T10:28:43.511Z",
  "actives_shares": 0,
  "workspace_id": 23,
  "current_revision_id": 12,
  "current_revision_type": "edition",
  "content_type": "html-document",
  "raw_content": "Foobar"
}
```

### content/file, content/kanban (same as FileContentSchema in API)

```json
{
  "content_id": 6,
  "content_namespace": "",
  "slug": "helloworld",
  "label": "Hello world",
  "parent_id": 5,
  "sub_content_types": [],
  "status": "open",
  "is_archived": false,
  "is_deleted": false,
  "is_editable": true,
  "show_in_ui": true,
  "file_extension": ".html",
  "filename": "helloworld.html",
  "modified": "2012-04-23T18:28:43.511Z",
  "created": "2012-02-23T10:28:43.511Z",
  "actives_shares": 0,
  "workspace_id": 23,
  "current_revision_id": 12,
  "current_revision_type": "edition",
  "content_type": "html-document",
  "raw_content": "Hello, world",
  "mimetype": "text/plain",
  "size": 120,
}
```

### content/comment (same as CommentSchema in API)

```json
{
  "content_id": 7,
  "parent_id": 5,
  "raw_content": "Hello",
  "author": {
    "avatar_url": null,
    "user_id": 1,
    "public_name": "John Doe"
  },
  "created": "2012-02-23T10:28:43.511Z"
}
```

### content/todo

```json
{
  "assignee_id": "2",
  "content_id": 7,
  "parent_id": 5,
  "parent_label": "New note",
  "status": "closed-deprecated"
}
```

### member

```json
{
  "role": "reader",
  "do_notify": false
}
```

### mention

```json
{
  "recipient": "all"
}
```

### subscription (same as WorkspaceSubscriptionSchema API)

```json
{
  "state":  "pending",
  "created_date": "2020-06-15T15:05:50.955Z",  "workspace":  {
    "workspace_id": 42,
    "label": "Tracim",
    "is_deleted": false
  },
  "author": {
    "avatar_url": "/api/asset/avatars/john-doe.jpg",
    "public_name": "John Doe",
    "user_id": 3,
    "username": "My-Power_User99"
  },
  "evaluation_date": null,
  "evaluator": {
    "avatar_url": "/api/asset/avatars/john-doe.jpg",
    "public_name": "John Doe",
    "user_id": 3,
    "username": "My-Power_User99"
  }
}
```

### tag (same as TagSchema in API)

```json
{
  "tag_name": "A tag",
  "tag_id": 23,
  "workspace_id": 12
}
```

### user_call (same as UserCallSchema in API)

```json
{
  "call_id": 12,
  "caller": {
    "user_id": 12,
    "public_name": "A user",
    "username": "auser",
    "has_avatar": true,
    "has_cover": false
  },
  "callee": {
    "user_id": 42,
    "public_name": "Another user",
    "username": "another-user",
    "has_avatar": false,
    "has_cover":
    false
  },
  "state": "in_progress",
  "created": "2021-08-18T12:12:02",
  "modified": "2021-08-18T12:12:02",
  "url": "https://meet.jit.si"
}
```
