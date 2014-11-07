<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.workspace_toolbars"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${result.workspace.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__'.format(result.workspace.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
## FIXME - D.A. - 2014-10-20 - Show a toolbar or remove this code    {TOOLBAR.ROOT(fake_api.current_user)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<h1 class="page-header">${TIM.ICO(32, 'places/folder-remote')} ${result.workspace.label}</h1>
<div style="margin: -1.5em auto 1em auto;">
  <p>${_('created on {}').format(h.date_time_in_long_format(result.workspace.created))|n}</p>
</div>
<p>
    ${result.workspace.description}
</p>
<p>
    <% member_nb = len(result.workspace.members) %>
    % if member_nb<=0:
        ${WIDGETS.EMPTY_CONTENT(_('There are no members in this workspace'))}
    % else:
        ${TIM.ICO(16, 'apps/system-users')} &mdash;
        % for member in result.workspace.members:
            <strong>${member.name}</strong>
            ${TIM.ICO_FA_BADGED('fa fa-flag', member.role_description, member.style)}&emsp;
        % endfor
    % endif
</p>
<hr class="tracim-panel-separator"/>


% if h.user_role(fake_api.current_user, result.workspace)<=2: # User must be a content manager to be allowed to create folders
    ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'))}
% else:
    ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'), 'folder-new', _('Add a folder...'))}
    ${FORMS.NEW_FOLDER_FORM('folder-new', result.workspace.id)}
% endif


<p>
    ${WIDGETS.FOLDER_LIST('subfolder-list', result.workspace.id, fake_api.current_workspace_folders)}
</p>
% if len(fake_api.current_workspace_folders)<=0 and fake_api.current_user:
    % if h.user_role(fake_api.current_user, result.workspace)>2: # User must be a content manager to be allowed to create folders
        <p>
            ${_('You need folders to organize your content.')}
            <a class="btn btn-small btn-primary" data-toggle="collapse" data-target="#folder-new"><i class="fa fa-check"></i> <b>${_('Create a folder now')}</b></a>
        </p>
    % endif
% endif

