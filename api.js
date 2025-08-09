const puppeteer = require("puppeteer");
const qrcode = require("qrcode-terminal");
const { from, merge } = require('rxjs');
const { take } = require('rxjs/operators');
const path = require('path');
var rimraf = require("rimraf");

let browser = null;
let page = null;
let counter = { fails: 0, success: 0 }
const tmpPath = path.resolve(__dirname, './wbm_session');

const SELECTORS = {
    LOADING: "progress",
    INSIDE_CHAT: "document.getElementsByClassName('two')[0]",
    QRCODE_PAGE: "body > div > div > .landing-wrapper",
    QRCODE_DATA: "div[data-ref]",
    QRCODE_DATA_ATTR: "data-ref",
    QRCODE_CANVAS: "canvas[aria-label*='Scan this QR code']",
    QRCODE_CONTAINER: "div[data-ref]",
    SEND_BUTTON: 'div:nth-child(2) > button > span[data-icon="send"]'
};

/**
 * Initialize browser, page and setup page desktop mode
 */
async function start({ showBrowser = false, qrCodeData = true, session = true } = {}) {
    if (!session) {
        deleteSession(tmpPath);
    }

    const args = {
        headless: !showBrowser,
        userDataDir: tmpPath,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process", // This might help on some VPS configurations
            "--disable-gpu",
            "--disable-extensions",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-features=TranslateUI",
            "--disable-ipc-flooding-protection",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor"
        ]
    }
    try {
        browser = await puppeteer.launch(args);
        page = await browser.newPage();
        // prevent dialog blocking page and just accept it(necessary when a message is sent too fast)
        page.on("dialog", async dialog => { await dialog.accept(); });
        // fix the chrome headless mode true issues
        // https://gitmemory.com/issue/GoogleChrome/puppeteer/1766/482797370
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36");
        page.setDefaultTimeout(60000);

        console.log('Loading WhatsApp Web...');
        await page.goto("https://web.whatsapp.com", { waitUntil: 'networkidle2' });
        
        if (session) {
            try {
                const authenticated = await isAuthenticated();
                if (authenticated) {
                    console.log('✅ Already authenticated from saved session');
                    return;
                }
            } catch (error) {
                console.log('❌ Authentication check failed:', error.message);
                console.log('🔄 Will proceed to show QR code...');
            }
        }
        
        if (qrCodeData) {
            console.log('Getting QRCode data...');
            console.log('Note: You should use wbm.waitQRCode() inside wbm.start() to avoid errors.');
            const qrData = await getQRCodeData();
            // Return the QR data but don't mark as connected yet
            return qrData;
        } else {
            await generateQRCode();
        }

    } catch (err) {
        deleteSession(tmpPath);
        throw err;
    }
}

/**
 * Check if needs to scan qr code or already is is inside the chat
 */
function isAuthenticated() {
    console.log('Authenticating...');
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Authentication timeout after 30 seconds'));
        }, 30000); // 30 second timeout

        merge(needsToScan(page), isInsideChat(page))
            .pipe(take(1))
            .toPromise()
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

function needsToScan() {
    return from(
        page
            .waitForSelector(SELECTORS.QRCODE_PAGE, {
                timeout: 15000, // 15 second timeout instead of infinite
            }).then(() => {
                console.log('QR Code page detected - needs scanning');
                return false;
            }).catch(() => {
                // QR code page not found, might already be authenticated
                return null;
            })
    );
}

function isInsideChat() {
    return from(
        page
            .waitForFunction(SELECTORS.INSIDE_CHAT,
                {
                    timeout: 15000, // 15 second timeout instead of infinite
                }).then(() => {
                    console.log('Already authenticated - inside chat');
                    return true;
                }).catch(() => {
                    // Chat interface not found, might need QR scan
                    return null;
                })
    );
}

function deleteSession() {
    rimraf.sync(tmpPath);
}
/**
 * return the data used to create the QR Code
 */
async function getQRCodeData() {
    // First try to wait for the canvas element (new WhatsApp Web structure)
    try {
        await page.waitForSelector(SELECTORS.QRCODE_CANVAS, { timeout: 30000 });
        console.log('Found QR code canvas, extracting data...');
        
        const qrcodeData = await page.evaluate((SELECTORS) => {
            // Try to get the canvas element
            let canvas = document.querySelector(SELECTORS.QRCODE_CANVAS);
            if (canvas) {
                // Get the canvas data as a data URL for web display
                const canvasDataUrl = canvas.toDataURL();
                
                // Also try to get the raw QR code data from data-ref for terminal display
                let qrcodeDiv = document.querySelector(SELECTORS.QRCODE_DATA);
                const rawQrData = qrcodeDiv ? qrcodeDiv.getAttribute(SELECTORS.QRCODE_DATA_ATTR) : null;
                
                return {
                    canvasDataUrl: canvasDataUrl,
                    rawQrData: rawQrData,
                    type: 'canvas'
                };
            }
            
            // Fallback: try to get from data-ref attribute (older WhatsApp Web)
            let qrcodeDiv = document.querySelector(SELECTORS.QRCODE_DATA);
            if (qrcodeDiv) {
                const rawQrData = qrcodeDiv.getAttribute(SELECTORS.QRCODE_DATA_ATTR);
                return {
                    canvasDataUrl: null,
                    rawQrData: rawQrData,
                    type: 'data-ref'
                };
            }
            
            return null;
        }, SELECTORS);
        
        if (qrcodeData) {
            return qrcodeData;
        }
    } catch (error) {
        console.log('Canvas method failed, trying fallback method...');
    }
    
    // Fallback to original method for older WhatsApp Web versions
    try {
        await page.waitForSelector(SELECTORS.QRCODE_DATA, { timeout: 30000 });
        const qrcodeData = await page.evaluate((SELECTORS) => {
            let qrcodeDiv = document.querySelector(SELECTORS.QRCODE_DATA);
            const rawQrData = qrcodeDiv ? qrcodeDiv.getAttribute(SELECTORS.QRCODE_DATA_ATTR) : null;
            return {
                canvasDataUrl: null,
                rawQrData: rawQrData,
                type: 'data-ref-fallback'
            };
        }, SELECTORS);
        return qrcodeData;
    } catch (error) {
        throw new Error('Could not find QR code element using any method');
    }
}

