// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');
const path = require('path');

// Webpack bundle analyzer configuration
const analyzeBundle = () => {
  return new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    reportFilename: 'bundle-report.html',
    openAnalyzer: false,
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json',
    logLevel: 'info'
  });
};

// Analyze bundle size and generate recommendations
const generateOptimizationReport = (statsFile) => {
  const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  const modules = stats.modules || [];
  
  const largeModules = modules
    .filter(module => module.size > 100000) // > 100KB
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  const duplicateModules = findDuplicateModules(modules);
  
  const report = {
    totalSize: stats.assets?.reduce((sum, asset) => sum + asset.size, 0) || 0,
    largeModules: largeModules.map(module => ({
      name: module.name,
      size: module.size,
      sizeFormatted: formatBytes(module.size)
    })),
    duplicateModules,
    recommendations: generateRecommendations(largeModules, duplicateModules)
  };

  fs.writeFileSync(
    path.join(__dirname, '../bundle-optimization-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('Bundle Optimization Report Generated:');
  console.log(`Total Bundle Size: ${formatBytes(report.totalSize)}`);
  console.log(`Large Modules Found: ${largeModules.length}`);
  console.log(`Duplicate Modules Found: ${duplicateModules.length}`);
};

const findDuplicateModules = (modules) => {
  const moduleMap = new Map();
  const duplicates = [];

  modules.forEach(module => {
    const baseName = module.name?.split('node_modules/').pop()?.split('/')[0];
    if (baseName) {
      if (moduleMap.has(baseName)) {
        moduleMap.get(baseName).push(module);
      } else {
        moduleMap.set(baseName, [module]);
      }
    }
  });

  moduleMap.forEach((instances, name) => {
    if (instances.length > 1) {
      duplicates.push({
        name,
        instances: instances.length,
        totalSize: instances.reduce((sum, inst) => sum + inst.size, 0)
      });
    }
  });

  return duplicates;
};

const generateRecommendations = (largeModules, duplicateModules) => {
  const recommendations = [];

  largeModules.forEach(module => {
    if (module.name.includes('node_modules')) {
      recommendations.push({
        type: 'code-splitting',
        module: module.name,
        suggestion: 'Consider lazy loading this large dependency'
      });
    }
  });

  duplicateModules.forEach(duplicate => {
    recommendations.push({
      type: 'deduplication',
      module: duplicate.name,
      suggestion: `Remove duplicate instances (${duplicate.instances} found)`
    });
  });

  return recommendations;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  analyzeBundle,
  generateOptimizationReport
};