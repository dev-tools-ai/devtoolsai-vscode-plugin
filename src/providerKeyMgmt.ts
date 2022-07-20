import ProviderDevToolsAi from "./providerDevToolsAi";
import { getDarkIcon, getLightIcon, openExternalUrl } from "./utilities";
import path = require("path");
import os = require("os");
import fs= require("fs");
import * as vscode from 'vscode';

interface IDisposable
{
	dispose(): void;
}

class ProviderKeyMgmt implements IDisposable
{
	public static isValid: boolean = false;
	private static configWatcher: vscode.FileSystemWatcher;
	private static _onVerify: vscode.EventEmitter<boolean>;

	constructor()
	{
		ProviderKeyMgmt.configWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(ProviderKeyMgmt.getFolder(), '*.smartdriver'));
		ProviderKeyMgmt.configWatcher.onDidCreate(async (e) => { await ProviderKeyMgmt.verify(); });
		ProviderKeyMgmt.configWatcher.onDidChange(async (e) => { await ProviderKeyMgmt.verify(); });
		ProviderKeyMgmt._onVerify = new vscode.EventEmitter<boolean>();
	}

	public static getFromFile(): string | undefined
	{
		let file = this.getFilePath();

		try
		{
			if (fs.existsSync(file))
			{
				let buffer = fs.readFileSync(file, "utf8");
				let json = JSON.parse(buffer);
				return json.api_key;
			}
		}
		catch (e)
		{
		}
	
		return undefined;
	}

	public static setToFile(value: string)
	{
		let file = this.getFilePath();
		let json = {};
	
		try
		{
			if (fs.existsSync(file))
			{
				let buffer = fs.readFileSync(file, "utf8");
				json = JSON.parse(buffer);
				json["api_key"] = value;
			}
			else
			{
				json["api_key"] = value;
			}
		}
		catch (e)
		{
			json["api_key"] = value;
		}
	
		fs.writeFileSync(file, JSON.stringify(json, null, 2));
	}

	private static getFolder(): string
	{
		return os.homedir();
	}

	private static getFilePath(): string
	{
		return path.join(this.getFolder(), ".smartdriver");
	}

	public static async verify()
	{
		let key = ProviderKeyMgmt.getFromFile();
		ProviderKeyMgmt.isValid = await ProviderDevToolsAi.isKeyValid(key);

		ProviderKeyMgmt._onVerify.fire(ProviderKeyMgmt.isValid);
	}

	public static async getFromUser(getIfExists: boolean = true)
	{
		const KEY_BUTTON_TITLE = "Get your dev-tools.ai key";
		const INPUT_BOX_TITLE = "Enter your dev-tools.ai key";
		const INPUT_BOX_PLACEHOLDER = "Click the key icon to get your key...";

		if (!ProviderKeyMgmt.isValid || getIfExists)
		{
			class InputButton implements vscode.QuickInputButton
			{
				constructor(public iconPath: { light: vscode.Uri; dark: vscode.Uri; }, public tooltip: string)
				{
				}
			}
		
			const keyButton = new InputButton(
			{
				dark: vscode.Uri.file(getDarkIcon('key.svg')),
				light: vscode.Uri.file(getLightIcon('key.svg')),
			}, KEY_BUTTON_TITLE);
		
			let keyPrompt = async () =>
			{
				let disposables: vscode.Disposable[] = [];
				try
				{
					await new Promise<string>((resolve) =>
					{
						let initialValue = ProviderKeyMgmt.getFromFile();
						let inputBox = vscode.window.createInputBox();
						inputBox.title = INPUT_BOX_TITLE;
						inputBox.placeholder = INPUT_BOX_PLACEHOLDER;
						inputBox.value = initialValue;
						inputBox.ignoreFocusOut = true;
						inputBox.buttons = [
							...([keyButton])
						];
						disposables.push(
							inputBox.onDidTriggerButton((item) =>
							{
								if (item === keyButton)
								{
									ProviderKeyMgmt.getFromWeb();
								}
							}),
							inputBox.onDidAccept(async () =>
							{
								if (!initialValue || initialValue.trim() != inputBox.value.trim())
								{
									inputBox.busy = true;
									inputBox.enabled = false;
			
									await new Promise(async (resolve) =>
									{
										await ProviderKeyMgmt.setToFile(inputBox.value);
										resolve(null);
									});
								}
								else
								{
									await ProviderKeyMgmt.verify();
								}
		
								inputBox.enabled = true;
								inputBox.busy = false;
								inputBox.hide();
								resolve("");			
							}),
							inputBox.onDidHide(() =>
							{
								resolve("");
							})
						);

						inputBox.show();
					});
				}
				finally
				{
					disposables.forEach((d) => d.dispose());
				}
			}
		
			await keyPrompt();
		}
	}

	public static getFromWeb()
	{
		const DEVTOOLS_AI_URL = ProviderDevToolsAi.getGetStartedUrl();
		openExternalUrl(DEVTOOLS_AI_URL);
	}

	public static get onVerify(): vscode.Event<boolean>
	{
		return ProviderKeyMgmt._onVerify.event;
	}

	public dispose(): void
	{
		ProviderKeyMgmt._onVerify.dispose();
		ProviderKeyMgmt.configWatcher.dispose();
	}
}

export default ProviderKeyMgmt;