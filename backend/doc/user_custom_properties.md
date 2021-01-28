# User Custom Properties

User custom properties allow adding instance-specific properties
for the users of the instance.

The structure of those user properties should be defined in a json schema file. Specification available [here]('https://json-schema.org/specification-links.html#draft-7')).

It is possible to fine-tune the display and edition behavior of those properties by
the Tracim frontend in a separate file (named UI schema). Its syntax can be found [here](https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/uiSchema/).

We do support also some Tracim specific parameters to have some Tracim specifics behaviors in both schema.

User-visible parts of these properties (title/description/…) can be translated by providing translations files (see Translations section),
these translations will allow the backend to automatically translate both the UI Schema and JSONSchema according
to connected user lang.

:warning: Tracim does not handle changes in the property schema when custom property values are already existing in the database.
If you want to change the schema in an incompatible way with the existing property values you'll have to update the `user_custom_properties` table manually.

## Configuration

You can set a schema for all users of the instance in the settings (`development.ini`):

Simple example with `user.custom_properties.dir` shortcut:
```ini
user.custom_properties.dir = %(here)s/examples/user_custom_properties/organization
user.custom_properties.json_schema_file_path = %(user.custom_properties.dir)s/schema.json
user.custom_properties.ui_schema_file_path = %(user.custom_properties.dir)s/ui.json
user.custom_properties.translations_dir_path = %(user.custom_properties.dir)s/locale
```
See [examples files related](../examples/user_custom_properties).


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

#### The display_group property

This property is mandatory for properties to appear in the Tracim user interface.

The Tracim user interface has two forms where user properties can be displayed in the public profile page: `Information` and `Personal data`.

Each user property can be assigned to one or the other form using the special key `tracim:display_group` in the UI schema file.  

To display a property in the `Information` column, use `"tracim:display_group": "public_profile_first"`.

To display a property in the `Personal data` column, use `"tracim:display_group": "public_profile_second"`.

See [ui schema](../examples/user_custom_properties/organization/ui.json) for an example.


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
- all the `ui:<key>` variants of the previous fields for UISchema.

Custom properties translation files are stored in `user.custom_properties.translations_dir_path` if provided.
They should be `json` format with a name of format `<lang>.json` (lang should be ISO 639-1 code).
The content of the translations should be `{"original value": "translation value"}` key:value style, which
make them compatible with [i18next-json-v3]('https://www.i18next.com/misc/json-format#i-18-next-json-v3').

To generate translation for an existing schema, a tool is available, which does a part of the job:
```shell
 $ tracimcli dev custom-properties extract-translation-source
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
 'roles in the organization': ''
}`
```
