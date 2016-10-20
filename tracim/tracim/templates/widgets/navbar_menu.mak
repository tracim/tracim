<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="ADMIN_ITEMS()">
    <li class="">
        <a href="${tg.url('/admin/users')}">
            ${ICON.FA('fa-user fa-fw')} ${_('Users')}
        </a>
    </li>
    <li class="">
        <a href="${tg.url('/admin/workspaces')}">
            ${ICON.FA('fa-bank fa-fw')} ${_('Workspaces')}
        </a>
    </li>
</%def>
