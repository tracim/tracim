from radicale.storage.filesystem import Collection as BaseCollection


class Collection(BaseCollection):
    def __init__(self, path, principal=False):
        super().__init__(path, principal)
