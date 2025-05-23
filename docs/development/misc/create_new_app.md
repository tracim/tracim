# Create a new app in Tracim

## Frontend

### Create the new app

We will create an app called "example".

App entry points: `index.js`.  
It must create a variable available at document root (here, `appExample`) with the following content:
**index.js**
```js
var appExample = {
  name: 'example',
  isRendered: false,
  renderAppPopupCreation: data => {
    // INFO - The code bellow calls the Tracim api to create a new content of type example
    // It is here to help create the first content. The api must be ready to accept this call
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
      console.log('Example created !', response)
    }

    const element = document.getElementById(data.config.domContainer)
    element.appendChild(button)
  },
  renderAppFeature: data => {
    var element = document.getElementById(data.config.domContainer)
    element.innerHTML = 'App renders here'
  },
  unmountApp: domId => {
    var element = document.getElementById(domId)
    element.remove()
  }
}

```
Implement the content of the 3 functions renderAppFeature, unmountApp, renderAppPopupCreation.
- **renderAppPopupCreation**
  - Called when creating a new content for this content type by clicking on the dropdown to create a content in a space content list
  - It should create a popin in HTML and insert it in the intended DOM container which id is `data.config.domContainer`
  - It should show a popin asking for the name of the content
- **renderAppFeature**
  - Called when opening a content of that type by clicking on it in the space content list
  - It should create the app in HTML and insert it in the intended DOM container which id is `data.config.domContainer`
  - It should show the app details and can show its timeline (frontend_lib/src/component/Timeline/Timeline.jsx)
- **unmountApp**
  - Called when closing the app
  - It should remove the node from DOM

Alternatively, you can bundle any app as a library that will expose the variable `appExample`.

### Add the new app to the appInterface.js

In `frontend/src/util/appInterface.js`  
In comment to declare "global", add library name (`appExample`)  
In switch case, add a case for your app  
```js
case 'example' // the name is the one from appExample.name in your app
    return appExample // the name is the root variable in your app
```

Rebuild frontend app.
```bash
./frontend/build_frontend.sh
```

### Add the new content type in frontend_lib

In frontend_lib/src/constant.js

Add the content type to the constant CONTENT_TYPE:  
**frontend_lib/src/constant.js**  
```js
EXAMPLE: 'example',
```

### Add a default color to the app

In frontend/dist/assets/branding.sample/color.json and your frontend/dist/assets/branding/color.json  
Add to, respectively, default values and your value:  
**frontend/dist/assets/branding.sample/color.json** and **frontend/dist/assets/branding/color.json**  
```json
"contents/example": "#123456",
```
Set the color of your choice.

### Create a script to place the app in frontend

Create a script to copy your entry point (bundled if required) to the folder frontend/dist/app.  
The file in frontend/dist/app must be named example.app.optimized.js  
**frontend_app_example/build_app.sh**  
```bash
cp ./index.js ../frontend/dist/app/example.app.optimized.js
```

### Add the app to the html page of development server

The development server is started with the command `yarn run server` in frontend/.  

In frontend/dist/index.html, add:
```html
<script type='text/javascript' src='/app/example.app.js'></script>
```


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
EXAMPLE = "example"
```

Add the app to the properties of class ContentTypeList:  
**backend/tracim_backend/app_models/contents.py**  
```python
@property
def Example(self) -> TracimContentType:
    return self.get_one_by_slug(ContentTypeSlug.EXAMPLE.value)
```

### Create the app in backend

Create folder backend/tracim_backend/applications/content_example/  
**backend/tracim_backend/applications/content_example/**  

In backend/tracim_backend/applications/content_example  
Create 3 files:  
**backend/tracim_backend/applications/content_example/__init__.py**  
empty file  

**backend/tracim_backend/applications/content_example/application.py**  
```py
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

### Declare the app as available

**backend/tracim_backend/config.py**  
Add `"contents/example,"`, in the function `_load_enabled_apps_config`, to the tuple default_enabled_app  
Add `"contents/example",`, in the function `_load_enabled_app`, to the tuple default_app_order  
Carefully check the commas  


## Todo

### Notification

- Add TLMs to frontend/src/container/ReduxTlmDispatcher.jsx.

### Translation

- Generate translations in all apps
- Import app translations and load them into frontend/src/util/i18n.js

### Docker build

- Add to dockerfiles
- tools_docker/Debian_New_Uwsgi/Dockerfile
- tools_docker/Debian_Uwsgi/Dockerfile
- tools_docker/Debian_Uwsgi_ARM64/Dockerfile

### Search
- Search:
  - Add key to facets in frontend/src/util/helper.js (line 72) as <content_type>_search
  - Add content type to ALL_CONTENT_TYPES in same file as above
