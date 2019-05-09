from mock import patch

from tracim_backend.config import CFG
from tracim_backend.config import ConfigParam


class TestConfigParam(object):
    def test_unit__init__config__params(self):
        param = ConfigParam("user.auth_token.validity")
        assert param.config_file_name == "user.auth_token.validity"
        assert param.config_name == "USER__AUTH_TOKEN__VALIDITY"
        assert param.env_var_name == "TRACIM_USER__AUTH_TOKEN__VALIDITY"


class TestCFG(object):
    def test_unit__get_printed_val_value__ok__not_secret(self):
        class FakeCFG(CFG):
            def __init__(self):
                pass

        fake_cfg = FakeCFG()
        assert fake_cfg._get_printed_val_value(value="value", secret=False) == "value"

    def test_unit__get_printed_val_value__ok__secret(self):
        class FakeCFG(CFG):
            def __init__(self):
                pass

        fake_cfg = FakeCFG()
        assert fake_cfg._get_printed_val_value(value="value", secret=True) == "<value not shown>"

    def test_get_raw_config__ok__from_default(self):
        class FakeCFG(CFG):
            def __init__(self):
                self.settings = {}
                self.config_naming = []

        fake_cfg = FakeCFG()
        assert (
            fake_cfg.get_raw_config(config_file_name="app.enabled", default_value="contents/thread")
            == "contents/thread"
        )

    def test_get_raw_config__ok__from_config_file(self):
        class FakeCFG(CFG):
            def __init__(self):
                self.settings = {"app.enabled": "content/folder, contents/files"}
                self.config_naming = []

        fake_cfg = FakeCFG()
        assert (
            fake_cfg.get_raw_config(config_file_name="app.enabled", default_value="contents/thread")
            == "content/folder, contents/files"
        )

    def test_get_raw_config__ok__from_env_var(self):
        with patch("os.environ", {"TRACIM_APP__ENABLED": "contents/html-document,agenda"}):

            class FakeCFG(CFG):
                def __init__(self):
                    self.settings = {"app.enabled": "content/folder, contents/files"}
                    self.config_naming = []

            fake_cfg = FakeCFG()
            assert (
                fake_cfg.get_raw_config(
                    config_file_name="app.enabled", default_value="contents/thread"
                )
                == "contents/html-document,agenda"
            )
