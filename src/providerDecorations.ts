import ProviderKeyMgmt from "./providerKeyMgmt";
import ProviderDevToolsAi from './providerDevToolsAi';
import ProviderLabel from './providerLabel';
import { ServiceLocalStorage } from './serviceLocalStorage';
import { isSupportedLanguage, getLightIcon, getDarkIcon } from "./utilities";
import * as vscode from 'vscode';

interface cachedLabel
{
	label: string;
	png: string;
	updated_at: number;
	version?: string;
}

class ProviderDecorations
{
	private timeout: NodeJS.Timeout | undefined;
	private context: vscode.ExtensionContext;
	private activeEditor: vscode.TextEditor | undefined;
	private version: string;

	private readonly decorElementType: vscode.TextEditorDecorationType;
	private readonly decorNoElementType: vscode.TextEditorDecorationType;

	constructor(context: vscode.ExtensionContext)
	{
		this.context = context;
		this.activeEditor = vscode.window.activeTextEditor;
		this.version = context.extension.packageJSON.version;

		this.decorElementType = this.getDecorElementType();
		this.decorNoElementType = this.getDecorNoElementType();

		vscode.window.onDidChangeActiveTextEditor((editor) =>
		{
			this.activeEditor = editor;

			if (editor)
			{
				this.triggerUpdateDecorations();
			}
		}, null, this.context.subscriptions);
	  
		vscode.workspace.onDidChangeTextDocument((event) =>
		{
			if (this.activeEditor &&
				event.document === this.activeEditor.document &&
				isSupportedLanguage(event.document.languageId))
			{
				this.triggerUpdateDecorations();
			}
		}, null, this.context.subscriptions);

		this.triggerUpdateDecorations();

		ProviderKeyMgmt.onVerify(() => { this.triggerUpdateDecorations(); });
		ProviderDevToolsAi.onServerUpdate(() => { this.triggerUpdateDecorations(); });
	}

