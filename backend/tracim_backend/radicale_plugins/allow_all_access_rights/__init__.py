from radicale import pathutils
from radicale import rights


class Rights(rights.BaseRights):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._verify_user = self.configuration.get("auth", "type") != "none"

    def authorization(self, user, path):
        if self._verify_user and not user:
            return ""
        sane_path = pathutils.strip_path(path)
        if "/" not in sane_path:
            return "RW"
        # INFO - G.M - 2021-30-11 - Explicitly allow access to sub-resource
        if sane_path.count("/") >= 1:
            return "rw"
        return ""
