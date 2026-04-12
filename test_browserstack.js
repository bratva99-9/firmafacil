const { remote } = require('webdriverio');

const capabilities = {
    platformName: 'Android',
    'appium:deviceName': 'Samsung Galaxy S22',
    'appium:platformVersion': '12.0',
    'appium:app': 'bs://5288d3cb7547ad85d1b9232a60e5a08b7d4ad264',
    'appium:automationName': 'UiAutomator2',
    'bstack:options': {
        userName: 'juliancenteno_30BgIb',
        accessKey: 'TaKdxejpnxWhqt5tRGtU',
        projectName: 'FirmaFacil',
        buildName: 'Build 1.0',
        sessionName: 'Test Basico - Arranque de App',
        debug: true,
        networkLogs: true,
    },
};

const opts = {
    hostname: 'hub.browserstack.com',
    port: 443,
    path: '/wd/hub',
    protocol: 'https',
    capabilities,
    logLevel: 'info',
};

async function main() {
    console.log('🚀 Conectando a BrowserStack App Automate...');
    console.log('   App: bs://5288d3cb7547ad85d1b9232a60e5a08b7d4ad264');
    console.log('   Dispositivo: Samsung Galaxy S22 (Android 12)');
    console.log('');

    let driver;
    try {
        driver = await remote(opts);
        console.log('✅ Sesión iniciada en BrowserStack!');
        console.log('   Session ID:', driver.sessionId);

        // Esperar a que la app cargue completamente
        console.log('⏳ Esperando que la app cargue (5 segundos)...');
        await driver.pause(5000);

        // Tomar screenshot de la pantalla inicial
        console.log('📸 Tomando screenshot de la pantalla inicial...');
        const screenshot = await driver.takeScreenshot();
        console.log('   Screenshot capturado (base64, primeros 50 chars):', screenshot.substring(0, 50) + '...');

        console.log('');
        console.log('✅ Test básico completado con éxito!');
        console.log('👉 Revisa el video en: https://app-automate.browserstack.com');

    } catch (err) {
        console.error('❌ Error durante el test:', err.message || err);
        process.exitCode = 1;
    } finally {
        if (driver) {
            await driver.deleteSession();
            console.log('🔒 Sesión cerrada correctamente.');
        }
    }
}

main();
