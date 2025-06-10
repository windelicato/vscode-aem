import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { AemScaffoldHelper } from '../aem/scaffold/helper';

suite('AemScaffoldHelper VS Code Extension Command', () => {
	test('runs scaffold with user input and sends correct command to terminal', async () => {
		// Arrange: stub VS Code APIs
		const showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showInputBoxStub.onFirstCall().resolves('My App'); // App Title
		showInputBoxStub.onSecondCall().resolves('mysite'); // Package Name (short, no spaces)

		const getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
		getConfigStub.returns({
			get: (key: string, def: any) => {
				if (key === 'scaffoldArgs') { return '-DgroupId={packageName} -DappTitle="{appTitle}" -DarchetypeVersion={archetypeVersion}'; }
				if (key === 'archetypePluginVersion') { return '3.3.1'; }
				return def;
			}
		} as any);

		let sentCommand = '';
		const fakeTerminal = {
			name: 'AEM Scaffold',
			show: sinon.spy(),
			sendText: (cmd: string) => { sentCommand = cmd; }
		};
		const terminalsStub = sinon.stub(vscode.window, 'terminals').value([]);
		const createTerminalStub = sinon.stub(vscode.window, 'createTerminal').returns(fakeTerminal as any);

		// Act
		await AemScaffoldHelper.runScaffold();

		// Assert
		assert.strictEqual(sentCommand, 'mvn archetype:generate -DgroupId=mysite -DappTitle="My App" -DarchetypeVersion=3.3.1');
		assert.ok(createTerminalStub.calledOnce, 'Terminal should be created');
		assert.ok((fakeTerminal.show as sinon.SinonSpy).calledOnce, 'Terminal should be shown');

		// Cleanup
		showInputBoxStub.restore();
		getConfigStub.restore();
		terminalsStub.restore();
		createTerminalStub.restore();
	});

	test('shows warning if app title is missing', async () => {
		const showInputBoxStub = sinon.stub(vscode.window, 'showInputBox').onFirstCall().resolves(undefined);
		const showWarningStub = sinon.stub(vscode.window, 'showWarningMessage');
		await AemScaffoldHelper.runScaffold();
		assert.ok(showWarningStub.calledWith('App Title is required.'));
		showInputBoxStub.restore();
		showWarningStub.restore();
	});

	test('shows warning if package name is missing', async () => {
		const showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showInputBoxStub.onFirstCall().resolves('My App');
		showInputBoxStub.onSecondCall().resolves(undefined);
		const showWarningStub = sinon.stub(vscode.window, 'showWarningMessage');
		await AemScaffoldHelper.runScaffold();
		assert.ok(showWarningStub.calledWith('Java package name is required.'));
		showInputBoxStub.restore();
		showWarningStub.restore();
	});
});
