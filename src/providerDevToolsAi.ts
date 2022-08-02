import { AxiosResponse } from "axios";
import { getRequest, postRequest } from "./utilities";
import * as vscode from 'vscode';

interface IDisposable
{
	dispose(): void;
}

class ProviderDevToolsAi implements IDisposable
{
	private static readonly baseUrl: string = "https://smartdriver.dev-tools.ai";
	private static _onServerUpdate: vscode.EventEmitter<void>;

	constructor()
	{
		ProviderDevToolsAi._onServerUpdate = new vscode.EventEmitter<void>();
	}

	public static async isKeyValid(key: string): Promise<boolean>
	{
		if (!key || key == "")
		{
			return false;
		}

		let res = await getRequest(`${this.baseUrl}/element_size?api_key=${key}`);
		if (res)
		{
			let message: string = res?.data?.message;

			if (message && message.indexOf("is not a valid API key") === -1)
			{
				return true;
			}
			else
			{
				return false;
			}
		}
		else
		{
			return false;
		}
	}

	public static async getElementSize(key: string, label: string): Promise<AxiosResponse<any, any> | undefined>
	{
		return await getRequest(`${this.baseUrl}/element_size?api_key=${key}&label=${encodeURIComponent(label)}`);
	}

	public static async getElementThumbnail(key: string, label: string, width?: number, height?: number): Promise<AxiosResponse<any, any> | undefined>
	{
		let config = { responseType: 'arraybuffer' };

		if (width && height)
		{
			return await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${encodeURIComponent(label)}&width=${width}&height=${height}`, config);
		}
		else
		{
			let elementSize = await ProviderDevToolsAi.getElementSize(key, label);
			if (elementSize?.data && elementSize.status == 200)
			{
				height = elementSize.data.height;
				width = elementSize.data.width;
	
				let area = height * width;
				let areaMax = 250000;
				
				if (area > areaMax)
				{
					height = Math.floor(height * (Math.sqrt(areaMax / area)));
					width = Math.floor(width * (Math.sqrt(areaMax / area)));
				}

				return await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${encodeURIComponent(label)}&width=${width}&height=${height}`, config);
			}
			else
			{
				return await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${encodeURIComponent(label)}`, config);
			}
		}
	}

	public static async getElementStatus(key: string, label: string): Promise<string>
	{
		let elementStatus = await getRequest(`${this.baseUrl}/element_status?api_key=${key}&label=${encodeURIComponent(label)}`);

		if (elementStatus?.data && elementStatus.status == 200)
		{
			if (elementStatus.data[label])
			{
				return elementStatus.data[label].status_for_display;
			}
		}

		return 'Status unavailable';
	}

	public static async deleteElement(key: string, label: string): Promise<void>
	{
		await postRequest(`${this.baseUrl}/delete_label`, { api_key: key, label: label });
		ProviderDevToolsAi.serverUpdate();
	}

	public static getLabelingDashboardUrl(): string
	{
		return `${this.baseUrl}`;
	}

	public static getLabelingElementUrl(label: string): string
	{
		return `${this.baseUrl}/label/labeler?label=${label}`;
	}

	public static getGetStartedUrl(): string
	{
		return "https://dev-tools.ai/docs/get-started";
	}

	public static getGithubUrl(): string
	{
		return "https://github.com/dev-tools-ai";
	}

	public static getVSCodeUrl(): string
	{
		return "https://marketplace.visualstudio.com/items?itemName=devtools-ai.devtools-ai";
	}

	public static serverUpdate()
	{
		ProviderDevToolsAi._onServerUpdate.fire();
	}

	public static get onServerUpdate(): vscode.Event<void>
	{
		return ProviderDevToolsAi._onServerUpdate.event;
	}

	public dispose(): void
	{
		ProviderDevToolsAi._onServerUpdate.dispose();
	}
}

export default ProviderDevToolsAi;