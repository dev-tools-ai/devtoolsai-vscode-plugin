import * as vscode from 'vscode';

async function verifyKey()
{
	let key = String(vscode.workspace.getConfiguration('devtoolsai.setup').get('key'));

	if (key.trim() === "")
	{
		let inputkey = await vscode.window.showInputBox
		(
			{
				prompt: "Please enter your dev tools ai key...",
				value: ""
			}
		);

		if (inputkey !== undefined && inputkey.trim() !== "")
		{
			await vscode.workspace.getConfiguration().update('devtoolsai.setup.key', inputkey, vscode.ConfigurationTarget.Global);
		}
	}
}

export
{
	verifyKey
}