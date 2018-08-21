## -*- coding: utf-8 -*-

${_("Dear {user}").format(user=user.display_name)}

${_("This email is intended to be read as HTML content.Please configure your email client to get the best of Tracim notifications.")}
${_("We understand that Email was originally intended to carry raw text only.\nAnd you probably understand on your own that we are a decades after email \n was created ;)")}

${_("Hope you'll switch your mail client configuration and enjoy Tracim :)")}


--------------------------------------------------------------------------------

${_("You receive this email because you are registered on {website_title} \n and you are {role} in the workspace {workspace_label}.").format(
website_title=config.WEBSITE_TITLE,
role=role_label,
workspace_label=workspace.label
)}
----

${_("This email was sent by *Tracim*,\na collaborative software developped by Algoo.")}

**Algoo SAS**
340 Rue de l'Eygala
38430 Moirans
France
http://algoo.fr

