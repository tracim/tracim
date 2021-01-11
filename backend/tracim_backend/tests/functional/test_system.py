# coding=utf-8
from mock import patch
import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.utils.utils import get_timezones_list
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


"""
Tests for /api/system subpath endpoints.
"""


@pytest.mark.usefixtures("base_fixture")
class TestApplicationEndpoint(object):
    """
    Tests for /api/system/applications
    """

    def test_api__get_applications__ok_200__nominal_case(
        self, application_api_factory, web_testapp, app_config
    ):
        """
        Get applications list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/applications", status=200)
        res = res.json_body
        app_api = application_api_factory.get()
        applications_in_context = [
            app_api.get_application_in_context(app, app_config) for app in app_api.get_all()
        ]
        assert len(res) == len(applications_in_context)
        for counter, application in enumerate(applications_in_context):
            assert res[counter]["label"] == application.label
            assert res[counter]["slug"] == application.slug
            assert res[counter]["fa_icon"] == application.fa_icon
            assert res[counter]["hexcolor"] == application.hexcolor
            assert res[counter]["is_active"] == application.is_active
            assert res[counter]["config"] == application.config

    def test_api__get_applications__err_401__unregistered_user(self, web_testapp):
        """
        Get applications list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/applications", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestContentsTypesEndpoint(object):
    """
    Tests for /api/system/content_types
    """

    def test_api__get_content_types__ok_200__nominal_case(
        self, web_testapp, content_type_list, app_config
    ):
        """
        Get system content_types list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/content_types", status=200)
        res = res.json_body
        assert len(res) == len(content_type_list.endpoint_allowed_types())
        content_types = content_type_list.endpoint_allowed_types()
        content_types_in_context = [
            content_type_list.get_content_type_in_context(content_type, app_config)
            for content_type in content_types
        ]
        for counter, content_type in enumerate(content_types_in_context):
            assert res[counter]["slug"] == content_type.slug
            assert res[counter]["fa_icon"] == content_type.fa_icon
            assert res[counter]["hexcolor"] == content_type.hexcolor
            assert res[counter]["label"] == content_type.label
            assert res[counter]["creation_label"] == content_type.creation_label
            for status_counter, status in enumerate(content_type.available_statuses):
                assert (
                    res[counter]["available_statuses"][status_counter]["fa_icon"] == status.fa_icon
                )
                assert (
                    res[counter]["available_statuses"][status_counter]["global_status"]
                    == status.global_status
                )
                assert res[counter]["available_statuses"][status_counter]["slug"] == status.slug
                assert (
                    res[counter]["available_statuses"][status_counter]["hexcolor"]
                    == status.hexcolor
                )

    def test_api__get_content_types__err_401__unregistered_user(self, web_testapp):
        """
        Get system content_types list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/content_types", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestTimezonesEndpoint(object):
    """
    Tests for /api/system/timezones
    """

    def test_api__get_timezones__ok_200__nominal_case(self, web_testapp):
        """
        Get alls timezones list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/timezones", status=200)
        timezones = res.json_body
        timezones_list = get_timezones_list()
        assert len(timezones) == len(timezones_list)

        for counter, timezone in enumerate(timezones_list):
            assert timezones[counter]["name"] == timezone.name

    def test_api__get_content_types__err_401__unregistered_user(self, web_testapp):
        """
        Get availables timezones list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/timezones", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestAboutEndpoint(object):
    """
    Tests for /api/system/about
    """

    def test_api__get_about__ok_200__nominal_case(self, web_testapp):
        """
        Get information about Tracim
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/about", status=200)
        assert res.json_body["name"] == "Tracim"
        assert res.json_body["version"]
        assert res.json_body["datetime"]
        assert res.json_body["website"] == "https://www.algoo.fr/fr/tracim"

    def test_api__get_about__err_401__unregistered_user(self, web_testapp):
        """
        Get information about Tracim with unregistered user
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/about", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("test_fixture")
class TestUsernameEndpoints(object):
    """
    Tests for:
     - /api/system/username-availability
     - /api/system/reserved-usernames
    """

    @pytest.mark.parametrize(
        "username,is_available",
        [
            ("TheAdmin", False),
            ("TheBobi", False),
            ("Cloclo", True),
            ("anotherOne", True),
            ("all", False),
            ("tous", False),
            ("todos", False),
        ],
    )
    def test_api__get_username_availability__ok_200__nominal_case(
        self, web_testapp, username: str, is_available: bool
    ) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/system/username-availability?username={}".format(username), status=200
        )
        assert res.json["available"] == is_available

    def test_api__get_reserved_usernames__ok_200__nominal_case(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/reserved-usernames", status=200)
        assert set(res.json["items"]) == set(("all", "tous", "todos"))


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "collabora_test"}], indirect=True)
class TestConfigEndpointCollabora(object):
    """
    Tests for /api/system/config
    """

    @patch("requests.get")
    def test_api__get_config__ok_200__nominal_case(self, patched_get, web_testapp):

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        patched_get.return_value.text = """
        <wopi-discovery>
            <net-zone name="external-http">
                <app name="application/vnd.lotus-wordpro">
                    <action ext="lwp" name="view" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <app name="image/svg+xml">
                    <action ext="svg" name="view" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <app name="application/vnd.oasis.opendocument.text">
                    <action ext="odt" name="edit" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <!-- a lot more `app` in the real response -->
            </net-zone>
        </wopi-discovery>
        """
        res = web_testapp.get("/api/system/config", status=200)
        assert res.json_body["collaborative_document_edition"]
        result = res.json_body
        assert result["collaborative_document_edition"]["software"] == "collabora"
        supported_file_types = result["collaborative_document_edition"]["supported_file_types"]
        assert len(supported_file_types) == 3
        assert supported_file_types[0]["extension"] == "lwp"
        assert supported_file_types[0]["mimetype"] == "application/vnd.lotus-wordpro"
        assert supported_file_types[0]["associated_action"] == "view"
        assert supported_file_types[1]["extension"] == "svg"
        assert supported_file_types[1]["mimetype"] == "image/svg+xml"
        assert supported_file_types[1]["associated_action"] == "view"
        assert supported_file_types[2]["extension"] == "odt"
        assert supported_file_types[2]["mimetype"] == "application/vnd.oasis.opendocument.text"
        assert supported_file_types[2]["associated_action"] == "edit"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestConfigEndpoint(object):
    """
    Tests for /api/system/config
    """

    def test_api__get_config__ok_200__nominal_case(self, web_testapp):
        """
        Get some config info about tracim
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/config", status=200)
        assert res.json_body["email_notification_activated"] is False
        assert res.json_body["new_user_invitation_do_notify"] is True
        assert res.json_body["webdav_enabled"] is False
        assert res.json_body["webdav_url"] == "https://localhost:3030/webdav"
        assert res.json_body["collaborative_document_edition"] is None
        assert res.json_body["content_length_file_size_limit"] == 0
        assert res.json_body["workspace_size_limit"] == 0
        assert res.json_body["workspaces_number_per_user_limit"] == 0
        assert res.json_body["email_required"] is True

    @pytest.mark.xfail(reason="[config_unauthenticated] issue #1270 ")
    def test_api__get_config__err_401__unregistered_user(self, web_testapp):
        """
        Get some config info about tracim with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/config", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestErrorCodeEndpoint(object):
    def test_api__get_error_code_endpoint__ok__200__nominal_case(self, web_testapp):
        web_testapp.authorization = (
            "Basic",
            ("admCollaborativeDocumentEditionFactoryin@admin.admin", "admin@admin.admin"),
        )
        res = web_testapp.get("/api/system/error_codes", status=200)
        # check if all error_codes are available by checking number of item
        # received
        assert len(res.json_body) == len(list(map(int, ErrorCode)))


