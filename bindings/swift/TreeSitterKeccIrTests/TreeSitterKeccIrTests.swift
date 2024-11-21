import XCTest
import SwiftTreeSitter
import TreeSitterKeccIr

final class TreeSitterKeccIrTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_kecc_ir())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading KeccIr grammar")
    }
}
