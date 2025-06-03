# Create a new app in Tracim

This documentation provide details to create a new app called "Example" with its associated content type "contents/example".  
To create your own app, replace every name "example" by your own name. Respect the case.  

## Frontend

### Create the new app

Create a folder frontend_app_example and the app entry point `index.js`.
```bash
mkdir frontend_app_example
cd frontend_app_example
touch index.js
```

The entry point must create a variable available at document root (here, `appExample`) with the following content:  
**index.js**  
```js
const appExample = {
  name: 'example',
  isRendered: false,
  renderAppPopupCreation: data => {
    // INFO - The code bellow calls the Tracim api to create a new content of content type "example"
    // It is here to help create the first content. The api must be ready to accept this call and the
    // content_type must exist in backend
    // See # Backend part
    const button = document.createElement('button')
    button.innerHTML = 'Create a content example'
    button.onclick = async () => {
      const spaceToCreateExampleInto = 1
      const response = await fetch(`/api/workspaces/${spaceToCreateExampleInto}/contents`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          parent_id: null,
          content_type: 'example',
          content_namespace: 'content',
          label: 'First example'
        })
      })
      if (response.status === 200) {
        console.log('Example created !', response)
      } else {
        console.log('Error in creation', response)
      }
    }

    const element = document.getElementById(data.config.domContainer)
    element.appendChild(button)
  },
  renderAppFeature: data => {
    const element = document.getElementById(data.config.domContainer)
    element.innerHTML = 'App renders here'
  },
  unmountApp: domId => {
    const element = document.getElementById(domId)
    element.remove()
  }
}
```
Implement the content of the 3 functions renderAppFeature, unmountApp, renderAppPopupCreation.
- **renderAppPopupCreation**
  - Called when creating a new content for this content type by clicking on the dropdown to create a content in a space content list
  - It should create a popin in HTML and insert it in the intended DOM container which id is `data.config.domContainer`
  - It should show a popin asking for the name of the content
  - The popin should have the style `position: absolute`
- **renderAppFeature**
  - Called when opening a content of that type by clicking on it in the space content list
  - It should create the app in HTML and insert it in the intended DOM container which id is `data.config.domContainer`
  - It should show the app details
  - If the app is in React, it can include any components from frontend_lib/
- **unmountApp**
  - Called when closing the app
  - It should remove the node from DOM

If the app relies on a bundling process, it must be configured to create a library that expose a variable `appExample`.

### Add the new app to the appInterface.js

In `frontend/src/util/appInterface.js`, in the switch case, add a case for the app.  
**frontend/src/util/appInterface.js**
```js
case 'example' // the name is the one from appExample.name in the app
    return appExample // the name is the root variable in the app
```
In the comment to declare "global", add library name (`appExample`).  
This is to avoid linting error for unknown variable.  

Rebuild frontend app.  
```bash
./frontend/build_frontend.sh
```

### Add the new content type in frontend_lib

In frontend_lib/src/constant.js, add the content type to the constant CONTENT_TYPE:  
**frontend_lib/src/constant.js**  
```js
export const CONTENT_TYPE = {
  EXAMPLE: 'example',
  // ...
}
```

### Add a default color to the app

In frontend/dist/assets/branding.sample/color.json and your frontend/dist/assets/branding/color.json,  
add to, respectively, default values and your value:  
**frontend/dist/assets/branding.sample/color.json** and **frontend/dist/assets/branding/color.json**  
```json
"contents/example": "#123456",
```
Set the color of your choice.

### Create a script to copy the app in frontend

Create a script to copy the entry point (bundled if required) to the folder frontend/dist/app.  
The file in frontend/dist/app must be named example.app.optimized.js  
**frontend_app_example/build_app.sh**  
```bash
cp ./index.js ../frontend/dist/app/example.app.optimized.js
```

### Handle the notification for the new content type

Notifications rely on TLMs.  
See [tlm_event_socket.md](/docs/api-integration/tlm_event_socket.md) for how TLMs work.

The file frontend/src/container/ReduxTlmDispatcher.jsx declares the handlers for the TLMs related to content types.  
Add the following handlers declarations to the parameter of `props.registerLiveMessageHandlerList()` in:  

**frontend/src/container/ReduxTlmDispatcher.jsx**
```js
{ entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.EXAMPLE, handler: this.handleContentCreated },
{ entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.EXAMPLE, handler: this.handleContentModified },
{ entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.EXAMPLE, handler: this.handleContentDeleted },
{ entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.EXAMPLE, handler: this.handleContentUnDeleted },
```
The handlers are generic for every content types.

