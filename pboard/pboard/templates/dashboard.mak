<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
pod :: your dashboard
</%def>

  <div class="row">
    <div class="container-fluid">
      <div class="row-fluid">
        <div class="span6">
          ## LEFT PANEL OF THE DASHBOARD
          <div id='whats-hot-panel' class="well">
            ## WHAT'S HOT PANEL
            <h3><i class="fa fa-warning pod-red"></i> ${_("What's hot!")}</h3>
            % if len(whats_hot_nodes)<=0:
              <p>${_("No hot stuff for today.")}</p>
            % else:
              <ul>
              % for node in whats_hot_nodes:
                <li title="${node.data_label}">
                  <i class="${node.getIconClass()}" title="${node.getUserFriendlyNodeType()}"></i> 
                % if node.node_type=='data' or node.parent_id==None:
                  <a href="${tg.url('/document/%i'%node.node_id)}">
                % else:
                  <a href="${tg.url('/document/%i#tab-%ss'%(node.parent_id, node.node_type))}">
                % endif
                    ${node.getTruncatedLabel(70)}
                  </a>
                    <span title="${_('last modification')}" class="pull-right label">
                     ${node.getFormattedDateTime(node.updated_at)}
                    </span>
                </li>
              % endfor
              </ul>
            % endif
            ## WHAT'S HOT PANEL [END]
          </div>

          <div id='action-to-do-documents-panel' class="well">
            ## DOCUMENTS REQUIRING ACTIONS PANEL
            <h3><i class="pod-blue fa fa-gears"></i> ${_("Actions to do")}</h3>
            % if len(action_to_do_nodes)<=0:
              <p>${_("No document requiring action.")}</p>
            % else:
              <ul>
              % for node in action_to_do_nodes:
                <li title="${node.data_label}">
                  <i class="${node.getIconClass()}" title="${node.getUserFriendlyNodeType()}"></i> 
                % if node.node_type=='data' or node.parent_id==None:
                  <a href="${tg.url('/document/%i'%node.node_id)}">
                % else:
                  <a href="${tg.url('/document/%i#tab-%ss'%(node.parent_id, node.node_type))}">
                % endif
                    ${node.getTruncatedLabel(70)}
                  </a>
                    <span title="${_('last modification')}" class="pull-right label">
                     ${node.getFormattedDateTime(node.updated_at)}
                    </span>
                </li>
              % endfor
              </ul>
            % endif
            ## DOCUMENTS REQUIRING ACTIONS PANEL [END]
          </div>

          ## LEFT PANEL OF THE DASHBOARD [END]
        </div>
        <div class="span6">
          ## RIGHT PANEL OF THE DASHBOARD
          <div id='last-modified-documents-panel' class="well">
            <h3><i style="color: #999;" class="fa fa-clock-o"></i> ${_("Latest operations")}</h3>
            % if len(last_modified_nodes)<=0:
              <p>${_("No activity found")}</p>
            % else:
              <table class="table table-condensed table-hover">
              % for node in last_modified_nodes:
                <tr title="${node.data_label}">
                  <td>${node.getFormattedDateTime(node.updated_at)}</td>
                  <td title="${node.getUserFriendlyNodeType()}">
                    <i class="${node.getIconClass()}"></i> 
                  </td>
                  <td>
                  % if node.node_type=='data' or node.parent_id==None:
                    <a href="${tg.url('/document/%i'%node.node_id)}">
                  % else:
                    <a href="${tg.url('/document/%i#tab-%ss'%(node.parent_id, node.node_type))}">
                  % endif
                      ${node.getTruncatedLabel(35)}
                    </a>
                  </td>
                  <td>
                  % if node.updated_at==node.created_at:
                    <span class="label label-success">${_("created")}</span>
                  % else:
                    <span class="label label-info">${_("updated")}</span>
                  % endif
                  </td>
                </tr>
              % endfor
              </table>
            % endif
          </div>
          ## RIGHT PANEL OF THE DASHBOARD [END]
        </div>
      </div>
    </div>
  </div>

