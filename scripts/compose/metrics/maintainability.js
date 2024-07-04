const { execSync, exec } = require('child_process');

const fs = require('fs');
const path = require('path');



// Função para calcular a média do acoplamento do projeto
const calculateProjectCoupling = (report) => {
    const files = report.reports;

    const totalFiles = files.length;
    let totalEfferentCoupling = 0;
    let totalAfferentCoupling = 0;
    let totalInstabilityIndex = 0;

    files.forEach(file => {
        totalEfferentCoupling += file.efferentCoupling;
        totalAfferentCoupling += file.afferentCoupling;
        totalInstabilityIndex += parseFloat(file.instabilityIndex);
    });

    const averageEfferentCoupling = totalEfferentCoupling / totalFiles;
    const averageAfferentCoupling = totalAfferentCoupling / totalFiles;
    const averageInstabilityIndex = totalInstabilityIndex / totalFiles;

    return {
        averageEfferentCoupling,
        averageAfferentCoupling,
        averageInstabilityIndex
    };
};



const getMaintainability = async () => {
    console.log('collecting health-meter... '+__dirname)


    try {
        console.log('collecting maintainability metrics...')


        const complexityReport = require('../../report/code-complexity-audit/CodeComplexityReport.json')
        const maintainability = Number(complexityReport.summary.average.maintainability)
        return { maintainability };

    } catch (error) {
        console.error("Erro ao executar o comando git log:", error);
        process.exit(1);
    }
};


const getCoupling = () => {

    const couplingReport = require('../../report/code-coupling-audit/CodeCouplingReport.json')
    // const svg = fs.readFileSync('../report/code-coupling-audit/CodeCouplingReport.svg')



    const projectCouplingMetrics = calculateProjectCoupling(couplingReport);
    console.log('Project Coupling:');
    console.log(`Efferent Coupling: ${projectCouplingMetrics?.averageEfferentCoupling?.toFixed(2)}`); // I depends of 
    console.log(`Afferent Coupling: ${projectCouplingMetrics?.averageAfferentCoupling?.toFixed(2)}`); // depends on me
    console.log(`Index de Instab: ${projectCouplingMetrics?.averageInstabilityIndex?.toFixed(2)}`);

    return { efferentCoupling: +projectCouplingMetrics?.averageEfferentCoupling?.toFixed(2), afferentCoupling: +projectCouplingMetrics?.averageAfferentCoupling?.toFixed(2) }
}

module.exports = { getMaintainability, getCoupling } 