import { AxiosResponse } from "axios";
import { getRequest } from "./utilities";

class ProviderDevToolsAi
{
	private static readonly baseUrl: string = "https://smartdriver.dev-tools.ai";

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
		return await getRequest(`${this.baseUrl}/element_size?api_key=${key}&label=${label}`);
	}

	public static async getElementThumbnail(key: string, label: string, width?: number, height?: number): Promise<AxiosResponse<any, any> | undefined>
	{
		let config = { responseType: 'arraybuffer' };

		if (width && height)
		{
			return await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${label}&width=${width}&height=${height}`, config);
		}
		else
		{
			return await getRequest(`${this.baseUrl}/element_thumbnail?api_key=${key}&label=${label}`, config);
		}
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
}

export default ProviderDevToolsAi;