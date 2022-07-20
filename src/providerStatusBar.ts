import ProviderDevToolsAi from "./providerDevToolsAi";
import ProviderKeyMgmt from "./providerKeyMgmt";
import * as vscode from 'vscode';

class ProviderStatusBar
{
	private static statusBarItem: vscode.StatusBarItem;

	constructor(context: vscode.ExtensionContext)
	{
		ProviderStatusBar.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
		ProviderStatusBar.statusBarItem.name = "dev-tools.ai";
		ProviderStatusBar.statusBarItem.text = "$(dtai-icon-id)";
		ProviderStatusBar.statusBarItem.tooltip = "dev-tools.ai";
		ProviderStatusBar.statusBarItem.show();

		context.subscriptions.push(ProviderStatusBar.statusBarItem);

		ProviderKeyMgmt.onVerify(() => { ProviderStatusBar.setState(); });
	}

	public static setState()
	{
		if (ProviderKeyMgmt.isValid)
		{
			ProviderStatusBar.statusBarItem.backgroundColor = undefined;
			ProviderStatusBar.setTooltip(`dev-tools.ai is currently enabled...`);
		}
		else
		{
			ProviderStatusBar.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			ProviderStatusBar.setTooltip(`dev-tools.ai is currently disabled...`);
		}
	}

	public static setTooltip(message: string)
	{
		let tooltip = new vscode.MarkdownString(undefined, true);
		tooltip.isTrusted = true;
		tooltip.appendMarkdown(message);
		tooltip.appendMarkdown(ProviderStatusBar.getTooltipFooter());

		ProviderStatusBar.statusBarItem.tooltip = tooltip;
	}

	private static getTooltipFooter(): string
	{
		const getKeyFromUser = "command:devtoolsai.getKeyFromUser";
		const SITE_TOOLTIP = "Get your dev-tools.ai key";
		const KEY_TOOLTIP = "Enter your dev-tools.ai key";
		const GITHUB_TOOLTIP = "dev-tools.ai repositories";
		const EXTENSION_TOOLTIP = "dev-tools.ai VSCode extension";

		let footer: string = "\n\n";
		footer += `[$(key)](${ProviderDevToolsAi.getGetStartedUrl()} "${SITE_TOOLTIP}")`;
		footer += `&nbsp;&nbsp;[$(pencil)](${getKeyFromUser} "${KEY_TOOLTIP}")`;
		footer += `&nbsp;&nbsp;&nbsp;&nbsp;[$(github)](${ProviderDevToolsAi.getGithubUrl()} "${GITHUB_TOOLTIP}")`;
		footer += `&nbsp;&nbsp;[$(extensions)](${ProviderDevToolsAi.getVSCodeUrl()} "${EXTENSION_TOOLTIP}")`;
		return footer;
	}
}

export default ProviderStatusBar;