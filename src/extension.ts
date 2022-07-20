import ProviderKeyMgmt from './providerKeyMgmt';
import ProviderDecorations from './providerDecorations';
import ProviderStatusBar from "./providerStatusBar";
import { ServiceLocalStorage } from './serviceLocalStorage';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext)
{
	ServiceLocalStorage.initialize(context.globalState);

	let providerKeyMgmt = new ProviderKeyMgmt();
	let statusBarProvider = new ProviderStatusBar(context);
	let decorationsProvider = new ProviderDecorations(context);

	let getKeyFromUserCommand = vscode.commands.registerCommand("devtoolsai.getKeyFromUser", ProviderKeyMgmt.getFromUser);
	context.subscriptions.push(getKeyFromUserCommand);

	await ProviderKeyMgmt.verify();

	if (!ProviderKeyMgmt.isValid)
	{
		ProviderKeyMgmt.getFromUser(false);
	}
}

export function deactivate()
{
}
