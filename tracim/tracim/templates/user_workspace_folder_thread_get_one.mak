<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.thread_toolbars"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${result.thread.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__folder_{}'.format(result.thread.workspace.id, result.thread.parent.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_THREAD(fake_api.current_user, result.thread.workspace, result.thread)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('thread-edit-modal-dialog', 'modal-lg')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

% if result.thread.status.id=='closed-deprecated':
    <div class="alert alert-warning" role="alert" style="margin-top: 1em;">
        ${TIM.ICO(16, 'status/status-outdated')}
        ${_('<b>This information is deprecated</b>')|n}
    </div>
% endif


<h1 class="page-header">
    ${TIM.ICO(32, result.thread.icon)} ${result.thread.label}
    <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
</h1>
${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

<p style="margin: -1.5em auto 1em auto;">
##    ${WIDGETS.SHOW_CHANGE_THREAD_STATUS(result.thread)}
    ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_THREAD(fake_api.current_user, result.thread.workspace, result.thread)}
    
    &mdash;&nbsp;&nbsp;&nbsp;
    ${_('created on {} by <b>{}</b>').format(h.date_time_in_long_format(result.thread.created), result.thread.owner.name)|n}</p>
</p>

% if result.thread.content:
    <div>
        ${result.thread.content|n}
        <hr/>
    </div>
% endif

% if h.user_role(fake_api.current_user, result.thread.workspace)<=1:
    ## READONLY USER
    <hr class="pod-panel-separator"/>
% else:
    % if result.thread.status.id!='open':
        <p class="pod-less-visible">${_('<b>Note</b>: In case you\'d like to post a reply, you must first open again the thread')|n}</p>
        <hr class="pod-panel-separator"/>
    % else:
        <hr class="pod-panel-separator"/>
        <p>    
            ${WIDGETS.DATA_TARGET_BUTTON('new-comment', _('Post a reply...'))}
            ${FORMS.NEW_COMMENT_FORM_IN_THREAD('new-comment', result.thread.workspace.id, result.thread.parent.id, result.thread.id)}
        </p>
    % endif
% endif 

% for comment in result.thread.comments:
    <div class="pod-thread-item">
        <h5 style="margin: 0;">
            <div class="pull-right text-right">
                <div class="label" style="font-size: 10px; border: 1px solid #CCC; color: #777; ">
                    ${h.format_short(comment.created)|n}
                </div>
                <br/>
## SHOW REMOVE ACTION                <a class="btn btn-default btn-xs" style="margin-top: 6px;" href="">
##                <img src="assets/icons/16x16/places/user-trash.png" title="Supprimer ce commentaire"></a>
            </div>
   
            ${TIM.ICO(32, comment.icon)}
            <span class="pod-less-visible">${_('<strong>{}</strong> wrote:').format(comment.owner.name)|n}</span>
        </h5>
        <div class="pod-thread-item-content">
            <div>${comment.content|n}</div>
            <br/>
        </div>
    </div>

% endfor

## <hr class="pod-panel-separator"/>
## <div>
##     <h4 id="associated-links" class="anchored-title" >${_('Links extracted from the thread')}</h4>
##     <div>
##         % if len(result.thread.links)<=0:
##             <p class="pod-empty">${_('No link found.')}</p>
##         % else:
##             <ul>
##                 % for link in result.thread.links:
##                     <li><a href="${link.href}">${link.label if link.label else link.href}</a></li>
##                 % endfor
##             </ul>
##         % endif
##     </div>
##     <hr/>
## 
##     % for comment in result.thread.comments:
##         ${comment}
##     % endfor
## </div>
