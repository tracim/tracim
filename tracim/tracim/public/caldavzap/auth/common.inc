<?php
	function array_to_xml($array, $skip_top_closing=false, $level=0)
	{
		static $result="<?xml version=\"1.0\" encoding=\"utf-8\" ?>\n";

		foreach($array as $k => $v)
		{
			if(is_numeric($k))
				array_to_xml($v, $skip_top_closing, $level);
			else
			{
				for($j=0; $j<$level; $j++)
					$result.="	";

				$result.="<".htmlspecialchars($k);
				if($k=='resources')
					$result.=" xmlns=\"urn:com.inf-it:configuration\"";
				if($v=='')
					$result.=" />\n";
				else
				{
					$result.=">";

					if(is_array($v))
					{
						$result.="\n";
						array_to_xml($v, $skip_top_closing, $level+1);
						for($j=0; $j<$level; $j++)
							$result.="	";
					}
					else
						$result.=htmlspecialchars($v);

					if($level!==0 || $skip_top_closing===false)
						$result.="</".htmlspecialchars($k).">\n";
				}
			}
		}
		return $result;
	}
?>