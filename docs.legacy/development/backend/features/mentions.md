# Mentions

## Structure

To be detected by the backend, a mention must be of the following form:

```html
<html-mention {DATA}></html-mention>
```

`DATA` can be decomposed either into `roleid="X"` or `userid="Y"` depending on if the mention is a role
mention or a user mention. X and Y are the ID of the role or user respectively.

### Examples

Mentioning everyone in a space:

```html
<html-mention roleid="0"></html-mention>
```

## Why

We store in the database the ID of the actor who is mentioned. This way we have a dynamic system,
where the mention is linked to the actor using their ID.
