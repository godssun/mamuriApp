/**
 * Expo config plugin to fix react-native-firebase build error:
 * "include of non-modular header inside framework module"
 *
 * This occurs when using useFrameworks: 'static' with @react-native-firebase/*.
 * The fix sets CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 * in the Pods project build settings.
 *
 * @see https://github.com/invertase/react-native-firebase/issues/8657
 */
const { withPodfile } = require('@expo/config-plugins');

const withFirebaseModularHeaders = (config) => {
  return withPodfile(config, (podfileConfig) => {
    const podfileContents = podfileConfig.modResults.contents;

    const snippet = `
    # [withFirebaseModularHeaders] Fix non-modular header error for RNFB
    installer.pods_project.build_configurations.each do |config|
      config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
    end`;

    if (podfileContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
      return podfileConfig;
    }

    // Insert before the last `end` in post_install
    const postInstallRegex = /(post_install do \|installer\|)/;
    if (postInstallRegex.test(podfileContents)) {
      podfileConfig.modResults.contents = podfileContents.replace(
        postInstallRegex,
        `$1${snippet}`
      );
    }

    return podfileConfig;
  });
};

module.exports = withFirebaseModularHeaders;
