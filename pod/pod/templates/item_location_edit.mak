<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="FORMS" file="pod.templates.user_workspace_forms"/>

<%def name="title()"></%def>

<% do_move_url = tg.url('/workspaces/{}/folders/{}/location/{}?_method=PUT').format(result.item.workspace.id, result.item.id, result.item.id) %>
${FORMS.ITEM_MOVE_FORM('move-form', result.item, do_move_url, _('Move folder'))}

