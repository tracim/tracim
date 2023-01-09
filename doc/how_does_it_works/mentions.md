# Mentions

## Structure

To be detected by the backend, a mention must be under the following:

```html
<html-mention {DATA}></html-mention>
```

`DATA` can be decomposed either into `roleid="X"` or `userid="Y"` depending if the mention is a role
mention or a user mention.

### Examples

Mentionning everyone in a space:

```html
<html-mention roleid="0"></html-mention>
```

## Why

We store in the database the id of the actor who is mentioned. This way we have a dynamic system,
where the mention is linked to the actor using the ID.
