# iOS/iPadOS delivery pitfalls

Read for build configuration, signing, install, or launch. Commands are templates;
inspect repository scripts and installed tool help for supported flags.

## Source → effective target → built artifact

Find the configuration owner: Xcode project, XcodeGen, Tuist, or another generator.
Editing only a generated plist or ignored `.xcodeproj` can disappear on a clean
checkout. For XcodeGen, `info.properties` generates the configured plist, while
targets/presets may override global settings
([specification](https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md)).

```sh
xcodegen generate --spec project.yml
xcodebuild -project App.xcodeproj -scheme App -showBuildSettings
plutil -p /absolute/path/to/App.app/Info.plist
codesign --verify --deep --strict /absolute/path/to/App.app
```

For relevant configuration changes, inspect bundle identity, deployment target,
`UIDeviceFamily`, orientations, entitlements, and embedded extensions in the
intended built artifact. Universal apps need both intended device families.
Device-specific tablet declarations can use
`UISupportedInterfaceOrientations~ipad`; phone policy is separate. Rotation also
involves controllers/app support, so verify the affected window behavior
([orientation contract](https://developer.apple.com/documentation/uikit/uiviewcontroller/supportedinterfaceorientations)).
A simulator artifact does not prove device signing.

## Device and per-target signing

Use an observed current destination, such as `xcrun devicectl list devices` or
Xcode's device UI. CoreDevice identifiers, UDIDs, and simulator IDs differ; a
paired listing does not prove reachability or unlock state. Recheck destination
when the connection changes.

App, notification extension, and UI runner can need distinct profiles. Inspect
the failing target's team, identifier, capabilities, certificate/profile validity,
and registered devices. GUI account configuration does not prove CLI account
visibility; inspect effective signing before replacing certificates or accounts.
Resolve manual profiles locally only where needed; do not embed machine-specific
profile UUIDs, signing identities, or device IDs in reusable source. Preserve
unrelated devices/capabilities when refreshing a profile.

## Separate stages rather than repeat blind retries

| Stage | Evidence |
| --- | --- |
| Build/sign | Completed build and intended artifact; correct relevant target profiles/entitlements |
| Install | Intended bundle reported installed on the destination |
| Ordinary launch | App launches into an observed useful state |
| Runner launch | Runner starts with its own signing/trust prerequisites |
| Automation | Session attaches and performs an interaction |

On runner failure, try ordinary app launch to separate app/signing problems from
automation. A timeout or black preview alone does not establish an app crash.

[Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)
can require restart and on-device confirmation. Unlock, developer trust,
UI Automation, and biometric/passcode prompts are separate possible blocks.
Ask for the observed block, retain prior confirmations, and verify afterward.
The user must perform biometric/passcode steps; never bypass trust.

For device-service failures, select a bounded error-driven recovery: refresh or
reselect the connection, then reconnect/restart if warranted. Stop identical
attempts when a user prompt or unavailable service blocks them.

## Observation versus control; delivery versus release

Do not assume iPhone Mirroring controls iPad. A supported USB/QuickTime preview
may observe the screen without controlling touch; XCTest is another capability.
A black/stale preview may need its source reselected after reconnect. Confirm
actual app state before diagnosing a crash; previewing needs no recording.

Development install, [ad hoc distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices),
TestFlight, and store release are distinct outcomes. Verify the requested channel.
For physical delivery after configuration changes, regenerate/build, read back
the artifact, then install and ordinarily launch it. Keep fixture conditions
visible rather than presenting acceptance data as connected live data.
