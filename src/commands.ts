import ProviderDecorations from './providerDecorations';
import ProviderDevToolsAi from './providerDevToolsAi';
import { ServiceLocalStorage } from "./serviceLocalStorage";

async function deleteElement(args)
{
	let key = args[0]?.key;
	let label = args[0]?.label;

	if (key && label)
	{
		ServiceLocalStorage.instance.removeKey(`${key}${label}`);
		await ProviderDevToolsAi.deleteElement(key, label);
	}
}

function refreshElement()
{
	ProviderDevToolsAi.serverUpdate();
}

export
{
	deleteElement,
	refreshElement
}