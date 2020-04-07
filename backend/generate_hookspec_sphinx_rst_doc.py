"""
Generate special rst file for
"""
from tracim_backend.lib.core.plugins import TracimPluginManager

HEADER = """
Tracim Plugin using Event Hooks
===============================

To plug external code in tracim backend, you need to add your code in a ``tracim_backend_myplugin`` module.

it can be either a python module file (``tracim_backend_myplugin.py``) or a python package (``tracim_backend_myplugin`` dir with ``__init__.py`` file into).

.. warning::
   Only module beginning with ``tracim_backend_`` will be considered by tracim as plugin.

   if your module doesn't begin like this, it will not be processed as plugin by tracim.

You can add it by:

1. add your ``tracim_backend_myplugin`` module to ``PLUGIN__FOLDER_PATH`` tracim backend config parameter dir. it will be automatically loaded by tracim.
2. creating python package named ``tracim_backend_myplugin`` and install it with ``pip``.
3. add your ``tracim_backend_myplugin`` module to your local python path, for example by using environnement var ``PYTHONPATH``.

To make a plugin, you just need to use available event hook methods and import ``tracim_backend.lib.core.plugins.hookimpl``.

Order of plugin running is LIFO (Last In, First Out) by default as in ``pluggy``. In Tracim, we load all plugin sorted by name one by one, that's means that ``tracim_backend_test_2`` hooks
will be runned before ``tracim_backend_test_1`` hooks unless to explictly use ``tryfirst`` or ``trylast`` parameters of pluggy hookspec.

Plugin hook mechanism in tracim is based on ``pluggy``, if you need more information about how plugin
mechanism do work in Tracim, you can check `pluggy documentation <https://pluggy.readthedocs.io/en/latest/>`_ .

Hello World Plugin example
--------------------------

.. literalinclude:: hello_world_plugin.py
   :language: python

Events hooks Availables
-----------------------

Those are events you can hook into to plug into Tracim Backends.
"""
FOOTER = """
"""

AUTODOC_HOOKSPEC_FILE = """
.. automodule:: {module_path}
   :members:
   :undoc-members:

"""


def generate_hookspec_sphinx_rst_doc() -> str:
    doc = HEADER
    for module_path in TracimPluginManager.get_all_hookspec_module_path():
        doc += AUTODOC_HOOKSPEC_FILE.format(module_path=module_path)
    doc += FOOTER
    return doc

def write_hookspec_sphinx_rst_file(rst_file_path: str = "hookspecs.rst") -> None:
    with open(rst_file_path, mode='w') as _file:
        _file.write(generate_hookspec_sphinx_rst_doc())


if __name__ == '__main__':
    write_hookspec_sphinx_rst_file()
