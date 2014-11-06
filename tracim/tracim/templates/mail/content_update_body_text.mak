## -*- coding: utf-8 -*-
${h.CFG.WEBSITE_TITLE}
-> ${result.item.workspace.label}
-> ${result.item.label} - ${result.item.status.label}

==============================================================================
 
${_('Some activity has been detected on the item above')} ${_('-- by {actor_name}').format(actor_name=result.actor.name)}
##
## TODO - D.A. - Show last action in the notification message
##
##${_('{last_action} -- by {actor_name}').format(last_action=result.item.last_action.label, actor_name=result.actor.name)}
##

% if result.item.is_deleted:
${_('This item has been deleted.')}
% elif result.item.is_archived:
${_('This item has been archived.')}
% else:
${_('Go to information:')} ${result.item.url}
% endif

==============================================================================

${_('*{user_display_name}*, you receive this email because you are *{user_role_label}* in the workspace {workspace_label} - {workspace_url}').format(user_display_name=user_display_name, user_role_label=user_role_label, workspace_url=result.item.workspace.url, workspace_label=workspace_label)}

