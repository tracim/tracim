<%namespace name="OLD_WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="TREEVIEW(dom_id, selected_id='', uniq_workspace='0', css_classes='t-spacer-above')">
    <div class="${css_classes}">
        <h4 class="t-less-visible t-spacer-above">${_('Workspaces')}</h4>
        ${OLD_WIDGETS.TREEVIEW(dom_id, selected_id, uniq_workspace)}
    </div>
</%def>

