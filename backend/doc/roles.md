# Introduction

In Tracim, you have 2 system of "roles".

One is global to whole tracim instance and is called "global profile" (Groups).
The other is workspace related and is called "workspace role".

## Global profile

|                               | Normal User | Trusted User    | Admin          |
|-------------------------------|-------------|-------------|----------------|
| slug                          | users       | trusted-users    | administrators |
|-------------------------------|-------------|-------------|---------|


|                               | Normal User | Trusted User    | Admin   |
|-------------------------------|-------------|-------------|---------|
| access to tracim apps/contents_types/timezones_list         |  yes        | yes         | yes     |
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
| invite user to tracim         |  no         | yes, if manager of a given workspace         | yes     |
| delete workspace              |  no         | yes, if manager of a given workspace         | yes     |
|-------------------------------|-------------|-------------|---------|
| get list of all user          | no          | no          | yes     |
| get list of all worskpace     | no          | no          | yes     |
| set user global profile rights|  no         | no          | yes     |
| activate/deactivate user      |  no         | no          | yes     |
| delete user/ undelete user    |  no         | no          | yes     |
|-------------------------------|-------------|-------------|---------|




## Workspace Roles


|                              | Reader | Contributor | Content Manager | Workspace Manager |
|------------------------------|--------|-------------|-----------------|-------------------|
| slug                         | reader | contributor | content-manager |  workspace-manager|
|------------------------------|--------|-------------|-----------------|-------------------|

|                              | Reader | Contributor | Content Manager | Workspace Manager |
|------------------------------|--------|-------------|-----------------|-------------------|
| read content                 |  yes   | yes         | yes             | yes               |
| get workspace members list   |  yes    | yes         | yes             | yes              |
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
| modify comments              |  no    | owner       | owner             | yes             |
| delete comments              |  no    | owner       | owner             | yes             |
 
  *: folder content not included.
