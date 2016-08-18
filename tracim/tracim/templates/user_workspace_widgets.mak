<%namespace name="TIM" file="tracim.templates.pod"/>

<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="BREADCRUMB(dom_id, breadcrumb_items)">
    <ul id="${dom_id}" class="breadcrumb" style="margin-top: -1.5em; display: none;">
        % for item in breadcrumb_items:
            % if item.is_active:
                <li class="active">${TIM.ICO(16, item.icon)} ${item.label}</li>
            % else:
                <li>${TIM.ICO(16, item.icon)} <a href="${item.url}">${item.label}</a></li>
            % endif
        % endfor
    </ul>
</%def>

<%def name="EMPTY_CONTENT(empty_content_label)"><p class="pod-empty">${empty_content_label|n}</p></%def>

<%def name="DATA_TARGET_BUTTON(dom_id, label)"><a data-toggle="collapse" data-target="#${dom_id}"><b>${label}</b></a></%def>

<%def name="SECURED_SECTION_TITLE(user, workspace, dom_id, label, action_dom_id='', action_label='', icon_size='', icon_path='')">
    <h4 id="${dom_id}">
        ${TIM.ICO(icon_size, icon_path) if icon_path else ''}
        ${label}
        
        ## Button is shown for contributors (or more), not for readers
        % if h.user_role(user, workspace)>1: 
            % if action_dom_id and action_label:
                <small style="margin-left: 1em;"> ${DATA_TARGET_BUTTON(action_dom_id, action_label)}</small>    
            % endif
        % endif
    </h4>
</%def>

