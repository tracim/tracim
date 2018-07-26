import time

from tracim.lib.webdav.model import Lock, Url2Token
from wsgidav import util
from wsgidav.lock_manager import normalizeLockRoot, lockString, generateLockToken, validateLock
from wsgidav.rw_lock import ReadWriteLock

_logger = util.getModuleLogger(__name__)


def from_dict_to_base(lock):
    return Lock(
        token=lock["token"],
        depth=lock["depth"],
        root=lock["root"],
        type=lock["type"],
        scopre=lock["scope"],
        owner=lock["owner"],
        timeout=lock["timeout"],
        principal=lock["principal"],
        expire=lock["expire"]
    )


def from_base_to_dict(lock):
    return {
        'token': lock.token,
        'depth': lock.depth,
        'root': lock.root,
        'type': lock.type,
        'scope': lock.scope,
        'owner': lock.owner,
        'timeout': lock.timeout,
        'principal': lock.principal,
        'expire': lock.expire
    }


class LockStorage(object):
    LOCK_TIME_OUT_DEFAULT = 604800  # 1 week, in seconds
    LOCK_TIME_OUT_MAX = 4 * 604800  # 1 month, in seconds

    def __init__(self):
        self._session = None# todo Session()
        self._lock = ReadWriteLock()

    def __repr__(self):
        return "C'est bien mon verrou..."

    def __del__(self):
        pass

    def get_lock_db_from_token(self, token):
        return self._session.query(Lock).filter(Lock.token == token).one_or_none()

    def _flush(self):
        """Overloaded by Shelve implementation."""
        pass

    def open(self):
        """Called before first use.

        May be implemented to initialize a storage.
        """
        pass

    def close(self):
        """Called on shutdown."""
        pass

    def cleanup(self):
        """Purge expired locks (optional)."""
        pass

    def clear(self):
        """Delete all entries."""
        self._session.query(Lock).all().delete(synchronize_session=False)
        self._session.commit()

    def get(self, token):
        """Return a lock dictionary for a token.

        If the lock does not exist or is expired, None is returned.

        token:
            lock token
        Returns:
            Lock dictionary or <None>

        Side effect: if lock is expired, it will be purged and None is returned.
        """
        self._lock.acquireRead()
        try:
            lock_base = self._session.query(Lock).filter(Lock.token == token).one_or_none()
            if lock_base is None:
                # Lock not found: purge dangling URL2TOKEN entries
                _logger.debug("Lock purged dangling: %s" % token)
                self.delete(token)
                return None
            expire = float(lock_base.expire)
            if 0 <= expire < time.time():
                _logger.debug("Lock timed-out(%s): %s" % (expire, lockString(from_base_to_dict(lock_base))))
                self.delete(token)
                return None
            return from_base_to_dict(lock_base)
        finally:
            self._lock.release()

    def create(self, path, lock):
        """Create a direct lock for a resource path.

        path:
            Normalized path (utf8 encoded string, no trailing '/')
        lock:
            lock dictionary, without a token entry
        Returns:
            New unique lock token.: <lock

        **Note:** the lock dictionary may be modified on return:

        - lock['root'] is ignored and set to the normalized <path>
        - lock['timeout'] may be normalized and shorter than requested
        - lock['token'] is added
        """
        self._lock.acquireWrite()
        try:
            # We expect only a lock definition, not an existing lock
            assert lock.get("token") is None
            assert lock.get("expire") is None, "Use timeout instead of expire"
            assert path and "/" in path

            # Normalize root: /foo/bar
            org_path = path
            path = normalizeLockRoot(path)
            lock["root"] = path

            # Normalize timeout from ttl to expire-date
            timeout = float(lock.get("timeout"))
            if timeout is None:
                timeout = LockStorage.LOCK_TIME_OUT_DEFAULT
            elif timeout < 0 or timeout > LockStorage.LOCK_TIME_OUT_MAX:
                timeout = LockStorage.LOCK_TIME_OUT_MAX

            lock["timeout"] = timeout
            lock["expire"] = time.time() + timeout

            validateLock(lock)

            token = generateLockToken()
            lock["token"] = token

            # Store lock
            lock_db = from_dict_to_base(lock)

            self._session.add(lock_db)

            # Store locked path reference
            url2token = Url2Token(
                path=path,
                token=token
            )

            self._session.add(url2token)
            self._session.commit()

            self._flush()
            _logger.debug("LockStorageDict.set(%r): %s" % (org_path, lockString(lock)))
            #            print("LockStorageDict.set(%r): %s" % (org_path, lockString(lock)))
            return lock
        finally:
            self._lock.release()

    def refresh(self, token, timeout):
        """Modify an existing lock's timeout.

        token:
            Valid lock token.
        timeout:
            Suggested lifetime in seconds (-1 for infinite).
            The real expiration time may be shorter than requested!
        Returns:
            Lock dictionary.
            Raises ValueError, if token is invalid.
        """
        lock_db = self._session.query(Lock).filter(Lock.token == token).one_or_none()
        assert lock_db is not None, "Lock must exist"
        assert timeout == -1 or timeout > 0
        if timeout < 0 or timeout > LockStorage.LOCK_TIME_OUT_MAX:
            timeout = LockStorage.LOCK_TIME_OUT_MAX

        self._lock.acquireWrite()
        try:
            # Note: shelve dictionary returns copies, so we must reassign values:
            lock_db.timeout = timeout
            lock_db.expire = time.time() + timeout
            self._session.commit()
            self._flush()
        finally:
            self._lock.release()
        return from_base_to_dict(lock_db)

    def delete(self, token):
        """Delete lock.

        Returns True on success. False, if token does not exist, or is expired.
        """
        self._lock.acquireWrite()
        try:
            lock_db = self._session.query(Lock).filter(Lock.token == token).one_or_none()
            _logger.debug("delete %s" % lockString(from_base_to_dict(lock_db)))
            if lock_db is None:
                return False
            # Remove url to lock mapping
            url2token = self._session.query(Url2Token).filter(
                Url2Token.path == lock_db.root,
                Url2Token.token == token).one_or_none()
            if url2token is not None:
                self._session.delete(url2token)
            # Remove the lock
            self._session.delete(lock_db)
            self._session.commit()

            self._flush()
        finally:
            self._lock.release()
        return True

    def getLockList(self, path, includeRoot, includeChildren, tokenOnly):
        """Return a list of direct locks for <path>.

        Expired locks are *not* returned (but may be purged).

        path:
            Normalized path (utf8 encoded string, no trailing '/')
        includeRoot:
            False: don't add <path> lock (only makes sense, when includeChildren
            is True).
        includeChildren:
            True: Also check all sub-paths for existing locks.
        tokenOnly:
            True: only a list of token is returned. This may be implemented
            more efficiently by some providers.
        Returns:
            List of valid lock dictionaries (may be empty).
        """
        assert path and path.startswith("/")
        assert includeRoot or includeChildren

        def __appendLocks(toklist):
            # Since we can do this quickly, we use self.get() even if
            # tokenOnly is set, so expired locks are purged.
            for token in toklist:
                lock_db = self.get_lock_db_from_token(token)
                if lock_db:
                    if tokenOnly:
                        lockList.append(lock_db.token)
                    else:
                        lockList.append(from_base_to_dict(lock_db))

        path = normalizeLockRoot(path)
        self._lock.acquireRead()
        try:
            tokList = self._session.query(Url2Token.token).filter(Url2Token.path == path).all()
            lockList = []
            if includeRoot:
                __appendLocks(tokList)

            if includeChildren:
                for url, in self._session.query(Url2Token.path).group_by(Url2Token.path):
                    if util.isChildUri(path, url):
                        __appendLocks(self._session.query(Url2Token.token).filter(Url2Token.path == url))

            return lockList
        finally:
            self._lock.release()