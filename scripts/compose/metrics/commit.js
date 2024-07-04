const { execSync, exec } = require('child_process');

const commit_hash = execSync('git rev-parse HEAD').toString().trim()

console.log(commit_hash)

const commit_date = execSync('git show -s --format=%ci').toString().trim()

console.log(commit_date)

function getGitLog() {
  return new Promise((resolve, reject) => {
    exec('git log -n 20 --pretty=tformat: --numstat', (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing git log: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error in git log: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

function getCommitCount() {
  return new Promise((resolve, reject) => {
    exec('git log -n 20 --oneline | wc -l', (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing git log: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error in git log: ${stderr}`);
        return;
      }

      resolve(parseInt(stdout.trim(), 10));
    });
  });
}

async function calculateAverageInsertions() {
  try {
    const log = await getGitLog();
    const commitCount = await getCommitCount();

    if (commitCount === 0) {
      console.log('No commits found.');
      return;
    }

    const insertions = log.split('\n')
      .map(line => line.split('\t')[0])
      .map(num => Number(num) || 1)
      .reduce((sum, num) => sum + parseInt(num, 10), 0);
  
    const average = (insertions / commitCount).toFixed(2);
    console.log(`Average lines inserted per commit in the last 20 commits: ${average}`);
    return +average;
  } catch (error) {
    console.error(error);
  }
}



module.exports = { getCommit: async () => ({commit_hash, commit_date: new Date(commit_date).getTime(), lines_per_commit: await calculateAverageInsertions() }) }