## -*- coding: utf-8 -*-
<style>
  ins { background-color: #c0ffc0; }
  del { background-color: #ffc0c0; }
</style>

% if content_intro:
<p>${content_intro|n}</p>
% endif
% if content_text:
<div>${content_text|n}</div>
% endif

<pre>
--
% if config.EMAIL_REPLY_ACTIVATED:
${_('Reply to this email directly or <a href="{call_to_action_url}">view it on tracim</a>').format(call_to_action_url=call_to_action_url)}
% else:
${_('<a href="{call_to_action_url}">view it on tracim</a>').format(call_to_action_url)}
%endif
${_("You're receiving this email because of your account on {website_title}.").format(website_title=config.WEBSITE_TITLE)}
${_("If you'd like to receive fewer emails, you can <a href=\"{website_title}/ui/account\">unsubscribe from notifications</a>.").format(website_title=config.WEBSITE_BASE_URL)}
</pre>
