/*
CalDavZAP - the open source CalDAV Web Client
Copyright (C) 2011-2015
    Jan Mate <jan.mate@inf-it.com>
    Andrej Lezo <andrej.lezo@inf-it.com>
    Matej Mihalik <matej.mihalik@inf-it.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

function CalDAVcleanupRegexEnvironment(repeatHash)
{
	if(typeof repeatHash!='undefined')
	{
		for(var element in vCalendar.tplM)
			if(element.indexOf('VT')==0 && typeof vCalendar.tplM[element][repeatHash]!='undefined')
				delete vCalendar.tplM[element][repeatHash];
	}
	else
		for(var element in vCalendar.tplM)
		 if(element=='unprocessed' || element=='unprocessedVTIMEZONE')
			vCalendar.tplM[element]='';
		else if(element.indexOf('VT')!=0)
			vCalendar.tplM[element]=new Array();
}

var vCalendar = new Object();
// RFC compiant templates (clean)
vCalendar.tplC = new Object();
// RFC compiant templates (modified -> if the editor does not support some of the attribute or value, we keep these intact)
vCalendar.tplM = new Object();

// subset of RFC 2234 (Augmented BNF for Syntax Specifications) used in RFC 2426 (vCalendar MIME Directory Profile)
vCalendar.re = new Object();
vCalendar.pre = new Object();
//vCalendar.re['ALPHA']='[\u0041-\u005a\u0061-\u007a]';	// ASCII Alphabetic characters
vCalendar.re['ALPHA']='[\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u066e\u0671-\u06d3\u06d5\u06e5\u06ee-\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971\u097b-\u097f\u0985-\u098c\u098f\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09df-\u09e1\u09f0\u0a05-\u0a0a\u0a0f\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a35-\u0a36\u0a38\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0b05-\u0b0c\u0b0f\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b35-\u0b39\u0b3d\u0b5c\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9c\u0b9e-\u0b9f\u0ba3\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c60-\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e40-\u0e46\u0e81\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0ead-\u0eb0\u0eb2\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400\u4db5\u4e00\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua61f\ua62a\ua640-\ua65f\ua662-\ua66e\ua67f-\ua697\ua717-\ua71f\ua722-\ua788\ua78b\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua90a-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uac00\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc\u0345\u05b0-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u0610-\u061a\u064b-\u0657\u0659-\u065e\u0670\u06d6-\u06dc\u06e1-\u06e4\u06e7-\u06e8\u06ed\u0711\u0730-\u073f\u07a6-\u07b0\u0901-\u0902\u0903\u093e-\u0940\u0941-\u0948\u0949-\u094c\u0962-\u0963\u0981\u0982-\u0983\u09be-\u09c0\u09c1-\u09c4\u09c7-\u09c8\u09cb-\u09cc\u09d7\u09e2-\u09e3\u0a01-\u0a02\u0a03\u0a3e-\u0a40\u0a41-\u0a42\u0a47-\u0a48\u0a4b-\u0a4c\u0a51\u0a70-\u0a71\u0a75\u0a81-\u0a82\u0a83\u0abe-\u0ac0\u0ac1-\u0ac5\u0ac7-\u0ac8\u0ac9\u0acb-\u0acc\u0ae2-\u0ae3\u0b01\u0b02-\u0b03\u0b3e\u0b3f\u0b40\u0b41-\u0b44\u0b47-\u0b48\u0b4b-\u0b4c\u0b56\u0b57\u0b62-\u0b63\u0b82\u0bbe-\u0bbf\u0bc0\u0bc1-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcc\u0bd7\u0c01-\u0c03\u0c3e-\u0c40\u0c41-\u0c44\u0c46-\u0c48\u0c4a-\u0c4c\u0c55-\u0c56\u0c62-\u0c63\u0c82-\u0c83\u0cbe\u0cbf\u0cc0-\u0cc4\u0cc6\u0cc7-\u0cc8\u0cca-\u0ccb\u0ccc\u0cd5-\u0cd6\u0ce2-\u0ce3\u0d02-\u0d03\u0d3e-\u0d40\u0d41-\u0d44\u0d46-\u0d48\u0d4a-\u0d4c\u0d57\u0d62-\u0d63\u0d82-\u0d83\u0dcf-\u0dd1\u0dd2-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2-\u0df3\u0e31\u0e34-\u0e3a\u0e4d\u0eb1\u0eb4-\u0eb9\u0ebb-\u0ebc\u0ecd\u0f71-\u0f7e\u0f7f\u0f80-\u0f81\u0f90-\u0f97\u0f99-\u0fbc\u102b-\u102c\u102d-\u1030\u1031\u1032-\u1036\u1038\u103b-\u103c\u103d-\u103e\u1056-\u1057\u1058-\u1059\u105e-\u1060\u1062\u1067-\u1068\u1071-\u1074\u1082\u1083-\u1084\u1085-\u1086\u135f\u1712-\u1713\u1732-\u1733\u1752-\u1753\u1772-\u1773\u17b6\u17b7-\u17bd\u17be-\u17c5\u17c6\u17c7-\u17c8\u18a9\u1920-\u1922\u1923-\u1926\u1927-\u1928\u1929-\u192b\u1930-\u1931\u1932\u1933-\u1938\u19b0-\u19c0\u19c8-\u19c9\u1a17-\u1a18\u1a19-\u1a1b\u1b00-\u1b03\u1b04\u1b35\u1b36-\u1b3a\u1b3b\u1b3c\u1b3d-\u1b41\u1b42\u1b43\u1b80-\u1b81\u1b82\u1ba1\u1ba2-\u1ba5\u1ba6-\u1ba7\u1ba8-\u1ba9\u1c24-\u1c2b\u1c2c-\u1c33\u1c34-\u1c35\u24b6-\u24e9\u2de0-\u2dff\ua823-\ua824\ua825-\ua826\ua827\ua880-\ua881\ua8b4-\ua8c3\ua926-\ua92a\ua947-\ua951\ua952\uaa29-\uaa2e\uaa2f-\uaa30\uaa31-\uaa32\uaa33-\uaa34\uaa35-\uaa36\uaa43\uaa4c\uaa4d\ufb1e]';	// UTF-8 Alphabetic characters
vCalendar.re['CR']='\u000d';
vCalendar.re['LF']='\u000a';
vCalendar.re['CRLF']='(?:'+vCalendar.re['CR']+vCalendar.re['LF']+')';
vCalendar.re['DIGIT']='[\u0030-\u0039]';
vCalendar.re['DQUOTE']='\u0022';
vCalendar.re['HTAB']='\u0009';
vCalendar.re['SP']='\u0020';
vCalendar.re['WSP']='(?:'+vCalendar.re['SP']+'|'+vCalendar.re['HTAB']+')';

//language parameter
vCalendar.re['ALPHANUM'] = '(?:'+vCalendar.re['ALPHA']+'|'+vCalendar.re['DIGIT']+')';
vCalendar.re['regular'] = '(?:art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang)';
vCalendar.re['irregular'] = '(?:en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)';
vCalendar.re['grandfathered'] = '(?:'+vCalendar.re['irregular']+'|'+vCalendar.re['regular']+')';
vCalendar.re['privateuse'] = '(?:x(-('+vCalendar.re['ALPHANUM']+'){3}){1,3})';
vCalendar.re['singleton'] = '(?:'+vCalendar.re['DIGIT']+'|[A-WY-Za-wy-z])';
vCalendar.re['extension'] = '(?:'+vCalendar.re['singleton']+'(-'+vCalendar.re['ALPHANUM']+'{2,8}){1,})';
vCalendar.re['variant'] = '(?:'+vCalendar.re['ALPHANUM']+'{5,8}|('+vCalendar.re['DIGIT']+''+vCalendar.re['ALPHANUM']+'{3}))';
vCalendar.re['region'] = '(?:'+vCalendar.re['ALPHA']+'{2}|'+vCalendar.re['DIGIT']+'{3})';
vCalendar.re['script'] = '(?:'+vCalendar.re['ALPHA']+'{4})';
vCalendar.re['extlang'] = '(?:'+vCalendar.re['ALPHA']+'{3}(-'+vCalendar.re['ALPHA']+'{3}){0,2})';
vCalendar.re['language'] = '(?:('+vCalendar.re['ALPHA']+'{2,3}(-'+vCalendar.re['extlang']+')?)|'+vCalendar.re['ALPHA']+'{4}|'+vCalendar.re['ALPHA']+'{5,8})';
vCalendar.re['langtag'] = '(?:'+vCalendar.re['language']+'(-'+vCalendar.re['script']+')?(-'+vCalendar.re['region']+')?(-'+vCalendar.re['variant']+')*(-'+vCalendar.re['extension']+')*(-'+vCalendar.re['privateuse']+')?)';
vCalendar.re['Language-Tag'] = '(?:'+vCalendar.re['langtag']+'|'+vCalendar.re['privateuse']+'|'+vCalendar.re['grandfathered']+')';


// unused because vCard.re['VALUE-CHAR'] was replaced by much simpler version (we allow any character in the value field except \r and \n)
//vCalendar.re['VCHAR']='[\u0021-\u007e]';	// ASCII Visible characters
//vCalendar.re['VCHAR']='[\u0021-\u007e\u00a0-\u00ac\u00ae-\u0377\u037a-\u037e\u0384-\u038a\u038c\u038e-\u03a1\u03a3-\u0523\u0531-\u0556\u0559-\u055f\u0561-\u0587\u0589\u0591-\u05c7\u05d0-\u05ea\u05f0-\u05f4\u0606-\u061b\u061e\u0621-\u065e\u0660-\u06dc\u06de-\u070d\u0710-\u074a\u074d-\u07b1\u07c0-\u07fa\u0901-\u0939\u093c-\u094d\u0950-\u0954\u0958-\u0972\u097b-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09cb-\u09ce\u09d7\u09dc\u09df-\u09e3\u09e6-\u09fa\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a35-\u0a36\u0a38\u0a3c\u0a3e-\u0a42\u0a47\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0af1\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b4b-\u0b4d\u0b56\u0b5c-\u0b5d\u0b5f-\u0b63\u0b66-\u0b71\u0b82\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9c\u0b9e-\u0b9f\u0ba3\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bfa\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c58-\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c78-\u0c7f\u0c82\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0d02-\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d60-\u0d63\u0d66-\u0d75\u0d79-\u0d7f\u0d82\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2-\u0df4\u0e01-\u0e3a\u0e3f-\u0e5b\u0e81\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc\u0f00-\u0f47\u0f49-\u0f6c\u0f71-\u0f8b\u0f90-\u0f97\u0f99-\u0fbc\u0fbe-\u0fcc\u0fce-\u0fd4\u1000-\u1099\u109e-\u10c5\u10d0-\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135f-\u137c\u1380-\u1399\u13a0-\u13f4\u1401-\u1676\u1680-\u169c\u16a0-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1736\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1780-\u17b3\u17b6-\u17dd\u17e0-\u17e9\u17f0-\u17f9\u1800-\u180e\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1940\u1944-\u196d\u1970-\u1974\u1980-\u19a9\u19b0-\u19c9\u19d0-\u19d9\u19de-\u1a1b\u1a1e\u1b00-\u1b4b\u1b50-\u1b7c\u1b80-\u1baa\u1bae-\u1bb9\u1c00-\u1c37\u1c3b-\u1c49\u1c4d-\u1c7f\u1d00-\u1de6\u1dfe-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fc4\u1fc6-\u1fd3\u1fd6-\u1fdb\u1fdd-\u1fef\u1ff2-\u1ff4\u1ff6-\u1ffe\u2000-\u200a\u2010-\u2027\u202f-\u205f\u2070\u2074-\u208e\u2090-\u2094\u20a0-\u20b5\u20d0-\u20f0\u2100-\u214f\u2153-\u2188\u2190-\u23e7\u2400-\u2426\u2440-\u244a\u2460-\u269d\u26a0-\u26bc\u26c0-\u26c3\u2701-\u2704\u2706-\u2709\u270c-\u2727\u2729-\u274b\u274d\u274f-\u2752\u2756\u2758-\u275e\u2761-\u2794\u2798-\u27af\u27b1-\u27be\u27c0-\u27ca\u27cc\u27d0-\u2b4c\u2b50-\u2b54\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2cea\u2cf9-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2e30\u2e80-\u2e99\u2e9b-\u2ef3\u2f00-\u2fd5\u2ff0-\u2ffb\u3000-\u303f\u3041-\u3096\u3099-\u30ff\u3105-\u312d\u3131-\u318e\u3190-\u31b7\u31c0-\u31e3\u31f0-\u321e\u3220-\u3243\u3250-\u32fe\u3300-\u3400\u4db5\u4dc0-\u4e00\u9fc3\ua000-\ua48c\ua490-\ua4c6\ua500-\ua62b\ua640-\ua65f\ua662-\ua673\ua67c-\ua697\ua700-\ua78c\ua7fb-\ua82b\ua840-\ua877\ua880-\ua8c4\ua8ce-\ua8d9\ua900-\ua953\ua95f\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa5c-\uaa5f\uac00\ud7a3\ue000\uf8ff-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfd\ufe00-\ufe19\ufe20-\ufe26\ufe30-\ufe52\ufe54-\ufe66\ufe68-\ufe6b\ufe70-\ufe74\ufe76-\ufefc\uff01-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc\uffe0-\uffe6\uffe8-\uffee\ufffc\ufffd]';	// UTF-8 Visible characters (Print characters except \u0020 - space)
//vCalendar.re['NON-ASCII']='[\u0080-\u00ff]';		// NON-ASCII
vCalendar.re['NON-ASCII']='[\u0080-\uffff]';	// UTF-8 NON-ASCII
vCalendar.re['QSAFE-CHAR']='(?:'+vCalendar.re['WSP']+'|[\u0021\u0023-\u007e]|'+vCalendar.re['NON-ASCII']+')';
vCalendar.re['SAFE-CHAR']='(?:'+vCalendar.re['WSP']+'|[\u0021\u0023-\u002b\u002d-\u0039\u003c-\u007e]|'+vCalendar.re['NON-ASCII']+'|-)';
// exact version
//vCalendar.re['VALUE-CHAR']='(?:'+vCalendar.re['WSP']+'|'+vCalendar.re['VCHAR']+'|'+vCalendar.re['NON-ASCII']+')';
// fast version (we allow any character in the value field except \r and \n)
vCalendar.re['VALUE-CHAR']='.';
vCalendar.re['ESCAPED-CHAR']='(?:(?:\\\\)|(?:\\\\;)|(?:\;)|(?:\\\\,)|(?:\\\\[nN]))';

// vCalendar Definition (general)
vCalendar.re['group']='(?:'+vCalendar.re['ALPHA']+'|'+vCalendar.re['DIGIT']+'|-)+';
vCalendar.re['iana-token']='(?:'+vCalendar.re['ALPHA']+'|'+vCalendar.re['DIGIT']+'|-)+';
vCalendar.re['x-name']='X-(?:'+vCalendar.re['ALPHA']+'|'+vCalendar.re['DIGIT']+'|-)+';
vCalendar.re['name']='(?:'+vCalendar.re['iana-token']+'|'+vCalendar.re['x-name']+')';
vCalendar.re['ptext']='(?:'+vCalendar.re['SAFE-CHAR']+')*';
vCalendar.re['quoted-string']='(?:'+vCalendar.re['DQUOTE']+vCalendar.re['QSAFE-CHAR']+'*'+vCalendar.re['DQUOTE']+')';	// BUG in RFC? -> it defines quoted char instead quoted string
vCalendar.re['param-value']='(?:'+vCalendar.re['ptext']+'|'+vCalendar.re['quoted-string']+')';
vCalendar.re['param-name']='(?:'+vCalendar.re['iana-token']+'|'+vCalendar.re['x-name']+')';
vCalendar.re['param']='(?:'+vCalendar.re['param-name']+'='+vCalendar.re['param-value']+'(?:,'+vCalendar.re['param-value']+')*)';
vCalendar.re['value']='(?:'+vCalendar.re['VALUE-CHAR']+')*';
// exact version
//vCalendar.re['contentline']='(?:'+vCalendar.re['group']+'\\.)?'+vCalendar.re['name']+'(?:;'+vCalendar.re['param']+')*:'+vCalendar.re['value']+vCalendar.re['CRLF'];
// fast version
if(typeof globalLazyMatching=='undefined' || globalLazyMatching!=false)
	vCalendar.re['contentline']='.+'+vCalendar.re['CRLF'];
else
	vCalendar.re['contentline']='(?:'+vCalendar.re['group']+'\\.)?'+vCalendar.re['name']+'(?:;'+vCalendar.re['param']+')*:.*'+vCalendar.re['CRLF'];
// contentline_parse = [1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
// exact version
//vCalendar.re['contentline_parse']='((?:'+vCalendar.re['group']+'\\.)?)('+vCalendar.re['name']+')((?:;'+vCalendar.re['param']+')*):('+vCalendar.re['value']+')'+vCalendar.re['CRLF'];
// fast version
vCalendar.re['contentline_parse']='((?:'+vCalendar.re['group']+'\\.)?)('+vCalendar.re['name']+')((?:;'+vCalendar.re['param']+')*):(.*)'+vCalendar.re['CRLF'];
vCalendar.pre['contentline_parse']=RegExp('\r\n'+vCalendar.re['contentline_parse'],'mi');
vCalendar.re['vcalendar']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VCALENDAR'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VCALENDAR'+vCalendar.re['CRLF']+')';
vCalendar.pre['vcalendar']=RegExp(vCalendar.re['vcalendar']);
vCalendar.re['vtodo']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VTODO'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VTODO'+vCalendar.re['CRLF']+')';
vCalendar.pre['vtodo']=RegExp(vCalendar.re['vtodo']);
vCalendar.re['vevent']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VEVENT'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VEVENT'+vCalendar.re['CRLF']+')';
vCalendar.pre['vevent']=RegExp(vCalendar.re['vevent']);
vCalendar.re['valarm']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VALARM'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VALARM'+vCalendar.re['CRLF']+')';
vCalendar.pre['valarm']=RegExp(''+vCalendar.re['valarm']);
vCalendar.re['valarm2']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VALARM'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VALARM)';
vCalendar.pre['valarm2']=RegExp(vCalendar.re['valarm2']);
vCalendar.re['tzone']='(?:(?:'+vCalendar.re['group']+'\\.)?BEGIN:VTIMEZONE'+vCalendar.re['CRLF']+'(?:'+vCalendar.re['contentline']+')+'+'(?:'+vCalendar.re['group']+'\\.)?END:VTIMEZONE'+vCalendar.re['CRLF']+')';
vCalendar.pre['tzone']=RegExp(vCalendar.re['tzone']);
vCalendar.re['vcalendar-entity']='(?:'+vCalendar.re['vcalendar']+')+';

// vCalendar Definition (full RFC specification, internal revision 1.0)
//vCalendar.re['langval']='(?:aa|aar|ab|abk|ace|ach|ada|af|afa|afh|afr|ajm|aka|akk|alb/sqi|ale|alg|am|amh|ang|apa|ar|ara|arc|arm/hye|arn|arp|art|arw|as|asm|ath|ava|ave|awa|ay|aym|az|aze|ba|bad|bai|bak|bal|bam|ban|baq/eus|bas|bat|be|bej|bel|bem|ben|ber|bg|bh|bho|bi|bih|bik|bin|bis|bla|bn|bo|bod/tib|br|bra|bre|bug|bul|bur/mya|ca|cad|cai|car|cat|cau|ceb|cel|ces/cze|cha|chb|che|chg|chi/zho|chn|cho|chr|chu|chv|chy|co|cop|cor|cos|cpe|cpf|cpp|cre|crp|cs|cus|cy|cym/wel|cze/ces|da|dak|dan|de|del|deu/ger|din|doi|dra|dua|dum|dut/nld|dyu|dz|dzo|efi|egy|eka|el|ell/gre|elx|en|en-cokney|eng|enm|eo|epo|es|esk|esl/spa|est|et|eth|eu|eus/baq|ewe|ewo|fa|fan|fao|fas/per|fat|fi|fij|fin|fiu|fj|fo|fon|fr|fra/fre|fre/fra|frm|fro|fry|ful|fy|ga|gaa|gae/gdh|gai/iri|gay|gd|gdh/gae|gem|geo/kat|ger/deu|gil|gl|glg|gmh|gn|goh|gon|got|grb|grc|gre/ell|grn|gu|guj|ha|hai|hau|haw|he|heb|her|hi|hil|him|hin|hmo|hr|hu|hun|hup|hy|hye/arm|i-sami-no|ia|iba|ibo|ice/isl|id|ie|ijo|ik|iku|ile|ilo|in|ina|inc|ind|ine|ipk|ira|iri/gai|iro|is|isl/ice||it|ita|iu|iw|ja|jav/jaw|jaw/jav|ji|jpn|jpr|jrb|jw|ka|kaa|kab|kac|kal|kam|kan|kar|kas|kat/geo|kau|kaw|kaz|kha|khi|khm|kho|kik|kin|kir|kk|kl|km|kn|ko|kok|kon|kor|kpe|kro|kru|ks|ku|kua|kur|kus|kut|ky|la|lad|lah|lam|lao|lap|lat|lav|lin|lit|ln|lo|lol|loz|lt|lub|lug|lui|lun|luo|lv|mac/mke|mad|mag|mah|mai|mak|mal|man|mao/mri|map|mar|mas|max|may/msa|men|mg|mi|mic|min|mis|mk|mke/mac|mkh|ml|mlg|mlt|mn|mni|mno|mo|moh|mol|mon|mos|mr|mri/mao|ms|msa/may|mt|mul|mun|mus|mwr|my|mya/bur|myn|na|nah|nai|nau|nav|nde|ndo|ne|nep|new|nic|niu|nl|nld/dut|no|no-bok|no-nyn|non|nor|nso|nub|nya|nym|nyn|nyo|nzi|oc|oci|oji|om|or|ori|orm|osa|oss|ota|oto|pa|paa|pag|pal|pam|pan|pap|pau|peo|per/fas|pl|pli|pol|pon|por|pra|pro|ps|pt|pus|qu|que|raj|rar|rm|rn|ro|roa|roh|rom|ron/rum|ru|rum/ron|run|rus|rw|sa|sad|sag|sai|sal|sam|san|sco|scr|sd|sel|sem|sg|sh|shn|si|sid|sin|sio|sit|sk|sl|sla|slk/slo|slo/slk|slv|sm|smo|sn|sna|snd|so|sog|som|son|sot|spa/esl|sq|sqi/alb|sr|srr|ss|ssa|ssw|st|su|suk|sun|sus|sux|sv|sve/swe|sw|swa|swe/sve|syr|ta|tah|tam|tat|te|tel|tem|ter|tg|tgk|tgl|th|tha|ti|tib/bod|tig|tir|tiv|tk|tl|tli|tn|to|tog|ton|tr|tru|ts|tsi|tsn|tso|tt|tuk|tum|tur|tut|tw|twi|ug|uga|uig|uk|ukr|umb|und|ur|urd|uz|uzb|vai|ven|vi|vie|vo|vol|vot|wak|wal|war|was|wel/cym|wen|wo|wo|wol|x-klingon|xh|xh|xho|yao|yap|yi|yid|yo|yo|yor|za|zap|zen|zh|zha|zho/chi|zu|zul|zun)';
vCalendar.re['text-param']='(?:VALUE=ptext|LANGUAGE='+vCalendar.re['Language-Tag']+'|'+vCalendar.re['x-name']+'='+vCalendar.re['param-value']+')';
vCalendar.re['text-value']='(?:'+vCalendar.re['SAFE-CHAR']+'|[:"]|'+vCalendar.re['ESCAPED-CHAR']+')*';
vCalendar.re['text-value-list']=vCalendar.re['text-value']+'(?:,'+vCalendar.re['text-value']+')*';
//vCalendar.re['img-inline-value']='(?:[A-Za-z+/]{4})*(?:(?:[A-Za-z+/]{4})|(?:[A-Za-z+/]{3}=)|(?:[A-Za-z+/]{2}==))';	// RFC 4648 -> TODO: "BASE64:" prefix (is it RFC compiant?)
//new version
// docasne -> opravit (hore by to malo byt spravne, ale zjavne nie je ...)

vCalendar.re['date-value']='[0-2][0-9]{3}?(?:0[1-9]|1[012])?(?:0[1-9]|[12][0-9]|3[01])';		// TODO: do not allow invalid dates as: 2000-02-30
vCalendar.re['date-time-value']=vCalendar.re['date-value']+'T(?:[01][0-9]|2[0-3]):?(?:[0-5][0-9])(?::?(?:[0-5][0-9]))?(?:Z?|[+-](?:[01][0-9]|2[0-3])(?::?(?:[0-5][0-9]))?)';
vCalendar.pre['date-time-value']=RegExp(vCalendar.re['date-time-value'],'mi');
vCalendar.re['utc-offset-value']='[+-]?(?:[01][0-9]|2[0-3]):[0-5][0-9]';	// TODO - pridal som otaznik za +-
vCalendar.re['float-value']='[+-]?[0-9]+\\.[0-9]+';	// TODO - pridal som otaznik za +-


vCalendar.re['xparam']=vCalendar.re['x-name']+'='+vCalendar.re['param-value']+'(?:,'+vCalendar.re['param-value']+')*';
vCalendar.re['freq']='(?:SECONDLY|MINUTELY|HOURLY|DAILY|WEEKLY|MONTHLY|YEARLY)';
vCalendar.re['seconds_minutes']='[1-5]?[0-9]';
vCalendar.re['byhrlist']='(?:1?[0-9]|2[0-3])';
vCalendar.re['byseclist_byminlist']=vCalendar.re['seconds_minutes']+'(?:,'+vCalendar.re['seconds_minutes']+')*';
vCalendar.re['ordwk']='(?:[1-9]|[1-4][0-9]|5[0-3])?';
vCalendar.re['weekday']='(?:SU|MO|TU|WE|TH|FR|SA)';
vCalendar.re['weekdaynum']='[+-]?'+vCalendar.re['ordwk']+vCalendar.re['weekday'];
vCalendar.re['bywdaylist']=vCalendar.re['weekdaynum']+'(?:,'+vCalendar.re['weekdaynum']+')*';
vCalendar.re['ordmoday']='(?:[1-9]|[1-2][0-9]|3[0-1])';
vCalendar.re['monthdaynum']='[+-]?'+vCalendar.re['ordmoday'];
vCalendar.re['bymodaylist']=vCalendar.re['monthdaynum']+'(?:,'+vCalendar.re['monthdaynum']+')*';
vCalendar.re['ordyrday']='(?:[1-9]|[1-2]?[1-9][0-9]|3[0-5][0-9]|36[0-6])';
vCalendar.re['yeardaynum']='[+-]?'+vCalendar.re['ordyrday'];
vCalendar.re['byyrdaylist']=vCalendar.re['yeardaynum']+'(?:,'+vCalendar.re['yeardaynum']+')*';
vCalendar.re['weeknum']='[+-]?'+vCalendar.re['ordwk'];
vCalendar.re['bywknolist']=vCalendar.re['weeknum']+'(?:,'+vCalendar.re['weeknum']+')*';
vCalendar.re['monthnum']='(?:[1-9]|1[0-2])';
vCalendar.re['bymolist']=vCalendar.re['monthnum']+'(?:,'+vCalendar.re['monthnum']+')*';
vCalendar.re['bysplist']=vCalendar.re['yeardaynum']+'(?:,'+vCalendar.re['yeardaynum']+')*';
vCalendar.re['dtstval']='(?:'+vCalendar.re['date-value']+'|'+vCalendar.re['date-time-value']+')';
vCalendar.re['recur']='(?:FREQ='+vCalendar.re['freq']+'|;UNTIL='+vCalendar.re['dtstval']+'|;COUNT='+vCalendar.re['DIGIT']+'+|;INTERVAL='+vCalendar.re['DIGIT']+'+|;BYSECOND='+vCalendar.re['byseclist_byminlist']+'|;BYMINUTE='+vCalendar.re['byseclist_byminlist']+'|;BYHOUR='+vCalendar.re['byhrlist']+'|;BYDAY='+vCalendar.re['bywdaylist']+'|;BYMONTHDAY='+vCalendar.re['bymodaylist']+'|;BYYEARDAY='+vCalendar.re['byyrdaylist']+'|;BYWEEKNO='+vCalendar.re['bywknolist']+'|;BYMONTH='+vCalendar.re['bymolist']+'|;BYSETPOS='+vCalendar.re['bysplist']+'|;WKST='+vCalendar.re['weekday']+'|;'+vCalendar.re['x-name']+'='+vCalendar.re['text-value']+')*';
vCalendar.re['recurCaldav']='^(?:FREQ='+vCalendar.re['freq']+'|;UNTIL='+vCalendar.re['dtstval']+'|;COUNT='+vCalendar.re['DIGIT']+'+|;INTERVAL='+vCalendar.re['DIGIT']+'+|;BYDAY='+vCalendar.re['bywdaylist']+'|;BYMONTHDAY='+vCalendar.re['bymodaylist']+'|;BYMONTH='+vCalendar.re['bymolist']+'|;WKST='+vCalendar.re['weekday']+')*$';

vCalendar.re['contentline_SUMMARY']='(?:'+vCalendar.re['group']+'\\.)?SUMMARY(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_SUMMARY']=RegExp('\r\n'+vCalendar.re['contentline_SUMMARY'],'mi');

//vCalendar.re['contentline_DTSTART']='(?:'+vCalendar.re['group']+'\\.)?DTSTART:'+vCalendar.re['float-value']+';'+vCalendar.re['float-value']+vCalendar.re['CRLF'];

vCalendar.re['tzidparam']='TZID=/?'+vCalendar.re['param-value']; // more correct is vCalendar.re['ptext'] - from RFC 2445 -> TZID 4.2.19
vCalendar.re['dtstparam']='(?:VALUE=(?:date|date-time)|'+vCalendar.re['tzidparam']+'|'+vCalendar.re['xparam']+')';
vCalendar.re['contentline_DTSTART']='(?:'+vCalendar.re['group']+'\\.)?DTSTART(?:;'+vCalendar.re['dtstparam']+')*:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_DTSTART']=RegExp('\r\n'+vCalendar.re['contentline_DTSTART'],'mi');

vCalendar.re['contentline_LM']='(?:'+vCalendar.re['group']+'\\.)?LAST-MODIFIED:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_LM']=RegExp('\r\n'+vCalendar.re['contentline_LM'],'mi');

vCalendar.re['contentline_CREATED']='(?:'+vCalendar.re['group']+'\\.)?CREATED:'+vCalendar.re['date-time-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_CREATED']=RegExp('\r\n'+vCalendar.re['contentline_CREATED'],'mi');

vCalendar.re['contentline_DTSTAMP']='(?:'+vCalendar.re['group']+'\\.)?DTSTAMP:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_DTSTAMP']=RegExp('\r\n'+vCalendar.re['contentline_DTSTAMP'],'mi');


vCalendar.re['contentline_DTEND']= '(?:'+vCalendar.re['group']+'\\.)?DTEND(?:;'+vCalendar.re['dtstparam']+')*:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_DTEND']=RegExp('\r\n'+vCalendar.re['contentline_DTEND'],'mi');

vCalendar.re['contentline_DUE']= '(?:'+vCalendar.re['group']+'\\.)?DUE(?:;'+vCalendar.re['dtstparam']+')*:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_DUE']=RegExp('\r\n'+vCalendar.re['contentline_DUE'],'mi');

vCalendar.re['contentline_TZID']='(?:'+vCalendar.re['group']+'\\.)?TZID(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_TZID']=RegExp('\r\n'+vCalendar.re['contentline_TZID'],'mi');

vCalendar.re['contentline_RRULE']='(?:'+vCalendar.re['group']+'\\.)?RRULE(?:'+vCalendar.re['text-param']+')*:'+'.*'+vCalendar.re['CRLF'];
vCalendar.pre['contentline_RRULE']=RegExp('\r\n'+vCalendar.re['contentline_RRULE'],'mig');

vCalendar.re['contentline_RRULE2']='(?:'+vCalendar.re['group']+'\\.)?RRULE(?:;'+vCalendar.re['xparam']+')*:'+vCalendar.re['recur']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_RRULE2']=RegExp('\r\n'+vCalendar.re['contentline_RRULE2'],'mi');

vCalendar.re['contentline_RECURRENCE_ID']='(?:'+vCalendar.re['group']+'\\.)?RECURRENCE-ID(?:;'+vCalendar.re['dtstparam']+')*:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_RECURRENCE_ID']=RegExp('\r\n'+vCalendar.re['contentline_RECURRENCE_ID'],'mi');
vCalendar.pre['contentline_RECURRENCE_IDg']=RegExp('\r\n'+vCalendar.re['contentline_RECURRENCE_ID'],'mig');

vCalendar.re['contentline_EXDATE']='(?:'+vCalendar.re['group']+'\\.)?EXDATE(?:;'+vCalendar.re['dtstparam']+')*:'+vCalendar.re['dtstval']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_EXDATE']=RegExp('\r\n'+vCalendar.re['contentline_EXDATE'],'mi');

vCalendar.re['beginVEVENT']='BEGIN:VEVENT\r\n';
vCalendar.pre['beginVEVENT']=RegExp('\r\n'+vCalendar.re['beginVEVENT'],'mi');

vCalendar.re['endVEVENT']='END:VEVENT\r\n';
vCalendar.pre['endVEVENT']=RegExp('\r\n'+vCalendar.re['endVEVENT'],'mi');

vCalendar.re['beginVALARM']='BEGIN:VALARM\r\n';
vCalendar.pre['beginVALARM']=RegExp('\r\n'+vCalendar.re['beginVALARM'],'mig');

vCalendar.re['endVALARM']='END:VALARM\r\n';
vCalendar.pre['endVALARM']=RegExp('\r\n'+vCalendar.re['endVALARM'],'mi');

vCalendar.re['beginVTODO']='BEGIN:VTODO\r\n';
vCalendar.pre['beginVTODO']=RegExp('\r\n'+vCalendar.re['beginVTODO'],'mi');

vCalendar.re['endVTODO']='END:VTODO\r\n';
vCalendar.pre['endVTODO']=RegExp('\r\n'+vCalendar.re['endVTODO'],'mi');

vCalendar.re['contentline_ACTION']='(?:'+vCalendar.re['group']+'\\.)?ACTION(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_ACTION']=RegExp('\r\n'+vCalendar.re['contentline_ACTION'],'mig');

vCalendar.re['dur-day']=vCalendar.re['DIGIT']+'+D';
vCalendar.re['dur-second']=vCalendar.re['DIGIT']+'+S';
vCalendar.re['dur-minute']=vCalendar.re['DIGIT']+'+M(?:'+vCalendar.re['dur-second']+')?';
vCalendar.re['dur-hour']=vCalendar.re['DIGIT']+'+H(?:'+vCalendar.re['dur-minute']+')?';
vCalendar.re['dur-week']=vCalendar.re['DIGIT']+'+W';
vCalendar.re['dur-time']='T?(?:'+vCalendar.re['dur-hour']+'|'+vCalendar.re['dur-minute']+'|'+vCalendar.re['dur-second']+')';
vCalendar.re['dur-date']=vCalendar.re['dur-day']+'(?:'+vCalendar.re['dur-time']+')?';

vCalendar.re['dur-value']='[+-]?P(?:'+vCalendar.re['dur-date']+'|'+vCalendar.re['dur-time']+'|'+vCalendar.re['dur-week']+')';
vCalendar.pre['dur-value']=  RegExp('\r\nDURATION:'+vCalendar.re['dur-value'],'mi');

vCalendar.re['trigrel']='(?:;VALUE=DURATION|;RELATED=(?:START|END)|;'+vCalendar.re['xparam']+')*:'+vCalendar.re['dur-value'];
vCalendar.re['trigabs']='(?:;VALUE=DATE-TIME|;'+vCalendar.re['xparam']+')+:'+vCalendar.re['date-time-value'];

vCalendar.re['contentline_TRIGGER']='(?:'+vCalendar.re['group']+'\\.)?TRIGGER(?:'+vCalendar.re['trigrel']+'|'+vCalendar.re['trigabs']+')';
vCalendar.pre['contentline_TRIGGER']=  RegExp('\r\n'+vCalendar.re['contentline_TRIGGER'],'mi');

vCalendar.re['contentline_NOTE']='(?:'+vCalendar.re['group']+'\\.)?DESCRIPTION(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_NOTE']=RegExp('\r\n'+vCalendar.re['contentline_NOTE'],'mig');
vCalendar.pre['contentline_NOTE2']=RegExp('\r\n'+vCalendar.re['contentline_NOTE'],'mi');

vCalendar.re['contentline_LOCATION']='(?:'+vCalendar.re['group']+'\\.)?LOCATION(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_LOCATION']=RegExp('\r\n'+vCalendar.re['contentline_LOCATION'],'mi');

vCalendar.re['contentline_PRODID']='(?:'+vCalendar.re['group']+'\\.)?PRODID(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_PRODID']=RegExp('\r\n'+vCalendar.re['contentline_PRODID'],'mi');

vCalendar.re['contentline_STATUS']='(?:'+vCalendar.re['group']+'\\.)?STATUS(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_STATUS']=RegExp('\r\n'+vCalendar.re['contentline_STATUS'],'mi');

vCalendar.re['contentline_COMPLETED']='(?:'+vCalendar.re['group']+'\\.)?COMPLETED:'+vCalendar.re['date-time-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_COMPLETED']=RegExp('\r\n'+vCalendar.re['contentline_COMPLETED'],'mi');

vCalendar.re['contentline_CLASS']='(?:'+vCalendar.re['group']+'\\.)?CLASS(?:;'+vCalendar.re['text-param']+')*:'+'(?:PUBLIC|PRIVATE|CONFIDENTIAL)'+vCalendar.re['CRLF'];
vCalendar.pre['contentline_CLASS']=RegExp('\r\n'+vCalendar.re['contentline_CLASS'],'mi');

vCalendar.re['contentline_TRANSP']='(?:'+vCalendar.re['group']+'\\.)?TRANSP(?:;'+vCalendar.re['text-param']+')*:'+'(?:OPAQUE|TRANSPARENT)'+vCalendar.re['CRLF'];
vCalendar.pre['contentline_TRANSP']=RegExp('\r\n'+vCalendar.re['contentline_TRANSP'],'mi');

vCalendar.re['contentline_PERCENT-COMPLETE']='(?:'+vCalendar.re['group']+'\\.)?PERCENT-COMPLETE(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_PERCENT-COMPLETE']=RegExp('\r\n'+vCalendar.re['contentline_PERCENT-COMPLETE'],'mi');

vCalendar.re['contentline_PRIORITY']='(?:'+vCalendar.re['group']+'\\.)?PRIORITY(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['DIGIT']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_PRIORITY']=RegExp('\r\n'+vCalendar.re['contentline_PRIORITY'],'mi');

vCalendar.re['contentline_TZOFFSETFROM']='(?:'+vCalendar.re['group']+'\\.)?TZOFFSETFROM(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_TZOFFSETFROM']=RegExp('\r\n'+vCalendar.re['contentline_TZOFFSETFROM'],'mi');
vCalendar.re['contentline_TZOFFSETTO']='(?:'+vCalendar.re['group']+'\\.)?TZOFFSETTO(?:;'+vCalendar.re['text-param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_TZOFFSETTO']=RegExp('\r\n'+vCalendar.re['contentline_TZOFFSETTO'],'mi');

vCalendar.re['contentline_UID']='(?:'+vCalendar.re['group']+'\\.)?UID:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_UID']=RegExp('\r\n'+vCalendar.re['contentline_UID'],'mi');

vCalendar.re['contentline_URL']='(?:'+vCalendar.re['group']+'\\.)?URL(?:;'+vCalendar.re['param']+')*:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];	// Non-RFC
vCalendar.pre['contentline_URL']=RegExp('\r\n'+vCalendar.re['contentline_URL'],'mi');

vCalendar.re['contentline_VERSION']='(?:'+vCalendar.re['group']+'\\.)?VERSION:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_VERSION']=RegExp('\r\n'+vCalendar.re['contentline_VERSION'],'mi');
vCalendar.re['contentline_CALSCALE']='(?:'+vCalendar.re['group']+'\\.)?CALSCALE:'+vCalendar.re['text-value']+vCalendar.re['CRLF'];
vCalendar.pre['contentline_CALSCALE']=RegExp('\r\n'+vCalendar.re['contentline_CALSCALE'],'mi');

vCalendar.pre['+/-number']=RegExp('[-+]?[0-9]*','mi');
vCalendar.pre['hrefRex']=RegExp('^(https?://)(.*)', 'i');
vCalendar.pre['uidParts']=RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)([^/]+/)([^/]*)', 'i');
vCalendar.pre['accountUidParts']=RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)', 'i');
vCalendar.pre['escapeRex']=RegExp('(,|;|\\\\)','g');
vCalendar.pre['escapeRex2']=RegExp('\\n','g');
vCalendar.pre['compressNewLineRex']=RegExp('(\\r\\n|\\n|\\r)+','gm');
vCalendar.pre['numberPortRex']=RegExp(':[0-9]+$');
vCalendar.pre['domainRex']=RegExp('^[^.]+\\.');
vCalendar.pre['domainNameRex']=RegExp('^([^.]+\\.)*?((?:[^.]+\\.)?[^.]+)$');
vCalendar.pre['principalUserNameRex']=RegExp('(@.*)?$');
vCalendar.pre['loginRex']=RegExp('@.*$');
vCalendar.pre['HRex']=RegExp('%H', 'g');
vCalendar.pre['hRex']=RegExp('%h', 'g');
vCalendar.pre['DRex']=RegExp('%D', 'g');
vCalendar.pre['dRex']=RegExp('%d', 'g');
vCalendar.pre['PRex']=RegExp('%P', 'g');
vCalendar.pre['pRex']=RegExp('%p', 'g');
vCalendar.pre['URex']=RegExp('%U', 'g');
vCalendar.pre['uRex']=RegExp('%u', 'g');
vCalendar.pre['xRex']=RegExp('%x', 'g');
vCalendar.pre['spaceRex']=RegExp(' ','g')
vCalendar.pre['hrefValRex']=RegExp('.*/', '')
//---------VEVENT-----------------------------------------------------------------------------

