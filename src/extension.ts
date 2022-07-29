import ProviderDevToolsAi from './providerDevToolsAi';
import ProviderKeyMgmt from './providerKeyMgmt';
import ProviderDecorations from './providerDecorations';
import ProviderStatusBar from "./providerStatusBar";
import { ServiceLocalStorage } from './serviceLocalStorage';
import { deleteElement, refreshElement } from './commands';

import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext)
{
	ServiceLocalStorage.initialize(context.globalState);

	let providerDevToolsAi = new ProviderDevToolsAi();
	let providerKeyMgmt = new ProviderKeyMgmt();
	let statusBarProvider = new ProviderStatusBar(context);
	let decorationsProvider = new ProviderDecorations(context);

	let getKeyFromUserCommand = vscode.commands.registerCommand("devtoolsai.getKeyFromUser", ProviderKeyMgmt.getFromUser);
	let deleteElementCommand = vscode.commands.registerCommand("devtoolsai.deleteElement", deleteElement);
	let refreshElementCommand = vscode.commands.registerCommand("devtoolsai.refreshElement", refreshElement);

	context.subscriptions.push(getKeyFromUserCommand);
	context.subscriptions.push(deleteElementCommand);
	context.subscriptions.push(refreshElementCommand);

	await ProviderKeyMgmt.verify();

	if (!ProviderKeyMgmt.isValid)
	{
		ProviderKeyMgmt.getFromUser(false);
	}
}

export function deactivate()
{
}
