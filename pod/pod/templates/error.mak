<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
                      "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>

<head>
  <meta content="text/html; charset=UTF-8" http-equiv="content-type"/>
  <title>A ${code} Error has Occurred </title>
</head>

<body>
<h1>Error ${code}</h1>

<%
import re
mf = re.compile(r'(</?)script', re.IGNORECASE)
def fixmessage(message):
    return mf.sub(r'\1noscript', message)
%>

<div>${fixmessage(message) | n}</div>
</body>
</html>
