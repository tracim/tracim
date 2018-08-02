# Introduction

In Tracim, you have 2 system of "roles".

One is global to whole tracim instance and is called "global profile" (Groups).
The other is workspace related and is called "workspace role".

## Global profile

|                               | Normal User | Managers    | Admin          |
|-------------------------------|-------------|-------------|----------------|
| slug                            | users       | managers    | administrators |
|-------------------------------|-------------|-------------|---------|


|                               | Normal User | Managers    | Admin   |
|-------------------------------|-------------|-------------|---------|
| participate to workspaces     |  yes        | yes         | yes     |
| access to tracim apps         |  yes        | yes         | yes     |
|-------------------------------|-------------|-------------|---------|
| create workspace              |  no         | yes         | yes     |
| invite user to tracim         |  no         | yes, if manager of a given workspace         | yes     |
|-------------------------------|-------------|-------------|---------|
| set user global profile rights|  no         | no          | yes     |
| deactivate user               |  no         | no          | yes     |
|-------------------------------|-------------|-------------|---------|
| access to all user data (/users/{user_id} endpoints) |personal-only|personal-only| yes     |




## Workspace Roles


|                              | Reader | Contributor | Content Manager | Workspace Manager |
|------------------------------|--------|-------------|-----------------|-------------------|
| slug                         | reader | contributor | content-manager |  workspace-manager|
|------------------------------|--------|-------------|-----------------|-------------------|

|                              | Reader | Contributor | Content Manager | Workspace Manager |
|------------------------------|--------|-------------|-----------------|-------------------|
| read content                 |  yes   | yes         | yes             | yes               |
|------------------------------|--------|-------------|-----------------|-------------------|
| create content               |  no    | yes         | yes             | yes               |
| edit content                 |  no    | yes         | yes             | yes               |
| copy content                 |  no    | yes         | yes             | yes               |
| comments content             |  no    | yes         | yes             | yes               |
| update content status        |  no    | yes         | yes             | yes               |
-------------------------------|--------|-------------|-----------------|-------------------|
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
 
 
