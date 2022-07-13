# Roles in Tracim

In Tracim, there are two systems of "roles".

One is global to whole Tracim instance and is called `global profile` (Groups).
The other is workspace-related and is called `workspace role`.

## Global Profile

Available slugs:
- `users` is for normal users.
- `trysted-users` is for trusted users.
- `administrators` is for admin.

|                               | Normal User | Trusted User    | Admin   |
|-------------------------------|-------------|-------------|---------|
| access to Tracim apps/contents_types/timezones_list         |  yes        | yes         | yes     |
| participate to workspaces     |  yes        | yes         | yes     |
|-------------------------------|-------------|-------------|---------|
| get list of user workspace    | personal-only        | personal_only       | yes     |
| get know_users of user        | personal-only        | personal-only        | yes     |
| access to all user data (/users/{user_id} endpoints) |personal-only|personal-only| yes     |
| set user info                 |personal-only|personal-only| yes     |
| set content as read/unread for user | personal-only | personal-only | yes |
| enable/disable user notification for workspace | personal-only | personal-only | yes |
|-------------------------------|-------------|-------------|---------|
| create workspace              |  no         | yes         | yes     |
| invite user to Tracim         |  no         | yes, if manager of a given workspace         | yes     |
| delete workspace              |  no         | yes, if manager of a given workspace         | yes     |
|-------------------------------|-------------|-------------|---------|
| get list of all user          | no          | no          | yes     |
| get list of all worskpace     | no          | no          | yes     |
| set user global profile rights|  no         | no          | yes     |
| activate/deactivate user      |  no         | no          | yes     |
| delete user/ undelete user    |  no         | no          | yes     |


## Workspace Roles

A workspace role is a role that is specific to a workspace.<br>
Available slugs:
- `reader` is for readers.
- `contributor` is for contributors.
- `content-manager` is for content managers.
- `workspace-manager` is for workspace managers.


|                              | Reader | Contributor | Content Manager | Workspace Manager |
|------------------------------|--------|-------------|-----------------|-------------------|
| read content                 |  yes   | yes         | yes             | yes               |
| get workspace members list   |  yes   | yes         | yes             | yes               |
|------------------------------|--------|-------------|-----------------|-------------------|
| create content*              |  no    | yes         | yes             | yes               |
| edit content                 |  no    | yes         | yes             | yes               |
| copy content                 |  no    | yes         | yes             | yes               |
| comments content             |  no    | yes         | yes             | yes               |
| update content status        |  no    | yes         | yes             | yes               |
-------------------------------|--------|-------------|-----------------|-------------------|
| create folder                |  no    | no          | yes             | yes               |
| move content                 |  no    | no          | yes             | yes               |
| archive content              |  no    | no          | yes             | yes               |
| delete content               |  no    | no          | yes             | yes               |
|------------------------------|--------|-------------|-----------------|-------------------|
| edit workspace               |  no    | no          | no              | yes               |
| invite users (to workspace)  |  no    | no          | no              | yes               |
| set user workspace role      |  no    | no          | no              | yes               |
| revoke users (from workspace)|  no    | no          | no              | yes               |
|------------------------------|--------|-------------|-----------------|-------------------|
| modify comments              |  no    | owner       | owner           | yes               |
| delete comments              |  no    | owner       | owner           | yes               |
-------------------------------|--------|-------------|-----------------|-------------------|
| share content**              | no     | no          | yes             | yes               |
| give upload permission***    | no     | no          | yes             | yes               |

 *: folder content not included.

 **: share with link/email to external user. The share content feature needs to be activated in the workspace by the
 workspace manager (see "edit workspace").

 ***: allow with link/email external user to upload some files in workspace inbox. The upload permission feature needs to be activated in the workspace by the workspace manager (see "edit workspace").

### To do roles
On top of the [workspace roles](#workspace-roles) we add the assignee and owner role. They don't have a specific slug, but they are defined by the following rules:
  - assignee: the user is assigned to the todo.
  - owner: the user is the owner of the todo.

|| Reader | Reader + assignee | Reader + owner | Contributor | Contributor + assignee | Contributor + owner | Content Manager | Workspace Manager |
|-|-|-|-|-|-|-|-|-|
| create todo | no | no | no | yes | yes | yes | yes | yes |
| update todo (check/uncheck) | no | yes | no | no | yes | yes | yes | yes | yes |
| delete todo | no | no | no | no | no | yes | yes | yes |
