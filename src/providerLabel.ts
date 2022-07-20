class ProviderLabel
{
	constructor()
	{
	}

	private static getLabelPrefix(find: string): string
	{
  		return find.replace(/find_element_by|find_element/, "element_name_by");
	}

	private static isLabelArg(arg: string): boolean
	{
  		return arg.startsWith("element_name");
	}

	private static getLabelArgValue(arg: string): string
	{
  		return this.normalizeLabel(arg.split('=')[1]);
	}

	private static normalizeLabel(label: string): string
	{
  		return label.replace(/^["'](.+(?=["']$))["']$/, '$1').replace(/\.+/g, '_');
	}

	public static getLabel(line: string, languageId: string): string | null
	{
		switch (languageId)
		{
			case 'python':
				return ProviderLabel.getPythonLabel(line);

			case 'javascript': // cypress, playwright, webdriver.io
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
		let matches = line.match(/.(find_[^(]+)\(([^)]+)\)/);
		if (matches !== null)
		{
			let args = matches[2].split(',');
			args = args.map(arg => arg.trim());
	  
			switch(matches[1])
		  	{
				case 'find_element':
			  		if (args.length == 3 && this.isLabelArg(args[2]))
			  		{
						return this.getLabelArgValue(args[2]);
			  		}
	  
			  		if (args.length < 2)
			  		{
						return null;
			  		}
	  
			  		if (args[0].startsWith("by.") || args[0].startsWith("appiumby."))
			  		{
						args[0] = args[0].split('.')[1];
			  		}
	  
			  		return `${this.getLabelPrefix(matches[1])}_${this.normalizeLabel(args[0])}_${this.normalizeLabel(args[1])}`;
	  
				case 'find_element_by_accessibility_id':
				case 'find_element_by_class_name':
				case 'find_element_by_css_selector':
				case 'find_element_by_id':
				case 'find_element_by_link_text':
				case 'find_element_by_name':
				case 'find_element_by_partial_link_text':
				case 'find_element_by_tag_name':
				case 'find_element_by_xpath':
			  		if (args.length == 2 && this.isLabelArg(args[1]))
			  		{
						return this.getLabelArgValue(args[1]);
			  		}
	  
			  		if (args.length < 1)
			  		{
						return null;
			  		}
	  
			  		return `${this.getLabelPrefix(matches[1])}_${this.normalizeLabel(args[0])}`;
	  
				case 'find_by_ai':
			  		return this.normalizeLabel(args[0]);
	  
				default:
			  		return null;
		  	}
		}
	  
		return null;
	}

	private static getJavascriptLabel(line: string): string | null
	{
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