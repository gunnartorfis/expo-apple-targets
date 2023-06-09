import { PBXNativeTarget } from "@bacons/xcode";
import plist from "@expo/plist";
import fs from "fs";
import path from "path";

export type ExtensionType =
  | "widget"
  | "notification-content"
  | "notification-service"
  | "share"
  | "intent"
  | "bg-download"
  | "intent-ui"
  | "spotlight"
  | "matter"
  | "quicklook-thumbnail"
  | "safari";

export const KNOWN_EXTENSION_POINT_IDENTIFIERS: Record<string, ExtensionType> =
  {
    "com.apple.widgetkit-extension": "widget",
    "com.apple.usernotifications.content-extension": "notification-content",
    "com.apple.share-services": "share",
    "com.apple.usernotifications.service": "notification-service",
    "com.apple.spotlight.import": "spotlight",
    "com.apple.intents-service": "intent",
    "com.apple.intents-ui-service": "intent-ui",
    "com.apple.Safari.web-extension": "safari",
    "com.apple.background-asset-downloader-extension": "bg-download",
    "com.apple.matter.support.extension.device-setup": "matter",
    "com.apple.quicklook.thumbnail": "quicklook-thumbnail",
    // "com.apple.intents-service": "intents",
  };

// TODO: Maybe we can replace `NSExtensionPrincipalClass` with the `@main` annotation that newer extensions use?
export function getTargetInfoPlistForType(type: ExtensionType) {
  const NSExtensionPointIdentifier = Object.keys(
    KNOWN_EXTENSION_POINT_IDENTIFIERS
  ).find((key) => KNOWN_EXTENSION_POINT_IDENTIFIERS[key] === type);

  if (type === "notification-service") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          NSExtensionActivationRule: "TRUEPREDICATE",
        },
        // TODO: Update `NotificationService` dynamically
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).NotificationService",
        // NSExtensionMainStoryboard: 'MainInterface',
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "quicklook-thumbnail") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          QLSupportedContentTypes: [],
          QLThumbnailMinimumDimension: 0,
        },
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).ThumbnailProvider",
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "spotlight") {
    return plist.build({
      CSExtensionLabel: "myImporter",
      NSExtension: {
        NSExtensionAttributes: {
          CSSupportedContentTypes: ["com.example.plain-text"],
        },
        // TODO: Update `ImportExtension` dynamically
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).ImportExtension",
        // NSExtensionMainStoryboard: 'MainInterface',
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "share") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          NSExtensionActivationRule: "TRUEPREDICATE",
        },
        // TODO: Update `ShareViewController` dynamically
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).ShareViewController",
        // NSExtensionMainStoryboard: 'MainInterface',
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "intent-ui") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          IntentsSupported: ["INSendMessageIntent"],
        },
        // TODO: Update `IntentViewController` dynamically
        NSExtensionPrincipalClass:
          "$(PRODUCT_MODULE_NAME).IntentViewController",
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "intent") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          IntentsRestrictedWhileLocked: [],
          IntentsSupported: [
            "INSendMessageIntent",
            "INSearchForMessagesIntent",
            "INSetMessageAttributeIntent",
          ],
        },
        // TODO: Update `IntentHandler` dynamically
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).IntentHandler",
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "matter") {
    return plist.build({
      NSExtension: {
        NSExtensionPrincipalClass: "$(PRODUCT_MODULE_NAME).RequestHandler",
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "safari") {
    return plist.build({
      NSExtension: {
        // TODO: Update `SafariWebExtensionHandler` dynamically
        NSExtensionPrincipalClass:
          "$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler",
        // NSExtensionMainStoryboard: 'MainInterface',
        NSExtensionPointIdentifier,
      },
    });
  } else if (type === "notification-content") {
    return plist.build({
      NSExtension: {
        NSExtensionAttributes: {
          UNNotificationExtensionCategory: "myNotificationCategory",
          UNNotificationExtensionInitialContentSizeRatio: 1,
        },
        // TODO: Update `NotificationViewController` dynamically
        NSExtensionPrincipalClass:
          "$(PRODUCT_MODULE_NAME).NotificationViewController",
        // NSExtensionMainStoryboard: 'MainInterface',
        NSExtensionPointIdentifier,
      },
    });
  }

  // Default: used for widget and bg-download
  return plist.build({
    NSExtension: {
      NSExtensionPointIdentifier,
    },
  });
}

export function needsEmbeddedSwift(type: ExtensionType) {
  return [
    "spotlight",
    "share",
    "intent",
    "intent-ui",
    "bg-download",
    "quicklook-thumbnail",
    "matter",
  ].includes(type);
}

export function getFrameworksForType(type: ExtensionType) {
  if (type === "widget") {
    return [
      // CD07060B2A2EBE2E009C1192 /* WidgetKit.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = WidgetKit.framework; path = System/Library/Frameworks/WidgetKit.framework; sourceTree = SDKROOT; };
      "WidgetKit",
      // CD07060D2A2EBE2E009C1192 /* SwiftUI.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = SwiftUI.framework; path = System/Library/Frameworks/SwiftUI.framework; sourceTree = SDKROOT; };
      "SwiftUI",
    ];
  } else if (type === "intent") {
    return ["Intents"];
  } else if (type === "intent-ui") {
    return ["IntentsUI"];
  } else if (type === "quicklook-thumbnail") {
    return ["QuickLookThumbnailing"];
  } else if (type === "notification-content") {
    return ["UserNotifications", "UserNotificationsUI"];
  }

  return [];
}

export function isNativeTargetOfType(
  target: PBXNativeTarget,
  type: ExtensionType
): boolean {
  if (target.props.productType !== "com.apple.product-type.app-extension") {
    return false;
  }
  // Could be a Today Extension, Share Extension, etc.

  const defConfig =
    target.props.buildConfigurationList.props.buildConfigurations.find(
      (config) =>
        config.props.name ===
        target.props.buildConfigurationList.props.defaultConfigurationName
    );
  const infoPlistPath = path.join(
    // TODO: Resolve root better
    path.dirname(path.dirname(target.project.getXcodeProject().filePath)),
    defConfig.props.buildSettings.INFOPLIST_FILE
  );

  const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));

  if (!infoPlist.NSExtension?.NSExtensionPointIdentifier) {
    console.error(
      "No NSExtensionPointIdentifier found in extension Info.plist for target: " +
        target.getDisplayName()
    );
    return false;
  }

  return (
    KNOWN_EXTENSION_POINT_IDENTIFIERS[
      infoPlist.NSExtension?.NSExtensionPointIdentifier
    ] === type
  );
}
