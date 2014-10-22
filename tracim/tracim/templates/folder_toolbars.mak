<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_FOLDER(user, workspace, folder)">
    <% edit_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed'] %>
    <%
        ## FIXME - This control should be based on the user role
        move_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed']
    %>
    
    <% delete_or_archive_disabled = ('', 'disabled')[folder.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>2:
        <div class="btn-group btn-group-vertical">
            ## This action is allowed for content managers only
            <a title="${_('Edit current folder')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#folder-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/edit'.format(folder.workspace.id, folder.id))}" >${TIM.ICO(32, 'apps/accessories-text-editor')}</a>
        </div>
        <p></p>
    % endif
    
    <div class="btn-group btn-group-vertical">
        % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
            ## This action is allowed for content managers only
            <a title="${_('Move current folder')}" class="btn btn-default ${move_disabled}" data-toggle="modal" data-target="#folder-move-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/location/{}/edit'.format(folder.workspace.id, folder.id, folder.id))}" >${TIM.ICO(32, 'actions/item-move')}</a>
        % endif
    </div>
    <p></p>

</%def>

