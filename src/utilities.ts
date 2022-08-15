import path = require("path");
import open = require('open');
import axios, { AxiosResponse } from 'axios';
let Jimp = require('jimp');


function isSupportedLanguage(langId: string): boolean
{
	let supportedLanguages = ['python', 'javascript', 'typescript', 'java', 'csharp', 'ruby'];
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

async function resizePng(data: any, width: number, height: number): Promise<any | undefined>
{
	try
	{
		let image = await Jimp.read(data);
		return await image.resize(width, height).quality(100).getBufferAsync(Jimp.MIME_PNG);
	}
	catch (e)
	{
		return undefined;
	}
}

function scaleWidthHeight(width: number, height: number, areaMax: number): { width: number, height: number }
{
	let area = height * width;
	if (area > areaMax)
	{
		height = Math.floor(height * (Math.sqrt(areaMax / area)));
		width = Math.floor(width * (Math.sqrt(areaMax / area)));
	}

	return { width: width, height: height };
}

export
{
	isSupportedLanguage,
	getLightIcon,
	getDarkIcon,
	openExternalUrl,
	getRequest,
	postRequest,
	resizePng,
	scaleWidthHeight
}