@pytest.mark.usefixtures("base_fixture")
class TestWorkspaceAccessType(object):
    """
    Tests for /api/system/workspace_access_types
    """

    def test_api__get_workspace_access_type__ok_200__nominal_case(self, web_testapp):
        """
        Get the list of allowed workspace access types with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/workspace_access_types", status=200)
        assert set(res.json["items"]) == set(("confidential", "on_request", "open"))

    def test_api__get_workspace_access_type__err_401__unregistered_user(self, web_testapp):
        """
        Get allowed workspace access types list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/workspace_access_types", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestUserCustomPropertiesSchema(object):
    """
    Tests for GET /api/system/custom-user-properties-schema
    """

    def test_api__get_user_custom_properties_schema__ok_200__nominal_case(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-schema", status=200)
        json_schema = res.json_body["json_schema"]
        assert json_schema == {}

    @pytest.mark.parametrize(
        "config_section", [{"name": "custom_properties_sample_test"}], indirect=True
    )
    def test_api__get_user_custom_properties_schema__ok_200__sample_data(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-schema", status=200)
        json_schema = res.json_body["json_schema"]
        assert json_schema["title"] == "User Info"
        assert json_schema["definitions"] == {
            "address": {
                "title": "Address",
                "description": "address of the user",
                "type": "object",
                "properties": {
                    "street_address": {"type": "string"},
                    "city": {"type": "string"},
                    "state": {"type": "string"},
                },
                "required": ["street_address", "city", "state"],
            }
        }
        assert json_schema["properties"]["organization"] == {
            "title": "Organization",
            "type": "object",
            "properties": {
                "name": {"type": "string", "title": "name", "default": "Tracim"},
                "roles": {
                    "title": "roles in the organization",
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enumNames": [
                            "Developer",
                            "System Administrator",
                            "Manager",
                            "Administrator",
                            "Designer",
                        ],
                        "enum": ["developer", "sysadmin", "manager", "administrator", "designer"],
                    },
                },
            },
        }
        assert json_schema["properties"]["address"] == {"$ref": "#/definitions/address"}
        assert json_schema["properties"]["birthday_date"] == {
            "title": "Birthday date",
            "type": "string",
            "format": "date",
        }

    @pytest.mark.parametrize(
        "config_section", [{"name": "custom_properties_sample_test"}], indirect=True
    )
    def test_api__get_user_custom_properties_schema__ok_200__sample_data_translated(
        self, web_testapp, admin_user, session
    ):
        admin_user.lang = "fr"
        session.add(admin_user)
        session.flush()
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-schema", status=200)
        json_schema = res.json_body["json_schema"]
        assert json_schema["title"] == "Information sur l'utilisateur"
        assert json_schema["definitions"] == {
            "address": {
                "title": "Adresse",
                "description": "Adresse de l'utilisateur",
                "type": "object",
                "properties": {
                    "street_address": {"type": "string"},
                    "city": {"type": "string"},
                    "state": {"type": "string"},
                },
                "required": ["street_address", "city", "state"],
            }
        }
        assert json_schema["properties"]["organization"] == {
            "properties": {
                "name": {"default": "Tracim", "title": "Nom", "type": "string"},
                "roles": {
                    "items": {
                        "enum": ["developer", "sysadmin", "manager", "administrator", "designer"],
                        "enumNames": [
                            "Développeur",
                            "Administrateur système",
                            "Manager",
                            "Administrateur",
                            "Designeur",
                        ],
                        "type": "string",
                    },
                    "title": "Role dans l'organisation",
                    "type": "array",
                },
            },
            "title": "Organisation",
            "type": "object",
        }
        assert json_schema["properties"]["address"] == {"$ref": "#/definitions/address"}
        assert json_schema["properties"]["birthday_date"] == {
            "format": "date",
            "title": "Date de naissance",
            "type": "string",
        }

    def test_api__get_user_custom_properties_schema_err_401__unregistered_user(self, web_testapp):
        """
        Get some config info about tracim with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/user-custom-properties-schema", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
class TestUserCustomPropertiesUISchema(object):
    """
    Tests for GET /api/system/users-custom-properties-ui-schema
    """

    def test_api__get_user_custom_properties_ui_schema__ok_200__nominal_case(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-ui-schema", status=200)
        ui_schema = res.json_body["ui_schema"]
        assert ui_schema == {}

    @pytest.mark.parametrize(
        "config_section", [{"name": "custom_properties_sample_test"}], indirect=True
    )
    def test_api__get_user_custom_properties_ui_schema__ok_200__sample_data(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-ui-schema", status=200)
        ui_schema = res.json_body["ui_schema"]
        assert ui_schema["firstName"] == {
            "ui:autofocus": True,
            "ui:emptyValue": "",
            "ui:autocomplete": "family-name",
        }
        assert ui_schema["bio"] == {
            "ui:widget": "textarea",
            "ui:help": "Give use some informations about you.",
        }
        assert ui_schema["phone_number"] == {"ui:options": {"inputType": "tel"}}

    @pytest.mark.parametrize(
        "config_section", [{"name": "custom_properties_sample_test"}], indirect=True
    )
    def test_api__get_user_custom_properties_ui_schema__ok_200__sample_data_translated(
        self, session, web_testapp, admin_user
    ):
        admin_user.lang = "fr"
        session.add(admin_user)
        session.flush()
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/user-custom-properties-ui-schema", status=200)
        ui_schema = res.json_body["ui_schema"]
        assert ui_schema["firstName"] == {
            "ui:autofocus": True,
            "ui:emptyValue": "",
            "ui:autocomplete": "family-name",
        }
        assert ui_schema["bio"] == {"ui:widget": "textarea", "ui:help": "Parlez nous de vous."}
        assert ui_schema["phone_number"] == {"ui:options": {"inputType": "tel"}}

    def test_api__get_user_custom_properties_ui_schema_err_401__unregistered_user(
        self, web_testapp
    ):
        """
        Get some config info about tracim with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/user-custom-properties-ui-schema", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()
