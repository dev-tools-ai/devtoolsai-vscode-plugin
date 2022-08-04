class ProviderLabel
{
	constructor()
	{
	}

	public static getLabel(line: string, languageId: string): string | null
	{
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

	private static getPythonLabel(line: string): string | null
	{
		let normalizeLabel = (label: string): string =>
		{
			return label.replace(/^["'](.+(?=["']$))["']$/, '$1').replace(/\.+|\s+/g, '_');
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
			return arg.startsWith("element_name");
		}

		let getLabelType = (find: string): string =>
		{
			return normalizeLabel(find.toLowerCase().replace(/find_element_by_|by.|appiumby./, ""));
		}

		let getLabelPrefix = (): string =>
		{
			return "element_name_by_locator_By";
		}

		let matches = line.match(/\.(find_[^(]+)\(([^)]+)\)/);
		if (matches !== null)
		{
			let args = matches[2].split(',');
			args = args.map(arg => arg.trim());
	  
			switch(matches[1])
		  	{
				case 'find_element':
			  		if (args.length == 3 && isLabelArg(args[2]))
			  		{
						return getLabelArgValue(args[2]);
			  		}
	  
			  		if (args.length < 2)
			  		{
						return null;
			  		}

					return `${getLabelPrefix()}_${getLabelType(args[0])}:_${getLabelValue(args[1])}`;
	  
				case 'find_element_by_accessibility_id':
				case 'find_element_by_class_name':
				case 'find_element_by_css_selector':
				case 'find_element_by_id':
				case 'find_element_by_link_text':
				case 'find_element_by_name':
				case 'find_element_by_partial_link_text':
				case 'find_element_by_tag_name':
				case 'find_element_by_xpath':
			  		if (args.length == 2 && isLabelArg(args[1]))
			  		{
						return getLabelArgValue(args[1]);
			  		}
	  
			  		if (args.length < 1)
			  		{
						return null;
			  		}

					return `${getLabelPrefix()}_${getLabelType(matches[1])}:_${getLabelValue(args[0])}`;
	  
				case 'find_by_ai':
			  		return normalizeLabel(args[0]);
	  
				default:
			  		return null;
		  	}
		}
	  
		return null;
	}

	private static getJavascriptLabel(line: string): string | null
	{
		let normalizeLabel = (label: string): string =>
		{
			return label.replace(/^["'](.+(?=["']$))["']$/, '$1');
		}

		let cypressMatches = line.match(/cy\.(get|find|getByAI|findByAI)\(([^)]+)\)/);
		if (cypressMatches !== null)
		{
			let args = cypressMatches[2].split(',');
			args = args.map(arg => arg.trim());
			return normalizeLabel(args[0]);
		}

		let getWdioLabelPrefix = (): string =>
		{
			return "wdio_by_selector";
		}

		let wdioMatches = line.match(/browser\.(\$|findByAI\$)\(([^)]+)\)/);
		if (wdioMatches !== null)
		{
			let args = wdioMatches[2].split(',');
			args = args.map(arg => arg.trim());

			switch(wdioMatches[1])
			{
				case '$':
					return `${getWdioLabelPrefix()}_${normalizeLabel(args[0])}`;

				case 'findByAI$':
					return normalizeLabel(args[0]);

				default:
					return null;
			}
		}
	  
		return null;
	}

	private static getJavaLabel(line: string): string | null
	{
		return null;
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