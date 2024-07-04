import fs from 'fs-extra';
import { execSync } from 'child_process';
import { parseArgs } from 'node:util';
import AppLogger from './commons/AppLogger.js';
import CodeComplexityAuditor from './kernel/complexity/CodeComplexityAuditor.js';
import CodeCouplingAuditor from './kernel/coupling/CodeCouplingAuditor.js';
import CodeDuplicationAuditor from './kernel/duplication/CodeDuplicationAuditor.js';
import CodeSecurityAuditor from './kernel/security/CodeSecurityAuditor.js';
import CodeComplexityUtils from './kernel/complexity/CodeComplexityUtils.js';
import CodeCouplingUtils from './kernel/coupling/CodeCouplingUtils.js';
import CodeSecurityUtils from './kernel/security/CodeSecurityUtils.js';



/**
 * Destructures the values from the parsed arguments.
 * @type {Object}
 */
const srcDir = process.argv[2],
  outputDir = process.argv[3],
  format = process.argv[4];

console.log({args: process.argv})

/**
 * Checks if the source directory and output directory are provided.
 */
if(!srcDir || !outputDir){
  AppLogger.info('srcDir is require and must be a string (npm run code-health-meter --srcDir "../../my-path" --outputDir "../../my-output-path" --format "json or html")');
  process.exit(-1);
}

AppLogger.info('***** Code audit start *****');

/**
 * Cleaning workspace
 */
if(fs.existsSync(outputDir)) {
  try{
    execSync(`rm -rf ${outputDir}`);
  } catch(error){
    AppLogger.info(`Code auditor cleaning workspace error:  ${error.message}`);
    process.exit(-1);
  }
}

const deleteFolderRecursive = (folderPath) => {
  console.log('deleting folder: ', folderPath);
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const currentPath = path.join(folderPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        // Recursively delete contents of subdirectory
        deleteFolderRecursive(currentPath);
      } else {
        // Delete file
        fs.unlinkSync(currentPath);
      }
    });
    // Delete empty folder
    fs.rmdirSync(folderPath);
  }
};

const clear = (filePath) => {
  // deleteFolderRecursive(srcDir+'/node_modules');
  // deleteFolderRecursive(srcDir+'/coverage');
  // deleteFolderRecursive(srcDir+'/dist');
};

clear();


/**
 * Starts the code complexity audit.
 * @type {Object}
 */
const codeComplexityAnalysisResult = await CodeComplexityAuditor.startAudit(
  srcDir,
  {
    exclude: null,
    noempty: true,
    quiet: true,
    title: srcDir,
  }
);

/**
 * Writes the audit result to files.
 */
CodeComplexityUtils
  .writeCodeComplexityAuditToFile({
    codeComplexityOptions: {
      outputDir: `${outputDir}/code-complexity-audit`,
      fileFormat: format, // html or json
    },
    codeComplexityAnalysisResult,
  });

/**
 * Starts the code coupling audit.
 * https://github.com/pahen/madge?tab=readme-ov-file#configuration
 * @type {Object}
 */
const codeCouplingAnalysisResult = await CodeCouplingAuditor.startAudit(srcDir);

/**
 * Writes the audit result to files.
 */
CodeCouplingUtils
  .writeCodeCouplingAuditToFile({
    codeCouplingOptions: {
      outputDir: `${outputDir}/code-coupling-audit`,
      fileFormat: format, // html or json
    },
    codeCouplingAnalysisResult,
  });

// /**
//  * Starts the code duplication audit.
//  * @type {Object}
//  */
// CodeDuplicationAuditor.startAudit(
//   srcDir,
//   `${outputDir}/code-duplication-audit`,
//   format
// );

/**
 * Starts the code security audit.
 * @type {Object}
 */
// const codeSecurityAnalysisResult = await CodeSecurityAuditor.startAudit(srcDir, {});

// /**
//  * Writes the audit result to files.
//  */
// CodeSecurityUtils
//   .writeCodeSecurityAuditToFile({
//     codeSecurityOptions: {
//       outputDir: `${outputDir}/code-security-audit`,
//       fileFormat: format, // html or json
//     },
//     codeSecurityAnalysisResult,
//   });

AppLogger.info('***** Code audit finished successfully *****');
