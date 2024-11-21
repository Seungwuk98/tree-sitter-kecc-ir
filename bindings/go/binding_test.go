package tree_sitter_kecc_ir_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_kecc_ir "github.com/seungwuk98/tree-sitter-kecc-ir/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_kecc_ir.Language())
	if language == nil {
		t.Errorf("Error loading KeccIr grammar")
	}
}