vCalendar.tplC['begin']='##:::##group_wd##:::##BEGIN:VCALENDAR\r\n';
vCalendar.tplM['begin']=null;
vCalendar.tplC['beginTZONE']='##:::##group_wd##:::##BEGIN:VTIMEZONE\r\n';
vCalendar.tplM['beginTZONE']=null;
vCalendar.tplC['beginDAYLIGHT']='##:::##group_wd##:::##BEGIN:DAYLIGHT\r\n';
vCalendar.tplM['beginDAYLIGHT']=null;
vCalendar.tplC['beginST']='##:::##group_wd##:::##BEGIN:STANDARD\r\n';
vCalendar.tplM['beginST']=null;
vCalendar.tplC['beginVEVENT']='##:::##group_wd##:::##BEGIN:VEVENT\r\n';
vCalendar.tplM['beginVEVENT']=null
vCalendar.tplC['beginVALARM']='##:::##group_wd##:::##BEGIN:VALARM\r\n';
vCalendar.tplM['beginVALARM']=null

vCalendar.tplC['contentline_VERSION']='##:::##group_wd##:::##VERSION:##:::##version##:::##\r\n';
vCalendar.tplM['contentline_VERSION']=null;
vCalendar.tplC['contentline_CALSCALE']='##:::##group_wd##:::##CALSCALE:##:::##calscale##:::##\r\n';
vCalendar.tplM['contentline_CALSCALE']=null;
vCalendar.tplC['contentline_UID']='##:::##group_wd##:::##UID##:::##params_wsc##:::##:##:::##uid##:::##\r\n';
vCalendar.tplM['contentline_UID']=new Array();

