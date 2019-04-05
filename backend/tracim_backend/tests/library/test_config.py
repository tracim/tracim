from mock import patch
from tracim_backend.config import CFG

class TestConfig(object):

    def test_unit__get_associated_env_var_name__ok__nominal_case(self):
        class FakeCFG(CFG):
            def __init__(self):
                pass

        fake_cfg=FakeCFG()
        assert fake_cfg._get_associated_env_var_name(config_name='app.enabled') == 'TRACIM_APP_ENABLED'

    def test_unit__get_printed_val_value__ok__not_secret(self):
        class FakeCFG(CFG):
            def __init__(self):
                pass

        fake_cfg=FakeCFG()
        assert fake_cfg._get_printed_val_value(value='value', secret=False) == 'value'

    def test_unit__get_printed_val_value__ok__secret(self):
        class FakeCFG(CFG):
            def __init__(self):
                pass

        fake_cfg=FakeCFG()
        assert fake_cfg._get_printed_val_value(value='value', secret=True) == '<value not shown>'

    def test_get_raw_config__ok__from_default(self):
        class FakeCFG(CFG):
            def __init__(self):
                self.settings = {}

        fake_cfg=FakeCFG()
        assert fake_cfg.get_raw_config( config_name='app.enabled', default_value='contents/thread') == 'contents/thread'

    def test_get_raw_config__ok__from_config_file(self):
        class FakeCFG(CFG):
            def __init__(self):
                self.settings= {'app.enabled': 'content/folder, contents/files'}

        fake_cfg=FakeCFG()
        assert fake_cfg.get_raw_config(config_name='app.enabled', default_value='contents/thread') == 'content/folder, contents/files'

    def test_get_raw_config__ok__from_env_var(self):
        with patch('os.environ', {'TRACIM_APP_ENABLED': 'contents/html-document,agenda'}):
            class FakeCFG(CFG):
                def __init__(self):
                    self.settings = {'app.enabled': 'content/folder, contents/files'}

            fake_cfg = FakeCFG()
            assert fake_cfg.get_raw_config(config_name='app.enabled', default_value='contents/thread') == 'contents/html-document,agenda'
