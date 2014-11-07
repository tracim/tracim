## -*- coding: utf-8 -*-
<html>
  <head>
    <style>
      a { color: #3465af;}
      a.call-to-action {
        background: #3465af;
        padding: 3px 4px 5px 4px;
        border: 1px solid #12438d;
        font-weight: bold;
        color: #FFF;
        text-decoration: none;
        margin-left: 5px;
      }
      a.call-to-action img { vertical-align: middle;}
      th { vertical-align: top;}
    </style>
  </head>
  <body style="font-family: Arial; font-size: 12px; width: 600px; margin: 0; padding: 0;">

    <table style="width: 600px; cell-padding: 0; 	border-collapse: collapse;">
      <tr style="background-color: F5F5F5; border-bottom: 1px solid #CCC;" >
        <td>
          <img src="${base_url+'/assets/img/logo.png'}" style="vertical-align: middle;"/>
          <span style="font-weight: bold; padding-left: 0.5em; font-size: 1.5em; vertical-align: middle;">${h.CFG.WEBSITE_TITLE}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 5px 5px 2em;">
          <img style="vertical-align: middle;" src="${base_url+'/assets/icons/32x32/places/folder-remote.png'}"/>
          <span style="font-weight: bold; padding-left: 0.5em; font-size: 1.2em; vertical-align: middle;">${result.item.workspace.label}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 5px 5px 4em;">
          <img style="vertical-align: middle;" src="${base_url+'/assets/icons/32x32/'+result.item.icon+'.png'}"/>
          <span style="font-weight: bold; padding-left: 0.5em; font-size: 1em; vertical-align: middle;">
            ${result.item.label} &mdash;
            <span style="font-weight: bold; color: #999; font-weight: bold;">
                ${result.item.status.label}
                <img src="${base_url+'/assets/icons/16x16/{}.png'.format(result.item.status.icon)}" style="vertical-align: middle;">
            </span>
          </span>
        </td>
      </tr>
    </table>

    <hr style="border: 0px solid #CCC; border-width: 1px 0 0 0;">

    <div style="margin-left: 0.5em; border: 1em solid #DDD; border-width: 0 0 0 1em; padding-left: 1em;">
      <p>
        ${_('Some activity has been detected')|n}
        ##
        ## TODO - D.A. - Show last action in the notification message
        ##
        ## &mdash;
        ## <img style="vertical-align: middle; " src="${base_url+'/assets/icons/16x16/'+result.item.last_action.icon+'.png'}"/>
        ## ${result.item.last_action.label}
        ##
        ${_('<span style="{style}">&mdash; by {actor_name}</span>').format(style='color: #666; font-weight: bold;', actor_name=result.actor.name)}
      </p>
      <p>
        % if result.item.is_deleted:
            <img style="vertical-align: middle; " src="${base_url+'/assets/icons/16x16/status/user-trash-full.png'}"/>
            ${_('This item has been deleted.')}
        % elif result.item.is_archived:
            <img style="vertical-align: middle; " src="${base_url+'/assets/icons/16x16/mimetypes/package-x-generic.png'}"/>
            ${_('This item has been archived.')}
        % else:
            <a href="${result.item.url}" style="background-color: #5CB85C; border: 1px solid #4CAE4C; color: #FFF; text-decoration: none; font-weight: bold; padding: 4px; border-radius: 3px;">
              <img style="vertical-align: middle; " src="${base_url+'/assets/icons/16x16/actions/system-search.png'}"/>
              ${_('Go to information')}
            </a>
        % endif
        <div style="clear:both;"></div>
      </p>
    </div>

    <hr style="border: 0px solid #CCC; border-width: 1px 0 0 0;">

    <p style="color: #999; margin-left: 0.5em;">
      ${_('{user_display_name}, you receive this email because you are <b>{user_role_label}</b> in the workspace <a href="{workspace_url}">{workspace_label}</a>').format(user_display_name=user_display_name, user_role_label=user_role_label, workspace_url=result.item.workspace.url, workspace_label=workspace_label)|n}
    </p>
  </body>
</html>