vCalendar.tplC['contentline_URL']='##:::##group_wd##:::##URL##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_URL']=new Array();
vCalendar.tplC['contentline_TZID']='##:::##group_wd##:::##TZID##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TZID']=new Array();
vCalendar.tplC['contentline_X-LIC-LOCATION']='##:::##group_wd##:::##X-LIC-LOCATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_X-LIC-LOCATION']=new Array();
vCalendar.tplC['contentline_LOCATION']='##:::##group_wd##:::##LOCATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_LOCATION']=new Array();
vCalendar.tplC['contentline_NOTE']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_NOTE']=new Array();
vCalendar.tplC['contentline_VANOTE']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_VANOTE']=null;
vCalendar.tplC['contentline_SUMMARY']='##:::##group_wd##:::##SUMMARY##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_SUMMARY']=new Array();
vCalendar.tplC['contentline_RRULE']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_RRULE']=new Array();
vCalendar.tplC['contentline_RRULE2']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_RRULE2']=new Array();
vCalendar.tplC['contentline_RRULE3']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_RRULE3']=new Array();
vCalendar.tplC['contentline_PRODID']='##:::##group_wd##:::##PRODID##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_PRODID']=new Array();
vCalendar.tplC['contentline_TZOFFSETFROM']='##:::##group_wd##:::##TZOFFSETFROM##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TZOFFSETFROM']=new Array();
vCalendar.tplC['contentline_TZOFFSETTO']='##:::##group_wd##:::##TZOFFSETTO##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TZOFFSETTO']=new Array();
vCalendar.tplC['contentline_TZNAME']='##:::##group_wd##:::##TZNAME##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TZNAME']=new Array();

