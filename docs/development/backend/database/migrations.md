### Creating a New Database Migration (Revision)

This creates a new auto-generated python migration file:

in `tracim_backend/migration/versions/` ending with `migration_label.py`:

```bash
alembic -c development.ini revision --autogenerate -m "migration label"
```

# Creating working migration

Creating a working alembic migration for all database engines supported by Tracim is not so easy, here are some tricks to help us.

## sqlite support of alter table is limited, use always batch_op

SQLite has limited support for ops altering tables. As a consequence, you can't easily add/remove/rename columns.

This code doesn't work:

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('users',sa.Column("lang", sa.Unicode(length=3), nullable=True))
```

you should instead use [batch ops](https://alembic.sqlalchemy.org/en/latest/batch.html), do:

```python
from alembic import op
import sqlalchemy as sa
def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("lang", sa.Unicode(length=3), nullable=True))
```

There are many examples of this in Tracim migration revision:

- [2b4043fa2502_remove_webdav_right_digest_response_.py](/backend/tracim_backend/migration/versions/2b4043fa2502_remove_webdav_right_digest_response_.py)
- [5a4962fb875f_add_allowed_space_to_user.py](/backend/tracim_backend/migration/versions/5a4962fb875f_add_allowed_space_to_user.py)
- [32e629b17e2e_change_calendar_enabled_to_agenda_enabled_colum.py](/backend/tracim_backend/migration/versions/32e629b17e2e_change_calendar_enabled_to_agenda_enabled_colum.py)

## Postgresql Support for Real Enum Type

PostgreSQL does support real enum whereas other database engines support enum as a "check" constraint.
This means different code to support the specificities of PostgreSQL in alembic.

Creating enum is not too complex:

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    enum = sa.Enum("INTERNAL", "LDAP", name="authtype")
    enum.create(op.get_bind(), checkfirst=False)
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("auth_type", enum, server_default="INTERNAL", nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("auth_type")
    sa.Enum(name="authtype").drop(op.get_bind(), checkfirst=False)
    # ### end Alembic commands ###
```

See [ab7c7f4bcbc5_add_auth_type_enum_to_user.py](/backend/tracim_backend/migration/versions/ab7c7f4bcbc5_add_auth_type_enum_to_user.py)

But updating an enum list is a bit more tricky so a custom alembic operation has been written to handle this case.

[An example of its usage is available](/backend/tracim_backend/migration/versions/78a01733957f_add_publication_namespace.py).

The custom operation itself can be found in [env.py](/backend/tracim_backend/migration/env.py), in the `ReplaceEnumOp` class.

## MySQL Always Requires the Type When Altering a Column

When updating a table, setting the type does not always seem to be required, for instance when you just need
to rename a column. Due to differing behaviors across database engines, Alembic always requires
setting the type.

```python
from alembic import op
def upgrade():
    with op.batch_alter_table("workspaces") as bop:
        bop.alter_column("calendar_enabled", new_column_name="agenda_enabled")
```

Will work on both postgresql and sqlite but will fail on mysql, you need to specify
type_ like this:

```python
from alembic import op
from sqlalchemy import Boolean

def upgrade():
    with op.batch_alter_table("workspaces") as bop:
        bop.alter_column("calendar_enabled", new_column_name="agenda_enabled", type_=Boolean)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("workspaces") as bop:
        bop.alter_column("agenda_enabled", new_column_name="calendar_enabled", type_=Boolean)
```

see [32e629b17e2e_change_calendar_enabled_to_agenda_enabled_colum.py](/backend/tracim_backend/migration/versions/32e629b17e2e_change_calendar_enabled_to_agenda_enabled_colum.py)

This example is a bit tricky because, it is in fact, not working properly on recent versions of MariaDB and MySQL (versions 8 and later),
this is related to issues in the Alembic support for these database engines.

A fix that should work on any database, should be:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Boolean

def rename_boolean_column(
    table_name: str, old_column_name: str, new_column_name: str, constraint_name: str
):
    """
    Utils to help rename a boolean column supporting:
    - postgresql
    - mysql 8.0+
    - mariadb 10.3+
    - sqlite
    """
    with op.batch_alter_table(table_name) as bop:
        dialect = op.get_context().dialect
        if dialect.name == "mysql":
            if not dialect._is_mariadb and dialect.server_version_info >= (8, 0, 0):
                bop.drop_constraint(constraint_name, type_="check")
            bop.alter_column(
                old_column_name,
                new_column_name=new_column_name,
                type_=Boolean(create_constraint=False),
            )
            bop.alter_column(new_column_name, type_=Boolean(constraint_name))
        else:
            bop.alter_column(old_column_name, new_column_name=new_column_name)

def upgrade():
    rename_boolean_column("workspaces", "calendar_enabled", "agenda_enabled", "workspaces_chk_2")


def downgrade():
    rename_boolean_column("workspaces", "agenda_enabled", "calendar_enabled", "workspaces_chk_2")

