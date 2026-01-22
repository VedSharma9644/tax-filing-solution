const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemoveMediaPermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest['uses-permission']) {
      return config;
    }

    // Convert to array if single object
    let permissions = manifest['uses-permission'];
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    // Filter out all media-related permissions that cause Play Store rejections
    // These permissions are often added by dependencies but not actually needed
    const mediaPermissionsToRemove = [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.RECORD_AUDIO'
    ];

    const filteredPermissions = permissions.filter((permission) => {
      const permissionName = permission.$?.['android:name'];
      const shouldKeep = !mediaPermissionsToRemove.includes(permissionName);
      
      if (!shouldKeep) {
        console.log(`🗑️  Removing permission: ${permissionName}`);
      }
      
      return shouldKeep;
    });

    // Update manifest with filtered permissions
    if (filteredPermissions.length === 0) {
      delete manifest['uses-permission'];
    } else if (filteredPermissions.length === 1) {
      manifest['uses-permission'] = filteredPermissions[0];
    } else {
      manifest['uses-permission'] = filteredPermissions;
    }

    console.log('✅ Removed all unnecessary media permissions from AndroidManifest.xml');
    
    return config;
  });
};

