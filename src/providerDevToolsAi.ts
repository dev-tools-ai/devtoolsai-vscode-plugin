import { AxiosResponse } from "axios";
import { getRequest, postRequest, resizePng, scaleWidthHeight } from "./utilities";
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
		let elementThumbnail = await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${encodeURIComponent(label)}`, { responseType: 'arraybuffer' });
		if (elementThumbnail?.data && elementThumbnail.status == 200)
		{
			if (width && height)
			{	
				elementThumbnail.data = await resizePng(elementThumbnail.data, width, height);
				return elementThumbnail;
			}

			let elementSize = await ProviderDevToolsAi.getElementSize(key, label);
			if (elementSize?.data && elementSize.status == 200)
			{
				let swh = scaleWidthHeight(elementSize.data.width, elementSize.data.height, 40000);
				let data = await resizePng(elementThumbnail.data, swh.width, swh.height);

				// image rendering in vscode hovers seem to fail when ${elementThumbnail.data.length} > ~70k
				// 74953 == footer markdown torched
				// >= 75615 == image + footer markdowns torched
				if (data.length > 65536)
				{
					let swh = scaleWidthHeight(elementSize.data.width, elementSize.data.height, 25000);
					data = await resizePng(elementThumbnail.data, swh.width, swh.height);
				}

				elementThumbnail.data = data;
				return elementThumbnail;
			}
			else
			{
				return elementThumbnail;
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
		return `${this.baseUrl}/label/labeler?label=${encodeURIComponent(label)}`;
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