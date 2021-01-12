# User Custom Properties
User custom properties is a feature allowing to add instance-specific properties
for all user in the instance.

Idea is that for each user is associated some properties
which structure is defined by a JSONSchema draftv7 (specification available [here]('https://json-schema.org/specification-links.html#draft-7'))

Another specific schema, more related to the way things should be display is available too. it's
named UISchema and base specification are available [here]('https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/uiSchema/').

We do support also some tracim specific properties to have some tracim specifics behaviors in both schema.
We provide you also a way to translate theses schema.

:warning: migration of this schema is not handled by tracim, if you want to update the
schema, you must adapt the sql table `user_custom_properties` accordingly to new schema.

## Configuration
you can set a specific schema for all user of one instance by settings(`development.ini`):

Simple example:
```ini
user_custom_properties_dir = %(here)s/examples/user_custom_properties/organization
user.custom_properties.json_schema_file_path = %(user_custom_properties_dir)s/schema.json
user.custom_properties.ui_schema_file_path = %(user_custom_properties_dir)s/ui.json
user.custom_properties.translations_dir_path = %(user_custom_properties_dir)s/locale
```
see [examples files related](../examples/user_custom_properties)


### JSONSchema

configurable through:
```ini
user.custom_properties.json_schema_file_path
```

#### Tracim specific properties in json schemas

No specific properties for now in json schema.

## UISchema

configurable through:
```ini
user.custom_properties.ui_schema_file_path
```

### Tracim specific properties in ui schemas

No specific properties for now in ui schema.

## Translations

Translation of custom properties is done by api itself, which will directly return
translated schema for both UISchema and JSONSchema. Only some key parameters value are translated.
These keys parameters are:
- `description`
- `title`
- `EnumNames` (not standard JSONSchema but supported, see [here]('https://react-jsonschema-form.readthedocs.io/en/latest/usage/single/#custom-labels-for-enum-fields'))

for JSONSchema

Theses keys parameters are:
- `description`
- `title`
- `placeholder`
- `help`
- all `ui:<key>` variants of precedent keys
for UISchema.

custom properties translation files are stored in `user.custom_properties.translations_dir_path` if provided.
They should be `json` format with a name of format `<lang>.json` (lang should be ISO 639-1 code).
The content of the translations should be `{"original value": "translation value"}` key:value style, which
make them compatible with [i18next-json-v3]('https://www.i18next.com/misc/json-format#i-18-next-json-v3').

to generate translation for an existing schema, a tool is available, which does a part of the job:
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