vCalendar.tplC['contentline_TRIGGER']='##:::##group_wd##:::##TRIGGER##:::##VALUE=DURATION##:::####:::##VALUE=DATE-TIME##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TRIGGER']=null;



vCalendar.tplC['contentline_REPEAT']='##:::##group_wd##:::##REPEAT##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_REPEAT']=new Array();
vCalendar.tplC['contentline_ACTION']='##:::##group_wd##:::##ACTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_ACTION']=null;
vCalendar.tplC['contentline_DURATION']='##:::##group_wd##:::##DURATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_DURATION']=new Array();
vCalendar.tplC['contentline_DESCRIPTION']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_DESCRIPTION']=new Array();
vCalendar.tplC['contentline_CLASS']='##:::##group_wd##:::##CLASS##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_CLASS']=new Array();
vCalendar.tplC['contentline_PRIORITY']='##:::##group_wd##:::##PRIORITY##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_PRIORITY']=new Array();

vCalendar.tplC['contentline_DTSTART']='##:::##group_wd##:::##DTSTART##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_DTSTART']=new Array();
vCalendar.tplC['contentline_CREATED']='##:::##group_wd##:::##CREATED##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_CREATED']=new Array();
vCalendar.tplC['contentline_LM']='##:::##group_wd##:::##LAST-MODIFIED##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_LM']=new Array();
vCalendar.tplC['contentline_DTSTAMP']='##:::##group_wd##:::##DTSTAMP##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_DTSTAMP']=new Array();
vCalendar.tplC['contentline_REC_ID']='##:::##group_wd##:::##RECURRENCE-ID##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_REC_ID']=new Array();
vCalendar.tplC['contentline_EXDATE']='##:::##group_wd##:::##EXDATE##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_EXDATE']=new Array();
vCalendar.tplC['contentline_E_DTSTART']='##:::##group_wd##:::##DTSTART##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_E_DTSTART']=new Array();
vCalendar.tplC['contentline_E_DTEND']='##:::##group_wd##:::##DTEND##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_E_DTEND']=new Array();
vCalendar.tplC['contentline_TRANSP']='##:::##group_wd##:::##TRANSP##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_TRANSP']=new Array();
vCalendar.tplC['contentline_STATUS']='##:::##group_wd##:::##STATUS##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['contentline_STATUS']=new Array();

