"""
Just a simple script to get some data from python sqlite for debugging
"""
import sqlite3

template_on_line = "{field: <51}|"
template = "{field: <30}|{value: <20}|"
print(template_on_line.format(field="PYTHON SQLITE INFORMATION"))
print(template_on_line.format(field="-" * 51))
print(template.format(field="sqlite version", value=sqlite3.sqlite_version))
print(template.format(field="sqlite3 module version", value=sqlite3.version))

con = sqlite3.connect(":memory:")
cur = con.cursor()
cur.execute("pragma compile_options;")
available_pragmas = cur.fetchall()
con.close()

print(template_on_line.format(field="Available pragmas:"))
for pragma in available_pragmas:
    print(template_on_line.format(field="  {}".format(pragma[0])))
