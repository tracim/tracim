<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="SECURED_PAGE(user, workspace, page)">

    % if page.is_editable:
        <div class="btn-group btn-group-vertical">
            ${BUTTON.MARK_CONTENT_READ_OR_UNREAD(user, workspace, page)}
        </div>
        <hr class="t-toolbar-btn-group-separator"/>
        <p></p>
    % endif

    <% edit_disabled = ('', 'disabled')[page.selected_revision!='latest' or page.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[page.selected_revision!='latest'] %>
    % if h.user_role(user, workspace)>1 and page.is_editable:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit')}" id="edit_page_button" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#page-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/pages/{}/edit'.format(page.workspace.id, page.parent.id, page.id))}" >
                <i class="fa fa-edit fa-fw t-less-visible"></i> ${_('Edit')}
            </a>
        </div>
        <p></p>
    % endif

    <div class="btn-group btn-group-vertical">
        <a href="#associated-revisions" role="button" class="btn btn-default" title="${_('View versions of the page')}">
            <i class="fa fa-history fa-fw t-less-visible"></i>
            ${_('Revisions')}
        </a>
    </div>
    <p></p>

## TODO - D.A - 2014-09-16
## Hide the delete button if the user is not a TIM Manager
    % if (user.profile.id>=2 or h.user_role(user, workspace)>2) and page.is_editable:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive page')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_archive'.format(page.workspace.id, page.parent.id, page.id))}">
                <i class="fa fa-archive fa-fw t-less-visible"></i>
                ${_('Archive')}
            </a>
            <a title="${_('Delete page')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_delete'.format(page.workspace.id, page.parent.id, page.id))}">
                <i class="fa fa-trash fa-fw t-less-visible"></i>
                ${_('Delete')}
            </a>

        </div>
    % endif

    % if page.is_deleted or page.is_archived:
        <div class="btn-group btn-group-vertical">
            % if page.is_archived:
                <a title="${_('Restore')}"
                   class="btn btn-default"
                   href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_archive_undo'.format(page.workspace.id, page.parent.id, page.id))}">
                    <i class="fa fa-archive fa-fw tracim-less-visible"></i>
                    ${_('Restore')}
                </a>
            % endif
            % if page.is_deleted:
                <a title="${_('Restore')}"
                   class="btn btn-default"
                   href="${tg.url('/workspaces/{}/folders/{}/pages/{}/put_delete_undo'.format(page.workspace.id, page.parent.id, page.id))}">
                    <i class="fa fa-archive fa-fw tracim-less-visible"></i>
                    ${_('Restore')}
                </a>
            % endif
        </div>
        <p></p>
    % endif

</%def>