### Add the app to the html page of development server

The development server is started with the command `yarn run server` in frontend/.

In frontend/dist/index.html, add the following html line in the `body` tag, after the declaration of
/app/tracim_frontend_lib.lib.optimized.js:  
**frontend/dist/index.html,**  
```html
<script type='text/javascript' src='/app/example.app.js'></script>
```

### Translation

The app can have its own translation process or use the Tracim one.  

Tracim frontend translation rely on i18next-scanner.  
To use it, add the dependency:  
```bash
npm install --save-dev i18next-scanner@4.4.0
```
Copy the i18n file of an existing app and add it to the new app.
```bash
cp frontend_app_file/src/i18n.js frontend_app_example/src/i18n.js
```
In frontend_app_example/src/i18n.js, replace i18n.tracimId with the app name.  
**frontend_app_example/src/i18n.js**  
```js
i18n.tracimId = 'frontend_app_example'
```

Create the script in package.json to generate the translation files  
**frontend_app_example/package.json**  
```json
"scripts": {
  ...,
  "build:translation": "node ../i18next.scanner.js"
}
```
Run it once to generate the folder tree.
```bash
cd frontend_app_example
npm run build:translation
```

In the build script, add a script to copy the generated translation files to the frontend/dist/app/ folder.  
**frontend_app_example/build_app.sh**  
```bash
cp ./index.js ../frontend/dist/app/example.app.optimized.js

for lang in $(ls i18next.scanner); do
    echo "copying ${lang}/translation.json"
    cp i18next.scanner/"${lang}"/translation.json ../frontend/dist/app/example_"${lang}"_translation.json
done
```

Update frontend/src/util/i18n.js by requiring each new translation files:  
**frontend/src/util/i18n.js**
```js
const exampleEnTranslation = require('../../dist/app/example_en_translation.json')
const exampleFrTranslation = require('../../dist/app/example_fr_translation.json')
const examplePtTranslation = require('../../dist/app/example_pt_translation.json')
const exampleDeTranslation = require('../../dist/app/example_de_translation.json')
const exampleArTranslation = require('../../dist/app/example_ar_translation.json')
const exampleEsTranslation = require('../../dist/app/example_es_translation.json')
const exampleNbNOTranslation = require('../../dist/app/example_nb_NO_translation.json')
```
Add the translation object for each language to the appropriate language object in `i18n.init.resource` declaration.  
Example for the lang english:  
```js
resources: {
  en: {
    translation: {
      // ...,
      exampleEnTranslation
    }
```

See `i18next.scanner.js` `option.func.list` for the available translation functions.  
Optional, add additional file extension if required.

## Backend

### Add the app to the backend configuration

In backend/development.ini.sample and your backend/development.ini  
Add to, respectively, app.enabled default value and your value:  
**backend/development.ini.sample** and your **backend/development.ini**  
```ini
contents/example
```

### Add the content type in backend

In backend/tracim_backend/app_models/contents.py  
Add the content type to the class ContentTypeSlug:  

**backend/tracim_backend/app_models/contents.py**  
```python
class ContentTypeSlug(str, Enum):
  EXAMPLE = "example"
  # ...
```

Add the app to the properties of the class ContentTypeList:  
**backend/tracim_backend/app_models/contents.py**  
```python
@property
def Example(self) -> TracimContentType:
    return self.get_one_by_slug(ContentTypeSlug.EXAMPLE.value)
```

### Create the app in backend

Create the folder backend/tracim_backend/applications/content_example/  
```bash
mkdir backend/tracim_backend/applications/content_example
```

In backend/tracim_backend/applications/content_example  
Create 3 files:  
**backend/tracim_backend/applications/content_example/__init__.py**  
empty file  

