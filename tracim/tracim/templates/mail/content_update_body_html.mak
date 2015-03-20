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
      
      #content-intro-username { font-size: 1.5em; color: #666; font-weight: bold; }
      #content-intro { margin: 0; border: 1em solid #DDD; border-width: 0 0 0 0em; padding: 1em 1em 1em 1em; }
      #content-body { margin: 0em; border: 2em solid #DDD; border-width: 0 0 0 4em; padding: 0.5em 2em 1em 1em; }
      #content-body-intro { font-size: 2em; color: #666; }
      #content-body-only-title { font-size: 1.5em; }

      #content-body ins { background-color: #AFA; }
      #content-body del { background-color: #FAA; }


      #call-to-action-button { background-color: #5CB85C; border: 1px solid #4CAE4C; color: #FFF; text-decoration: none; font-weight: bold; padding: 4px; border-radius: 3px; font-size: 2em; padding-right: 0.5em;}
      #call-to-action-container { text-align: right; margin-top: 2em; }

      #footer hr { border: 0px solid #CCC; border-top-width: 1px; width: 8em; max-width:25%; margin-left: 0;}
      #footer { color: #999; margin: 4em auto auto 0.5em; }
      #footer a { color: #999; }
    </style>
  </head>
  <body style="font-family: Arial; font-size: 12px; max-width: 600px; margin: 0; padding: 0;">

    <table style="width: 100%; cell-padding: 0; border-collapse: collapse; margin: 0">
      <tr style="background-color: F5F5F5; border-bottom: 1px solid #CCC;" >
        <td style="background-color: #666;">
          <img src="http://team.trac.im/assets/img/logo.png" style="vertical-align: middle;"/>
        </td>
        <td style="padding: 0.5em; background-color: #666; text-align: left;">
          <span style="font-size: 1.3em; color: #FFF; font-weight: bold;">
            ${main_title}
            &mdash;&nbsp;<span style="font-weight: bold; color: #999; font-weight: bold;">
                ${result.item.status.label}
                <img alt="" src="${base_url+'/assets/icons/16x16/{}.png'.format(result.item.status.icon)}" style="vertical-align: middle;">
            </span>
        </td>
      </tr>
    </table>

    <p id="content-intro">${content_intro|n}</p>
    <div id="content-body">
        <div>${content_text|n}</div>
        <div id="call-to-action-container">
            <span style="">
                <a href="${result.item.url}" id='call-to-action-button'>${call_to_action_text}</a>
            </span>
        </div>
    </div>
    
    <div id="footer">
        <p>
            ${_('{user_display_name}, you receive this email because you are registered on <i>{website_title}</i> and you are <i>{user_role_label}</i> in the workspace <a href="{workspace_url}">{workspace_label}</a>.').format(user_display_name=user_display_name, user_role_label=user_role_label, workspace_url=result.item.workspace.url, workspace_label=workspace_label, website_title=h.CFG.WEBSITE_TITLE)|n}
        </p>
        <hr/>
        <p>
            ${_('This email was automatically sent by <i>Tracim</i>, a collaborative software developped by Algoo.')}<br/>
            Algoo SAS &mdash; 9 rue du rocher de Lorzier, 38430 Moirans, France &mdash; <a style="text-decoration: none;" href="http://algoo.fr">www.algoo.fr</a>
        </p>
    </div>
  </body>
</html>
