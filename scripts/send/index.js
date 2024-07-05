process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


const projectName = process.argv[3];
const metricsFile = process.argv[5];

if (!projectName || !metricsFile) {
    console.log('Is required script.js --projectName <my_project_name> --metrics <my_metrics_file>');
    process.exit(0);
}

const metrics = JSON.parse(fs.readFileSync(metricsFile).toString())

const requestOptions = {
    method: "GET",
    redirect: "follow"
};
const hash = Buffer.from(JSON.stringify(metrics)).toString('base64');

let attempt = 0;
const maxAttempts = 100;
const interval = 5000; // 5 seconds

const sendMetrics = () => {
    console.log(`Attempt ${attempt + 1}/${maxAttempts}`);
    fetch(`https://api.mercadopago.com/mgrowth-quality/api/metrics/quality?application=${projectName}&meta=${hash}`, requestOptions)
        .then(async (r) => {
            console.log(`Attempt ${attempt + 1} - metrics sent: ${r.status}`);
            if (r.status === 200) {
                clearInterval(intervalId);
            } else {
                attempt++;
                if (attempt >= maxAttempts) {
                    clearInterval(intervalId);
                }
            }
        })
        .catch((e) => {
            console.log(`Attempt ${attempt + 1} - error sending: ${e}`);
            attempt++;
            if (attempt >= maxAttempts) {
                clearInterval(intervalId);
            }
        });
};

const intervalId = setInterval(sendMetrics, interval);
sendMetrics(); // Send the first request immediately