vCalendar.tplC['endVALARM']='##:::##group_wd##:::##END:VALARM\r\n';
vCalendar.tplM['endVALARM']=null;
vCalendar.tplC['endVEVENT']='##:::##group_wd##:::##END:VEVENT\r\n';
vCalendar.tplM['endVEVENT']=null;
vCalendar.tplC['endTZONE']='##:::##group_wd##:::##END:VTIMEZONE\r\n';
vCalendar.tplM['endTZONE']=null;
vCalendar.tplC['endST']='##:::##group_wd##:::##END:STANDARD\r\n';
vCalendar.tplM['endST']=null;
vCalendar.tplC['endDAYLIGHT']='##:::##group_wd##:::##END:DAYLIGHT\r\n';
vCalendar.tplM['endDAYLIGHT']=null;
vCalendar.tplC['end']='##:::##group_wd##:::##END:VCALENDAR\r\n';
vCalendar.tplM['end']=null;
vCalendar.tplM['unprocessed']='';
vCalendar.tplM['unprocessedVTIMEZONE']='';
vCalendar.tplM['unprocessedVEVENT']=new Array();
vCalendar.tplM['unprocessedVALARM']=new Array();

//---------------------------------VTODO----------------------------
vCalendar.tplC['VTbegin']='##:::##group_wd##:::##BEGIN:VCALENDAR\r\n';
vCalendar.tplM['VTbegin']={};
vCalendar.tplC['VTbeginTZONE']='##:::##group_wd##:::##BEGIN:VTIMEZONE\r\n';
vCalendar.tplM['VTbeginTZONE']={};
vCalendar.tplC['VTbeginDAYLIGHT']='##:::##group_wd##:::##BEGIN:DAYLIGHT\r\n';
vCalendar.tplM['VTbeginDAYLIGHT']={};
vCalendar.tplC['VTbeginST']='##:::##group_wd##:::##BEGIN:STANDARD\r\n';
vCalendar.tplM['VTbeginST']={};
vCalendar.tplC['VTbeginVALARM']='##:::##group_wd##:::##BEGIN:VALARM\r\n';
vCalendar.tplM['VTbeginVALARM']={}
vCalendar.tplC['VTbeginVTODO']='##:::##group_wd##:::##BEGIN:VTODO\r\n';
vCalendar.tplM['VTbeginVTODO']={}