<%def name="FOLDER_LIST(dom_id, workspace_id, folders)">
    % if len(folders)<=0:
        ${EMPTY_CONTENT(_('No folder found.'))|n}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for folder in folders:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}'.format(workspace_id, folder.id))}">${TIM.ICO(16, 'places/jstree-folder')} ${folder.label}</a></td>
                    <td>
                        % if folder.content_nb.all==0:
                            <span class="pod-empty-item">${_('This folder is empty')}</span>
                        % else:
                            % if folder.folder_nb.all>=1:
                                ${_('{nb_total} subfolder(s)').format(nb_total=folder.folder_nb.all)|n}
                            % endif
                            
                            % if folder.thread_nb.all>=1:
                                ${_('{nb_total} thread(s) &mdash; {nb_open} open').format(nb_total=folder.thread_nb.all, nb_open=folder.thread_nb.open)|n}
                                <br/>
                            % endif

                            % if folder.file_nb.all>=1:
                                ${_('{nb_total} file(s) &mdash; {nb_open} open').format(nb_total=folder.file_nb.all, nb_open=folder.file_nb.open)|n}
                                <br/>
                            % endif

                            % if folder.page_nb.all>=1:
                                ${_('{nb_total} page(s) &mdash; {nb_open} open').format(nb_total=folder.page_nb.all, nb_open=folder.page_nb.open)|n}
                                <br/>
                            % endif

                        % endif
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="PAGE_LIST(dom_id, workspace_id, pages)">
    % if len(pages)<=0:
        ${EMPTY_CONTENT(_('No page found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            <tr>
                <th>${_('Type')}</th>
                <th>${_('Title')}</th>
                <th colspan="2">${_('Status')}</th>
            </tr>
            % for page in pages:
                <tr>
                    <td>
                        <span class="tracim-less-visible"><i class="fa fa-file-text-o fa-tw"></i> page</span>
                    </td>
                    <td>
                        <a href="${tg.url('/workspaces/{}/folders/{}/pages/{}'.format(workspace_id, page.folder.id, page.id))}">${page.label}</a>
                    </td>
                    <td>
                        % if 'open' == page.status.id:
                            <i class="fa fa-fw fa-square-o"></i>
                        % elif 'closed-validated' == page.status.id:
                            <i class="fa fa-fw fa-check-square-o"></i>
                        % elif 'closed-unvalidated' == page.status.id:
                            <i class="fa fa-fw fa-check-square-o"></i>
                        % elif 'closed-deprecated' == page.status.id:
                            <i class="fa fa-fw fa-bell-slash-o"></i>
                        % else:
                            <i class="fa fa-fw fa-close"></i>
                        % endif
                    </td>
                    <td>
                        ${page.status.label}
##                        ${page.status.id}
##                        ${TIM.ICO(16, page.status.icon)} <span class="${page.status.css}">${page.status.label}</span>
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="FILE_LIST(dom_id, workspace_id, files)">
    % if len(files)<=0:
        ${EMPTY_CONTENT(_('No file found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for curfile in files:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/files/{}'.format(workspace_id, curfile.folder.id, curfile.id))}">${TIM.ICO(16, 'mimetypes/text-html')} ${curfile.label}</a></td>
                    <td>
                        ${TIM.ICO(16, curfile.status.icon)} <span class="${curfile.status.css}">${curfile.status.label}</span>
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="THREAD_LIST(dom_id, workspace_id, threads)">
    % if len(threads)<=0:
        ${EMPTY_CONTENT(_('No thread found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for thread in threads:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/threads/{}'.format(workspace_id, thread.folder.id, thread.id))}">${TIM.ICO(16, 'apps/internet-group-chat')} ${thread.label}</a></td>
                    <td>${TIM.ICO(16, thread.status.icon)} <span class="${thread.status.css}">${thread.status.label}</span></td>
                    <td>${_('{} message(s)').format(thread.comment_nb)}</td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="TREEVIEW(dom_id, selected_id='', uniq_workspace='0')">
    <%
        get_root_url = tg.url("/workspaces/treeview_root", dict(current_id=selected_id))
        get_children_url = tg.url("/workspaces/treeview_children")
    %>
    ${TREEVIEW_DYNAMIC(dom_id, selected_id, get_root_url, get_children_url)}
</%def>

<%def name="TREEVIEW_DYNAMIC(dom_id, selected_id, get_root_url, get_children_url, mode='link_to_document', updatable_field_id=None)">
    ## If mode is 'link to document', then a click on a tree item will open the given document as main page
    ## If mode is 'move_mode', then a click will update the value of hidden field with dom id: '${dom_id}-treeview-hidden-field'
    ## TODO - D.A. - 2014-09-25 - Select default node
    <div id="${dom_id}">
        <div id="${dom_id}-treeview"></div>
        % if not updatable_field_id:
            <input type='hidden' id='${dom_id}-treeview-hidden-field' name='folder_id' value=''/>
        % endif
        <script>
            $(function () {
                $('#${dom_id}-treeview').jstree({
                    'plugins' : [ 'wholerow', 'types' ],
                    "types" : {
                        "default" : {
                            "icon" : "fa fa-folder-open-o t-folder-color"
                        },
                        "page" : {
                            "icon" : "fa fa-file-text-o t-page-color"
                        },
                        "file" : {
                            "icon" : "fa fa-paperclip t-file-color"
                        },
                        "thread" : {
                            "icon" : "fa fa-comments-o t-thread-color"
                        },
                        "workspace" : {
                            "icon" : "fa fa-bank"
                        },
                    },
                    'core' : {
                        'error': function (error) {
                            console.log('Error ' + error.toString())
                        },
                        'data' : {
                            'dataType': 'json',
                            'contentType': 'application/json; charset=utf-8',
                            'url' : function (node) {
                                if (node.id==='#') {
                                    return '${get_root_url|n}'
                                } else {
                                    return '${get_children_url|n}'
                                }
                            },
                            'data' : function(node) {
                                console.log("NODE => "+JSON.stringify(node))
                                return {
                                    'id' : node.id
                                };
                            },
                            'success': function (new_data) {
                                console.log('loaded new menu data' + JSON.stringify(new_data))
                                return new_data;
                            },
                        },
                    }
                });

                ##
                ## INFO - D.A. - 2014-10-17
                ## Look comment at top of this function in order to get information about the next if/then/else 
                ##
                % if mode=='link_to_document':
                    $('#${dom_id}-treeview').on("select_node.jstree", function (e, data) {
                        // click event is intercepted, so we fake a click() by getting the href value
                        // of child link and put it as current document location
                        url = $('#'+data.selected[0]+' > a').attr('href');
                        location.href = url;
                    });
                % else:              
                    $('#${dom_id}-treeview').on("select_node.jstree", function (e, data) {
                        // on click, the form hidden field is updated
                        ## FIXME - REMOVE alert('about to update value of field '+'#${dom_id}-treeview-hidden-field');
                        ## FIXME - REMOVE alert('new value will be '+$('#'+data.selected[0]+' > a').attr('id'));
                        ## FIXME - REMOVE alert('data is '+data.selected[0]+ ' => '+$('#'+data.selected[0]+' > a')[0]);
                        % if not updatable_field_id:
                            $('#${dom_id}-treeview-hidden-field').val(data.selected[0]);
                        % else:  # in this case, we will update another hidden field
                            $('#${updatable_field_id}').val(data.selected[0]);
                        % endif
                    });
                % endif
                
                $('#${dom_id}-treeview').on("loaded.jstree", function () {
                    nodes = $('#${dom_id}-treeview .jstree-node');
                    console.log("nodes = "+nodes.length);
                    if (nodes.length<=0) {
                        ## TODO - D.A. - 2014-11-06 - Parameterize the fake_api.current_user access
                        $("#${dom_id}-treeview").append( "<p class='pod-grey'>${_('You have no workspace.')|n}" );
                        % if fake_api.current_user.profile.id >= 2:
                            $("#${dom_id}-treeview").append( "<p><a class=\"btn btn-success\" href=\"${tg.url('/admin/workspaces')}\" ><i class=\"fa fa-plus\"></i> ${_('Create a workspace')}</a></p>" );
                        % else:
                            $("#${dom_id}-treeview").append( "<p class=\"alert alert-info\"><b>${_('Contact the administrator.')}</b></p>" );
                        % endif
                    }
                });
            });
        </script>
    </div>
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_FILE(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/files/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/pages/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_THREAD(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/threads/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ## The user can't change status if he is a simple reader
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SHOW_CHANGE_STATUS(item, target_url, allow_to_change_status=False)">
    <div class="btn-group pull-right">
        % if not allow_to_change_status:
            <button type="button" class="btn btn-default disable btn-link" title="${_('This operation is locked')}">
                <span class="${item.status.css}">${item.status.label} ${ICON.FA_FW_2X(item.status.icon)}</span>
            </button>
        % else:
            <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">
                <span class="${item.status.css}">${item.status.label} ${ICON.FA_FW_2X(item.status.icon)}</span>
            </button>
            <ul class="dropdown-menu" role="menu">
                % for status in h.AllStatus(item.type):
                    % if status.id == 'closed-deprecated':
                        <li class="divider"></li>
                    % endif
                    <li class="text-right"><a
                        class="${('', 'pod-status-selected')[status.id==item.status.id]}"
                        href="${target_url.format(status_id=status.id)}">
                        <span class="${status.css}">
                            ${status.label} ${ICON.FA_FW(status.icon)}
                        </span>
                    </a></li>
                % endfor
            </ul>
        % endif
    </div>
</%def>

<%def name="SECURED_TIMELINE_ITEM(user, item)">
##     <div class="row t-odd-or-even t-hacky-thread-comment-border-top">
##         <div class="col-sm-7 col-sm-offset-3">
##             <div class="t-timeline-item">
## ##                <i class="fa fa-fw fa-3x fa-comment-o t-less-visible" style="margin-left: -1.5em; float:left;"></i>
##                 ${ICON.FA_FW('fa fa-3x fa-comment-o t-less-visible t-timeline-item-icon')}
##
##                 <h5 style="margin: 0;">
##                     <span class="tracim-less-visible">${_('<strong>{}</strong> wrote:').format(item.owner.name)|n}</span>
##
##                     <div class="pull-right text-right t-timeline-item-moment" title="${h.date_time(item.created)|n}">
##                         ${_('{delta} ago').format(delta=item.created_as_delta)}
##
##                         % if h.is_item_still_editable(item) and item.owner.id==user.id:
##                             <br/>
## ##                            <div class="btn-group">
##                                 <a class="t-timeline-comment-delete-button" href="${item.urls.delete}">
##                                     ${_('delete')} ${ICON.FA('fa fa-trash-o')}
## ##                                    ${TIM.ICO_TOOLTIP(16, 'status/user-trash-full', h.delete_label_for_item(item))}
##                                 </a>
## ##                            </div>
##                         % endif
##                     </div>
##                 </h5>
##                 <div class="t-timeline-item-content">
##                     <div>${item.content|n}</div>
##                     <br/>
##                 </div>
##             </div>
##         </div>
##     </div>
</%def>

<%def name="SECURED_HISTORY_VIRTUAL_EVENT(user, event)">
    <% is_new_css_class = 't-is-new-content' if event.is_new else '' %>

    <div class="row t-odd-or-even t-hacky-thread-comment-border-top ${is_new_css_class}">
        <div class="col-sm-7 col-sm-offset-3">
            <div class="t-timeline-item">
##                <i class="fa fa-fw fa-3x fa-comment-o t-less-visible" style="margin-left: -1.5em; float:left;"></i>

                ${ICON.FA_FW('fa fa-3x t-less-visible t-timeline-item-icon '+event.type.icon)}

                <h5 style="margin: 0;">

                    % if 'comment' == event.type.id:
                        <span class="tracim-less-visible">${_('<strong>{}</strong> wrote:').format(event.owner.name)|n}</span>
                    %else:
                        <span class="tracim-less-visible">${_('{} by <strong>{}</strong>').format(event.label, event.owner.name)|n}</span>
                    % endif

                    <div class="pull-right text-right t-timeline-item-moment" title="${h.date_time(event.created)|n}">
                        ${_('{delta} ago').format(delta=event.created_as_delta)}

                        % if h.is_item_still_editable(CFG, event) and event.owner.id==user.id:
                            <br/>
                                <a class="t-timeline-comment-delete-button" href="${event.urls.delete}">
                                    ${_('delete')} ${ICON.FA('fa fa-trash-o')}
                                </a>
                        % endif
                    </div>
                </h5>
                <div class="t-timeline-item-content">
                    <div>${event.content|n}</div>
                    <br/>
                </div>
            </div>
        </div>
    </div>
</%def>

<%def name="SECURED_HISTORY_VIRTUAL_EVENT_AS_TABLE_ROW(user, event, current_revision_id)">
    <%
        warning_or_not = ('', 'warning')[current_revision_id==event.id]
        row_css = 't-is-new-content' if event.is_new else warning_or_not
    %>
    <tr class="${row_css}">
        <td class="t-less-visible">
            <span class="label label-default">${ICON.FA_FW(event.type.icon)} ${event.type.label}</span>
        </td>
        <td title="${h.date_time(event.created)|n}">${_('{delta} ago').format(delta=event.created_as_delta)}</td>
        <td>${event.owner.name}</td>
## FIXME - REMOVE                            <td>${event}</td>

        % if 'comment' == event.type.id:
            <td colspan="2">
                ${event.content|n}
            </td>
        % else:

            <td>
                % if event.type.id in ('creation', 'edition', 'revision'):
                    <a href="${'?revision_id={}'.format(event.id)}">${_('View revision')}</a>
                % endif
            </td>
            <td class="t-less-visible" title="${_('Currently shown')}">
                % if warning_or_not:
                    ${ICON.FA_FW('fa fa-caret-left')}&nbsp;${_('shown')}
                % endif
            </td>
        % endif
    </tr>
</%def>