**backend/tracim_backend/applications/content_example/application.py**  
```python
from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.config import CFG
from tracim_backend.lib.core.mention import DescriptionMentionParser
from tracim_backend.lib.core.mention import MentionBuilder
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.models.roles import WorkspaceRoles


class ContentExampleApp(TracimApplication):
    def load_content_types(self) -> None:
        content_type = TracimContentType(
            slug=ContentTypeSlug.EXAMPLE.value,
            fa_icon=self.fa_icon,
            label="Example",
            creation_label="Create an example",
            available_statuses=content_status_list.get_all(),
            slug_aliases=["page"],
            file_extension=".example",
            minimal_role_content_creation=WorkspaceRoles.CONTRIBUTOR,
            app=self,
        )
        self.content_types.append(content_type)
        MentionBuilder.register_content_type_parser(
            ContentTypeSlug.EXAMPLE.value, DescriptionMentionParser()
        )

    def load_config(self, app_config: CFG) -> None:
        pass

    def check_config(self, app_config: CFG) -> None:
        pass

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        from tracim_backend.applications.content_example.controller import (
            ExampleController,
        )

        example_controller = ExampleController()
        configurator.include(example_controller.bind, route_prefix=route_prefix)


def create_app() -> TracimApplication:
    return ContentExampleApp(
        label="Example",
        slug="contents/{}".format(ContentTypeSlug.EXAMPLE.value),
        fa_icon="fas fa-magic",
        config={},
        main_route="",
    )
```
You can customize the 2 labels, creation_label, file_extension and fa_icon

**backend/tracim_backend/applications/content_example/controller.py**  
```py
# cod#ing=utf-8
from http import HTTPStatus
from pyramid.config import Configurator
import transaction
import typing

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.config import CFG  # noqa: F401
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import ContentTypeChecker
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS

SWAGGER_TAG__CONTENT_EXAMPLE_SECTION = "Example"
SWAGGER_TAG__CONTENT_EXAMPLE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS, SWAGGER_TAG__CONTENT_EXAMPLE_SECTION
)
is_example_content = ContentTypeChecker([ContentTypeSlug.EXAMPLE.value])


class ExampleController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_EXAMPLE_ENDPOINTS])
    @check_right(is_reader)
    @check_right(is_example_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(ContentSchema())
    def get_example(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Get example info
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=ContentTypeSlug.ANY.value)
        return api.get_content_in_context(content)

    def bind(self, configurator: Configurator) -> None:
        # Get example
        configurator.add_route(
            "example",
            "/workspaces/{workspace_id}/examples/{content_id}",
            request_method="GET",
        )
        configurator.add_view(self.get_example, route_name="example")
```
The endpoint to create the content already exists and is generic. See create_generic_content in
`backend/tracim_backend/views/core_api/workspace_controller.py`

### Declare the app as available

**backend/tracim_backend/config.py**  
In the function `_load_enabled_apps_config`, add `"contents/example,"`, to the concatenated string default_enabled_app  
In the function `_load_enabled_app`, add `"contents/example",`, to the tuple default_app_order  
Carefully check the commas, default_enabled_app is a string while default_app_order is a tuple.  

## Docker

Add the app to the Dockerfile environment variable DEFAULT_APP_LIST  

**tools_docker/Debian_New_Uwsgi/Dockerfile**  
**tools_docker/Debian_Uwsgi/Dockerfile**  
**tools_docker/Debian_Uwsgi_ARM64/Dockerfile**  
```dockerfile
ENV DEFAULT_APP_LIST="[...],contents/example"
```

## Search

To allow the search to filter the app specifically, add the app to ALL_CONTENT_TYPES.  
**frontend/src/util/helper.js**  
```js
ALL_CONTENT_TYPES="[...],example"
```

Add the app to the facets of advanced search:  
**frontend/src/util/helper.js**  
```js
SEARCH_CONTENT_FACETS = {
  // ...,
  TYPE: {
    items: [
      // ...,
      i18n.t('example_search')
    ]
  }
}
```

## Troubleshooting

To check that the app works, try to create a new content of type "example".  
Open the content list page of a space.  
Example url: /ui/workspaces/1/contents  
Click on the "+ Create" button.  

If the content type is visible in the dropdown, the app and content type are properly declared in backend.  

When clicking on the app in the dropdown, the code from frontend_app_example/index.js::renderPopupCreateContent should
be executed and render the popin.  

If the popin doesn't open, check js console.  

### "example does not exist. Maybe it hasn't finished loading yet? Retrying in 500ms"

Check frontend/src/util/appInterface.js.  
The name of the case or of the app in the switch case might not match the name in frontend_app_example/index.js.  

Alternatively, check that the app source `example.app.optimized.js` is in the folder `frontend/dist/app`.  
If missing, the script `frontend_app_example/build_app.sh` might have an issue.  

### The app is not visible with no error

Check both endpoint:
- /api/system/content_types
- /api/system/applications
They both should include the app in the response.

The app might be missing from `app.enabled` in `backend/development.ini`.  
Alternatively, the app might be missing from the string `default_enabled_app` in `backend/tracim_backend/config.py`.
