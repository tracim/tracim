<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_PAGE(user, workspace, page)">
    <% edit_disabled = ('', 'disabled')[page.selected_revision!='latest' or page.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[page.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>1:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current page')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#page-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/pages/{}/edit'.format(page.workspace.id, page.parent.id, page.id))}" >${TIM.ICO(32, 'apps/accessories-text-editor')}</a>
        </div>
        <p></p>
    % endif
    
    <div class="btn-group btn-group-vertical">
        <a href="#associated-revisions" role="button" class="btn btn-default" title="${_('View versions of the page')}">${TIM.ICO(32, 'actions/gnome-document-open-recent')}</a>
        <a href="#associated-links" role="button" class="btn btn-default" title="${_('View all links')}">${TIM.ICO(32, 'apps/internet-web-browser')}</a>
    </div>
    <p></p>
    
## TODO - D.A - 2014-09-16
## Hide the delete button if the user is not a TIM Manager
    % if user.profile.id>=2 or h.user_role(user, workspace)>2:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive page')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_archive'.format(page.workspace.id, page.parent.id, page.id))}">${TIM.ICO(32, 'mimetypes/package-x-generic')}</a>
            <a title="${_('Delete page')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_delete'.format(page.workspace.id, page.parent.id, page.id))}">${TIM.ICO(32, 'status/user-trash-full')}</a>
        </div>
    % endif
</%def>

