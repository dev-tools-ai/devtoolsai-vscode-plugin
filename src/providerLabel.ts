class ProviderLabel
{
	constructor()
	{
	}

	public static getLabel(line: string, languageId: string): string | null
	{
		line = line.replace(/\\(['"])/g, '$1');

		switch (languageId)
		{
			case 'python':
				return ProviderLabel.getPythonLabel(line);

			case 'javascript': // cypress, playwright, webdriver.io
			case 'typescript':
				return ProviderLabel.getJavascriptLabel(line);

			case 'java':
				return ProviderLabel.getJavaLabel(line);

			case 'csharp':
				return ProviderLabel.getCSharpLabel(line);

			case 'ruby':
				return ProviderLabel.getRubyLabel(line);

			default:
				return null;
		}
	}

	private static getClosingParenIndex(line: string, openParenNdx: number): number | null
	{
		let closeParenNdx = openParenNdx;

		let counter = 1;
		while (counter > 0 && closeParenNdx < line.length - 1)
		{
			let c = line[++closeParenNdx];
			if (c == '(')
			{
				counter++;
			}
			else
			{
				if (c == ')')
				{
					counter--;
				}
			}
		}
	
		return (counter > 0) ? null : closeParenNdx;
	}

	private static getPythonLabel(line: string): string | null
	{
		let normalizeLabel = (label: string): string =>
		{
			return label.trim().replace(/^["'](.+(?=["']))["']$/, '$1').replace(/\.+|\s+/g, '_');
		}

		let getLabelArgValue = (arg: string): string =>
		{
			return normalizeLabel(arg.split('=')[1]);
		}

		let getLabelValue = (find: string): string =>
		{
			return normalizeLabel(find);
		}

		let isLabelArg = (arg: string): boolean =>
		{
			return arg.trim().startsWith("element_name");
		}

		let getLabelType = (find: string): string =>
		{
			return normalizeLabel(find.toLowerCase().replace(/find_element_by_|by.|appiumby./, ""));
		}

		let getLabelPrefix = (): string =>
		{
			return "element_name_by_locator_By";
		}

		let matches = line.match(/\.(find_[^(]+)(.+)$/);
		if (!matches)
		{
			return null;
		}

		let closingParen = ProviderLabel.getClosingParenIndex(matches[2], 0);
		if (!closingParen)
		{
			return null;
		}

		let subMatches: RegExpMatchArray;
		let subLine = matches[2].substring(1, closingParen);
		switch(matches[1])
		{
			case 'find_element':
				subMatches = subLine.match(/([^,]+)\s*,\s*([^,]+)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					if (subMatches[3] && isLabelArg(subMatches[3]))
					{
						return getLabelArgValue(subMatches[3]);
					}

					return `${getLabelPrefix()}_${getLabelType(subMatches[1])}:_${getLabelValue(subMatches[2])}`;
				}

				return null;

			case 'find_element_by_accessibility_id':
			case 'find_element_by_class_name':
			case 'find_element_by_css_selector':
			case 'find_element_by_id':
			case 'find_element_by_link_text':
			case 'find_element_by_name':
			case 'find_element_by_partial_link_text':
			case 'find_element_by_tag_name':
			case 'find_element_by_xpath':
				subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					if (subMatches[2] && isLabelArg(subMatches[2]))
					{
						return getLabelArgValue(subMatches[2]);
					}

					return `${getLabelPrefix()}_${getLabelType(matches[1])}:_${getLabelValue(subMatches[1])}`;
				}

				return null;

			case 'find_by_ai':
				subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					return normalizeLabel(subMatches[1]);
				}

				return null;

			default:
				return null;
		}
	}

	private static getJavascriptLabel(line: string): string | null
	{
		let normalizeLabel = (label: string): string =>
		{
			return label.trim().replace(/^["'](.+(?=["']$))["']$/, '$1');
		}

		let cypressMatches = line.match(/cy\.(getByAI|findByAI|get|find(?=[(]))(.+)$/);
		if (cypressMatches)
		{
			let closingParen = ProviderLabel.getClosingParenIndex(cypressMatches[2], 0);
			if (!closingParen)
			{
				return null;
			}

			let subLine = cypressMatches[2].substring(1, closingParen);
			let subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
			if (!subMatches)
			{
				return null;
			}

			return normalizeLabel(subMatches[1]);
		}

		let getWdioLabelPrefix = (): string =>
		{
			return "wdio_by_selector";
		}

		let wdioMatches = line.match(/browser\.(findByAI\$|\$(?=[(]))(.+)/);
		if (wdioMatches)
		{
			let closingParen = ProviderLabel.getClosingParenIndex(wdioMatches[2], 0);
			if (!closingParen)
			{
				return null;
			}

			let subLine = wdioMatches[2].substring(1, closingParen);
			let subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
			if (!subMatches)
			{
				return null;
			}

			switch(wdioMatches[1])
			{
				case '$':
					return `${getWdioLabelPrefix()}_${normalizeLabel(subMatches[1])}`;

				case 'findByAI$':
					return normalizeLabel(subMatches[1]);

				default:
					return null;
			}
		}
	  
		return null;
	}

	private static getJavaLabel(line: string): string | null
	{
		let normalizeLabel = (label: string): string =>
		{
			return label.trim().replace(/^["'](.+(?=["']$))["']$/, '$1').replace(/\.+|\s+/g, '_');
		}

		let getLabelArgValue = (arg: string): string =>
		{
			return normalizeLabel(arg);
		}

		let getLabelValue = (find: string): string =>
		{
			return normalizeLabel(find);
		}

		let getLabelType = (find: string): string =>
		{
			 let val = find.replace(/findelementby|by.|appiumby./i, "");
			 val = val.slice(0,2).toLowerCase() + val.slice(2);
			 return normalizeLabel(val);
		}

		let getLabelPrefix = (): string =>
		{
			return "element_name_by_locator_By";
		}

		let matches = line.match(/\.(find[^(]+)(.+)$/);
		if (!matches)
		{
			return null;
		}

		let closingParen = ProviderLabel.getClosingParenIndex(matches[2], 0);
		if (!closingParen)
		{
			return null;
		}

		let subMatches: RegExpMatchArray;
		let subLine = matches[2].substring(1, closingParen);
		switch(matches[1])
		{
			case 'findElement':
				subMatches = subLine.match(/([^(]+)\(([^)]+)\)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					if (subMatches[3])
					{
						return getLabelArgValue(subMatches[3]);
					}

					return `${getLabelPrefix()}_${getLabelType(subMatches[1])}:_${getLabelValue(subMatches[2])}`;
				}

				return null;

			case 'findElementByAccessibilityId':
			case 'findElementByClassName':
			case 'findElementByCssSelector':
			case 'findElementById':
			case 'findElementByLinkText':
			case 'findElementByName':
			case 'findElementByPartialLinkText':
			case 'findElementByTagName':
			case 'findElementByXPath':
				subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					if (subMatches[2])
					{
						return getLabelArgValue(subMatches[2]);
					}

					return `${getLabelPrefix()}_${getLabelType(matches[1])}:_${getLabelValue(subMatches[1])}`;
				}

				return null;
	  
			case 'findByAI':
				subMatches = subLine.match(/([^,]+)(?:\s*,\s*(.+))?/);
				if (subMatches)
				{
					return normalizeLabel(subMatches[1]);
				}

				return null;
	  
			default:
		  		return null;
		}
	}

	private static getCSharpLabel(line: string): string | null
	{
		return null;
	}

	private static getRubyLabel(line: string): string | null
	{
		return null;
	}
}

export default ProviderLabel;