	public updateDecorations()
	{
		vscode.window.visibleTextEditors.forEach(async (editor) =>
		{
			let decorElementOptions: vscode.DecorationOptions[] = [];
			let decorNoElementOptions: vscode.DecorationOptions[] = [];

			if (!isSupportedLanguage(editor.document.languageId))
			{
				return;
			}

			if (ProviderKeyMgmt.isValid)
			{
				let key = ProviderKeyMgmt.getFromFile();

				for (let line = 0; line < editor.document.lineCount; line++)
				{
					let textLine = editor.document.lineAt(line);
					let label = ProviderLabel.getLabel(textLine.text, editor.document.languageId);
					let foundElement = false;

					if (label)
					{
						let hoverMessage: vscode.MarkdownString = new vscode.MarkdownString(undefined, true);
						hoverMessage.isTrusted = true;

						let getTooltipFooter = async (): Promise<string> =>
						{
							const LABEL_DASHBOARD_TOOLTIP = "Label Dashboard";
							const LABEL_ELEMENT_TOOLTIP = "Label Element";
							const REFRESH_ELEMENT_TOOLTIP = "Refresh Element";
							const DELETE_ELEMENT_TOOLTIP = "Delete Element";

							const refreshElementCmd = `command:devtoolsai.refreshElement`;
							const deleteElementArgs = encodeURIComponent(JSON.stringify([[{ key: key, label: label }]]));
							const deleteElementCmd = `command:devtoolsai.deleteElement?${deleteElementArgs}`;
					
							let footer: string = "\n\n";
							footer += `[$(dashboard)](${ProviderDevToolsAi.getLabelingDashboardUrl()} "${LABEL_DASHBOARD_TOOLTIP}")`;
							footer += `&nbsp;&nbsp;[$(tag)](${ProviderDevToolsAi.getLabelingElementUrl(label)} "${LABEL_ELEMENT_TOOLTIP}")`;
							footer += `&nbsp;&nbsp;[$(refresh)](${refreshElementCmd} "${REFRESH_ELEMENT_TOOLTIP}")`;
							footer += `&nbsp;&nbsp;[$(trash)](${deleteElementCmd} "${DELETE_ELEMENT_TOOLTIP}")`;
							footer += `&nbsp;&nbsp;$(kebab-vertical)&nbsp;&nbsp;${await ProviderDevToolsAi.getElementStatus(key, label)}`;
							return footer;
						}

						//console.log("is label tied back to an element in dtai");
						let elementSize = await ProviderDevToolsAi.getElementSize(key, label);
						if (elementSize && elementSize.status == 200)
						{
							//console.log("yes: is label in cache");
							let cachedLabel = ServiceLocalStorage.instance.getValue<cachedLabel>(`${key}${label}`);
							if (cachedLabel)
							{
								//console.log("yes: label is in cache, is it up to date");
								if (elementSize?.data?.updated_at &&
									cachedLabel.updated_at == elementSize.data.updated_at &&
									cachedLabel?.version &&
									cachedLabel?.version == this.version)
								{
									console.log(`yes: cached label is up to date, use cache`);
									console.log(`this.version: ${this.version}`);
									console.log(`cachedLabel.version: ${cachedLabel.version}`);
								}
								else
								{
									console.log(`no: cached label is not up to date (update it): ${label}`);
									let elementThumbnail = await ProviderDevToolsAi.getElementThumbnail(key, label);
									if (elementThumbnail?.data && elementThumbnail.status == 200)
									{
										let cl: cachedLabel = 
										{ 
											label: label,
											png:  elementThumbnail.data,
											updated_at: elementSize.data.updated_at,
											version: this.version
										}

										ServiceLocalStorage.instance.setValue<cachedLabel>(`${key}${label}`, cl);
										cachedLabel = cl;
									}
									else
									{
										//console.log(`failed to get image, use cache: ${label}`);
									}
								}
							}
							else
							{
								console.log(`no: label is not in cache (add it): ${label}`);
								let elementThumbnail = await ProviderDevToolsAi.getElementThumbnail(key, label);
								if (elementThumbnail?.data && elementThumbnail.status == 200)
								{
									let cl: cachedLabel = 
									{ 
										label: label,
										png:  elementThumbnail.data,
										updated_at: elementSize.data.updated_at,
										version: this.version
									}

									ServiceLocalStorage.instance.setValue<cachedLabel>(`${key}${label}`, cl);
									cachedLabel = cl;
								}
							}

							if (cachedLabel)
							{
								//console.log("label is in cache, use it");
								foundElement = true;

								let buff = Buffer.from(cachedLabel.png, 'binary').toString('base64');
								hoverMessage.appendMarkdown(`![Element Image](data:image/png;base64,${buff})`);
								hoverMessage.appendMarkdown(await getTooltipFooter());
							}
							else
							{
								hoverMessage.appendMarkdown(`Element not found: ${label}`);
								hoverMessage.appendMarkdown(await getTooltipFooter());
							}
						}
						else
						{
							//console.log(`no: label has no element in dtai, nothing else to do: ${label}`);
							hoverMessage.appendMarkdown(`Element not found: ${label}`);
							hoverMessage.appendMarkdown(await getTooltipFooter());
						}

						let getMatches = (line: string, languageId: string): RegExpMatchArray =>
						{
							switch (languageId)
							{
								case 'python':
									return line.match(/\.(find_[^(]+)(.+)$/);
					
								case 'javascript': // cypress, playwright, webdriver.io
								case 'typescript':
									let cypressMatches = line.match(/cy\.(getByAI|findByAI|get|find(?=[(]))(.+)$/);
									if (cypressMatches)
									{
										return cypressMatches;
									}
									else
									{
										let wdioMatches = line.match(/browser\.(findByAI\$|\$(?=[(]))(.+)/);
										return wdioMatches;
									}
					
								case 'java':
									return line.match(/\.(find[^(]+)(.+)$/);
					
								case 'csharp':
									return null;
					
								case 'ruby':
									return null;
							}
						}

						let matches = getMatches(textLine.text, editor.document.languageId);
						let startIndex = textLine.text.indexOf(matches[1]);
						let endIndex = startIndex + 2;

						let decorOption: vscode.DecorationOptions =
						{
							hoverMessage: hoverMessage,
							range: new vscode.Range(line, startIndex, line, endIndex)
						}

						if (foundElement)
						{
							decorElementOptions.push(decorOption);
						}
						else
						{
							decorNoElementOptions.push(decorOption);
						}
					}
				}
			}

			editor.setDecorations(this.decorElementType, decorElementOptions);
			editor.setDecorations(this.decorNoElementType, decorNoElementOptions);
		});
	}

	private getDecorElementType(): vscode.TextEditorDecorationType
	{
		const decorType = vscode.window.createTextEditorDecorationType(
		{
			overviewRulerLane: vscode.OverviewRulerLane.Right,
			light:
			{
				overviewRulerColor: '#42424299',
				textDecoration: 'dotted underline 2px #424242',
				before: {
					contentIconPath: getLightIcon("dtai.svg")
				}
			},
			dark:
			{
				overviewRulerColor: '#C5C5C599',
				textDecoration: 'dotted underline 2px #C5C5C5',
				before: {
					contentIconPath: getDarkIcon("dtai.svg")
				}
			}
		});

		return decorType;
	}

	private getDecorNoElementType(): vscode.TextEditorDecorationType
	{
		const decorType = vscode.window.createTextEditorDecorationType(
		{
			overviewRulerLane: vscode.OverviewRulerLane.Right,
			light:
			{
				overviewRulerColor: '#42424233',
				textDecoration: 'dotted underline 2px #424242',
				before: {
					contentIconPath: getLightIcon("dtai2.svg")
				}
			},
			dark:
			{
				overviewRulerColor: '#C5C5C533',
				textDecoration: 'dotted underline 2px #C5C5C5',
				before: {
					contentIconPath: getDarkIcon("dtai2.svg")
				}
			}
		});

		return decorType;
	}

	public triggerUpdateDecorations()
	{
		if (this.timeout)
		{
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}

		this.timeout = setTimeout(() =>
		{
			this.updateDecorations();
		}, 10);
	}
}

export default ProviderDecorations;