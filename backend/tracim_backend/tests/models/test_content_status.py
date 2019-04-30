from tracim_backend.app_models.contents import ContentStatus
from tracim_backend.app_models.contents import GlobalStatus


class TestContentStatus(object):
    def test_content_status__init__ok__nominal_case(self):
        status = ContentStatus(
            "open-test", GlobalStatus.OPEN.value, "Open-Test", "square-o", "#3f52e3"
        )
        assert status.slug == "open-test"
        assert status.label == "Open-Test"
        assert status.global_status == GlobalStatus.OPEN.value
        assert status.fa_icon == "square-o"
        assert status.hexcolor == "#3f52e3"

    def test_content_status__is_editable__ok__nominal_case(self):
        status = ContentStatus(
            "open-test", GlobalStatus.OPEN.value, "Open-Test", "square-o", "#3f52e3"
        )
        assert status.is_editable() is True

        status2 = ContentStatus(
            "open-test", GlobalStatus.CLOSED.value, "Open-Test", "square-o", "#3f52e3"
        )
        assert status2.is_editable() is False
