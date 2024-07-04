const { execSync } = require('child_process');

// Função para obter os logs do Git
const getGitLog = () => {
  try {
    const logOutput = execSync("git log -n 200 --pretty=format:'%h author:%an' --numstat").toString();
    return logOutput;
  } catch (error) {
    console.error("Erro ao executar o comando git log:", error);
    process.exit(1);
  }
};
let authorCount = {}
// Função para analisar a saída do Git log e mapear os arquivos para os contribuidores
const parseGitLog = (logOutput) => {
  const fileContributors = {};
  const lines = logOutput.split('\n');


  let author = null;


  lines.forEach((line) => {
    // Verifica se a linha contém o autor
    if (line.includes(' author:')) {
      author = line.split(' author:')[1];

    } else if (line) {
      if (!fileContributors[line]) {
        fileContributors[line] = new Set();
      }

      // Numstat line: added lines, removed lines, and file name
      const [added] = line.split('\t');

      authorCount[author] = authorCount[author] ? authorCount[author] + Number(added) : Number(added);
      fileContributors[line].add(author);
    }
  });

  return fileContributors;
};

// Função para calcular o bus factor
const calculateBusFactor = (fileContributors) => {
  const contributorCounts = {};

  Object.values(fileContributors).forEach((contributors) => {
    contributors.forEach((contributor) => {
      if (!contributorCounts[contributor]) {
        contributorCounts[contributor] = 0;
      }
      contributorCounts[contributor] += 1;
    });
  });

  const sortedContributors = Object.entries(contributorCounts).sort((a, b) => b[1] - a[1]);

  const totalFiles = Object.keys(fileContributors).length;
  let coveredFiles = 0;
  let busFactor = 0;

  for (const [contributor, count] of sortedContributors) {
    busFactor += 1;
    coveredFiles += count;
    if (coveredFiles >= totalFiles) {
      break;
    }
  }

  return busFactor;
};

const busFactor = () => {
    console.log('collecting busFactor metrics...')
    const logOutput = getGitLog();
    const fileContributors = parseGitLog(logOutput);
    const busFactor = calculateBusFactor(fileContributors);
    const total = Object.keys(authorCount).reduce((acc, author) => acc + authorCount[author], 0);
    const authorsFactor = Object.keys(authorCount).sort((a,b) => authorCount[b] - authorCount[a]).filter(author => Math.floor(authorCount[author] * 100 / total) > 0).map(author => `${author} (${Math.floor(authorCount[author] * 100 / total)}%)`).join(', ')
    return { busFactor, authors: authorsFactor.replace(/“|”/g, "") };
  };
  
module.exports = { busFactor };