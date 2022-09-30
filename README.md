# dev tools ai

#### [Repository](https://github.com/dev-tools-ai/devtoolsai-vscode-plugin)&nbsp;&nbsp;|&nbsp;&nbsp;[Issues](https://github.com/dev-tools-ai/devtoolsai-vscode-plugin/issues)&nbsp;&nbsp;|&nbsp;&nbsp;[Milestones](https://github.com/dev-tools-ai/devtoolsai-vscode-plugin/milestones)&nbsp;&nbsp;|&nbsp;&nbsp;[Documentation](https://dev-tools.ai/)

![Badge](https://img.shields.io/visual-studio-marketplace/v/devtools-ai.devtools-ai) ![Badge](https://img.shields.io/visual-studio-marketplace/last-updated/devtools-ai.devtools-ai) ![Badge](https://img.shields.io/github/issues/dev-tools-ai/devtoolsai-vscode-plugin)

This extension adds support for `dev-tools.ai` into your IDE experience where it will learn from your tests, so you don't have to update them.


## Features

### Decorations
Each locator (selector) within your code will be decorated to indicate coverage by `dev-tools.ai`.

### Hovers
When mousing over a decoration, a hover (tooltip) will be displayed showing the image captured and utilized by `dev-tools.ai`.


## Setup
[Sign up and login](https://dev-tools.ai/) to your `dev-tools.ai` account.

Copy your api key from the upper-right corner of the dashboard.

Install this plugin and provide your api key when prompted.

Update your api key at any time by hovering over the `dev-tools.ai` icon in the status bar and clicking on the `pencil` icon.

[Follow steps](https://dev-tools.ai/) to instrument your project with `dev-tools.ai` libraries and SmartDriver.

*Note this plugin stores and utilizes the api key at `~/.smartdriver (linux/mac)` or `%userprofile%\.smartdriver (windows)`.  It is recommended that you instantiate SmartDriver (when possible) without the api key `(eg SmartDriver(driver))` wherein it will use the same key as this plugin.*

### Support
Current support:
- Python (Selenium)
- Java (Selenium)
- Cypress.io
- Webdriver.io
- Playwright

Future support:
- C# (Selenium)
- JavaScript (Selenium)
- Ruby

### License
Licensed under the [MIT](LICENSE) license.