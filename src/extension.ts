import * as vscode from 'vscode';
import { verifyKey } from "./utilities";

export async function activate(context: vscode.ExtensionContext)
{
	await verifyKey();
}

export function deactivate()
{

}
