import path = require("path");
import open = require('open');
import axios, { AxiosResponse } from 'axios';


function isSupportedLanguage(langId: string): boolean
{
	let supportedLanguages = ['python', 'javascript', 'java', 'csharp', 'ruby'];
	return supportedLanguages.includes(langId);
}

function getLightIcon(icon: string): string
{
	return path.join(__dirname, '..', 'resources', 'light', icon);
}

function getDarkIcon(icon: string): string
{
	return path.join(__dirname, '..', 'resources', 'dark', icon);
}

function openExternalUrl(url: string): void
{
	open(url);
}

async function getRequest(url: string, config: object = {}): Promise<AxiosResponse<any, any> | undefined>
{
	try
	{
		let response = await axios.get(url, config);
		return response;
	}
	catch (e: any)
	{
		if (axios.isAxiosError(e))
		{
			return e.response;
		}
		else
		{
			return e;
		}
	}
}

async function postRequest(url: string, data: object, config: object = {}): Promise<AxiosResponse<any, any> | undefined>
{
	try
	{
		let response = await axios.post(url, data, config);
		return response;
	}
	catch (e: any)
	{
		if (axios.isAxiosError(e))
		{
			return e.response;
		}
		else
		{
			return e;
		}
	}
}

export
{
	isSupportedLanguage,
	getLightIcon,
	getDarkIcon,
	openExternalUrl,
	getRequest,
	postRequest
}