vCalendar.tplC['VTcontentline_VERSION']='##:::##group_wd##:::##VERSION:##:::##version##:::##\r\n';
vCalendar.tplM['VTcontentline_VERSION']={};
vCalendar.tplC['VTcontentline_CALSCALE']='##:::##group_wd##:::##CALSCALE:##:::##calscale##:::##\r\n';
vCalendar.tplM['VTcontentline_CALSCALE']={};
vCalendar.tplC['VTcontentline_UID']='##:::##group_wd##:::##UID##:::##params_wsc##:::##:##:::##uid##:::##\r\n';
vCalendar.tplM['VTcontentline_UID']={};

vCalendar.tplC['VTcontentline_URL']='##:::##group_wd##:::##URL##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_URL']={};
vCalendar.tplC['VTcontentline_LOCATION']='##:::##group_wd##:::##LOCATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_LOCATION']={};

vCalendar.tplC['VTcontentline_TZID']='##:::##group_wd##:::##TZID##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TZID']={};
vCalendar.tplC['VTcontentline_X-LIC-LOCATION']='##:::##group_wd##:::##X-LIC-LOCATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_X-LIC-LOCATION']={};
vCalendar.tplC['VTcontentline_LOCATION']='##:::##group_wd##:::##LOCATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_LOCATION']={};
vCalendar.tplC['VTcontentline_NOTE']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_NOTE']={};
vCalendar.tplC['VTcontentline_VANOTE']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_VANOTE']={};
vCalendar.tplC['VTcontentline_SUMMARY']='##:::##group_wd##:::##SUMMARY##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_SUMMARY']={};
vCalendar.tplC['VTcontentline_RRULE']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_RRULE']={};
vCalendar.tplC['VTcontentline_RRULE2']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_RRULE2']={};
vCalendar.tplC['VTcontentline_REC_ID']='##:::##group_wd##:::##RECURRENCE-ID##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_REC_ID']={};
vCalendar.tplC['VTcontentline_EXDATE']='##:::##group_wd##:::##EXDATE##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_EXDATE']={};
vCalendar.tplC['VTcontentline_RRULE3']='##:::##group_wd##:::##RRULE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_RRULE3']={};
vCalendar.tplC['VTcontentline_PRODID']='##:::##group_wd##:::##PRODID##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_PRODID']={};
vCalendar.tplC['VTcontentline_TZOFFSETFROM']='##:::##group_wd##:::##TZOFFSETFROM##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TZOFFSETFROM']={};
vCalendar.tplC['VTcontentline_TZOFFSETTO']='##:::##group_wd##:::##TZOFFSETTO##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TZOFFSETTO']={};
vCalendar.tplC['VTcontentline_TZNAME']='##:::##group_wd##:::##TZNAME##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TZNAME']={};

