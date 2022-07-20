import * as vscode from 'vscode';
import ProviderKeyMgmt from "./providerKeyMgmt";
import ProviderDevToolsAi from './providerDevToolsAi';
import ProviderLabel from './providerLabel';
import { ServiceLocalStorage } from './serviceLocalStorage';
import { isSupportedLanguage, getLightIcon, getDarkIcon } from "./utilities";

interface cachedLabel
{
	label: string;
	png: string;
	updated_at: number;
}

class ProviderDecorations
{
	private timeout: NodeJS.Timeout | undefined;
	private context: vscode.ExtensionContext;
	private activeEditor: vscode.TextEditor | undefined;

	private readonly decorType: vscode.TextEditorDecorationType;

	constructor(context: vscode.ExtensionContext)
	{
		this.context = context;
		this.activeEditor = vscode.window.activeTextEditor;

		this.decorType = this.getDecorType();

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
	}

	public updateDecorations()
	{
		vscode.window.visibleTextEditors.forEach(async (editor) =>
		{
			let decorOptions: vscode.DecorationOptions[] = [];

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

					if (label)
					{
						let hoverMessage: vscode.MarkdownString = new vscode.MarkdownString(undefined, true);
						hoverMessage.isTrusted = true;

						console.log("is label tied back to an element in dtai");
						let elementSize = await ProviderDevToolsAi.getElementSize(key, label);
						if (elementSize && elementSize.status == 200)
						{
							console.log("yes: is label in cache");
							let cachedLabel = ServiceLocalStorage.instance.getValue<cachedLabel>(`${key}${label}`);
							if (cachedLabel)
							{
								console.log("yes: label is in cache, is it up to date");
								if (elementSize?.data?.updated_at &&
									cachedLabel.updated_at == elementSize.data.updated_at)
								{
									console.log("yes: cached label is up to date, use cache");
								}
								else
								{
									console.log("no: cached label is not up to date (update it)");
									let elementThumbnail = await ProviderDevToolsAi.getElementThumbnail(key, label);
									if (elementThumbnail?.data && elementThumbnail.status == 200)
									{
										let cl: cachedLabel = 
										{ 
											label: label,
											png:  elementThumbnail.data,
											updated_at: elementSize.data.updated_at
										}

										ServiceLocalStorage.instance.setValue<cachedLabel>(`${key}${label}`, cl);
										cachedLabel = cl;
									}
									else
									{
										console.log("failed to get image, use cache");
									}
								}
							}
							else
							{
								console.log("no: label is not in cache (add it)");
								let elementThumbnail = await ProviderDevToolsAi.getElementThumbnail(key, label);
								if (elementThumbnail?.data && elementThumbnail.status == 200)
								{
									let cl: cachedLabel = 
									{ 
										label: label,
										png:  elementThumbnail.data,
										updated_at: elementSize.data.updated_at
									}

									ServiceLocalStorage.instance.setValue<cachedLabel>(`${key}${label}`, cl);
									cachedLabel = cl;
								}
							}

							if (cachedLabel)
							{
								console.log("label is in cache, use it");

								let getTooltipFooter = (): string =>
								{
									const LABELING_DASHBOARD_TOOLTIP = "Label Dashboard";
									const LABELING_ELEMENT_TOOLTIP = "Label Element";
									const GITHUB_TOOLTIP = "dev-tools.ai repositories";
									const EXTENSION_TOOLTIP = "dev-tools.ai VSCode extension";
							
									let footer: string = "\n\n";
									footer += `[$(dashboard)](${ProviderDevToolsAi.getLabelingDashboardUrl()} "${LABELING_DASHBOARD_TOOLTIP}")`;
									footer += `&nbsp;&nbsp;[$(tag)](${ProviderDevToolsAi.getLabelingElementUrl(label)} "${LABELING_ELEMENT_TOOLTIP}")`;
									footer += `&nbsp;&nbsp;&nbsp;&nbsp;[$(github)](${ProviderDevToolsAi.getGithubUrl()} "${GITHUB_TOOLTIP}")`;
									footer += `&nbsp;&nbsp;[$(extensions)](${ProviderDevToolsAi.getVSCodeUrl()} "${EXTENSION_TOOLTIP}")`;
									return footer;
								}

								let elementThumbnail = await ProviderDevToolsAi.getElementThumbnail(key, label);
								let buff = Buffer.from(elementThumbnail.data, 'binary').toString('base64');
								hoverMessage.appendMarkdown(`![Element Image](data:image/png;base64,${buff})`);
								hoverMessage.appendMarkdown(getTooltipFooter());
							}
							else
							{

								hoverMessage.appendMarkdown(`element not found for label: ${label}`);
							}
						}
						else
						{
							console.log("no: label has no element in dtai, nothing else to do");
							hoverMessage.appendMarkdown(`element not found for label: ${label}`);
						}

						let matches = textLine.text.match(/.(find_[^(]+)\(([^)]+)\)/);
						let startIndex = textLine.text.indexOf(matches[0]) + 1;
						let endIndex = startIndex + 4;

						let decorOption: vscode.DecorationOptions =
						{
							hoverMessage: hoverMessage,
							range: new vscode.Range(line, startIndex, line, endIndex)
						}

						decorOptions.push(decorOption);

						console.log(label);
					}
					else
					{
						// line is not a locator, ignore
					}
				}
			}

			editor.setDecorations(this.decorType, decorOptions);
		});
	}

	private getDecorType(): vscode.TextEditorDecorationType
	{
		const decorType = vscode.window.createTextEditorDecorationType(
		{
			overviewRulerLane: vscode.OverviewRulerLane.Right,
			light:
			{
				overviewRulerColor: 'rgba(0, 0, 0, 0.5)',
				textDecoration: 'dotted underline 2px #424242',
				before: {
					contentIconPath: getLightIcon("dtai.svg")
				}
			},
			dark:
			{
				overviewRulerColor: 'rgba(255, 255, 255, 0.5)',
				textDecoration: 'dotted underline 2px #C5C5C5',
				before: {
					contentIconPath: getDarkIcon("dtai.svg")
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