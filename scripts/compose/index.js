
const { busFactor } = require('./metrics/busFactor');
const { getCommit } = require('./metrics/commit');
const { getMaintainability, getCoupling } = require('./metrics/maintainability');

const fs = require('fs');
const process = require('process');

// Function to parse named arguments
function getArgumentValue(argName) {
    const argIndex = process.argv.indexOf(`--${argName}`);
    if (argIndex > -1 && argIndex < process.argv.length - 1) {
        return process.argv[argIndex + 1];
    }
    return null;
}

const path = getArgumentValue('path');
const output = getArgumentValue('output');
const complexityReportPath = getArgumentValue('complexityReportPath')
const branchName = getArgumentValue('branchName')

if (!path || !output) {
    console.error('Missing arguments: path or output');
    console.log('Usage: node script.js --path <path/to/input.json> --output <path/to/output/directory>');
    process.exit(1);
}

const file = fs.readFileSync(path).toString();

function snakeToCamel(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelCaseKey = key.replace(/([-_]\w)/g, g => g[1].toUpperCase());
    let value = obj[key];

    if (value !== null && typeof value === 'object') {
      value = snakeToCamel(value);
    }

    acc[camelCaseKey] = value;
    return acc;
  }, {});
}

const result = JSON.parse(file);

const getMetrics = async () => {
    const r = result.component.measures.reduce((acc, m) => ({ ...acc, [m.metric]: +m.value }), {});
    r.vulnerability = r.vulnerabilities;
    r.duplication = r.duplicated_lines_density;
    r.number_of_lines = r.ncloc;

    const { busFactor: factor, authors } = busFactor()
    r.bus_factor = factor;
    r.committer = authors;

    const { maintainability } = await getMaintainability({path: complexityReportPath})

    r.score = maintainability;
    r.maintainability = maintainability;

    const { efferentCoupling, afferentCoupling } = getCoupling({path: complexityReportPath})

    r.coupling = efferentCoupling;
    r.efferentCoupling = efferentCoupling;
    r.afferentCoupling = afferentCoupling;

    const { commit_hash, commit_date, lines_per_commit } = await getCommit()
    r.commit_hash = commit_hash;
    r.branch_name = branchName;
    r.createdAt = commit_date;
    r.lines_per_commit = lines_per_commit;

    const finalResult = snakeToCamel(r);
    console.log(JSON.stringify(finalResult, null, 4));

    const commentBody = `
    ### 📊 Project Metrics
    #### This report is generated by Quality Admin
    
    | 🔍 Metric               | 📈 Value     |
    |----------------------|-----------|
    | 📊 SQALE Rating         | ${r.sqaleRating} |
    | 📊 Maintainability      | ${r.maintainability} |
    | 📊 Coverage             | ${r.coverage} |
    | 🐞 Bugs                 | ${r.bugs} |
    | 🔥 Security Hotspots    | ${r.securityHotspots} |
    | 🔒 Security Review Rating | ${r.securityReviewRating} |
    | ❌ Violations           | ${r.violations} |
    | 📊 Duplicated Lines Density | ${r.duplicatedLinesDensity} |
    | 🛡️ Security Rating      | ${r.securityRating} |
    | 🏁 Quality Gate Details | ${r.qualityGateDetails} |
    | 🔓 Open Issues          | ${r.openIssues} |
    | 🚨 Code Smells          | ${r.codeSmells} |
    | 📈 Reliability Rating   | ${r.reliabilityRating} |
    | 🛡️ Vulnerability        | ${r.vulnerability} |
    | 📊 Duplication          | ${r.duplication} |
    | 📏 Number Of Lines      | ${r.numberOfLines} |
    | 🚌 Bus Factor           | ${r.busFactor} |
    | 🔗 Coupling             | ${r.coupling} |
    | 🔗 Efferent Coupling    | ${r.efferentCoupling} |
    | 🔗 Afferent Coupling    | ${r.afferentCoupling} |
    | 📝 Lines Per Commit     | ${r.linesPerCommit} |


    `;
    fs.writeFileSync(`${output}/metrics.me`, commentBody);
    fs.writeFileSync(`${output}/metrics.json`, JSON.stringify(finalResult, null, 4));
};

getMetrics();