vCalendar.tplC['VTcontentline_STATUS']='##:::##group_wd##:::##STATUS##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_STATUS']={};

vCalendar.tplC['VTcontentline_PERCENT-COMPLETE']='##:::##group_wd##:::##PERCENT-COMPLETE##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_PERCENT-COMPLETE']={};

vCalendar.tplC['VTcontentline_PRIORITY']='##:::##group_wd##:::##PRIORITY##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_PRIORITY']={};


vCalendar.tplC['VTcontentline_TRIGGER']='##:::##group_wd##:::##TRIGGER##:::##VALUE=DURATION##:::####:::##VALUE=DATE-TIME##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TRIGGER']={};



vCalendar.tplC['VTcontentline_REPEAT']='##:::##group_wd##:::##REPEAT##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_REPEAT']={};
vCalendar.tplC['VTcontentline_ACTION']='##:::##group_wd##:::##ACTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_ACTION']={};
vCalendar.tplC['VTcontentline_DURATION']='##:::##group_wd##:::##DURATION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_DURATION']={};
vCalendar.tplC['VTcontentline_DESCRIPTION']='##:::##group_wd##:::##DESCRIPTION##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_DESCRIPTION']={};
vCalendar.tplC['VTcontentline_CLASS']='##:::##group_wd##:::##CLASS##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_CLASS']={};