/**
 * Access whatsapp web page, get QR Code data and generate it on terminal
 */
async function generateQRCode() {
    try {
        console.log("generating QRCode...");
        const qrcodeData = await getQRCodeData();
        qrcode.generate(qrcodeData, { small: true });
        console.log("QRCode generated! Scan it using Whatsapp App.");
    } catch (err) {
        throw await QRCodeExeption("QR Code can't be generated(maybe your connection is too slow).");
    }
    await waitQRCode();
}

/**
 * Wait for QR code to be scanned by waiting for chat interface to appear
 */
async function waitQRCode() {
    console.log('⏳ Waiting for QR code to be scanned...');
    try {
        // Wait for the chat interface to appear (means QR code was scanned)
        await page.waitForFunction(
            "document.getElementsByClassName('two')[0] !== undefined",
            { timeout: 60000 }
        );
        console.log('✅ Chat interface detected - QR code was scanned!');
    } catch (err) {
        console.error('❌ QR code scan timeout or failed');
        throw await QRCodeExeption("QR Code scan timeout. Please try again.");
    }
}

/**
 * Close browser and show an error message
 * @param {string} msg 
 */
async function QRCodeExeption(msg) {
    await browser.close();
    return "QRCodeException: " + msg;
}

/**
 * @param {string} phone phone number: '5535988841854'
 * @param {string} message Message to send to phone number
 * Send message to a phone number
 */
async function sendTo(phoneOrContact, message) {
    let phone = phoneOrContact;
    if (typeof phoneOrContact === "object") {
        phone = phoneOrContact.phone;
        message = generateCustomMessage(phoneOrContact, message);
    }
    
    // Clean phone number - remove + and any spaces/dashes
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    try {
        process.stdout.write("Sending Message...\r");
        await page.goto(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`);
        await page.waitForSelector(SELECTORS.LOADING, { hidden: true, timeout: 60000 });
        
        // Check if there's an error message on the page
        const errorSelectors = [
            '[data-testid="invalid-phone-number"]',
            'div[data-animate-alert-text]',
            '[data-testid="alert-phone-number-not-found"]'
        ];
        
        for (const errorSelector of errorSelectors) {
            const errorElement = await page.$(errorSelector);
            if (errorElement) {
                const errorText = await page.evaluate(el => el.textContent, errorElement);
                throw new Error(`WhatsApp error: ${errorText}`);
            }
        }
        
        // Try multiple send button selectors (WhatsApp changes these frequently)
        const sendButtonSelectors = [
            'div:nth-child(2) > button > span[data-icon="send"]', // Original selector
            '[data-testid="send"]',
            '[data-icon="send"]',
            'button[data-testid="send"]',
            'span[data-icon="send"]',
            '[aria-label*="Send"]',
            'button[aria-label*="Send"]'
        ];
        
        let sendButton = null;
        
        for (const selector of sendButtonSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                sendButton = await page.$(selector);
                if (sendButton) {
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!sendButton) {
            throw new Error('Send button not found with any known selector');
        }
        
        await sendButton.click();
        await page.waitFor(1000);
        
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${phone} Sent\n`);
        counter.success++;
    } catch (err) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${phone} Failed\n`);
        counter.fails++;
    }
}

/**
 * @param {array} phones Array of phone numbers: ['5535988841854', ...]
 * @param {string} message Message to send to every phone number
 * Send same message to every phone number
 */
async function send(phoneOrContacts, message) {
    for (let phoneOrContact of phoneOrContacts) {
        await sendTo(phoneOrContact, message);
    }
}

/**
 * @param {object} contact contact with several properties defined by the user
 * @param {string} messagePrototype Custom message to send to every phone number
 * @returns {string} message
 * Replace all text between {{}} to respective contact property
 */
function generateCustomMessage(contact, messagePrototype) {
    let message = messagePrototype;
    for (let property in contact) {
        message = message.replace(new RegExp(`{{${property}}}`, "g"), contact[property]);
    }
    return message;
}

/**
 * Close browser and show results(number of messages sent and failed)
 */
async function end() {
    await browser.close();
    console.log(`Result: ${counter.success} sent, ${counter.fails} failed`);
}

module.exports = {
    start,
    send,
    sendTo,
    end,
    waitQRCode
}