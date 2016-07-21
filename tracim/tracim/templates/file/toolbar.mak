<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="SECURED_FILE(user, workspace, file)">
    <div class="btn-group btn-group-vertical text-center">
        ${BUTTON.MARK_CONTENT_READ_OR_UNREAD(user, workspace, file)}
    </div>
    <hr class="t-toolbar-btn-group-separator"/>
    <p></p>

    <% download_url = tg.url('/workspaces/{}/folders/{}/files/{}/download?revision_id={}'.format(result.file.workspace.id, result.file.parent.id,result.file.id,result.file.selected_revision)) %>
    <% edit_disabled = ('', 'disabled')[file.selected_revision!='latest' or file.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[file.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>1:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current file')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#file-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/files/{}/edit'.format(file.workspace.id, file.parent.id, file.id))}" >${ICON.FA_FW('fa fa-edit t-less-visible')} ${_('Edit')}</a>
        </div>
        <p></p>
    % endif
    
    <div class="btn-group btn-group-vertical">
        <a href="${download_url}" role="button" class="btn btn-default" data-toggle="modal" title="${_('Download the file')}">${ICON.FA('fa fa-download t-less-visible')} ${_('Download')}</a>
        <a href="#file-versions" role="button" class="btn btn-default" data-toggle="modal" title="${_('View versions of the file')}">${ICON.FA('fa fa-history t-less-visible')} ${_('Revisions')}</a>
## RESTORE LINKS IF REQUIRED        <a href="#file-associated-links" role="button" class="btn btn-default" data-toggle="modal" title="${_('View all links')}">${TIM.ICO(32, 'apps/internet-web-browser')}</a>
    </div>
    <p></p>
    
    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive file')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/files/{}/put_archive'.format(file.workspace.id, file.parent.id, file.id))}">${ICON.FA_FW('fa fa-archive t-less-visible')} ${_('Archive')}</a>
            <a title="${_('Delete file')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/files/{}/put_delete'.format(file.workspace.id, file.parent.id, file.id))}">${ICON.FA_FW('fa fa-trash t-less-visible')} ${_('Delete')}</a>
        </div>
    % endif
</%def>