vCalendar.tplC['VTcontentline_DTSTART']='##:::##group_wd##:::##DTSTART##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_DTSTART']={};
vCalendar.tplC['VTcontentline_CREATED']='##:::##group_wd##:::##CREATED##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_CREATED']={};

vCalendar.tplC['VTcontentline_COMPLETED']='##:::##group_wd##:::##COMPLETED##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_COMPLETED']={};

vCalendar.tplC['VTcontentline_LM']='##:::##group_wd##:::##LAST-MODIFIED##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_LM']={};
vCalendar.tplC['VTcontentline_DTSTAMP']='##:::##group_wd##:::##DTSTAMP##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_DTSTAMP']={};
vCalendar.tplC['VTcontentline_E_DTSTART']='##:::##group_wd##:::##DTSTART##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_E_DTSTART']={};
vCalendar.tplC['VTcontentline_DUE']='##:::##group_wd##:::##DUE##:::##AllDay##:::####:::##TZID##:::####:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_DUE']={};
vCalendar.tplC['VTcontentline_TRANSP']='##:::##group_wd##:::##TRANSP##:::##params_wsc##:::##:##:::##value##:::##\r\n';
vCalendar.tplM['VTcontentline_TRANSP']={};

vCalendar.tplC['VTendVTODO']='##:::##group_wd##:::##END:VTODO\r\n';
vCalendar.tplM['VTendVTODO']={};
vCalendar.tplM['VTalarm_STRING'] = {};
vCalendar.tplC['VTendVALARM']='##:::##group_wd##:::##END:VALARM\r\n';
vCalendar.tplM['VTendVALARM']={};
vCalendar.tplC['VTendTZONE']='##:::##group_wd##:::##END:VTIMEZONE\r\n';
vCalendar.tplM['VTendTZONE']={};
vCalendar.tplC['VTendST']='##:::##group_wd##:::##END:STANDARD\r\n';
vCalendar.tplM['VTendST']={};
vCalendar.tplC['VTendDAYLIGHT']='##:::##group_wd##:::##END:DAYLIGHT\r\n';
vCalendar.tplM['VTendDAYLIGHT']={};
vCalendar.tplC['VTend']='##:::##group_wd##:::##END:VCALENDAR\r\n';
vCalendar.tplM['VTend']={};
vCalendar.tplM['VTunprocessed']={};
vCalendar.tplM['VTunprocessedVALARM']={};
vCalendar.tplM['VTunprocessedVTODO']={};
vCalendar.tplM['VTunprocessedVTIMEZONE']={};
