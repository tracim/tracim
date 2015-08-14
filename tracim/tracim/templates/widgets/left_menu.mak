<%namespace name="OLD_WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="ADMIN(css_classes='t-spacer-above')">
    <div class="${css_classes}">
        <h4 class="t-less-visible">${_('Admin')}</h4>
        <ul class="list-unstyled">
            <li><a href="${tg.url('/admin/users')}" >${ICON.FA('fa-user fa-fw')} ${_('Users')}</a></li>
            <li><a href="${tg.url('/admin/workspaces')}" >${ICON.FA('fa-bank fa-fw')} ${_('Workspaces')}</a></li>
        </ul>
    </div>

</%def>

<%def name="TREEVIEW(dom_id, selected_id='', uniq_workspace='0', css_classes='t-spacer-above')">
    <div class="${css_classes}">
        <h4 class="t-less-visible t-spacer-above">${_('Workspaces')}</h4>
        ${OLD_WIDGETS.TREEVIEW(dom_id, selected_id, uniq_workspace)}
    </div>
</%def>

