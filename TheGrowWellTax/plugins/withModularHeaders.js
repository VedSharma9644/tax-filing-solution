const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');
        
        // Add use_modular_headers! after platform :ios if not present
        if (!podfile.includes('use_modular_headers!')) {
          podfile = podfile.replace(
            /(platform\s+:ios[^\n]*)/,
            `$1\nuse_modular_headers!`
          );
        }
        
        // Check if post_install hook already exists
        const hasPostInstall = podfile.includes('post_install do |installer|');
        const hasNonModularSetting = podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES');
        
        if (hasPostInstall && !hasNonModularSetting) {
          // Add to existing post_install hook - use the correct method
          podfile = podfile.replace(
            /(post_install do \|installer\|[\s\S]*?)(end\s*$)/m,
            `$1  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'\n    end\n  end\n$2`
          );
        } else if (!hasPostInstall) {
          // Add new post_install hook at the end - use the correct method
          const postInstallHook = `\n\npost_install do |installer|\n  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'\n    end\n  end\nend`;
          podfile = podfile.trim() + postInstallHook;
        }
        
        fs.writeFileSync(podfilePath, podfile);
        console.log('✅ Added use_modular_headers! and CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES to Podfile');
      }
      return config;
    },
  ]);
};

