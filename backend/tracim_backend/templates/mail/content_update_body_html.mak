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
Reply to this email directly or <a href="${call_to_action_url}">view it on tracim</a>.
You're receiving this email because of your account on ${config.WEBSITE_TITLE}.
If you'd like to receive fewer emails, you can <a href="${config.WEBSITE_BASE_URL}/ui/account">unsubscribe from notifications</a>.
</pre>
