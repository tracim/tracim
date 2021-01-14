# User Custom Properties

User custom properties allow adding instance-specific properties
for the users of the instance.

Idea is that for each user is associated some properties
which structure is defined by a JSONSchema draftv7 (specification available [here]('https://json-schema.org/specification-links.html#draft-7'))

Another specific schema, more related to the way things should be display is available too. It's
named UISchema and base specification are available [here]('https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/uiSchema/').

We do support also some Tracim specific properties to have some Tracim specifics behaviors in both schema.
We provide you also a way to translate theses schema.

:warning: Tracim does not handle changes in the properties schema when custom property values are already existing in the database.
If you want to change the schema in an incompatible way with the existing property values you'll have to update the `user_custom_properties` table manually.

## Configuration

You can set a schema for all users of the instance in the settings (`development.ini`):

Simple example:
```ini
user_custom_properties_dir = %(here)s/examples/user_custom_properties/organization
user.custom_properties.json_schema_file_path = %(user_custom_properties_dir)s/schema.json
user.custom_properties.ui_schema_file_path = %(user_custom_properties_dir)s/ui.json
user.custom_properties.translations_dir_path = %(user_custom_properties_dir)s/locale
```
see [examples files related](../examples/user_custom_properties)


### JSONSchema

Configurable through:
```ini
user.custom_properties.json_schema_file_path
```

#### Tracim specific properties in json schemas

No specific properties for now in json schema.

## UISchema

Configurable through:
```ini
user.custom_properties.ui_schema_file_path
```

### Tracim specific properties in ui schemas

No specific properties for now in ui schema.

## Translations

The json and ui schema returned in the HTTP API are directly translated.
The following json schema field values are translated:
- `description`
- `title`
- `EnumNames` (not standard JSONSchema but supported, see [here]('https://react-jsonschema-form.readthedocs.io/en/latest/usage/single/#custom-labels-for-enum-fields'))


The following ui schema field values are translated:
- `description`
- `title`
- `placeholder`
- `help`
- all the `ui:<key>` variants of the previous fields
for UISchema.

Custom properties translation files are stored in `user.custom_properties.translations_dir_path` if provided.
They should be `json` format with a name of format `<lang>.json` (lang should be ISO 639-1 code).
The content of the translations should be `{"original value": "translation value"}` key:value style, which
make them compatible with [i18next-json-v3]('https://www.i18next.com/misc/json-format#i-18-next-json-v3').

To generate translation for an existing schema, a tool is available, which does a part of the job:
```shell
 $ tracimcli dev custom-properties translate template
{'Address': '',
 'Administrator': '',
 'Biography': '',
 'Birthday date': '',
 'Designer': '',
 'Developer': '',
 'First name': '',
 'Give use some informations about you.': '',
 'Last name': '',
 'Manager': '',
 'Organization': '',
 'Phone number': '',
 'System Administrator': '',
 'User Info': '',
 'address of the user': '',
 'info about a user in this organization': '',
 'name': '',
 'roles in the organization': ''
}`
```
