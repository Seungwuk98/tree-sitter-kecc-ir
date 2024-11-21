// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterKeccIr",
    products: [
        .library(name: "TreeSitterKeccIr", targets: ["TreeSitterKeccIr"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterKeccIr",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterKeccIrTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterKeccIr",
            ],
            path: "bindings/swift/TreeSitterKeccIrTests"
        )
    ],
    cLanguageStandard: .c11
)
