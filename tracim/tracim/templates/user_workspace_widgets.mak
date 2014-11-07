<%namespace name="TIM" file="tracim.templates.pod"/>

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

<%def name="EMPTY_CONTENT(empty_content_label)"><p class="pod-empty">${empty_content_label}</p></%def>

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
            % for page in pages:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/pages/{}'.format(workspace_id, page.folder.id, page.id))}">${TIM.ICO(16, 'mimetypes/text-html')} ${page.label}</a></td>
                    <td>
                        ${TIM.ICO(16, page.status.icon)} <span class="${page.status.css}">${page.status.label}</span>
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

<%def name="TREEVIEW_DYNAMIC(dom_id, selected_id, get_root_url, get_children_url, mode='link_to_document')">
    ## If mode is 'link to document', then a click on a tree item will open the given document as main page
    ## If mode is 'move_mode', then a click will update the value of hidden field with dom id: '${dom_id}-treeview-hidden-field'
    ## TODO - D.A. - 2014-09-25 - Select default node
    <div id="${dom_id}">
        <div id="${dom_id}-treeview"></div>
        <input type='hidden' id='${dom_id}-treeview-hidden-field' name='folder_id' value=''/>
        <script>
            $(function () {
                $('#${dom_id}-treeview').jstree({
                    'plugins' : [ 'wholerow', 'types' ],
                    "types" : {
                        "default" : {
                            "icon" : "${TIM.ICO_URL(16, 'places/jstree-folder')}"
                        },
                        "workspace" : {
                            "icon" : "${TIM.ICO_URL(16, 'places/folder-remote')}"
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
                                    return '${get_children_url}'
                                }
                            },
                            'data' : function(node) {
                                console.log("NODE => "+JSON.stringify(node))
                                return {
                                    'id' : node.id
                                };
                            },
                            'success': function (new_data) {
                                console.log('loaded new menu data' + new_data)
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
                        $('#${dom_id}-treeview-hidden-field').val(data.selected[0]);
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
    <div class="btn-group">
        % if not allow_to_change_status:
            <button type="button" class="btn btn-default disable btn-link">
                ${TIM.ICO(16, item.status.icon)} <span class="${item.status.css}">${item.status.label}</span>
            </button>
        % else:
            <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">
                ${TIM.ICO(16, item.status.icon)} <span class="${item.status.css}">${item.status.label}</span>
            </button>
            <ul class="dropdown-menu" role="menu">
                % for status in h.AllStatus(item.type):
                    % if status.id == 'closed-deprecated':
                        <li class="divider"></li>
                    % endif
                    <li><a
                        class="${('', 'pod-status-selected')[status.id==item.status.id]}"
                        href="${target_url.format(status_id=status.id)}"> ${TIM.ICO(16, status.icon)} <span class="${status.css}">${status.label}</span></a></li>
                % endfor
            </ul>
        % endif
    </div>
</%def>