```

As you see, for the version of Alembic (1.0.5) currently used in Tracim, you need to:

- drop explicit constraint for MySQL 8.0+
- do rename for MySQL and MariaDB without creating constraint, then reapply type with
the constraint to be sure the constraint will be readded.

## Mysql does already add index to foreign keys

MySQL automatically adds indexes to foreign keys, this leads to issues with migration downgrades as we cannot drop these indexes.
The current way to deal with this, is just ignoring mysql for index add/remove on foreign key as it is really complicated
to handle this properly with the correct index names.

```python
from alembic import op

def upgrade():
    dialect = op.get_context().dialect
    if dialect.name != "mysql":
        op.create_index(
            "idx__content_revisions__content_id", "content_revisions", ["content_id"], unique=False
        )
        op.create_index(
            "idx__content_revisions__workspace_id",
            "content_revisions",
            ["workspace_id"],
            unique=False,
        )

def downgrade():
    dialect = op.get_context().dialect
    if dialect.name != "mysql":
        op.drop_index("idx__content_revisions__workspace_id", table_name="content_revisions")
        op.drop_index("idx__content_revisions__content_id", table_name="content_revisions")

```

## Few others useful tricks

### Updating database content in migration revision

There are a few ways to update the database content in migration revision:

#### Use SQLAlchemy Table

You can use `sa.Table` to ease updating the database content. To do this, you must
create a new table (content from the revision must be completely independant from current code) which
is attached to an existing table. You don't need to field all column and in most case, it's not
needed to add constraint too.

```python
from alembic import op
import sqlalchemy as sa

revisions = sa.Table(
    "content_revisions",
    sa.MetaData(),
    sa.Column("revision_id", sa.Integer, primary_key=True),
    sa.Column("type", sa.Unicode(32), unique=False, nullable=False),
    sa.Column("file_extension", sa.Unicode(255), unique=False, nullable=False, server_default=""),
)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        revisions.update()
        .where(revisions.c.type == "html-document")
        .values(file_extension=".document.html")
    )
    connection.execute(
        revisions.update().where(revisions.c.type == "thread").values(file_extension=".thread.html")
    )

```

#### Use Simplified ORM Model

You can also in some case add a distinct simplified orm model to make update easier:
This add lot of code, but it's useful to make complex update:

```python
import json

from alembic import op
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import MetaData
from sqlalchemy import Text
from sqlalchemy import Unicode
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

OLD_SLUG = "page"
NEW_SLUG = "html-document"


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq__%(table_name)s__%(column_0_name)s",  # Unique constrains
    # for ck contraint.
    # "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)
DeclarativeBase = declarative_base(metadata=metadata)


class TemporaryContentRevision(DeclarativeBase):
    """ temporary sqlalchemy object to help migration"""

    __tablename__ = "content_revisions"

    revision_id = Column(Integer, primary_key=True)
    properties = Column("properties", Text(), unique=False, nullable=False, default="")
    type = Column(Unicode(32), unique=False, nullable=False)


def upgrade():
    connection = op.get_bind()
    session = Session(bind=connection)
    # check all revision with not empty content
    revisions = session.query(TemporaryContentRevision).filter(
        TemporaryContentRevision.properties != ""
    )
    # for each revision go to json properties['allowed_content'] and search for
    # OLD_SLUG section
    for rev in revisions:
        if rev.properties:
            json_properties = json.loads(rev.properties)
            allowed_content_properties = json_properties.get("allowed_content")
            if allowed_content_properties:
                if OLD_SLUG in allowed_content_properties:
                    if NEW_SLUG not in allowed_content_properties:
                        # add old value to new slug
                        allowed_content_properties[NEW_SLUG] = allowed_content_properties[OLD_SLUG]
                    # remove old slug section
                    del allowed_content_properties[OLD_SLUG]
                    # convert to json and apply modification
                    new_properties = json.dumps(json_properties)
                    rev.properties = new_properties
                    session.add(rev)
    session.commit()
```

See:

- [354d62d490ad_remove_page_slug_from_properties.py](/backend/tracim_backend/migration/versions/354d62d490ad_remove_page_slug_from_properties.py)
- [cd79614189ac_add_owner_to_workspace.py](/backend/tracim_backend/migration/versions/cd79614189ac_add_owner_to_workspace.py)

#### Use Raw SQL

In some specific cases, using raw sql query is the easiest solution, be careful about
using sql that does work on all your supported database.

```python
from alembic import op

filling_current_revision_query = """
update content
set revision_id = (select max(revision_id) from content_revisions where content_id = content.id)
"""

def upgrade():
    connection = op.get_bind()
    connection.execute(filling_current_revision_query)

```

### Doing specific database code

To make specific code for some database, we can rely on sqlalchemy dialect:

```python
from alembic import op
dialect = op.get_context().dialect
if dialect.name == "mysql":
   pass
```

In the case of MySQL, dialect does not tell all the truth, you can use specific method to
check if we are in mariadb or mysql:

```python
from alembic import op
dialect = op.get_context().dialect
if not dialect._is_mariadb:
   pass

if not dialect._is_mysql:
   pass
```

To have restriction on version, you can do this way:

```python
from alembic import op
dialect = op.get_context().dialect
if dialect.server_version_info >= (8, 0, 0):
   pass
```
